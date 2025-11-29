import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { db } from "./db";
import { users, newsArticles, podcastEpisodes, forumDiscussions } from "@shared/schema";
import { storage } from "./storage";

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => htmlEntities[char] || char);
}

// Bot/crawler detection patterns
const botPatterns = [
  'bot', 'crawler', 'spider', 'slurp', 'facebookexternalhit', 
  'linkedinbot', 'twitterbot', 'whatsapp', 'telegrambot',
  'chatgpt', 'gptbot', 'anthropic', 'claude', 'bingbot', 'googlebot',
  'discordbot', 'slackbot', 'pinterest', 'applebot', 'chatgpt-user'
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return botPatterns.some(pattern => ua.includes(pattern));
}

const app = express();

// Trust proxy - required for apps behind reverse proxy (like published Replit apps)
// This ensures Express correctly recognizes HTTPS connections and sets secure cookies
app.set("trust proxy", 1);

// Robots.txt - Allow all crawlers including ChatGPT
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`# Allow all crawlers
User-agent: *
Allow: /

# Explicitly allow OpenAI crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

# Allow search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Sitemap location
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml
`);
});

// Bot-friendly article pages - must be FIRST middleware to intercept before Vite
// This serves pre-rendered HTML with meta tags to ChatGPT, social media crawlers, etc.
app.use(async (req, res, next) => {
  // Only handle /news/:id routes (supports both numeric and UUID IDs)
  const match = req.path.match(/^\/news\/([a-zA-Z0-9-]+)$/);
  if (!match) {
    return next();
  }
  
  const userAgent = req.headers['user-agent'] || '';
  
  // Check for ChatGPT Agent mode (uses standard Chrome UA but has special signature header)
  const signatureAgent = req.headers['signature-agent'] as string || '';
  const isChatGPTAgent = signatureAgent.includes('chatgpt.com');
  
  // If not a bot and not ChatGPT Agent mode, let Vite/SPA handle it
  if (!isBot(userAgent) && !isChatGPTAgent) {
    return next();
  }
  
  try {
    const articleId = match[1];
    const article = await storage.getNewsArticle(articleId);
    if (!article) {
      return next();
    }
    
    log(`Serving bot-friendly HTML for article ${articleId}`);
    
    // Strip HTML tags from content for description
    const plainContent = article.content 
      ? article.content.replace(/<[^>]*>/g, '').substring(0, 300)
      : article.excerpt || 'Read this article on The Digital Ledger';
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const articleUrl = `${baseUrl}/news/${article.id}`;
    // Ensure image URL is absolute for social media crawlers
    let imageUrl = article.imageUrl || '/default-article-image.jpg';
    if (imageUrl.startsWith('/')) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }
    const publishDate = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Unknown date';
    const publishedAtISO = article.publishedAt ? article.publishedAt.toISOString() : '';
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(article.title)} | The Digital Ledger</title>
  <meta name="description" content="${escapeHtml(plainContent)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${articleUrl}">
  <meta property="og:title" content="${escapeHtml(article.title)}">
  <meta property="og:description" content="${escapeHtml(plainContent)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:site_name" content="The Digital Ledger">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${articleUrl}">
  <meta name="twitter:title" content="${escapeHtml(article.title)}">
  <meta name="twitter:description" content="${escapeHtml(plainContent)}">
  <meta name="twitter:image" content="${imageUrl}">
  
  ${publishedAtISO ? `<meta property="article:published_time" content="${publishedAtISO}">` : ''}
</head>
<body>
  <article>
    <h1>${escapeHtml(article.title)}</h1>
    ${article.excerpt ? `<p><strong>${escapeHtml(article.excerpt)}</strong></p>` : ''}
    <p>Published: ${publishDate}</p>
    ${article.imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(article.title)}">` : ''}
    <div>${article.content || ''}</div>
    ${article.sourceUrl ? `<p>Source: <a href="${article.sourceUrl}">${escapeHtml(article.sourceName || 'Original Source')}</a></p>` : ''}
    <p><a href="${articleUrl}">Read full article on The Digital Ledger</a></p>
  </article>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error('Error serving bot-friendly article:', error);
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Initialize menu settings
  try {
    await storage.initializeMenuSettings();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log(`Warning: Menu settings initialization failed: ${errorMsg}`);
  }

  // Initialize news categories
  try {
    await storage.initializeNewsCategories();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log(`Warning: News categories initialization failed: ${errorMsg}`);
  }

  // Auto-seed database on startup if empty
  try {
    log("Checking database status...");
    const userCount = await db.select().from(users).limit(10);
    const newsCount = await db.select().from(newsArticles).limit(5);
    const podcastCount = await db.select().from(podcastEpisodes).limit(5);
    const forumCount = await db.select().from(forumDiscussions).limit(5);

    // If database appears empty or minimal, auto-seed
    if (userCount.length <= 2 || newsCount.length === 0 || podcastCount.length === 0 || forumCount.length === 0) {
      log("Database appears empty. Auto-seeding with sample data...");
      const result = await seedDatabase(false);
      if (result.success) {
        log("✓ Database auto-seeded successfully!");
      }
    } else {
      log(`✓ Database already populated (${userCount.length} users, ${newsCount.length} articles, ${podcastCount.length} podcasts, ${forumCount.length} discussions)`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log(`Warning: Auto-seed check failed: ${errorMsg}`);
    // Continue server startup even if seeding fails
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
