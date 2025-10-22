import { Charts } from './charts.js';

window.addEventListener('DOMContentLoaded', () => {
  const target = localStorage.getItem('ink_target_section');
  if (target) document.location.hash = `#${target}`;
  Charts.renderDashboardCharts(); // or filtered ones
});
