import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { db } from "./db";
import { users, newsArticles, podcastEpisodes, forumDiscussions } from "@shared/schema";
import { storage } from "./storage";

// ============================================
// SEO & Bot Detection Utilities
// ============================================

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

// Strip HTML tags and clean text for meta descriptions
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&')  // Decode &amp;
    .replace(/&lt;/g, '<')   // Decode &lt;
    .replace(/&gt;/g, '>')   // Decode &gt;
    .replace(/&quot;/g, '"') // Decode &quot;
    .replace(/&#39;/g, "'")  // Decode &#39;
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

// Extract first paragraph or generate summary for description
function generateDescription(content: string, maxLength: number = 160): string {
  const plainText = stripHtml(content);
  if (plainText.length <= maxLength) return plainText;
  
  // Try to break at sentence end
  const truncated = plainText.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclaim = truncated.lastIndexOf('!');
  const breakPoint = Math.max(lastSentence, lastQuestion, lastExclaim);
  
  if (breakPoint > maxLength * 0.5) {
    return plainText.substring(0, breakPoint + 1);
  }
  
  // Break at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  return plainText.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
}

// Extract keywords from content
function extractKeywords(title: string, content: string, categories: string[] = []): string[] {
  const keywords = new Set<string>([
    'finance', 'accounting', 'AI', 'artificial intelligence',
    ...categories
  ]);
  
  // Add words from title
  const titleWords = title.toLowerCase().split(/\s+/)
    .filter(word => word.length > 4 && !['about', 'their', 'these', 'those', 'which', 'would', 'could', 'should'].includes(word));
  titleWords.forEach(word => keywords.add(word));
  
  return Array.from(keywords).slice(0, 10);
}

// Calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = stripHtml(content).split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

// Comprehensive bot/crawler detection patterns
const botPatterns = [
  // AI Assistants
  'chatgpt', 'gptbot', 'chatgpt-user', 'oai-searchbot',
  'anthropic', 'claude', 'claudebot',
  'perplexity', 'perplexitybot',
  'google-extended', 'bard',
  // Search Engines
  'googlebot', 'bingbot', 'yandexbot', 'baiduspider', 'duckduckbot',
  'slurp', 'sogou', 'exabot', 'ia_archiver',
  // Social Media
  'facebookexternalhit', 'facebot', 'fb_iab',
  'linkedinbot', 'twitterbot', 'x-bot',
  'whatsapp', 'telegrambot', 'discordbot', 'slackbot',
  'pinterest', 'redditbot', 'tumblr',
  // Other Crawlers
  'applebot', 'mj12bot', 'semrushbot', 'ahrefsbot', 'dotbot',
  'bot', 'crawler', 'spider', 'scraper', 'fetcher'
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return botPatterns.some(pattern => ua.includes(pattern));
}

const app = express();

// Trust proxy - required for apps behind reverse proxy (like published Replit apps)
// This ensures Express correctly recognizes HTTPS connections and sets secure cookies
app.set("trust proxy", 1);

// ============================================
// Robots.txt - Allow all crawlers
// ============================================
app.get('/robots.txt', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain');
  res.send(`# The Digital Ledger - Robots.txt
# Welcome crawlers! We want our content indexed and shared.

# Allow all crawlers by default
User-agent: *
Allow: /
Crawl-delay: 1

# OpenAI Crawlers - Explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

# Anthropic Crawlers
User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

# Search Engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Yandex
Allow: /

User-agent: DuckDuckBot
Allow: /

# Social Media
User-agent: facebookexternalhit
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: Twitterbot
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml
`);
});

// ============================================
// Dynamic XML Sitemap for Google indexing
// ============================================
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const articles = await storage.getNewsArticles();
    const podcasts = await storage.getPodcastEpisodes();
    
    const now = new Date().toISOString();
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/news</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/podcasts</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/forums</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/resources</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;

    // Add news articles
    for (const article of articles.filter(a => !a.isArchived && a.status === 'published')) {
      const lastMod = article.publishedAt ? new Date(article.publishedAt).toISOString() : now;
      const imageUrl = article.imageUrl ? (article.imageUrl.startsWith('/') ? `${baseUrl}${article.imageUrl}` : article.imageUrl) : '';
      
      sitemap += `
  <url>
    <loc>${baseUrl}/news/${article.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <news:news>
      <news:publication>
        <news:name>The Digital Ledger</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${lastMod}</news:publication_date>
      <news:title>${escapeHtml(article.title)}</news:title>
    </news:news>
    ${imageUrl ? `<image:image><image:loc>${imageUrl}</image:loc><image:title>${escapeHtml(article.title)}</image:title></image:image>` : ''}
  </url>`;
    }

    // Add podcast episodes
    for (const podcast of podcasts.filter(p => !p.isArchived)) {
      const lastMod = podcast.publishedAt ? new Date(podcast.publishedAt).toISOString() : now;
      sitemap += `
  <url>
    <loc>${baseUrl}/podcasts/${podcast.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    sitemap += `
</urlset>`;

    res.type('application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// ============================================
// Bot-friendly article pages for ChatGPT, social media, and search engines
// Must be FIRST middleware to intercept before Vite
// ============================================
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
    
    log(`Serving SEO-optimized HTML for article ${articleId} to crawler`);
    
    // Get article categories for keywords (optional)
    const categoryNames: string[] = [];
    
    // Get author info
    let authorName = 'The Digital Ledger Team';
    if (article.authorId) {
      try {
        const author = await storage.getUser(article.authorId);
        if (author) {
          authorName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'The Digital Ledger Team';
        }
      } catch (e) {
        // Author optional
      }
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const articleUrl = `${baseUrl}/news/${article.id}`;
    
    // Generate optimized description
    const description = article.excerpt 
      ? generateDescription(article.excerpt, 160)
      : generateDescription(article.content || '', 160);
    
    // Generate longer description for Open Graph (300 chars)
    const ogDescription = article.excerpt 
      ? generateDescription(article.excerpt, 300)
      : generateDescription(article.content || '', 300);
    
    // Ensure image URL is absolute
    let imageUrl = article.imageUrl || `${baseUrl}/og-default.jpg`;
    if (imageUrl.startsWith('/')) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }
    
    // Generate keywords
    const keywords = extractKeywords(article.title, article.content || '', categoryNames);
    
    // Calculate reading time
    const readingTime = calculateReadingTime(article.content || '');
    
    // Date formatting
    const publishedAt = article.publishedAt ? new Date(article.publishedAt) : new Date();
    const publishedAtISO = publishedAt.toISOString();
    const publishDateFormatted = publishedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // JSON-LD Structured Data for Google Rich Snippets
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": description,
      "image": [imageUrl],
      "datePublished": publishedAtISO,
      "dateModified": publishedAtISO,
      "author": {
        "@type": "Person",
        "name": authorName,
        "url": baseUrl
      },
      "publisher": {
        "@type": "Organization",
        "name": "The Digital Ledger",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/logo.png`
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": articleUrl
      },
      "articleSection": categoryNames.length > 0 ? categoryNames[0] : "Finance & Accounting",
      "keywords": keywords.join(', '),
      "wordCount": stripHtml(article.content || '').split(/\s+/).length,
      "timeRequired": `PT${readingTime}M`,
      "isAccessibleForFree": true,
      "inLanguage": "en-US"
    };
    
    // Clean article content - keep HTML structure for readability
    const articleContent = article.content || '';
    
    const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns# article: https://ogp.me/ns/article#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escapeHtml(article.title)} | The Digital Ledger</title>
  <meta name="title" content="${escapeHtml(article.title)} | The Digital Ledger">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${keywords.join(', ')}">
  <meta name="author" content="${escapeHtml(authorName)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="googlebot" content="index, follow">
  <link rel="canonical" href="${articleUrl}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${articleUrl}">
  <meta property="og:title" content="${escapeHtml(article.title)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(article.title)}">
  <meta property="og:site_name" content="The Digital Ledger">
  <meta property="og:locale" content="en_US">
  
  <!-- Article-specific Open Graph -->
  <meta property="article:published_time" content="${publishedAtISO}">
  <meta property="article:modified_time" content="${publishedAtISO}">
  <meta property="article:author" content="${escapeHtml(authorName)}">
  <meta property="article:section" content="${categoryNames.length > 0 ? escapeHtml(categoryNames[0]) : 'Finance'}">
  ${categoryNames.map(cat => `<meta property="article:tag" content="${escapeHtml(cat)}">`).join('\n  ')}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${articleUrl}">
  <meta name="twitter:title" content="${escapeHtml(article.title)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <meta name="twitter:image" content="${imageUrl}">
  <meta name="twitter:image:alt" content="${escapeHtml(article.title)}">
  <meta name="twitter:site" content="@thedigitalledger">
  
  <!-- LinkedIn specific -->
  <meta property="og:image:secure_url" content="${imageUrl}">
  
  <!-- JSON-LD Structured Data for Google -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
  
  <!-- Basic styling for crawlers that render HTML -->
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333; }
    h1 { font-size: 2em; margin-bottom: 0.5em; color: #1a1a1a; }
    h2 { font-size: 1.5em; margin-top: 1.5em; color: #2a2a2a; }
    .meta { color: #666; font-size: 0.9em; margin-bottom: 1.5em; }
    .excerpt { font-size: 1.1em; font-weight: 500; color: #444; margin-bottom: 1.5em; border-left: 3px solid #0066cc; padding-left: 1em; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    article { margin-bottom: 2em; }
    .source { margin-top: 2em; padding-top: 1em; border-top: 1px solid #eee; color: #666; }
    a { color: #0066cc; }
    ul, ol { margin: 1em 0; padding-left: 1.5em; }
    li { margin: 0.5em 0; }
    p { margin: 1em 0; }
  </style>
</head>
<body>
  <article itemscope itemtype="https://schema.org/NewsArticle">
    <header>
      <h1 itemprop="headline">${escapeHtml(article.title)}</h1>
      <div class="meta">
        <span itemprop="author" itemscope itemtype="https://schema.org/Person">
          By <span itemprop="name">${escapeHtml(authorName)}</span>
        </span>
        &bull; 
        <time itemprop="datePublished" datetime="${publishedAtISO}">${publishDateFormatted}</time>
        &bull; 
        ${readingTime} min read
        ${categoryNames.length > 0 ? `&bull; ${categoryNames.map(c => escapeHtml(c)).join(', ')}` : ''}
      </div>
    </header>
    
    ${article.excerpt ? `<p class="excerpt" itemprop="description">${escapeHtml(article.excerpt)}</p>` : ''}
    
    ${article.imageUrl ? `
    <figure>
      <img src="${imageUrl}" alt="${escapeHtml(article.title)}" itemprop="image">
    </figure>
    ` : ''}
    
    <div itemprop="articleBody">
      ${articleContent}
    </div>
    
    ${article.sourceUrl ? `
    <footer class="source">
      <p>Source: <a href="${article.sourceUrl}" rel="noopener" target="_blank">${escapeHtml(article.sourceName || 'Original Source')}</a></p>
    </footer>
    ` : ''}
    
    <nav>
      <p><a href="${baseUrl}/news">← Back to all articles</a> | <a href="${baseUrl}">Visit The Digital Ledger</a></p>
    </nav>
  </article>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} The Digital Ledger. All rights reserved.</p>
  </footer>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
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
