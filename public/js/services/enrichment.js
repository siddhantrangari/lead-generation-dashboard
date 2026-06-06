/**
 * Simulated website contact scraper and technology identifier
 */

const TECH_CHOICES = {
  'Dentist': ['WordPress', 'Elementor', 'Google Analytics', 'Yoast SEO', 'PHP', 'Apache'],
  'Gym': ['Squarespace', 'Mindbody Integration', 'Google Tag Manager', 'Stripe', 'Facebook Pixel'],
  'Lawyer': ['Webflow', 'HubSpot', 'Salesforce CRM', 'Google Analytics 4', 'Cloudflare'],
  'Agency': ['React', 'NextJS', 'TailwindCSS', 'Segment', 'Hubspot', 'Hotjar', 'Vercel'],
  'Cafe': ['Wix', 'Squarespace', 'Mailchimp', 'Shopify', 'Square Payments'],
  'Restaurant': ['WordPress', 'OpenTable Widget', 'Facebook Custom Audiences', 'Google Tag Manager'],
  'Plumber': ['WordPress', 'GoDaddy Website Builder', 'Google Ads Conversion Tracking', 'PHP']
};
const DEFAULT_TECH = ['WordPress', 'Google Analytics', 'jQuery', 'Apache'];

const FIRST_NAMES = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Ashley', 'Robert', 'Amanda'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez'];

export const enrichmentService = {
  /**
   * Simulates website crawling and lead enrichment.
   * Dispatches updates via progressCallback to display a live console log.
   */
  async enrichLead(lead, progressCallback) {
    const domain = lead.website ? lead.website.replace(/https?:\/\/(www\.)?/, '') : `${lead.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const cleanName = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const ownerName = `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`;
    
    // Setup stages of simulation
    const steps = [
      { msg: `⚡ Initializing crawler for ${lead.name}...`, delay: 400 },
      { msg: `📡 Connecting to server: IP resolving for ${domain}...`, delay: 350 },
      { msg: `🟢 Connected. HTTP status 200 OK. Fetching index document...`, delay: 300 },
      { msg: `🔍 Parsing HTML DOM structure...`, delay: 400 },
      { msg: `📨 Scraping contact tags and mailto references...`, delay: 500, action: () => 'emails' },
      { msg: `🔗 Crawling subpages: /contact, /about, /terms...`, delay: 450 },
      { msg: `👥 Extracting social profiles from meta tags...`, delay: 450, action: () => 'socials' },
      { msg: `🛠️ Analyzing server headers and script footprints...`, delay: 500, action: () => 'tech' },
      { msg: `📋 Checking SSL certification and mobile responsiveness...`, delay: 350 },
      { msg: `🏆 Enrichment completed! Storing results in database...`, delay: 300 }
    ];

    let emails = [];
    let socials = {};
    let techStack = [];

    for (const step of steps) {
      if (progressCallback) {
        progressCallback(step.msg);
      }
      
      await wait(step.delay);
      
      // Perform matching logic
      if (step.action) {
        const type = step.action();
        if (type === 'emails') {
          const mainEmail = `contact@${domain}`;
          const officeEmail = `info@${domain}`;
          const ownerEmail = `${ownerName.toLowerCase().replace(' ', '.')}@${domain}`;
          emails = [ownerEmail, mainEmail, officeEmail];
          if (progressCallback) {
            progressCallback(`  ✔️ Discovered emails: [${emails.join(', ')}]`);
          }
        } else if (type === 'socials') {
          socials = {};
          if (['Gym', 'Cafe', 'Restaurant', 'Dentist'].includes(lead.niche)) {
            socials.instagram = `instagram.com/${cleanName}`;
            socials.facebook = `facebook.com/${cleanName}`;
          }
          if (['Lawyer', 'Agency', 'Gym'].includes(lead.niche)) {
            socials.linkedin = `linkedin.com/company/${cleanName}`;
          }
          if (['Agency'].includes(lead.niche)) {
            socials.twitter = `twitter.com/${cleanName}`;
          }
          
          const foundSocials = Object.keys(socials).map(k => `${k}: ${socials[k]}`);
          if (progressCallback && foundSocials.length > 0) {
            progressCallback(`  ✔️ Discovered social links: [${foundSocials.join(' | ')}]`);
          }
        } else if (type === 'tech') {
          techStack = TECH_CHOICES[lead.niche] || DEFAULT_TECH;
          if (progressCallback) {
            progressCallback(`  ✔️ Technology stack identified: [${techStack.join(', ')}]`);
          }
        }
      }
    }

    // Return the enriched data structure
    return {
      enriched: true,
      ownerName,
      email: emails[0], // primary outreach email
      emails,
      socials,
      techStack
    };
  }
};

// Utility function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility to pick random item
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
