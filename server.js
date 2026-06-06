import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Fallback: serve index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Lead Generation & CRM Server running on port ${PORT}`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
