import { Analysis } from './analysis.js';
import { Charts } from './charts.js';

window.addEventListener('DOMContentLoaded', () => {
  // drawer & summary code from your dashboard — unchanged
  const els = {
    fn: document.getElementById('fn'),
    wc: document.getElementById('wc'),
    rt: document.getElementById('rt'),
    summaryText: document.getElementById('summaryText'),
    summaryEmpty: document.getElementById('summaryEmpty'),
  };

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
  }

  // charts
  Charts.renderDashboardCharts();
});
