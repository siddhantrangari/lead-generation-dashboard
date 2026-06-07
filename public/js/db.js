// Default mock lead templates to seed the database
const DEFAULT_MOCK_LEADS = [
  {
    id: "mock-1",
    name: "Apex Dental Care",
    niche: "Dentist",
    location: "New York, NY",
    address: "120 Broadway, New York, NY 10005",
    phone: "+1 212-555-0143",
    website: "https://apexdentalnyc.com",
    rating: 4.7,
    reviewCount: 128,
    latitude: 40.7081,
    longitude: -74.0112,
    status: "new",
    value: 1200,
    notes: "Top rated dentist in downtown Manhattan. Website looks a bit outdated, needs mobile optimization.",
    checklist: [
      { id: 1, task: "Audit website performance", done: true },
      { id: 2, task: "Identify technical SEO issues", done: false },
      { id: 3, task: "Send cold outreach email", done: false },
      { id: 4, task: "Follow up call", done: false }
    ],
    enriched: false,
    email: null,
    emails: [],
    socials: {},
    techStack: []
  },
  {
    id: "mock-2",
    name: "Metro Fitness Hub",
    niche: "Gym",
    location: "New York, NY",
    address: "350 5th Ave, New York, NY 10118",
    phone: "+1 212-555-0982",
    website: "https://metrofitnesshubnyc.com",
    rating: 4.5,
    reviewCount: 312,
    latitude: 40.7484,
    longitude: -73.9857,
    status: "contacted",
    value: 2400,
    notes: "Medium sized gym. High traffic but social media links on website are broken. Great opportunity for agency social media services.",
    checklist: [
      { id: 1, task: "Verify social links", done: true },
      { id: 2, task: "Draft custom email template", done: true },
      { id: 3, task: "Send email outreach", done: true },
      { id: 4, task: "Follow up on social channels", done: false }
    ],
    enriched: true,
    email: "outreach@metrofitnesshubnyc.com",
    emails: ["outreach@metrofitnesshubnyc.com", "info@metrofitnesshubnyc.com"],
    socials: {
      instagram: "instagram.com/metrofitnesshub",
      facebook: "facebook.com/metrofitnesshubnyc",
      linkedin: "linkedin.com/company/metro-fitness-hub"
    },
    techStack: ["WordPress", "Google Analytics", "WooCommerce"]
  },
  {
    id: "mock-3",
    name: "Vanguard Law Group",
    niche: "Lawyer",
    location: "San Francisco, CA",
    address: "101 California St, San Francisco, CA 94111",
    phone: "+1 415-555-8833",
    website: "https://vanguardlawsf.com",
    rating: 4.9,
    reviewCount: 84,
    latitude: 37.7928,
    longitude: -122.3995,
    status: "discussion",
    value: 5000,
    notes: "Corporate and tax attorneys. Expressed interest in automated client onboarding portal. Scheduled Zoom call for next Thursday.",
    checklist: [
      { id: 1, task: "Send portfolio link", done: true },
      { id: 2, task: "Initial proposal draft", done: true },
      { id: 3, task: "Review pricing", done: false },
      { id: 4, task: "Zoom demo call", done: false }
    ],
    enriched: true,
    email: "partner@vanguardlawsf.com",
    emails: ["partner@vanguardlawsf.com", "contact@vanguardlawsf.com"],
    socials: {
      linkedin: "linkedin.com/company/vanguardlawsf"
    },
    techStack: ["Webflow", "Hubspot", "Google Tag Manager"]
  },
  {
    id: "mock-4",
    name: "Blue Wave Digital",
    niche: "Agency",
    location: "Austin, TX",
    address: "600 Congress Ave, Austin, TX 78701",
    phone: "+1 512-555-4321",
    website: "https://bluewavedigital.co",
    rating: 4.8,
    reviewCount: 43,
    latitude: 30.2688,
    longitude: -97.7423,
    status: "converted",
    value: 3500,
    notes: "SEO and PPC agency. Signed 3-month contract for custom analytics dashboard development.",
    checklist: [
      { id: 1, task: "Send contract agreement", done: true },
      { id: 2, task: "Process first payment invoice", done: true },
      { id: 3, task: "Kickoff onboarding questionnaire", done: true },
      { id: 4, task: "Setup Github repo", done: true }
    ],
    enriched: true,
    email: "hello@bluewavedigital.co",
    emails: ["hello@bluewavedigital.co", "sales@bluewavedigital.co"],
    socials: {
      twitter: "twitter.com/bluewavedigital",
      linkedin: "linkedin.com/company/bluewavedigital"
    },
    techStack: ["React", "TailwindCSS", "Segment", "NextJS"]
  },
  {
    id: "mock-5",
    name: "Sip & Studio Cafe",
    niche: "Cafe",
    location: "London, UK",
    address: "15 Wardour St, London W1D 6PH",
    phone: "+44 20 7555 0192",
    website: "https://sipandstudiocafe.co.uk",
    rating: 4.3,
    reviewCount: 204,
    latitude: 51.5113,
    longitude: -0.1319,
    status: "lost",
    value: 800,
    notes: "Independent specialty cafe. Emailed about custom online ordering app. Rejected - too small budget right now, using Deliveroo.",
    checklist: [
      { id: 1, task: "Send cafe package info", done: true },
      { id: 2, task: "Send follow up email", done: true },
      { id: 3, task: "Offer discount model", done: true }
    ],
    enriched: false,
    email: null,
    emails: [],
    socials: {},
    techStack: []
  },
  {
    id: "mock-6",
    name: "Green Garden Bistro",
    niche: "Restaurant",
    location: "Austin, TX",
    address: "1601 Barton Springs Rd, Austin, TX 78704",
    phone: "+1 512-555-8900",
    website: "https://greengardenbistro.com",
    rating: 4.6,
    reviewCount: 512,
    latitude: 30.2638,
    longitude: -97.7712,
    status: "new",
    value: 1800,
    notes: "Popular organic eatery. High reviews, but website reservation system is slow and buggy. Pitch custom table-booking app.",
    checklist: [
      { id: 1, task: "Test booking flow on mobile", done: true },
      { id: 2, task: "Outline performance issues", done: false },
      { id: 3, task: "Draft pitch email", done: false }
    ],
    enriched: false,
    email: null,
    emails: [],
    socials: {},
    techStack: []
  }
];

const DEFAULT_TEMPLATES = [
  {
    id: "template-cold-web",
    name: "🌐 Website Upgrade Pitch",
    subject: "Improving online bookings for {{business_name}}",
    body: "Hi {{owner_name}},\n\nI came across {{business_name}} while looking for top-rated services in {{location}} and was really impressed by your {{rating}}-star reviews! \n\nHowever, I noticed that your website is not fully optimized for mobile devices, which might be causing you to lose potential clients to competitors.\n\nI build custom high-performance websites for businesses in the {{niche}} niche that load in under 1 second and convert visitors into leads automatically. \n\nWould you be open to a quick 5-minute call this Thursday to see a mockup I drew up for {{business_name}}?\n\nBest regards,\n[Your Name]\n[Your Agency]"
  },
  {
    id: "template-social",
    name: "📱 Social Media Outreach",
    subject: "Quick question about {{business_name}}'s social presence",
    body: "Hi {{owner_name}},\n\nI love what you are doing at {{business_name}}! Your reviews are amazing, but I noticed the Instagram and Facebook links on your website aren't active or are missing some of your latest work.\n\nFor businesses in the {{niche}} industry, social media is the #1 way to capture local customers. We specialize in managing profiles and running high-ROI local lead ads for companies in {{location}}.\n\nCould I send you 3 quick, custom social graphics we designed for {{business_name}} that you can post today for free?\n\nBest,\n[Your Name]"
  },
  {
    id: "template-followup",
    name: "✉️ Quick Follow-up",
    subject: "Checking in re: {{business_name}} digital presence",
    body: "Hi {{owner_name}},\n\nI wanted to follow up on my email last week regarding your website and booking flow at {{business_name}}.\n\nI know you are busy running the business in {{location}}. If you have 5 minutes next week, I'd love to share our checklist of quick tweaks that can increase your conversion rates by 20%.\n\nHere is a link to schedule a brief chat: [Your Booking Link]\n\nHave a great week,\n[Your Name]"
  }
];

// Database manager
export const db = {
  /**
   * Initializes local storage with seed data if empty
   */
  init() {
    if (!localStorage.getItem('lead_gen_crm_db')) {
      localStorage.setItem('lead_gen_crm_db', JSON.stringify(DEFAULT_MOCK_LEADS));
    }
    if (!localStorage.getItem('lead_gen_templates')) {
      localStorage.setItem('lead_gen_templates', JSON.stringify(DEFAULT_TEMPLATES));
    }
    if (!localStorage.getItem('lead_gen_api_config')) {
      localStorage.setItem('lead_gen_api_config', JSON.stringify({
        mode: 'mock', // 'mock', 'osm', 'serpapi'
        serpapiKey: '',
        razorpayKeyId: 'rzp_test_SwqquWZp1VDDGx',
        razorpayKeySecret: '',
        mockPayment: false
      }));
    } else {
      // Migrate existing configuration and turn off mock payments by default
      try {
        const existingConfig = JSON.parse(localStorage.getItem('lead_gen_api_config'));
        if (existingConfig) {
          existingConfig.razorpayKeyId = existingConfig.razorpayKeyId || 'rzp_test_SwqquWZp1VDDGx';
          existingConfig.razorpayKeySecret = existingConfig.razorpayKeySecret || '';
          existingConfig.mockPayment = false; // Turn off mock payments to verify real checkout
          localStorage.setItem('lead_gen_api_config', JSON.stringify(existingConfig));
        }
      } catch (err) {
        console.error('Migration of API config failed:', err);
      }
    }
    if (!localStorage.getItem('lead_gen_subscription')) {
      localStorage.setItem('lead_gen_subscription', JSON.stringify({
        plan: 'free', // 'free', 'starter', 'pro', 'premium'
        active: false,
        expiresAt: null,
        paymentId: null,
        subscriptionId: null
      }));
    } else {
      // Clean up any mock subscriptions to allow testing the live gateway
      try {
        const sub = JSON.parse(localStorage.getItem('lead_gen_subscription'));
        if (sub && sub.subscriptionId && sub.subscriptionId.startsWith('sub_mock_')) {
          localStorage.setItem('lead_gen_subscription', JSON.stringify({
            plan: 'free',
            active: false,
            expiresAt: null,
            paymentId: null,
            subscriptionId: null
          }));
        }
      } catch (err) {
        console.error('Failed to clean up mock subscription:', err);
      }
    }
  },

  /**
   * Fetches all leads stored in the database
   */
  getLeads() {
    this.init();
    return JSON.parse(localStorage.getItem('lead_gen_crm_db'));
  },

  /**
   * Saves or updates a lead in the database
   */
  saveLead(lead) {
    const leads = this.getLeads();
    const index = leads.findIndex(l => l.id === lead.id);
    
    if (index !== -1) {
      leads[index] = { ...leads[index], ...lead };
    } else {
      leads.push(lead);
    }
    
    localStorage.setItem('lead_gen_crm_db', JSON.stringify(leads));
    return leads;
  },

  /**
   * Deletes a lead by ID
   */
  deleteLead(id) {
    const leads = this.getLeads();
    const filtered = leads.filter(l => l.id !== id);
    localStorage.setItem('lead_gen_crm_db', JSON.stringify(filtered));
    return filtered;
  },

  /**
   * Updates lead status (CRM stage)
   */
  updateLeadStatus(id, status) {
    const leads = this.getLeads();
    const lead = leads.find(l => l.id === id);
    if (lead) {
      lead.status = status;
      localStorage.setItem('lead_gen_crm_db', JSON.stringify(leads));
    }
    return leads;
  },

  /**
   * Updates lead notes
   */
  updateLeadNotes(id, notes) {
    const leads = this.getLeads();
    const lead = leads.find(l => l.id === id);
    if (lead) {
      lead.notes = notes;
      localStorage.setItem('lead_gen_crm_db', JSON.stringify(leads));
    }
    return leads;
  },

  /**
   * Updates lead estimated pipeline value
   */
  updateLeadValue(id, value) {
    const leads = this.getLeads();
    const lead = leads.find(l => l.id === id);
    if (lead) {
      lead.value = Number(value) || 0;
      localStorage.setItem('lead_gen_crm_db', JSON.stringify(leads));
    }
    return leads;
  },

  /**
   * Updates checklist for a lead
   */
  updateLeadChecklist(id, checklist) {
    const leads = this.getLeads();
    const lead = leads.find(l => l.id === id);
    if (lead) {
      lead.checklist = checklist;
      localStorage.setItem('lead_gen_crm_db', JSON.stringify(leads));
    }
    return leads;
  },

  /**
   * Gets outreach templates
   */
  getTemplates() {
    this.init();
    return JSON.parse(localStorage.getItem('lead_gen_templates'));
  },

  /**
   * Saves or updates a template
   */
  saveTemplate(template) {
    const templates = this.getTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    
    if (index !== -1) {
      templates[index] = { ...templates[index], ...template };
    } else {
      templates.push(template);
    }
    
    localStorage.setItem('lead_gen_templates', JSON.stringify(templates));
    return templates;
  },

  /**
   * Gets API key and config settings
   */
  getApiConfig() {
    this.init();
    return JSON.parse(localStorage.getItem('lead_gen_api_config'));
  },

  /**
   * Saves API key and config settings
   */
  saveApiConfig(config) {
    localStorage.setItem('lead_gen_api_config', JSON.stringify(config));
  },

  /**
   * Gets current subscription plan state
   */
  getSubscription() {
    this.init();
    return JSON.parse(localStorage.getItem('lead_gen_subscription'));
  },

  /**
   * Saves subscription plan state
   */
  saveSubscription(subState) {
    localStorage.setItem('lead_gen_subscription', JSON.stringify(subState));
    return subState;
  },

  /**
   * Resets database to initial seed data
   */
  resetDatabase() {
    localStorage.removeItem('lead_gen_crm_db');
    localStorage.removeItem('lead_gen_templates');
    localStorage.removeItem('lead_gen_api_config');
    localStorage.removeItem('lead_gen_subscription');
    this.init();
  }
};

