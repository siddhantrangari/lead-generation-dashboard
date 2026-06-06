import { db } from '../db.js';

// Random datasets for generating dynamic mock leads
const COMPANY_PREFIXES = ['Apex', 'Summit', 'Vanguard', 'Blue Wave', 'Metro', 'Elite', 'Zenith', 'Nova', 'Pinnacle', 'Horizon', 'Evolve', 'Signature'];
const COMPANY_SUFFIXES = {
  'Dentist': ['Dental', 'Family Dental', 'Dental Care', 'Orthodontics', 'Dental Group'],
  'Gym': ['Fitness', 'Gym', 'Fitness Club', 'Athletic Club', 'CrossFit', 'Yoga Studio'],
  'Lawyer': ['Law Group', 'Law Firm', 'Associates', 'Legal Partners', 'Defense Lawyers'],
  'Agency': ['Digital', 'Marketing', 'Media', 'Solutions', 'Creative', 'SEO Group'],
  'Cafe': ['Cafe', 'Coffee Roasters', 'Espresso Bar', 'Bistro', 'Daily Brew'],
  'Restaurant': ['Grill', 'Bistro', 'Kitchen', 'Eatery', 'Steakhouse', 'Tavern'],
  'Plumber': ['Plumbing', 'Plumbing & Heating', 'Rooter Services', 'Drain Care']
};
const DEFAULT_SUFFIXES = ['Services', 'Co', 'Partners', 'Hub', 'Associates'];

const STREET_NAMES = ['Main St', 'Broadway', 'Oak Ave', 'Pine St', 'Congress Ave', 'California St', 'Washington St', 'Market St', 'Second St', 'Maple Dr'];

/**
 * Helper to generate a random number between min and max
 */
const randomBetween = (min, max) => Math.random() * (max - min) + min;

/**
 * Helper to pick a random item from array
 */
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generates realistic mock coordinates based on city name
 */
const getCityCoordinates = (city) => {
  const c = city.toLowerCase();
  if (c.includes('new york') || c.includes('nyc')) return { lat: 40.7128, lng: -74.0060 };
  if (c.includes('san francisco') || c.includes('sf')) return { lat: 37.7749, lng: -122.4194 };
  if (c.includes('austin')) return { lat: 30.2672, lng: -97.7431 };
  if (c.includes('london')) return { lat: 51.5074, lng: -0.1278 };
  if (c.includes('los angeles') || c.includes('la')) return { lat: 34.0522, lng: -118.2437 };
  if (c.includes('chicago')) return { lat: 41.8781, lng: -87.6298 };
  if (c.includes('sydney')) return { lat: -33.8688, lng: 151.2093 };
  if (c.includes('miami')) return { lat: 25.7617, lng: -80.1918 };
  // Default coordinate for random cities
  return { lat: 39.8283, lng: -98.5795 };
};

/**
 * Generates dynamic mock leads for any niche and city combo
 */
export const generateDynamicLeads = (niche, location, count = 10) => {
  const leads = [];
  const coords = getCityCoordinates(location);
  const formattedLocation = location.split(',')[0].trim();
  const suffixes = COMPANY_SUFFIXES[niche] || DEFAULT_SUFFIXES;

  for (let i = 0; i < count; i++) {
    const prefix = pickRandom(COMPANY_PREFIXES);
    const suffix = pickRandom(suffixes);
    const name = `${prefix} ${suffix}`;
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const website = `https://${cleanName}.com`;
    const rating = parseFloat(randomBetween(4.0, 5.0).toFixed(1));
    const reviewCount = Math.floor(randomBetween(10, 450));
    
    // Random offset coordinates around city center
    const latitude = coords.lat + randomBetween(-0.03, 0.03);
    const longitude = coords.lng + randomBetween(-0.03, 0.03);
    
    const streetNum = Math.floor(randomBetween(100, 2500));
    const street = pickRandom(STREET_NAMES);
    const address = `${streetNum} ${street}, ${location}`;

    // Standard phone number generation
    const phone = `+1 (${Math.floor(randomBetween(200, 999))}) 555-${String(Math.floor(randomBetween(1000, 9999)))}`;

    leads.push({
      id: `dyn-${niche.toLowerCase()}-${i}-${Date.now()}`,
      name,
      niche,
      location,
      address,
      phone,
      website,
      rating,
      reviewCount,
      latitude,
      longitude,
      status: 'new',
      value: Math.floor(randomBetween(10, 50)) * 100, // $1000 - $5000
      notes: `Discovered lead in ${formattedLocation}. Business operates in the ${niche} sector.`,
      checklist: [
        { id: 1, task: "Review local SEO rankings", done: false },
        { id: 2, task: "Scan website speed & performance", done: false },
        { id: 3, task: "Draft outreach email", done: false }
      ],
      enriched: false,
      email: null,
      emails: [],
      socials: {},
      techStack: []
    });
  }
  return leads;
};

export const apiService = {
  /**
   * Search for leads using the configured API mode (Mock, OSM, or SerpApi)
   */
  async searchLeads(niche, location) {
    const config = db.getApiConfig();
    const mode = config.mode || 'mock';

    console.log(`[API Service] Search initiated. Mode: ${mode}, Niche: ${niche}, Location: ${location}`);

    if (mode === 'mock') {
      return this.searchMockLeads(niche, location);
    } else if (mode === 'osm') {
      return this.searchOSMLeads(niche, location);
    } else if (mode === 'serpapi') {
      return this.searchSerpApiLeads(niche, location, config.serpapiKey);
    }
  },

  /**
   * Filter from existing local leads, or generate matching new ones
   */
  searchMockLeads(niche, location) {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        const storedCRMLeads = db.getLeads();
        
        // Search if we already have them in CRM to avoid duplication
        const matchingCRM = storedCRMLeads.filter(lead => 
          lead.niche.toLowerCase().includes(niche.toLowerCase()) &&
          lead.location.toLowerCase().includes(location.toLowerCase())
        );

        // Generate custom dynamic leads for variety
        const dynamicLeads = generateDynamicLeads(niche, location, 8);
        
        // Merge them - placing CRM leads first if they exist
        const results = [...matchingCRM];
        
        // Add dynamic leads only if they don't share same website
        dynamicLeads.forEach(d => {
          if (!results.some(r => r.website === d.website)) {
            results.push(d);
          }
        });

        resolve(results);
      }, 800);
    });
  },

  /**
   * Fetch from OpenStreetMap Nominatim proxy
   */
  async searchOSMLeads(niche, location) {
    const response = await fetch(`/api/search/osm?niche=${encodeURIComponent(niche)}&location=${encodeURIComponent(location)}`);
    
    if (!response.ok) {
      throw new Error(`OSM proxy returned error status: ${response.status}`);
    }

    const data = await response.json();
    return this.parseOSMResults(data, niche, location);
  },

  /**
   * Parse OpenStreetMap results into our standard Lead format
   */
  parseOSMResults(osmData, niche, location) {
    const storedCRM = db.getLeads();
    
    return osmData.map((item, index) => {
      const name = item.display_name.split(',')[0];
      const address = item.display_name;
      
      // Extract website from OSM details if available
      let website = '';
      if (item.extratags && item.extratags.website) {
        website = item.extratags.website;
      } else {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        website = `https://${cleanName}.org`;
      }

      // Check if it's already in CRM
      const existingInCRM = storedCRM.find(c => c.name === name || c.address === address);
      if (existingInCRM) {
        return existingInCRM;
      }

      // Generate randomized but structured details for incomplete fields (OSM lacks phone/ratings)
      const rating = parseFloat(randomBetween(3.8, 5.0).toFixed(1));
      const reviewCount = Math.floor(randomBetween(5, 120));
      const phone = `+1 (512) 555-${1000 + index}`;

      return {
        id: `osm-${item.place_id || index}-${Date.now()}`,
        name,
        niche,
        location,
        address,
        phone,
        website,
        rating,
        reviewCount,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        status: 'new',
        value: 1500,
        notes: `Discovered live from OpenStreetMap. Osm ID: ${item.osm_id}`,
        checklist: [
          { id: 1, task: "Audit website performance", done: false },
          { id: 2, task: "Draft outreach email", done: false }
        ],
        enriched: false,
        email: null,
        emails: [],
        socials: {},
        techStack: []
      };
    });
  },

  /**
   * Fetch from Google Maps SerpApi proxy
   */
  async searchSerpApiLeads(niche, location, apiKey) {
    const headers = {};
    if (apiKey) {
      headers['x-serpapi-key'] = apiKey;
    }

    const response = await fetch(
      `/api/search/serpapi?niche=${encodeURIComponent(niche)}&location=${encodeURIComponent(location)}`,
      { headers }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `SerpApi proxy returned error status: ${response.status}`);
    }

    const data = await response.json();
    return this.parseSerpApiResults(data, niche, location);
  },

  /**
   * Parse SerpApi Google Maps results into standard Lead format
   */
  parseSerpApiResults(data, niche, location) {
    const results = data.local_results || [];
    const storedCRM = db.getLeads();

    return results.map((item, index) => {
      const name = item.title;
      const address = item.address || location;
      const phone = item.phone || 'N/A';
      const website = item.website || `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      const rating = item.rating || 0;
      const reviewCount = item.reviews || 0;

      // Extract coordinates
      let latitude = 0;
      let longitude = 0;
      if (item.gps_coordinates) {
        latitude = item.gps_coordinates.latitude;
        longitude = item.gps_coordinates.longitude;
      } else {
        // Fallback offset
        const center = getCityCoordinates(location);
        latitude = center.lat + randomBetween(-0.02, 0.02);
        longitude = center.lng + randomBetween(-0.02, 0.02);
      }

      // Check CRM
      const existingInCRM = storedCRM.find(c => c.name === name || c.address === address);
      if (existingInCRM) {
        return existingInCRM;
      }

      return {
        id: `serp-${index}-${Date.now()}`,
        name,
        niche,
        location,
        address,
        phone,
        website,
        rating,
        reviewCount,
        latitude,
        longitude,
        status: 'new',
        value: 2000,
        notes: `Discovered via Google Maps search. Ranking position: ${item.position || index + 1}.`,
        checklist: [
          { id: 1, task: "Perform digital presence audit", done: false },
          { id: 2, task: "Send outreach campaign", done: false }
        ],
        enriched: false,
        email: null,
        emails: [],
        socials: {},
        techStack: []
      };
    });
  }
};
