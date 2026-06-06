import { db } from '../db.js';
import { showToast } from '../app.js';

let currentTemplates = [];

export const outreachComponent = {
  /**
   * Initializes Outreach campaign controllers
   */
  init(app) {
    const templateSelect = document.getElementById('template-select');
    const leadSelect = document.getElementById('outreach-lead-select');
    const saveBtn = document.getElementById('save-template-btn');
    const copyBtn = document.getElementById('copy-email-btn');
    const sendLink = document.getElementById('send-email-link');
    
    if (!templateSelect) return;

    currentTemplates = db.getTemplates();
    this.populateTemplatesDropdown();
    this.updateLeadDropdown();

    // Select first template by default
    if (currentTemplates.length > 0) {
      this.loadTemplate(currentTemplates[0].id);
    }

    // Template selection change
    templateSelect.addEventListener('change', (e) => {
      this.loadTemplate(e.target.value);
      this.renderPreview();
    });

    // Lead selection change
    leadSelect.addEventListener('change', () => {
      this.renderPreview();
    });

    // Save Template Edits
    saveBtn.addEventListener('click', () => {
      const selectedId = templateSelect.value;
      const subject = document.getElementById('template-subject').value.trim();
      const body = document.getElementById('template-body').value.trim();

      if (!subject || !body) {
        showToast('Subject and body cannot be empty.', 'error');
        return;
      }

      const activeTemplate = currentTemplates.find(t => t.id === selectedId);
      if (activeTemplate) {
        activeTemplate.subject = subject;
        activeTemplate.body = body;
        db.saveTemplate(activeTemplate);
        
        showToast('Template saved successfully!', 'success');
        this.renderPreview();
      }
    });

    // Insert token helper
    document.querySelectorAll('.btn-token').forEach(btn => {
      btn.addEventListener('click', () => {
        const token = btn.getAttribute('data-token');
        const textarea = document.getElementById('template-body');
        
        // Insert token at cursor location
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        
        textarea.value = before + token + after;
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + token.length;
      });
    });

    // Copy Content
    copyBtn.addEventListener('click', () => {
      const text = document.getElementById('outreach-body-preview').innerText;
      
      navigator.clipboard.writeText(text).then(() => {
        showToast('Email content copied to clipboard!', 'success');
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy to clipboard.', 'error');
      });
    });
  },

  /**
   * Populates the templates dropdown selector
   */
  populateTemplatesDropdown() {
    const templateSelect = document.getElementById('template-select');
    if (!templateSelect) return;
    
    templateSelect.innerHTML = currentTemplates.map(t => 
      `<option value="${t.id}">${t.name}</option>`
    ).join('');
  },

  /**
   * Refreshes the CRM Leads dropdown list
   */
  updateLeadDropdown() {
    const leadSelect = document.getElementById('outreach-lead-select');
    if (!leadSelect) return;
    
    const leads = db.getLeads();
    
    // Maintain selection if possible
    const currentSelection = leadSelect.value;

    if (leads.length === 0) {
      leadSelect.innerHTML = `<option value="">-- No Leads Available (Add from Finder) --</option>`;
      this.renderPreview();
      return;
    }

    const leadOptions = leads.map(l => 
      `<option value="${l.id}">${l.name} (${l.location.split(',')[0]})</option>`
    ).join('');

    leadSelect.innerHTML = `
      <option value="">-- Select a Lead --</option>
      ${leadOptions}
    `;

    // Restore selection
    if (leads.some(l => l.id === currentSelection)) {
      leadSelect.value = currentSelection;
    }
    this.renderPreview();
  },

  /**
   * Sets Outreach page to select a specific lead and template automatically
   */
  setTargetSelection(leadId, templateId = null) {
    const leadSelect = document.getElementById('outreach-lead-select');
    const templateSelect = document.getElementById('template-select');

    if (leadSelect) {
      leadSelect.value = leadId;
    }
    if (templateSelect && templateId) {
      templateSelect.value = templateId;
      this.loadTemplate(templateId);
    }
    
    this.renderPreview();
  },

  /**
   * Loads template text details into input forms
   */
  loadTemplate(id) {
    const template = currentTemplates.find(t => t.id === id);
    if (!template) return;

    document.getElementById('template-subject').value = template.subject;
    document.getElementById('template-body').value = template.body;
  },

  /**
   * Replaces token placeholders and compiles preview card + mailto details
   */
  renderPreview() {
    const leadSelect = document.getElementById('outreach-lead-select');
    const copyBtn = document.getElementById('copy-email-btn');
    const sendLink = document.getElementById('send-email-link');
    
    const toSpan = document.getElementById('outreach-email-to');
    const subjectSpan = document.getElementById('outreach-subject-preview');
    const bodyBox = document.getElementById('outreach-body-preview');
    
    const leadId = leadSelect.value;
    
    if (!leadId) {
      // Clear preview
      toSpan.innerText = 'Select lead to see email';
      toSpan.className = 'text-mute';
      subjectSpan.innerText = 'Select lead to see subject';
      subjectSpan.className = 'text-mute';
      bodyBox.innerText = 'Select a lead from the dropdown above to render personalized email content using CRM records.';
      bodyBox.className = 'preview-body-content text-mute';
      
      copyBtn.disabled = true;
      sendLink.style.pointerEvents = 'none';
      sendLink.style.opacity = '0.6';
      return;
    }

    const leads = db.getLeads();
    const lead = leads.find(l => l.id === leadId);
    
    const templateSubject = document.getElementById('template-subject').value;
    const templateBody = document.getElementById('template-body').value;

    if (!lead) return;

    // Determine target email
    const emailTo = lead.email || (lead.emails && lead.emails.length > 0 ? lead.emails[0] : null) || 'Not Available';
    
    if (emailTo === 'Not Available') {
      toSpan.innerHTML = `Not Available (💡 Scan website in CRM to discover)`;
      toSpan.className = 'text-amber font-bold';
    } else {
      toSpan.innerText = emailTo;
      toSpan.className = 'text-cyan font-bold';
    }

    // Process Token replacements
    const ownerName = lead.ownerName || 'Business Owner';
    const cleanLocation = lead.location.split(',')[0];

    const replaceTokens = (text) => {
      return text
        .replace(/{{business_name}}/g, lead.name)
        .replace(/{{owner_name}}/g, ownerName)
        .replace(/{{location}}/g, cleanLocation)
        .replace(/{{rating}}/g, lead.rating ? lead.rating : 'N/A')
        .replace(/{{niche}}/g, lead.niche);
    };

    const compiledSubject = replaceTokens(templateSubject);
    const compiledBody = replaceTokens(templateBody);

    subjectSpan.innerText = compiledSubject;
    subjectSpan.classList.remove('text-mute');
    
    bodyBox.innerText = compiledBody;
    bodyBox.classList.remove('text-mute');

    // Enable buttons
    copyBtn.disabled = false;
    
    if (emailTo !== 'Not Available') {
      sendLink.href = `mailto:${emailTo}?subject=${encodeURIComponent(compiledSubject)}&body=${encodeURIComponent(compiledBody)}`;
      sendLink.style.pointerEvents = 'auto';
      sendLink.style.opacity = '1';
    } else {
      sendLink.style.pointerEvents = 'none';
      sendLink.style.opacity = '0.6';
    }
  }
};
