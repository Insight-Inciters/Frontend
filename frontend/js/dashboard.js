// js/dashboard.js
import { Analysis } from './analysis.js';
import { Charts } from './charts.js';

window.addEventListener('DOMContentLoaded', () => {
  const els = {
    fn: document.getElementById('fn'),
    wc: document.getElementById('wc'),
    rt: document.getElementById('rt'),
    summaryText: document.getElementById('summaryText'),
    summaryEmpty: document.getElementById('summaryEmpty'),
    deleteBtn: document.getElementById('deleteBtn'),
    exportBtn: document.getElementById('exportBtn'),
  };

  // ----- Restore meta/text -----
  const text = localStorage.getItem('ink_text') || '';
  const meta = JSON.parse(localStorage.getItem('ink_report_meta') || 'null');

  // badges
  const words = meta?.words ?? (text.match(/\b[\p{L}\p{N}’'-]+\b/gu) || []).length;
  els.fn.textContent = meta?.name || 'none';
  els.wc.textContent = words ? words.toLocaleString() : '0000';
  els.rt.textContent = words ? `${Math.max(1, Math.ceil(words / 200))} min` : '00 min';

  // summary
  const summary = Analysis.quickSummary(text);
  if (summary) {
    els.summaryText.textContent = summary;
    els.summaryEmpty.hidden = true;
  } else {
    els.summaryText.textContent = '';
    els.summaryEmpty.hidden = false;
  }

  // charts render or clear
  if (text && text.trim().length > 0) {
    Charts.renderDashboardCharts();
  } else {
    Charts.clearCharts();
  }

  // ====== DELETE ======
  const handleDelete = () => {
    if (!confirm('Delete this report?')) return;
    try {
      localStorage.removeItem('ink_text');
      localStorage.removeItem('ink_report_meta');
    } catch {}
    // reset UI
    els.fn.textContent = 'none';
    els.wc.textContent = '0000';
    els.rt.textContent = '00 min';
    els.summaryText.textContent = '';
    els.summaryEmpty.hidden = false;

    // tear down charts and show "No chart available" notes
    Charts.clearCharts();
  };

  if (els.deleteBtn) els.deleteBtn.addEventListener('click', handleDelete);

  // ====== EXPORT (optional; if you added earlier) ======
  if (els.exportBtn) {
    els.exportBtn.addEventListener('click', () => {
      alert('Connect jsPDF/html2canvas export logic here or keep the previous exportPDF() implementation.');
    });
  }

  // Persist selected feature so features.html can auto-open the right section
  document.querySelectorAll('.feature').forEach(link => {
    link.addEventListener('click', () => {
      const section = link.getAttribute('data-section');
      try { localStorage.setItem('ink_target_section', section); } catch {}
    });
  });
});
