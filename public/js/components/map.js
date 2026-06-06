let map = null;
let markerLayer = null;

export const mapComponent = {
  /**
   * Initializes the map in container
   */
  init() {
    const mapContainer = document.getElementById('lead-map-container');
    if (!mapContainer || map) return;

    if (typeof L === 'undefined') {
      console.warn('Leaflet.js is not loaded. Map will be disabled.');
      mapContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:20px; text-align:center; color:var(--text-muted);">
          <i class="fa-solid fa-map-marked-alt" style="font-size:32px; margin-bottom:12px; opacity:0.3;"></i>
          <h4>Interactive Map Offline</h4>
          <p style="font-size:12px; max-width:200px; margin-top:4px;">Mapping CDN is currently unavailable. Lead searching and CRM board will still work offline.</p>
        </div>
      `;
      return;
    }

    // Initialize Leaflet map centered on US
    map = L.map('lead-map-container', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([39.8283, -98.5795], 4);

    // Load dark map tiles from CartoDB Voyager or Positron (we can invert Positron tiles for beautiful dark mode)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);
    
    // Inject marker styling
    this.injectMarkerStyles();
  },

  /**
   * Plots markers on map
   */
  plotMarkers(leads, app) {
    if (typeof L === 'undefined' || !map || !markerLayer) return;

    markerLayer.clearLayers();
    
    const validLeads = leads.filter(l => l.latitude && l.longitude && !isNaN(l.latitude) && !isNaN(l.longitude));
    
    if (validLeads.length === 0) return;

    const bounds = [];
    const storedCRM = dbList();

    validLeads.forEach(lead => {
      // Check if lead is saved in CRM to color code pins
      const crmLead = storedCRM.find(c => c.name === lead.name);
      const isSaved = !!crmLead;
      const status = isSaved ? crmLead.status : 'search';
      
      let markerColor = 'var(--primary)'; // Indigo/Purple
      if (status === 'converted') markerColor = 'var(--emerald)';
      if (status === 'contacted') markerColor = 'var(--cyan)';
      if (status === 'discussion') markerColor = 'var(--amber)';
      if (status === 'lost') markerColor = 'var(--rose)';
      if (status === 'search') markerColor = '#a855f7'; // Bright purple for searched items not in CRM

      const customIcon = L.divIcon({
        html: `
          <div class="map-marker-pulse" style="background: ${markerColor}; box-shadow: 0 0 0 ${markerColor};">
            <span class="marker-core"></span>
          </div>
        `,
        className: 'custom-map-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([lead.latitude, lead.longitude], { icon: customIcon });
      
      // Popup Content Card
      const popupHtml = `
        <div class="map-popup-card">
          <h4>${lead.name}</h4>
          <span style="color:var(--text-muted); font-size:11px; text-transform:uppercase;">${lead.niche}</span>
          <div style="font-size:11px; color:#cbd5e1; margin-top:4px;">
            <i class="fa-solid fa-location-dot" style="color:var(--primary); margin-right:4px;"></i> ${lead.address.split(',')[0]}
          </div>
          <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">
            <i class="fa-solid fa-star" style="color:var(--amber); margin-right:4px;"></i> ${lead.rating || 'No reviews'}
          </div>
          <button class="map-popup-btn" id="map-popup-view-${lead.id.replace(/[^a-zA-Z0-9]/g, '')}">Quick View</button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markerLayer.addLayer(marker);
      
      // Bind click on popup buttons
      marker.on('popupopen', () => {
        const btnId = `map-popup-view-${lead.id.replace(/[^a-zA-Z0-9]/g, '')}`;
        const btn = document.getElementById(btnId);
        if (btn) {
          btn.addEventListener('click', () => {
            // Find active object details
            let activeLead = lead;
            const liveCRM = dbList();
            const match = liveCRM.find(c => c.name === lead.name);
            if (match) activeLead = match;
            
            app.showLeadDetails(activeLead);
            map.closePopup();
          });
        }
      });

      bounds.push([lead.latitude, lead.longitude]);
    });

    // Fit map bounds to encompass all pins
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  },

  /**
   * Helper inject map markers custom styling tags
   */
  injectMarkerStyles() {
    if (document.getElementById('custom-marker-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'custom-marker-styles';
    style.innerHTML = `
      .map-marker-pulse {
        display: block;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        animation: pulse-marker 2s infinite;
        position: relative;
        border: 2px solid white;
      }
      .marker-core {
        position: absolute;
        top: 3px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: white;
      }
      @keyframes pulse-marker {
        0% {
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
        }
        70% {
          box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
        }
      }
    `;
    document.head.appendChild(style);
  }
};

// Helper function to read current database records safely
function dbList() {
  const crmRaw = localStorage.getItem('lead_gen_crm_db');
  return crmRaw ? JSON.parse(crmRaw) : [];
}
