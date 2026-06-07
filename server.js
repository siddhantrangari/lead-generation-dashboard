import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Razorpay from 'razorpay';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve directories for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * OpenStreetMap (OSM) Nominatim Proxy
 * Fetches location search results without CORS issues.
 * Passes a standard User-Agent to satisfy OSM usage policy.
 */
app.get('/api/search/osm', async (req, res) => {
  try {
    const { niche, location, limit = 50 } = req.query;

    if (!niche || !location) {
      return res.status(400).json({ error: 'Niche and location parameters are required' });
    }

    // Nominatim query format: dentist in Austin, TX
    const query = encodeURIComponent(`${niche} in ${location}`);
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=${limit}`;

    console.log(`[Proxy] Querying OSM: ${osmUrl}`);

    const response = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'LeadGenerationDashboardApp/1.0 (contact: siddhant@example.com)'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] OSM API error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: 'OpenStreetMap API returned an error' });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('[Proxy] OpenStreetMap proxy failed:', error);
    return res.status(500).json({ error: 'Failed to fetch data from OpenStreetMap' });
  }
});

/**
 * SerpApi Google Maps Proxy
 * Integrates Google Maps data via SerpApi.
 * Can use a key provided in the request headers/body OR environment variable.
 */
app.get('/api/search/serpapi', async (req, res) => {
  try {
    const { niche, location } = req.query;
    // Accept key from client headers (for beginner setup custom key) or fall back to backend .env
    const apiKey = req.headers['x-serpapi-key'] || process.env.SERPAPI_API_KEY;

    if (!niche || !location) {
      return res.status(400).json({ error: 'Niche and location parameters are required' });
    }

    if (!apiKey) {
      return res.status(401).json({ 
        error: 'SerpApi Key missing. Please provide it in Settings or configure .env file.' 
      });
    }

    const query = encodeURIComponent(`${niche} ${location}`);
    const serpapiUrl = `https://serpapi.com/search.json?engine=google_maps&q=${query}&api_key=${apiKey}`;

    console.log(`[Proxy] Querying SerpApi: engine=google_maps, q=${niche} ${location}`);

    const response = await fetch(serpapiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] SerpApi error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: 'SerpApi returned an error' });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('[Proxy] SerpApi proxy failed:', error);
    return res.status(500).json({ error: 'Failed to fetch data from SerpApi' });
  }
});

/**
 * Razorpay subscription mapping and creation
 */
const PLANS_MAPPING = {
  starter: {
    name: 'LeadFlow Starter',
    amount: 29900, // INR 299 in paise
    description: 'Starter plan for LeadFlow CRM'
  },
  pro: {
    name: 'LeadFlow Pro',
    amount: 49900, // INR 499 in paise
    description: 'Pro plan for LeadFlow CRM'
  },
  premium: {
    name: 'LeadFlow Premium',
    amount: 99900, // INR 999 in paise
    description: 'Premium plan for LeadFlow CRM'
  }
};

app.post('/api/payment/create-subscription', async (req, res) => {
  try {
    const { planName } = req.body;
    const keyId = req.headers['x-razorpay-key-id'] || process.env.RAZORPAY_KEY_ID || 'rzp_test_SwqquWZp1VDDGx';
    const keySecret = req.headers['x-razorpay-key-secret'] || process.env.RAZORPAY_KEY_SECRET;

    if (!planName || !PLANS_MAPPING[planName]) {
      return res.status(400).json({ error: 'Invalid or missing plan name.' });
    }

    if (!keySecret) {
      return res.status(400).json({ error: 'Razorpay Key Secret is missing. Please provide it in settings.' });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const targetPlan = PLANS_MAPPING[planName];
    let razorpayPlanId = null;

    // 1. Fetch active plans to see if we can reuse one
    try {
      const plansResponse = await razorpay.plans.all({ count: 100 });
      const existingPlan = plansResponse.items.find(
        p => p.item && p.item.name === targetPlan.name && p.item.amount === targetPlan.amount
      );
      if (existingPlan) {
        razorpayPlanId = existingPlan.id;
        console.log(`[Razorpay] Reusing plan: ${razorpayPlanId} for ${targetPlan.name}`);
      }
    } catch (err) {
      console.warn('[Razorpay] Failed fetching plans, trying creation:', err.message);
    }

    // 2. Create a plan if we couldn't find one
    if (!razorpayPlanId) {
      try {
        const newPlan = await razorpay.plans.create({
          period: 'monthly',
          interval: 1,
          item: {
            name: targetPlan.name,
            amount: targetPlan.amount,
            currency: 'INR',
            description: targetPlan.description
          }
        });
        razorpayPlanId = newPlan.id;
        console.log(`[Razorpay] Created plan: ${razorpayPlanId}`);
      } catch (err) {
        console.error('[Razorpay] Failed creating plan:', err);
        return res.status(500).json({ error: 'Failed to create subscription plan on Razorpay.' });
      }
    }

    // 3. Create Subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: 12, // 12 monthly cycles
      customer_notify: 1
    });

    return res.json({
      subscription,
      key_id: keyId
    });
  } catch (error) {
    console.error('[Razorpay] Error creating subscription:', error);
    return res.status(500).json({ error: error.description || error.message || 'Failed to create subscription' });
  }
});

app.post('/api/payment/verify-subscription', async (req, res) => {
  try {
    const { subscription_id, payment_id, signature } = req.body;
    const keySecret = req.headers['x-razorpay-key-secret'] || process.env.RAZORPAY_KEY_SECRET;

    if (!subscription_id || !payment_id || !signature) {
      return res.status(400).json({ error: 'Missing signature verification parameters' });
    }

    if (!keySecret) {
      return res.status(400).json({ error: 'Razorpay Key Secret is missing. Verification halted.' });
    }

    // Compute expected signature: payment_id + '|' + subscription_id
    const body = payment_id + '|' + subscription_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature === signature) {
      return res.json({ success: true });
    } else {
      console.warn('[Razorpay] Signature mismatch. Expected:', expectedSignature, 'Got:', signature);
      return res.status(400).json({ success: false, error: 'Signature verification failed' });
    }
  } catch (error) {
    console.error('[Razorpay] Verification failed:', error);
    return res.status(500).json({ error: 'Verification error: ' + error.message });
  }
});

// Fallback: serve index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  Lead Generation & CRM Server running on port ${PORT}`);
    console.log(`  Local URL: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

export default app;
