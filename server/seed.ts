import { db } from "./db";
import {
  newsArticles,
  podcastEpisodes,
  forumCategories,
  forumDiscussions,
  forumReplies,
  resources,
  users,
} from "@shared/schema";
import { sql, notInArray } from "drizzle-orm";

export async function clearSeedData() {
  console.log("Clearing seed data from database...");
  
  try {
    // Delete seed data in correct order to respect foreign key constraints
    const adminEmails = ['admin@admin.com', 'admin@example.com', 'testuser@example.com'];
    
    // Delete forum data (child tables first)
    await db.delete(forumReplies);
    console.log("✓ Cleared forum replies");
    
    await db.delete(forumDiscussions);
    console.log("✓ Cleared forum discussions");
    
    await db.delete(forumCategories);
    console.log("✓ Cleared forum categories");
    
    // Delete news and content
    await db.delete(newsArticles);
    console.log("✓ Cleared news articles");
    
    await db.delete(podcastEpisodes);
    console.log("✓ Cleared podcast episodes");
    
    await db.delete(resources);
    console.log("✓ Cleared resources");
    
    // Delete non-admin users last
    await db.delete(users).where(notInArray(users.email, adminEmails));
    console.log("✓ Cleared seed users (kept admin accounts)");
    
    return { success: true, message: "Seed data cleared successfully" };
  } catch (error) {
    console.error("Error clearing seed data:", error);
    throw error;
  }
}

export async function seedDatabase(force: boolean = false) {
  console.log("Starting database seeding...");
  
  try {
    if (force) {
      console.log("Force flag enabled. Clearing existing seed data...");
      await clearSeedData();
    } else {
      // Check if database already has seed data
      const existingUsers = await db.select().from(users).limit(15);
      const existingNews = await db.select().from(newsArticles).limit(5);
      const existingPodcasts = await db.select().from(podcastEpisodes).limit(5);
      const existingResources = await db.select().from(resources).limit(5);
      const existingCategories = await db.select().from(forumCategories).limit(3);

      if (existingUsers.length > 5 || existingNews.length > 3 || existingPodcasts.length > 3) {
        console.log("Database already contains significant seed data. Skipping seeding to avoid duplicates.");
        return { 
          success: true, 
          message: "Database already contains seed data. Use force option to rebuild.", 
          alreadySeeded: true 
        };
      }
    }

    console.log("Proceeding with fresh seeding...");

    const contributorUsers = [
      {
        id: sql`gen_random_uuid()`,
        email: "sarah.mitchell@example.com",
        firstName: "Sarah",
        lastName: "Mitchell",
        role: "user",
        title: "Senior Tax Manager",
        company: "Deloitte",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        expertiseTags: sql`ARRAY['Tax Automation', 'AI Integration']`,
        bio: "Leading AI-powered tax automation initiatives at Deloitte. 15+ years in tax consulting.",
        points: 2847,
        badges: sql`ARRAY['AI Pioneer', 'Top Contributor']`,
        isActive: true,
      },
      {
        id: sql`gen_random_uuid()`,
        email: "james.rodriguez@example.com",
        firstName: "James",
        lastName: "Rodriguez",
        role: "user",
        title: "Chief Audit Technology Officer",
        company: "KPMG",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        expertiseTags: sql`ARRAY['Audit Analytics', 'Machine Learning']`,
        bio: "Championing ML-driven audit procedures across KPMG's global network.",
        points: 2654,
        badges: sql`ARRAY['Innovator', 'Expert Badge']`,
        isActive: true,
      },
      {
        id: sql`gen_random_uuid()`,
        email: "emily.chen@example.com",
        firstName: "Emily",
        lastName: "Chen",
        role: "user",
        title: "AI Research Director",
        company: "PwC",
        profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        expertiseTags: sql`ARRAY['Natural Language Processing', 'Financial Analysis']`,
        bio: "Developing NLP solutions for financial document analysis and compliance checking.",
        points: 2531,
        badges: sql`ARRAY['Research Leader', 'AI Champion']`,
        isActive: true,
      },
      {
        id: sql`gen_random_uuid()`,
        email: "michael.oconnor@example.com",
        firstName: "Michael",
        lastName: "O'Connor",
        role: "user",
        title: "Partner, Advisory Services",
        company: "EY",
        profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        expertiseTags: sql`ARRAY['Blockchain', 'Smart Contracts']`,
        bio: "Blockchain and smart contract specialist advising on audit automation and transparency.",
        points: 2398,
        badges: sql`ARRAY['Blockchain Expert']`,
        isActive: true,
      },
      {
        id: sql`gen_random_uuid()`,
        email: "priya.sharma@example.com",
        firstName: "Priya",
        lastName: "Sharma",
        role: "user",
        title: "Forensic Accounting Lead",
        company: "Grant Thornton",
        profileImageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        expertiseTags: sql`ARRAY['Fraud Detection', 'Data Analytics']`,
        bio: "Using AI to detect sophisticated fraud patterns in financial transactions.",
        points: 2276,
        badges: sql`ARRAY['Fraud Fighter', 'Data Wizard']`,
        isActive: true,
      },
      {
        id: sql`gen_random_uuid()`,
        email: "david.kim@example.com",
        firstName: "David",
        lastName: "Kim",
        role: "user",
        title: "Technology Risk Manager",
        company: "BDO",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        expertiseTags: sql`ARRAY['Cybersecurity', 'Risk Management']`,
        bio: "Implementing AI-driven risk assessment frameworks for emerging technologies.",
        points: 2103,
        badges: sql`ARRAY['Security Pro']`,
        isActive: true,
      },
      {
        id: sql`gen_random_uuid()`,
        email: "lisa.thompson@example.com",
        firstName: "Lisa",
        lastName: "Thompson",
        role: "user",
        title: "Controller",
        company: "Tesla",
        profileImageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        expertiseTags: sql`ARRAY['Financial Reporting', 'Process Automation']`,
        bio: "Transforming month-end close processes with AI automation at a Fortune 500 company.",
        points: 1987,
        badges: sql`ARRAY['Process Master']`,
        isActive: true,
      },
      {
        id: sql`gen_random_uuid()`,
        email: "robert.williams@example.com",
        firstName: "Robert",
        lastName: "Williams",
        role: "user",
        title: "AI Solutions Architect",
        company: "Accenture",
        profileImageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        expertiseTags: sql`ARRAY['Cloud Computing', 'AI Architecture']`,
        bio: "Designing scalable AI solutions for finance and accounting transformations.",
        points: 1845,
        badges: sql`ARRAY['Cloud Expert', 'Architect']`,
        isActive: true,
      },
      {
        id: sql`gen_random_uuid()`,
        email: "angela.martinez@example.com",
        firstName: "Angela",
        lastName: "Martinez",
        role: "user",
        title: "VP of Finance Technology",
        company: "Amazon",
        profileImageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        expertiseTags: sql`ARRAY['Digital Transformation', 'Change Management']`,
        bio: "Leading finance tech initiatives and AI adoption strategies at scale.",
        points: 1723,
        badges: sql`ARRAY['Transformation Leader']`,
        isActive: true,
      },
      {
        id: sql`gen_random_uuid()`,
        email: "thomas.anderson@example.com",
        firstName: "Thomas",
        lastName: "Anderson",
        role: "user",
        title: "Managing Director",
        company: "RSM",
        profileImageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
        expertiseTags: sql`ARRAY['Strategic Planning', 'AI Ethics']`,
        bio: "Guiding mid-market firms through ethical AI adoption in accounting practices.",
        points: 1598,
        badges: sql`ARRAY['Ethics Champion']`,
        isActive: true,
      },
    ];

    await db.insert(users).values(contributorUsers);
    console.log("✓ Seeded community contributors");

    const newsData = [
      {
        title: "How Machine Learning is Revolutionizing Audit Procedures in 2024",
        content: "New AI-powered audit tools are showing 94% accuracy in detecting financial anomalies, transforming traditional audit methodologies across major accounting firms. Machine learning algorithms are now capable of analyzing thousands of transactions in minutes, identifying patterns that would take human auditors weeks to discover.",
        excerpt: "New AI-powered audit tools are showing 94% accuracy in detecting financial anomalies, transforming traditional audit methodologies across major accounting firms.",
        category: "Automation",
        imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        sourceUrl: "https://example.com/ml-audit-revolution",
        authorName: "Jennifer Lawrence",
        isPublished: true,
        isFeatured: true,
      },
      {
        title: "New FASB Guidelines for AI-Generated Financial Reports",
        content: "The Financial Accounting Standards Board releases new guidance on transparency requirements for AI-assisted financial reporting and disclosure obligations. These guidelines aim to ensure stakeholders understand when and how AI is used in preparing financial statements.",
        excerpt: "The Financial Accounting Standards Board releases new guidance on transparency requirements for AI-assisted financial reporting and disclosure obligations.",
        category: "Regulatory",
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        sourceUrl: "https://example.com/fasb-ai-guidelines",
        authorName: "Michael Chen",
        isPublished: true,
        isFeatured: true,
      },
      {
        title: "AI Fraud Detection Prevents $2.3B in Losses for Fortune 500 Companies",
        content: "Latest industry report shows advanced AI algorithms successfully identified and prevented fraudulent transactions with 99.2% accuracy rate. The technology combines behavioral analytics, pattern recognition, and real-time monitoring to detect anomalies.",
        excerpt: "Latest industry report shows advanced AI algorithms successfully identified and prevented fraudulent transactions with 99.2% accuracy rate.",
        category: "Fraud Detection",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        sourceUrl: "https://example.com/ai-fraud-prevention",
        authorName: "Sarah Johnson",
        isPublished: true,
        isFeatured: false,
      },
      {
        title: "GPT-4 Integration in Tax Software Reduces Prep Time by 60%",
        content: "Major tax preparation platforms report dramatic efficiency gains after integrating OpenAI's GPT-4 for document analysis and tax code interpretation. Early adopters are seeing significant reductions in time spent on routine tax filings.",
        excerpt: "Major tax preparation platforms report dramatic efficiency gains after integrating OpenAI's GPT-4 for document analysis and tax code interpretation.",
        category: "Generative AI",
        imageUrl: "https://images.unsplash.com/photo-1633265486064-086b219458ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        sourceUrl: "https://example.com/gpt4-tax-software",
        authorName: "David Martinez",
        isPublished: true,
        isFeatured: false,
      },
      {
        title: "Automated Reconciliation Systems Save Big Four Firms 100,000 Hours Annually",
        content: "Industry analysis reveals that AI-powered reconciliation systems deployed across the Big Four accounting firms are saving approximately 100,000 collective hours per year, allowing accountants to focus on higher-value advisory work.",
        excerpt: "Industry analysis reveals that AI-powered reconciliation systems deployed across the Big Four accounting firms are saving approximately 100,000 collective hours per year.",
        category: "Automation",
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        sourceUrl: "https://example.com/automated-reconciliation",
        authorName: "Emily Rodriguez",
        isPublished: true,
        isFeatured: false,
      },
      {
        title: "SEC Proposes New Rules for AI Use in Financial Disclosures",
        content: "The Securities and Exchange Commission has announced proposed regulations requiring companies to disclose their use of artificial intelligence in preparing financial statements and conducting internal audits.",
        excerpt: "The Securities and Exchange Commission has announced proposed regulations requiring companies to disclose their use of artificial intelligence in preparing financial statements.",
        category: "Regulatory",
        imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        sourceUrl: "https://example.com/sec-ai-rules",
        authorName: "Robert Thompson",
        isPublished: true,
        isFeatured: false,
      },
      {
        title: "Neural Networks Detect Complex Money Laundering Schemes",
        content: "Advanced neural network systems are now capable of identifying sophisticated money laundering patterns across multiple jurisdictions, helping financial institutions comply with AML regulations more effectively.",
        excerpt: "Advanced neural network systems are now capable of identifying sophisticated money laundering patterns across multiple jurisdictions.",
        category: "Fraud Detection",
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        sourceUrl: "https://example.com/neural-aml",
        authorName: "Lisa Wang",
        isPublished: true,
        isFeatured: false,
      },
      {
        title: "ChatGPT Plugins Transform Client Communication for Small CPA Firms",
        content: "Small to mid-size CPA firms are leveraging ChatGPT plugins to automate routine client inquiries, schedule meetings, and provide instant answers to common tax questions, improving client satisfaction scores by 45%.",
        excerpt: "Small to mid-size CPA firms are leveraging ChatGPT plugins to automate routine client inquiries and provide instant answers to common tax questions.",
        category: "Generative AI",
        imageUrl: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        sourceUrl: "https://example.com/chatgpt-cpa-firms",
        authorName: "Amanda Foster",
        isPublished: true,
        isFeatured: false,
      },
      {
        title: "Robotic Process Automation Handles 80% of Accounts Payable Tasks",
        content: "New data shows that RPA bots are now handling the majority of routine accounts payable processes, including invoice processing, payment authorization, and vendor communications, with error rates below 0.1%.",
        excerpt: "New data shows that RPA bots are now handling the majority of routine accounts payable processes with error rates below 0.1%.",
        category: "Automation",
        imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        sourceUrl: "https://example.com/rpa-accounts-payable",
        authorName: "Christopher Lee",
        isPublished: true,
        isFeatured: false,
      },
      {
        title: "PCAOB Issues Guidance on AI Auditor Independence Requirements",
        content: "The Public Company Accounting Oversight Board has released comprehensive guidance on maintaining auditor independence when using AI tools, addressing concerns about algorithmic bias and data privacy.",
        excerpt: "The Public Company Accounting Oversight Board has released comprehensive guidance on maintaining auditor independence when using AI tools.",
        category: "Regulatory",
        imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        sourceUrl: "https://example.com/pcaob-ai-guidance",
        authorName: "Patricia O'Brien",
        isPublished: true,
        isFeatured: false,
      },
      {
        title: "Predictive Analytics Identify High-Risk Audit Areas with 91% Accuracy",
        content: "Cutting-edge predictive analytics platforms are helping auditors identify high-risk areas before fieldwork begins, significantly improving audit efficiency and effectiveness while reducing overall costs.",
        excerpt: "Cutting-edge predictive analytics platforms are helping auditors identify high-risk areas before fieldwork begins with 91% accuracy.",
        category: "Fraud Detection",
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        sourceUrl: "https://example.com/predictive-audit-analytics",
        authorName: "Mark Stevens",
        isPublished: true,
        isFeatured: false,
      },
    ];

    await db.insert(newsArticles).values(newsData);
    console.log("✓ Seeded news articles");

    const podcastData = [
      {
        episodeNumber: 3,
        title: "The Future of AI in Tax Compliance",
        description: "Dr. Michael Roberts from Deloitte discusses how AI is transforming tax compliance, from automated return preparation to real-time tax position analysis.",
        duration: "42:18",
        audioUrl: "https://example.com/podcast-3.mp3",
        imageUrl: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        hostName: "Sarah Chen",
        guestName: "Dr. Michael Roberts",
        guestTitle: "Director of Tax Innovation, Deloitte",
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        playCount: 1247,
        likes: 89,
        isFeatured: true,
      },
      {
        episodeNumber: 4,
        title: "Blockchain Auditing: AI-Powered Verification",
        description: "Jennifer Wu, Chief Blockchain Officer at PwC, shares insights on using AI to audit blockchain transactions and smart contracts.",
        duration: "38:45",
        audioUrl: "https://example.com/podcast-4.mp3",
        imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        hostName: "Sarah Chen",
        guestName: "Jennifer Wu",
        guestTitle: "Chief Blockchain Officer, PwC",
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        playCount: 892,
        likes: 67,
        isFeatured: false,
      },
      {
        episodeNumber: 5,
        title: "ChatGPT in the Accounting Firm: Real Stories",
        description: "Managing Partner David Martinez shares practical experiences implementing ChatGPT and GPT-4 in a mid-sized accounting firm.",
        duration: "51:22",
        audioUrl: "https://example.com/podcast-5.mp3",
        imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        hostName: "Sarah Chen",
        guestName: "David Martinez",
        guestTitle: "Managing Partner, Martinez & Associates",
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        playCount: 1534,
        likes: 112,
        isFeatured: false,
      },
      {
        episodeNumber: 6,
        title: "Fraud Detection 2.0: Machine Learning in Action",
        description: "Forensic accountant Lisa Morgan demonstrates how machine learning models are catching fraud that traditional methods miss.",
        duration: "44:15",
        audioUrl: "https://example.com/podcast-6.mp3",
        imageUrl: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        hostName: "Sarah Chen",
        guestName: "Lisa Morgan",
        guestTitle: "Lead Forensic Accountant, Grant Thornton",
        publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        playCount: 1109,
        likes: 78,
        isFeatured: false,
      },
      {
        episodeNumber: 7,
        title: "AI Ethics in Accounting: Drawing the Line",
        description: "Professor Amanda Foster discusses the ethical implications of AI in accounting and where we should draw boundaries.",
        duration: "47:30",
        audioUrl: "https://example.com/podcast-7.mp3",
        imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        hostName: "Sarah Chen",
        guestName: "Prof. Amanda Foster",
        guestTitle: "Chair of Accounting Ethics, MIT",
        publishedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        playCount: 967,
        likes: 84,
        isFeatured: false,
      },
      {
        episodeNumber: 8,
        title: "Natural Language Processing for Financial Documents",
        description: "AI researcher Dr. Kevin Park explains how NLP is revolutionizing financial document analysis and contract review.",
        duration: "40:55",
        audioUrl: "https://example.com/podcast-8.mp3",
        imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        hostName: "Sarah Chen",
        guestName: "Dr. Kevin Park",
        guestTitle: "AI Research Lead, KPMG Labs",
        publishedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        playCount: 834,
        likes: 61,
        isFeatured: false,
      },
      {
        episodeNumber: 9,
        title: "Automating Month-End Close: Best Practices",
        description: "Controller Rachel Green shares her journey automating the month-end close process using AI and RPA.",
        duration: "36:42",
        audioUrl: "https://example.com/podcast-9.mp3",
        imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        hostName: "Sarah Chen",
        guestName: "Rachel Green",
        guestTitle: "Corporate Controller, Microsoft",
        publishedAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
        playCount: 1223,
        likes: 95,
        isFeatured: false,
      },
      {
        episodeNumber: 10,
        title: "Will AI Replace Accountants? The Real Answer",
        description: "Industry leaders debate the future of the accounting profession in an AI-driven world.",
        duration: "53:18",
        audioUrl: "https://example.com/podcast-10.mp3",
        imageUrl: "https://images.unsplash.com/photo-1560472355-109703aa3edc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        hostName: "Sarah Chen",
        guestName: "Panel Discussion",
        guestTitle: "Industry Leaders from Big Four",
        publishedAt: new Date(Date.now() - 49 * 24 * 60 * 60 * 1000),
        playCount: 2156,
        likes: 187,
        isFeatured: false,
      },
      {
        episodeNumber: 11,
        title: "Real-Time Financial Reporting with AI",
        description: "CFO James Patterson discusses implementing AI for continuous accounting and real-time financial insights.",
        duration: "45:27",
        audioUrl: "https://example.com/podcast-11.mp3",
        imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        hostName: "Sarah Chen",
        guestName: "James Patterson",
        guestTitle: "CFO, Shopify",
        publishedAt: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000),
        playCount: 1378,
        likes: 103,
        isFeatured: false,
      },
      {
        episodeNumber: 12,
        title: "AI for Small Accounting Practices",
        description: "Solo practitioner Maria Gonzalez shares affordable AI tools and strategies for small firms to compete with larger practices.",
        duration: "39:12",
        audioUrl: "https://example.com/podcast-12.mp3",
        imageUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        hostName: "Sarah Chen",
        guestName: "Maria Gonzalez",
        guestTitle: "CPA, Small Practice Owner",
        publishedAt: new Date(Date.now() - 63 * 24 * 60 * 60 * 1000),
        playCount: 1645,
        likes: 134,
        isFeatured: false,
      },
    ];

    await db.insert(podcastEpisodes).values(podcastData);
    console.log("✓ Seeded podcast episodes");

    const resourcesData = [
      {
        title: "Complete Guide to AI in Financial Reporting",
        description: "Comprehensive 120-page guide covering AI applications in financial reporting, from automation to predictive analytics.",
        type: "Guide",
        category: "Financial Reporting",
        fileUrl: "https://example.com/resources/ai-financial-reporting-guide.pdf",
        thumbnailUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        authorName: "Digital Ledger Team",
        downloadCount: 2347,
        rating: 5,
        isPublished: true,
      },
      {
        title: "Machine Learning for Auditors Video Course",
        description: "8-hour video course teaching auditors how to leverage machine learning in audit procedures.",
        type: "Video",
        category: "Audit",
        fileUrl: "https://example.com/resources/ml-auditors-course",
        thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        authorName: "Prof. James Wilson",
        downloadCount: 1876,
        rating: 5,
        isPublished: true,
      },
      {
        title: "Tax Automation Templates and Scripts",
        description: "Ready-to-use Python scripts and templates for automating common tax preparation tasks.",
        type: "Template",
        category: "Tax",
        fileUrl: "https://example.com/resources/tax-automation-templates.zip",
        thumbnailUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        authorName: "Michael Chen",
        downloadCount: 1654,
        rating: 5,
        isPublished: true,
      },
      {
        title: "AI Ethics Framework for Accountants",
        description: "Ethical guidelines and decision-making framework for implementing AI in accounting practices.",
        type: "Guide",
        category: "Ethics",
        fileUrl: "https://example.com/resources/ai-ethics-framework.pdf",
        thumbnailUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        authorName: "Ethics Committee",
        downloadCount: 1432,
        rating: 5,
        isPublished: true,
      },
      {
        title: "Fraud Detection Algorithm Case Studies",
        description: "Real-world case studies of successful AI fraud detection implementations.",
        type: "Case Study",
        category: "Fraud Detection",
        fileUrl: "https://example.com/resources/fraud-detection-cases.pdf",
        thumbnailUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        authorName: "Lisa Morgan",
        downloadCount: 1287,
        rating: 5,
        isPublished: true,
      },
      {
        title: "ChatGPT Prompts for Accountants",
        description: "Collection of 200+ optimized ChatGPT prompts for accounting tasks and client communication.",
        type: "Template",
        category: "AI Tools",
        fileUrl: "https://example.com/resources/chatgpt-prompts.pdf",
        thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        authorName: "Digital Ledger Community",
        downloadCount: 2156,
        rating: 5,
        isPublished: true,
      },
      {
        title: "RPA Implementation Roadmap",
        description: "Step-by-step guide to implementing robotic process automation in accounting workflows.",
        type: "Guide",
        category: "Automation",
        fileUrl: "https://example.com/resources/rpa-roadmap.pdf",
        thumbnailUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        authorName: "Robert Williams",
        downloadCount: 1543,
        rating: 5,
        isPublished: true,
      },
      {
        title: "AI Regulatory Compliance Checklist",
        description: "Comprehensive checklist for ensuring AI implementations meet regulatory requirements.",
        type: "Tool",
        category: "Compliance",
        fileUrl: "https://example.com/resources/ai-compliance-checklist.pdf",
        thumbnailUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        authorName: "Compliance Team",
        downloadCount: 1398,
        rating: 5,
        isPublished: true,
      },
      {
        title: "Webinar: AI in Month-End Close",
        description: "Recorded webinar on automating month-end close processes with AI and best practices.",
        type: "Video",
        category: "Financial Reporting",
        fileUrl: "https://example.com/resources/month-end-webinar",
        thumbnailUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        authorName: "Rachel Green",
        downloadCount: 987,
        rating: 5,
        isPublished: true,
      },
      {
        title: "Natural Language Processing Toolkit",
        description: "Open-source toolkit for analyzing financial documents using NLP.",
        type: "Tool",
        category: "AI Tools",
        fileUrl: "https://example.com/resources/nlp-toolkit.zip",
        thumbnailUrl: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        authorName: "Dr. Kevin Park",
        downloadCount: 743,
        rating: 5,
        isPublished: true,
      },
      {
        title: "Blockchain Audit Procedures Manual",
        description: "Detailed manual covering audit procedures for blockchain-based transactions.",
        type: "Guide",
        category: "Blockchain",
        fileUrl: "https://example.com/resources/blockchain-audit-manual.pdf",
        thumbnailUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        authorName: "Jennifer Wu",
        downloadCount: 856,
        rating: 5,
        isPublished: true,
      },
      {
        title: "Small Firm AI Adoption Strategy",
        description: "Practical strategies and affordable tools for small accounting firms to adopt AI.",
        type: "Guide",
        category: "Practice Management",
        fileUrl: "https://example.com/resources/small-firm-ai-strategy.pdf",
        thumbnailUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        authorName: "Maria Gonzalez",
        downloadCount: 1234,
        rating: 5,
        isPublished: true,
      },
    ];

    await db.insert(resources).values(resourcesData);
    console.log("✓ Seeded resources");

    const categoriesData = [
      {
        name: "AI Implementation",
        description: "Share experiences and best practices for implementing AI solutions in accounting workflows.",
        slug: "ai-implementation",
        color: "#3B82F6",
      },
      {
        name: "Regulatory Compliance",
        description: "Navigate evolving regulations and compliance requirements for AI in financial reporting.",
        slug: "regulatory-compliance",
        color: "#8B5CF6",
      },
      {
        name: "Learning & Development",
        description: "Career growth, certification paths, and skill development in AI accounting technologies.",
        slug: "learning-development",
        color: "#06B6D4",
      },
    ];

    await db.insert(forumCategories).values(categoriesData);
    console.log("✓ Seeded forum categories");

    console.log("Database seeding completed successfully!");
    return { success: true, message: "Database seeded successfully" };
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
