import { db } from './db.js';
import { searchComponent } from './components/search.js';
import { mapComponent } from './components/map.js';
import { kanbanComponent } from './components/kanban.js';
import { outreachComponent } from './components/outreach.js';
import { enrichmentService } from './services/enrichment.js';

// Global variables for Charts
let funnelChartInstance = null;
let nicheChartInstance = null;

// Global active lead in modal
let activeDetailsLead = null;

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  db.init();
  
  // Coordinate sub-components
  searchComponent.init(appController);
  mapComponent.init();
  kanbanComponent.renderBoard(appController);
  outreachComponent.init(appController);
  
  appController.init();
});

// Main App Controller
export const appController = {
  // Expose components
  map: mapComponent,
  kanban: kanbanComponent,
  outreach: outreachComponent,

  init() {
    // 1. Sidebar tab switching router
    this.setupTabNavigation();
    
    // 2. Global headers and dashboard calculations
    this.updateHeaderStats();
    this.renderDashboardCharts();
    
    // 3. Settings controls
    this.setupSettingsPanel();
    
    // 4. Modal Dialog Event Handlers
    this.setupModalEvents();
    
    // 5. Populate initial activity logs
    this.addActivityLog("LeadFlow Workspace initialized. Mock Sandbox active.");
    
    // Check initial API mode badge
    this.updateApiModeBadge();
  },

  /**
   * Router to switch between sidebar views
   */
  setupTabNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabViews = document.querySelectorAll('.app-tab-view');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        // Update active class on buttons
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show target view, hide others
        tabViews.forEach(view => {
          if (view.id === `tab-${targetTab}`) {
            view.classList.add('active');
          } else {
            view.classList.remove('active');
          }
        });

        // Specific view callbacks
        if (targetTab === 'dashboard') {
          this.updateHeaderStats();
          this.updateDashboardCharts();
        } else if (targetTab === 'finder') {
          // Trigger Leaflet map invalidateSize to redraw tiles correctly
          setTimeout(() => {
            const mapContainer = document.getElementById('lead-map-container');
            if (mapContainer && mapContainer._leaflet_id) {
              window.dispatchEvent(new Event('resize'));
            }
          }, 100);
        } else if (targetTab === 'crm') {
          this.kanban.renderBoard(this);
        } else if (targetTab === 'outreach') {
          this.outreach.updateLeadDropdown();
        }
      });
    });
  },

  /**
   * Calculates dashboard stats card metrics
   */
  updateHeaderStats() {
    const leads = db.getLeads();
    
    // Calculations
    const totalLeads = leads.length;
    const contactedLeads = leads.filter(l => l.status === 'contacted').length;
    const discussionLeads = leads.filter(l => l.status === 'discussion').length;
    const wonLeads = leads.filter(l => l.status === 'converted').length;
    const lostLeads = leads.filter(l => l.status === 'lost').length;
    
    const pipelineValue = leads
      .filter(l => ['new', 'contacted', 'discussion'].includes(l.status))
      .reduce((sum, l) => sum + (l.value || 0), 0);
      
    const activeLeadsCount = leads.filter(l => l.status !== 'lost').length;
    const winRate = activeLeadsCount > 0 ? Math.round((wonLeads / activeLeadsCount) * 100) : 0;

    // Map to UI Headers
    document.getElementById('header-total-leads').innerText = totalLeads;
    document.getElementById('header-pipeline-value').innerText = `$${pipelineValue.toLocaleString()}`;
    
    // Map to Dashboard Cards
    const totalEl = document.getElementById('stat-total-leads');
    const contactedEl = document.getElementById('stat-contacted-leads');
    const pipelineEl = document.getElementById('stat-pipeline-value');
    const winRateEl = document.getElementById('stat-conversion-rate');

    if (totalEl) totalEl.innerText = totalLeads;
    if (contactedEl) contactedEl.innerText = contactedLeads;
    if (pipelineEl) pipelineEl.innerText = `$${pipelineValue.toLocaleString()}`;
    if (winRateEl) winRateEl.innerText = `${winRate}%`;
  },

  /**
   * Initializes global ChartJS objects
   */
  renderDashboardCharts() {
    const funnelCtx = document.getElementById('funnelChart');
    const nicheCtx = document.getElementById('nicheChart');
    
    if (!funnelCtx || !nicheCtx) return;

    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library is not loaded. Analytics charts disabled.');
      return;
    }

    // Destroy existing if re-rendering
    if (funnelChartInstance) funnelChartInstance.destroy();
    if (nicheChartInstance) nicheChartInstance.destroy();

    const chartData = this.getChartsDataset();

    // Chart 1: Funnel distribution
    funnelChartInstance = new Chart(funnelCtx, {
      type: 'doughnut',
      data: {
        labels: ['New', 'Outreached', 'In Discussion', 'Closed Won', 'Closed Lost'],
        datasets: [{
          data: chartData.funnelValues,
          backgroundColor: ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e'],
          borderColor: 'rgba(11, 15, 25, 0.6)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#9ca3af', font: { family: 'Outfit' } }
          }
        }
      }
    });

    // Chart 2: Niche Breakdown
    nicheChartInstance = new Chart(nicheCtx, {
      type: 'bar',
      data: {
        labels: chartData.nicheLabels,
        datasets: [{
          label: 'Number of Leads',
          data: chartData.nicheValues,
          backgroundColor: 'rgba(99, 102, 241, 0.45)',
          borderColor: '#6366f1',
          borderWidth: 1.5,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#9ca3af', font: { family: 'Outfit' }, stepSize: 1 } 
          },
          y: { 
            grid: { display: false },
            ticks: { color: '#9ca3af', font: { family: 'Outfit' } } 
          }
        }
      }
    });
  },

  /**
   * Refreshes chart statistics dynamically
   */
  updateDashboardCharts() {
    if (typeof Chart === 'undefined') return;
    if (!funnelChartInstance || !nicheChartInstance) {
      this.renderDashboardCharts();
      return;
    }

    const chartData = this.getChartsDataset();
    
    // Update Funnel Chart
    funnelChartInstance.data.datasets[0].data = chartData.funnelValues;
    funnelChartInstance.update();

    // Update Niche Chart
    nicheChartInstance.data.labels = chartData.nicheLabels;
    nicheChartInstance.data.datasets[0].data = chartData.nicheValues;
    nicheChartInstance.update();
  },

  /**
   * Compiles data counts from db
   */
  getChartsDataset() {
    const leads = db.getLeads();
    
    // Funnel counts
    const funnelValues = [
      leads.filter(l => l.status === 'new').length,
      leads.filter(l => l.status === 'contacted').length,
      leads.filter(l => l.status === 'discussion').length,
      leads.filter(l => l.status === 'converted').length,
      leads.filter(l => l.status === 'lost').length
    ];

    // Niche counts
    const nicheMap = {};
    leads.forEach(l => {
      const niche = l.niche || 'Other';
      nicheMap[niche] = (nicheMap[niche] || 0) + 1;
    });

    const nicheLabels = Object.keys(nicheMap);
    const nicheValues = Object.values(nicheMap);

    return { funnelValues, nicheLabels, nicheValues };
  },

  /**
   * Settings controls
   */
  setupSettingsPanel() {
    const saveBtn = document.getElementById('save-settings-btn');
    const apiRadios = document.getElementsByName('api-mode');
    const serpKeyContainer = document.getElementById('serpapi-key-container');
    const serpKeyInput = document.getElementById('serpapi-key-input');
    const toggleKeyBtn = document.getElementById('toggle-key-visibility');

    // Export & Reset buttons
    const exportBtn = document.getElementById('export-csv-btn');
    const resetBtn = document.getElementById('reset-db-btn');
    const clearActivityBtn = document.getElementById('clear-activity-btn');

    // Load initial settings
    const config = db.getApiConfig();
    apiRadios.forEach(radio => {
      if (radio.value === config.mode) {
        radio.checked = true;
        if (config.mode === 'serpapi') {
          serpKeyContainer.style.display = 'block';
        }
      }
      
      // Setup toggle visibility triggers on click
      radio.addEventListener('change', () => {
        if (radio.value === 'serpapi') {
          serpKeyContainer.style.display = 'block';
        } else {
          serpKeyContainer.style.display = 'none';
        }
      });
    });
    
    if (config.serpapiKey) {
      serpKeyInput.value = config.serpapiKey;
    }

    // Toggle SerpApi Password Visibility
    toggleKeyBtn.addEventListener('click', () => {
      const icon = toggleKeyBtn.querySelector('i');
      if (serpKeyInput.type === 'password') {
        serpKeyInput.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
      } else {
        serpKeyInput.type = 'password';
        icon.className = 'fa-solid fa-eye';
      }
    });

    // Save configurations
    saveBtn.addEventListener('click', () => {
      const selectedMode = Array.from(apiRadios).find(r => r.checked).value;
      const key = serpKeyInput.value.trim();

      if (selectedMode === 'serpapi' && !key) {
        showToast('Please enter a SerpApi key to use Google Maps mode.', 'warning');
        return;
      }

      db.saveApiConfig({
        mode: selectedMode,
        serpapiKey: key
      });

      this.updateApiModeBadge();
      this.addActivityLog(`API provider changed to: <strong>${selectedMode.toUpperCase()}</strong>.`);
      showToast('API configuration saved successfully!', 'success');
    });

    // Export CRM Database to CSV
    exportBtn.addEventListener('click', () => {
      const leads = db.getLeads();
      if (leads.length === 0) {
        showToast('No leads available to export.', 'warning');
        return;
      }
      this.exportCRMToCSV(leads);
    });

    // Reset Database
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset your database? All local leads, notes, and checklist revisions will be lost.')) {
        db.resetDatabase();
        this.kanban.renderBoard(this);
        this.outreach.updateLeadDropdown();
        this.updateHeaderStats();
        this.updateDashboardCharts();
        
        // Reload API key fields
        const conf = db.getApiConfig();
        serpKeyInput.value = conf.serpapiKey;
        apiRadios.forEach(radio => {
          if (radio.value === conf.mode) radio.checked = true;
        });

        this.updateApiModeBadge();
        this.addActivityLog("Database reset to factory seeds.");
        showToast('Database reset successfully!', 'info');
      }
    });

    // Clear Activity Feed
    clearActivityBtn.addEventListener('click', () => {
      const list = document.getElementById('activity-feed-list');
      list.innerHTML = `<li class="empty-state-list">No recent updates logged yet. Move leads in the CRM or run scans to populate.</li>`;
      showToast('Activity logs cleared.', 'info');
    });
  },

  /**
   * Updates top bar badge detailing active search provider
   */
  updateApiModeBadge() {
    const config = db.getApiConfig();
    const modeBadge = document.getElementById('system-mode-badge');
    const statusIcon = modeBadge.previousElementSibling;
    
    if (config.mode === 'mock') {
      modeBadge.innerText = 'Mock Sandbox';
      modeBadge.style.color = '#a5b4fc';
      modeBadge.style.borderColor = 'rgba(99, 102, 241, 0.4)';
      statusIcon.style.color = 'var(--cyan)';
    } else if (config.mode === 'osm') {
      modeBadge.innerText = 'Live OSM';
      modeBadge.style.color = '#67e8f9';
      modeBadge.style.borderColor = 'rgba(6, 182, 212, 0.4)';
      statusIcon.style.color = 'var(--cyan)';
    } else if (config.mode === 'serpapi') {
      modeBadge.innerText = 'Live Google Maps';
      modeBadge.style.color = '#6ee7b7';
      modeBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      statusIcon.style.color = 'var(--emerald)';
    }
  },

  /**
   * Modal dialog overlay controllers
   */
  setupModalEvents() {
    const detailsModal = document.getElementById('lead-details-modal');
    const notesArea = document.getElementById('dlg-lead-notes');
    const valueInput = document.getElementById('dlg-lead-value-input');
    const scanBtn = document.getElementById('dlg-trigger-scan-btn');
    const termModal = document.getElementById('enrichment-terminal-modal');
    const termCloseBtn = document.getElementById('terminal-close-btn');

    // Close Dialog using declarative buttons (for backup if invokers polyfill fails)
    document.querySelectorAll('.btn-close-dialog').forEach(btn => {
      // Remove inline onclick to avoid double-firing errors
      btn.removeAttribute('onclick');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dialogId = btn.getAttribute('commandfor');
        let dialog = dialogId ? document.getElementById(dialogId) : null;
        if (!dialog) {
          dialog = btn.closest('dialog');
        }
        if (dialog && dialog.open) {
          dialog.close();
        }
      });
    });

    // Notes auto-saving on typing/focus leave
    notesArea.addEventListener('blur', () => {
      if (activeDetailsLead) {
        const notesValue = notesArea.value.trim();
        db.updateLeadNotes(activeDetailsLead.id, notesValue);
        activeDetailsLead.notes = notesValue;
        this.kanban.renderBoard(this);
      }
    });

    // Estimated Value updating
    valueInput.addEventListener('change', () => {
      if (activeDetailsLead) {
        const val = Number(valueInput.value) || 0;
        db.updateLeadValue(activeDetailsLead.id, val);
        activeDetailsLead.value = val;
        this.kanban.renderBoard(this);
        this.updateHeaderStats();
      }
    });

    // Trigger crawler scan simulator
    scanBtn.addEventListener('click', () => {
      if (!activeDetailsLead) return;
      
      // Close details and open terminal
      detailsModal.close();
      termModal.showModal();
      termCloseBtn.disabled = true;
      termCloseBtn.innerText = 'Awaiting Crawler Completion...';
      
      const consoleLog = document.getElementById('terminal-body-console');
      consoleLog.innerHTML = '';

      // Run enrich service
      enrichmentService.enrichLead(activeDetailsLead, (line) => {
        const p = document.createElement('div');
        p.className = 'terminal-line';
        
        if (line.startsWith('  ✔️')) {
          p.classList.add('success');
        } else if (line.startsWith('🏆')) {
          p.classList.add('info');
        }
        
        p.innerText = line;
        consoleLog.appendChild(p);
        consoleLog.scrollTop = consoleLog.scrollHeight;
      }).then((enrichedData) => {
        // Update DB
        const updatedLead = { ...activeDetailsLead, ...enrichedData };
        db.saveLead(updatedLead);
        
        // Save back to local active variable
        activeDetailsLead = updatedLead;

        // Finish terminal logs
        const p = document.createElement('div');
        p.className = 'terminal-line success';
        p.innerText = '🟢 SCAN COMPLETE. Press button below to exit terminal.';
        consoleLog.appendChild(p);
        consoleLog.scrollTop = consoleLog.scrollHeight;
        
        termCloseBtn.disabled = false;
        termCloseBtn.innerText = 'Close Terminal & View Lead';
        
        // Add Activity Log
        this.addActivityLog(`Enriched lead details for: <strong>${activeDetailsLead.name}</strong>.`);
        showToast(`Enriched website profiles for ${activeDetailsLead.name}!`, 'success');
      });
    });

    // Terminal Close handler
    termCloseBtn.addEventListener('click', () => {
      termModal.close();
      if (activeDetailsLead) {
        // Re-open details dialog which now shows enriched data!
        this.showLeadDetails(activeDetailsLead);
        this.kanban.renderBoard(this);
      }
    });
  },

  /**
   * Pre-populates the Lead Details dialog layout
   */
  showLeadDetails(lead) {
    activeDetailsLead = lead;
    
    // Check if this lead is already in CRM or just a temporary searched item
    const stored = db.getLeads().find(c => c.name === lead.name || c.id === lead.id);
    const isSavedInCRM = !!stored;

    const modal = document.getElementById('lead-details-modal');
    
    // Map text values
    document.getElementById('dlg-lead-name').innerText = lead.name;
    document.getElementById('dlg-lead-niche').innerText = lead.niche;
    document.getElementById('dlg-lead-address').innerText = lead.address;
    document.getElementById('dlg-lead-phone').innerText = lead.phone;
    
    const webLink = document.getElementById('dlg-lead-website-link');
    if (lead.website) {
      webLink.href = lead.website;
      webLink.innerText = lead.website.replace(/https?:\/\/(www\.)?/, '');
      webLink.style.display = 'inline-block';
    } else {
      webLink.style.display = 'none';
    }

    document.getElementById('dlg-lead-rating').innerHTML = `${lead.rating || 0} <i class="fa-solid fa-star text-amber"></i> <span style="font-size:10px; color:var(--text-muted);">(${lead.reviewCount || 0} reviews)</span>`;
    
    // Value input
    document.getElementById('dlg-lead-value-input').value = lead.value || 0;
    
    // Notes
    document.getElementById('dlg-lead-notes').value = lead.notes || '';

    // Handle Enrichment states panels
    const statusTag = document.getElementById('dlg-enrichment-status');
    const enrichedPanel = document.getElementById('dlg-enriched-data-panel');
    const unscannedPanel = document.getElementById('dlg-unscranned-panel');
    const scanBtn = document.getElementById('dlg-trigger-scan-btn');

    // If it's a raw search lead NOT yet saved to CRM, disable notes, value, and website scanning!
    if (!isSavedInCRM) {
      document.getElementById('dlg-lead-notes').disabled = true;
      document.getElementById('dlg-lead-notes').placeholder = 'Save this lead to CRM to write custom notes.';
      document.getElementById('dlg-lead-value-input').disabled = true;
      
      statusTag.innerText = 'Unsaved Lead';
      statusTag.className = 'enrichment-status-tag not-scanned';
      enrichedPanel.style.display = 'none';
      unscannedPanel.style.display = 'flex';
      unscannedPanel.querySelector('h4').innerText = 'CRM Record Required';
      unscannedPanel.querySelector('p').innerText = 'Please save this lead to the CRM database to enable website analysis and contacts extraction.';
      scanBtn.style.display = 'none';
    } else {
      // Editable in CRM
      document.getElementById('dlg-lead-notes').disabled = false;
      document.getElementById('dlg-lead-notes').placeholder = 'Add custom notes here...';
      document.getElementById('dlg-lead-value-input').disabled = false;
      scanBtn.style.display = 'inline-flex';
      unscannedPanel.querySelector('h4').innerText = 'Website Scan Required';
      unscannedPanel.querySelector('p').innerText = 'Trigger our crawler simulator to analyze this business\'s website metadata, discover emails, social accounts, and tech profiles.';

      if (lead.enriched) {
        statusTag.innerText = 'Enriched';
        statusTag.className = 'enrichment-status-tag scanned';
        
        enrichedPanel.style.display = 'block';
        unscannedPanel.style.display = 'none';
        
        document.getElementById('dlg-lead-owner').innerText = lead.ownerName || 'N/A';
        
        // Emails list
        const emailList = document.getElementById('dlg-lead-emails');
        emailList.innerHTML = lead.emails && lead.emails.length > 0
          ? lead.emails.map(e => `<li><i class="fa-regular fa-envelope"></i> ${e}</li>`).join('')
          : '<li>No emails discovered.</li>';
          
        // Social icons
        const socialsContainer = document.getElementById('dlg-lead-socials');
        socialsContainer.innerHTML = '';
        
        if (lead.socials) {
          Object.keys(lead.socials).forEach(key => {
            const val = lead.socials[key];
            let iconClass = 'fa-globe';
            if (key === 'instagram') iconClass = 'fa-instagram';
            if (key === 'facebook') iconClass = 'fa-facebook';
            if (key === 'linkedin') iconClass = 'fa-linkedin';
            if (key === 'twitter') iconClass = 'fa-twitter-x';

            const a = document.createElement('a');
            a.href = `https://${val}`;
            a.target = '_blank';
            a.className = 'social-tag';
            a.innerHTML = `<i class="fa-brands ${iconClass}"></i> ${key}`;
            socialsContainer.appendChild(a);
          });
        }
        
        if (socialsContainer.children.length === 0) {
          socialsContainer.innerHTML = '<span style="font-size: 12px; color: var(--text-muted);">No profiles found</span>';
        }

        // Tech stack
        const techContainer = document.getElementById('dlg-lead-tech');
        techContainer.innerHTML = lead.techStack && lead.techStack.length > 0
          ? lead.techStack.map(t => `<span class="tech-pill">${t}</span>`).join('')
          : '<span style="font-size: 12px; color: var(--text-muted);">No scripts detected</span>';
          
      } else {
        statusTag.innerText = 'Not Scanned';
        statusTag.className = 'enrichment-status-tag not-scanned';
        enrichedPanel.style.display = 'none';
        unscannedPanel.style.display = 'flex';
      }
    }

    // Render Checklist (Only relevant if lead is saved in CRM)
    this.renderChecklistSection(isSavedInCRM);

    modal.showModal();
  },

  /**
   * Renders sub-tasks checkboxes
   */
  renderChecklistSection(isSavedInCRM) {
    const listContainer = document.getElementById('dlg-checklist-list');
    const progressText = document.getElementById('dlg-checklist-progress-text');
    const progressBar = document.getElementById('dlg-checklist-progress-fill');

    if (!isSavedInCRM || !activeDetailsLead || !activeDetailsLead.checklist) {
      listContainer.innerHTML = '';
      progressText.innerText = 'CRM checklist inactive';
      progressBar.style.width = '0%';
      return;
    }

    const checklist = activeDetailsLead.checklist;
    const total = checklist.length;
    const completed = checklist.filter(t => t.done).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    progressText.innerText = `${completed}/${total} Tasks (${pct}%)`;
    progressBar.style.width = `${pct}%`;

    listContainer.innerHTML = checklist.map(item => `
      <li>
        <label class="checklist-item-checkbox ${item.done ? 'checked' : ''}">
          <input type="checkbox" data-task-id="${item.id}" ${item.done ? 'checked' : ''}>
          <span>${item.task}</span>
        </label>
      </li>
    `).join('');

    // Add checkbox togglers
    listContainer.querySelectorAll('input[type="checkbox"]').forEach(box => {
      box.addEventListener('change', (e) => {
        const taskId = parseInt(box.getAttribute('data-task-id'));
        const item = checklist.find(t => t.id === taskId);
        if (item) {
          item.done = box.checked;
          
          // Save DB
          db.updateLeadChecklist(activeDetailsLead.id, checklist);
          
          // Re-render checklist and CRM Kanban
          this.renderChecklistSection(true);
          this.kanban.renderBoard(this);
        }
      });
    });
  },

  /**
   * Adds logs dynamically to activity list in dashboard
   */
  addActivityLog(text) {
    const list = document.getElementById('activity-feed-list');
    if (!list) return;

    // Remove empty log placeholder if present
    const emptyLi = list.querySelector('.empty-state-list');
    if (emptyLi) emptyLi.remove();

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const li = document.createElement('li');
    li.className = 'activity-item';
    li.innerHTML = `
      <div class="activity-text">
        <i class="fa-regular fa-bell text-purple"></i>
        <span>${text}</span>
      </div>
      <span class="activity-time">${timestamp}</span>
    `;

    // Insert at top of list
    list.insertBefore(li, list.firstChild);

    // Keep log max 15 lines
    if (list.children.length > 15) {
      list.removeChild(list.lastChild);
    }
  },

  /**
   * Custom CSV Builder and Downloader
   */
  exportCRMToCSV(leads) {
    const headers = ['ID', 'Company Name', 'Niche', 'Location', 'Address', 'Phone', 'Website', 'Rating', 'Reviews', 'Status', 'Estimated Value ($)', 'Owner/Decision Maker', 'Emails', 'Tech Stack'];
    
    const rows = leads.map(l => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      l.niche,
      `"${l.location.replace(/"/g, '""')}"`,
      `"${l.address.replace(/"/g, '""')}"`,
      l.phone || 'N/A',
      l.website || 'N/A',
      l.rating || 0,
      l.reviewCount || 0,
      l.status,
      l.value || 0,
      l.ownerName || 'N/A',
      l.emails ? l.emails.join(' | ') : 'N/A',
      l.techStack ? l.techStack.join(' | ') : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `leadflow_crm_export_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.addActivityLog(`Exported B2B lead list. (${leads.length} records).`);
    showToast('CSV Exported successfully!', 'success');
  }
};

/**
 * Global custom toasts
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  if (type === 'warning') iconClass = 'fa-circle-exclamation';
  if (type === 'error') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Fade out and remove after 3.5s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.5s ease';
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3500);
}
