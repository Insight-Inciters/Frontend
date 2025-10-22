// js/features.js
import { Analysis } from './analysis.js';
import { Charts } from './charts.js';

window.addEventListener('DOMContentLoaded', () => {
  // ----- Focus the correct section -----
  const target = localStorage.getItem('ink_target_section');
  if (target) {
    const hash = `#${target}`;
    document.location.hash = hash;
    // gentle scroll into view (without flash jump)
    const section = document.querySelector(hash);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ----- Pull text -----
  const text = localStorage.getItem('ink_text') || '';
  const hasText = !!text.trim();

  if (hasText) {
    try {
      // build charts dynamically from actual analysis
      const kw = Analysis.toChart.keywords(text, 10);
      Charts.makeChart('keywordsChart', Charts.barCfg(kw.labels, kw.values), 320);

      const pts = Analysis.toChart.themes(text, 30);
      Charts.makeChart('themesChart', Charts.scatterCfg(pts), 320);

      const sent = Analysis.toChart.sentiment(text);
      Charts.makeChart('sentimentChart', Charts.donutCfg(sent.labels, sent.values), 300);

      const emo = Analysis.toChart.emotions(text);
      Charts.makeChart('emotionsChart', Charts.radarCfg(emo.labels, emo.values), 340);
    } catch (e) {
      console.warn('Error rendering feature charts, fallback to demo:', e);
      Charts.renderDashboardCharts();
    }
  } else {
    // demo fallback
    Charts.renderDashboardCharts();
  }
});
