import { db } from '../db.js';
import { showToast } from '../app.js';

// Order of main pipeline columns (excluding lost)
const PIPELINE_ORDER = ['new', 'contacted', 'discussion', 'converted'];

export const kanbanComponent = {
  /**
   * Renders the CRM Kanban columns and cards
   */
  renderBoard(app) {
    const leads = db.getLeads();
    
    // Clear all column containers
    const containers = {
      new: document.getElementById('container-new'),
      contacted: document.getElementById('container-contacted'),
      discussion: document.getElementById('container-discussion'),
      converted: document.getElementById('container-converted'),
      lost: document.getElementById('container-lost')
    };

    const counts = {
      new: document.getElementById('count-new'),
      contacted: document.getElementById('count-contacted'),
      discussion: document.getElementById('count-discussion'),
      converted: document.getElementById('count-converted'),
      lost: document.getElementById('count-lost')
    };

    // Initialize counts and empty columns
    Object.keys(containers).forEach(key => {
      if (containers[key]) containers[key].innerHTML = '';
      if (counts[key]) counts[key].innerText = '0';
    });

    if (leads.length === 0) {
      Object.keys(containers).forEach(key => {
        if (containers[key]) {
          containers[key].innerHTML = `
            <div class="empty-state-list" style="padding:16px; font-size:11px;">
              No leads in stage
            </div>
          `;
        }
      });
      return;
    }

    // Populate columns
    leads.forEach(lead => {
      const status = lead.status || 'new';
      const container = containers[status];
      if (!container) return;

      // Increment count
      const countEl = counts[status];
      if (countEl) {
        countEl.innerText = parseInt(countEl.innerText) + 1;
      }

      // Calculate checklist progress
      const totalTasks = lead.checklist ? lead.checklist.length : 0;
      const completedTasks = lead.checklist ? lead.checklist.filter(t => t.done).length : 0;
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Build transition action buttons
      let leftBtnDisabled = false;
      let rightBtnDisabled = false;
      let lostBtnHtml = '';

      if (status === 'lost') {
        leftBtnDisabled = true;
        // If lost, right arrow restores back to 'new'
        rightBtnDisabled = false;
      } else {
        const pipelineIndex = PIPELINE_ORDER.indexOf(status);
        if (pipelineIndex === 0) leftBtnDisabled = true;
        if (pipelineIndex === PIPELINE_ORDER.length - 1) rightBtnDisabled = true;
        
        // Add a "Move to Lost" button
        lostBtnHtml = `
          <button class="btn-card-action btn-card-lost" data-lead-id="${lead.id}" title="Mark as Lost">
            <i class="fa-solid fa-face-frown text-rose" style="font-size:11px;"></i>
          </button>
        `;
      }

      const card = document.createElement('div');
      card.className = `kanban-card border-left-${status}`;
      card.innerHTML = `
        <div class="card-meta-row">
          <span class="card-niche-text">${lead.niche}</span>
          <span class="card-value-badge">$${lead.value || 0}</span>
        </div>
        
        <h4>${lead.name}</h4>
        
        <div style="font-size: 11px; color: var(--text-muted); display:flex; align-items:center; gap:4px;">
          <i class="fa-solid fa-location-dot" style="color:var(--primary);"></i>
          <span>${lead.location.split(',')[0]}</span>
        </div>

        ${totalTasks > 0 ? `
          <div class="card-checklist-progress">
            <div class="progress-text">
              <span>Checklist</span>
              <span>${completedTasks}/${totalTasks} (${progressPercent}%)</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
            </div>
          </div>
        ` : ''}

        <div class="card-nav-controls">
          <!-- Column Transitions -->
          <button class="btn-card-nav move-left-btn" data-lead-id="${lead.id}" ${leftBtnDisabled ? 'disabled' : ''} title="Move Left">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          
          <div class="card-action-icons">
            <button class="btn-card-action btn-action-view view-lead-btn" data-lead-id="${lead.id}" title="View/Edit Details">
              <i class="fa-solid fa-eye"></i>
            </button>
            ${lostBtnHtml}
            <button class="btn-card-action btn-action-delete delete-lead-btn" data-lead-id="${lead.id}" title="Delete Lead">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>

          <button class="btn-card-nav move-right-btn" data-lead-id="${lead.id}" ${rightBtnDisabled ? 'disabled' : ''} title="${status === 'lost' ? 'Restore to New' : 'Move Right'}">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      `;

      // Prevent card detail popup when clicking buttons inside card
      card.addEventListener('click', (e) => {
        // If clicked on a button or an icon inside a button, do nothing
        if (e.target.closest('button') || e.target.closest('a')) return;
        app.showLeadDetails(lead);
      });

      container.appendChild(card);
    });

    // Attach card event listeners
    this.attachEventListeners(containers, app);
  },

  /**
   * Attaches transition, view, and delete listeners
   */
  attachEventListeners(containers, app) {
    // Left transitions
    document.querySelectorAll('.move-left-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = btn.getAttribute('data-lead-id');
        const leads = db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        
        if (lead) {
          const currentIndex = PIPELINE_ORDER.indexOf(lead.status);
          if (currentIndex > 0) {
            const nextStatus = PIPELINE_ORDER[currentIndex - 1];
            db.updateLeadStatus(leadId, nextStatus);
            this.renderBoard(app);
            app.updateHeaderStats();
            app.addActivityLog(`Moved lead <strong>${lead.name}</strong> back to ${nextStatus}.`);
            showToast(`Moved ${lead.name} back to ${nextStatus}`, 'info');
          }
        }
      });
    });

    // Right transitions
    document.querySelectorAll('.move-right-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = btn.getAttribute('data-lead-id');
        const leads = db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        
        if (lead) {
          if (lead.status === 'lost') {
            // Restore from lost to new
            db.updateLeadStatus(leadId, 'new');
            this.renderBoard(app);
            app.updateHeaderStats();
            app.addActivityLog(`Restored lead <strong>${lead.name}</strong> to CRM pipeline (New).`);
            showToast(`Restored ${lead.name} to pipeline!`, 'success');
          } else {
            const currentIndex = PIPELINE_ORDER.indexOf(lead.status);
            if (currentIndex < PIPELINE_ORDER.length - 1) {
              const nextStatus = PIPELINE_ORDER[currentIndex + 1];
              db.updateLeadStatus(leadId, nextStatus);
              this.renderBoard(app);
              app.updateHeaderStats();
              app.addActivityLog(`Advanced lead <strong>${lead.name}</strong> to ${nextStatus}.`);
              
              if (nextStatus === 'converted') {
                showToast(`🎉 Congratulations! Won ${lead.name}!`, 'success');
              } else {
                showToast(`Advanced ${lead.name} to ${nextStatus}`, 'success');
              }
            }
          }
        }
      });
    });

    // Mark as Lost transition
    document.querySelectorAll('.btn-card-lost').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = btn.getAttribute('data-lead-id');
        const lead = db.getLeads().find(l => l.id === leadId);
        
        if (lead) {
          db.updateLeadStatus(leadId, 'lost');
          this.renderBoard(app);
          app.updateHeaderStats();
          app.addActivityLog(`Marked lead <strong>${lead.name}</strong> as Lost.`);
          showToast(`Marked ${lead.name} as lost.`, 'warning');
        }
      });
    });

    // View Details triggers
    document.querySelectorAll('.view-lead-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = btn.getAttribute('data-lead-id');
        const lead = db.getLeads().find(l => l.id === leadId);
        if (lead) app.showLeadDetails(lead);
      });
    });

    // Delete triggers
    document.querySelectorAll('.delete-lead-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = btn.getAttribute('data-lead-id');
        const lead = db.getLeads().find(l => l.id === leadId);
        
        if (lead && confirm(`Are you sure you want to delete ${lead.name} from the CRM?`)) {
          db.deleteLead(leadId);
          this.renderBoard(app);
          app.outreach.updateLeadDropdown();
          app.updateHeaderStats();
          app.addActivityLog(`Deleted lead <strong>${lead.name}</strong> from pipeline.`);
          showToast(`Deleted ${lead.name} from CRM.`, 'info');
        }
      });
    });
  }
};
