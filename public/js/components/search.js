import { apiService } from '../services/api.js';
import { db } from '../db.js';
import { showToast } from '../app.js';

let activeSearchLeads = [];

export const searchComponent = {
  /**
   * Initializes search panel and triggers events
   */
  init(app) {
    const searchForm = document.getElementById('lead-search-form');
    if (!searchForm) return;

    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nicheInput = document.getElementById('search-niche');
      const locationInput = document.getElementById('search-location');
      const searchBtn = document.getElementById('btn-search-trigger');
      
      const niche = nicheInput.value.trim();
      const location = locationInput.value.trim();
      
      if (!niche || !location) return;
      
      // Update UI loading state
      searchBtn.disabled = true;
      searchBtn.querySelector('span').innerText = 'Searching...';
      const searchIcon = searchBtn.querySelector('i');
      searchIcon.className = 'fa-solid fa-spinner fa-spin';
      
      const resultsList = document.getElementById('search-results-list');
      resultsList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-spider fa-spin empty-icon" style="color: var(--primary);"></i>
          <h4>Scanning Lead Targets...</h4>
          <p>Analyzing directories and query coordinate nodes for B2B contacts.</p>
        </div>
      `;
      
      const startTime = performance.now();
      
      try {
        // Query results
        const results = await apiService.searchLeads(niche, location);
        activeSearchLeads = results;
        
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        // Update speed timer
        const speedContainer = document.getElementById('search-speed-container');
        const speedTime = document.getElementById('search-speed-time');
        speedTime.innerText = duration;
        speedContainer.style.display = 'block';
        
        // Render results
        this.renderResults(results, app);
        
        // Plot results on map
        app.map.plotMarkers(results, app);
        
        showToast(`Discovered ${results.length} leads successfully!`, 'success');
      } catch (error) {
        console.error('[SearchComponent] Search error:', error);
        resultsList.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-triangle-exclamation empty-icon" style="color: var(--rose);"></i>
            <h4>Search Connection Failed</h4>
            <p>${error.message || 'Please check your connection and configuration keys.'}</p>
          </div>
        `;
        showToast('Failed to retrieve search results.', 'error');
      } finally {
        // Restore buttons
        searchBtn.disabled = false;
        searchBtn.querySelector('span').innerText = 'Search Leads';
        searchIcon.className = 'fa-solid fa-search-location';
      }
    });
  },

  /**
   * Renders leads results list
   */
  renderResults(leads, app) {
    const container = document.getElementById('search-results-list');
    const resultsCount = document.getElementById('results-count');
    
    resultsCount.innerText = leads.length;
    
    if (leads.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-face-frown empty-icon"></i>
          <h4>No Leads Found</h4>
          <p>Try searching with another niche or target city.</p>
        </div>
      `;
      return;
    }
    
    const storedCRM = db.getLeads();
    
    container.innerHTML = leads.map(lead => {
      // Check if lead is already in CRM database
      const crmRecord = storedCRM.find(c => c.name === lead.name || c.id === lead.id);
      const inCRM = !!crmRecord;
      const crmStatus = inCRM ? crmRecord.status : '';
      
      let actionButtonHtml = '';
      
      if (inCRM) {
        actionButtonHtml = `
          <span class="status-badge-crm badge-${crmStatus}">
            <i class="fa-solid fa-check-double"></i> In CRM (${crmStatus})
          </span>
        `;
      } else {
        actionButtonHtml = `
          <button class="btn btn-sm btn-primary add-crm-btn" data-lead-id="${lead.id}">
            <i class="fa-solid fa-folder-plus"></i> Add to CRM
          </button>
        `;
      }
      
      // Calculate rating stars
      let starsHtml = '';
      if (lead.rating > 0) {
        starsHtml = `
          <div class="lead-rating-badge">
            ${lead.rating} <i class="fa-solid fa-star"></i>
            <span style="font-size:10px; color:var(--text-muted);">(${lead.reviewCount})</span>
          </div>
        `;
      } else {
        starsHtml = `<span style="font-size: 11px; color: var(--text-muted);">No reviews</span>`;
      }

      return `
        <div class="lead-result-card" id="search-card-${lead.id}">
          <div class="lead-card-header">
            <div class="lead-title-box">
              <h4>${lead.name}</h4>
              <span class="lead-niche-tag">${lead.niche}</span>
            </div>
            ${starsHtml}
          </div>
          
          <div class="lead-card-details">
            <div class="detail-line">
              <i class="fa-solid fa-location-dot"></i>
              <span>${lead.address}</span>
            </div>
            <div class="detail-line">
              <i class="fa-solid fa-phone"></i>
              <span>${lead.phone}</span>
            </div>
            ${lead.website ? `
              <div class="detail-line">
                <i class="fa-solid fa-globe"></i>
                <a href="${lead.website}" target="_blank">${lead.website.replace(/https?:\/\/(www\.)?/, '')}</a>
              </div>
            ` : ''}
          </div>
          
          <div class="lead-card-actions">
            ${actionButtonHtml}
            <button class="btn btn-sm btn-outline view-details-search-btn" data-lead-id="${lead.id}">
              <i class="fa-solid fa-circle-info"></i> Details
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events
    container.querySelectorAll('.add-crm-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = btn.getAttribute('data-lead-id');
        const lead = activeSearchLeads.find(l => l.id === leadId);
        if (lead) {
          // Save to Local DB
          db.saveLead({ ...lead, id: `crm-${Date.now()}` }); // give it a CRM specific ID
          
          // Re-render search items & CRM columns
          this.renderResults(activeSearchLeads, app);
          app.kanban.renderBoard(app);
          app.outreach.updateLeadDropdown();
          app.updateHeaderStats();
          
          // Add Activity Feed entry
          app.addActivityLog(`Discovered & added lead: <strong>${lead.name}</strong> to CRM pipeline.`);
          showToast(`Added ${lead.name} to CRM pipeline!`, 'success');
        }
      });
    });

    container.querySelectorAll('.view-details-search-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = btn.getAttribute('data-lead-id');
        let lead = activeSearchLeads.find(l => l.id === leadId);
        
        // Check if we already have it in CRM
        const stored = db.getLeads().find(c => c.name === lead.name);
        if (stored) {
          lead = stored;
        }
        
        app.showLeadDetails(lead);
      });
    });
  }
};
export { activeSearchLeads };
