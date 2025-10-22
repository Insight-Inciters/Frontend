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
  };

  // ----- pull text/meta -----
  const text = localStorage.getItem('ink_text') || '';
  const meta = JSON.parse(localStorage.getItem('ink_report_meta') || 'null');

  // ----- badges -----
  const words = meta?.words ?? Analysis.wordCount(text);
  els.fn.textContent = meta?.name || 'none';
  els.wc.textContent = words ? words.toLocaleString() : '0000';
  els.rt.textContent = words ? `${Analysis.readTimeMin(words)} min` : '00 min';

  // ----- summary -----
  const summary = Analysis.quickSummary(text);
  if (summary) {
    els.summaryText.textContent = summary;
    els.summaryEmpty.hidden = true;
  }

  // ----- charts -----
  if (text && text.trim()) {
    // Build from actual text
    try {
      const kw = Analysis.toChart.keywords(text, 7); // {labels, values}
      Charts.makeChart('keywordsChart', Charts.barCfg(kw.labels, kw.values), 320);

      const pts = Analysis.toChart.themes(text, 25); // [{x,y}]
      Charts.makeChart('themesChart', Charts.scatterCfg(pts), 320);

      const sent = Analysis.toChart.sentiment(text); // {labels, values}
      Charts.makeChart('sentimentChart', Charts.donutCfg(sent.labels, sent.values), 300);

      const emo = Analysis.toChart.emotions(text); // {labels, values}
      Charts.makeChart('emotionsChart', Charts.radarCfg(emo.labels, emo.values), 340);
    } catch (e) {
      // If anything goes wrong, render demo so the UI isn't blank
      console.warn('Falling back to demo charts:', e);
      Charts.renderDashboardCharts();
    }
  } else {
    // No text yet → demo charts
    Charts.renderDashboardCharts();
  }
});
