export const Charts = (() => {
  const makeChart = (id, cfg) => {
    const el = document.getElementById(id);
    if (!el) return;
    return new Chart(el, cfg);
  };

  const barCfg = (labels, values) => ({
    type: 'bar',
    data: { labels, datasets: [{ data: values, backgroundColor: '#257881' }] },
    options: { indexAxis: 'y', plugins: { legend: { display: false } } }
  });

  const scatterCfg = (points) => ({
    type: 'scatter',
    data: { datasets: [{ data: points, backgroundColor: '#00A6FF' }] },
    options: { scales: { x: { beginAtZero: true }, y: { beginAtZero: true } } }
  });

  const donutCfg = (labels, values) => ({
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: ['#517A06','#FF2092','#00A6FF'] }] },
    options: { plugins: { legend: { position: 'bottom' } } }
  });

  const radarCfg = (labels, values) => ({
    type: 'radar',
    data: { labels, datasets: [{ data: values, fill: true, backgroundColor: 'rgba(0,90,99,0.3)', borderColor: '#005A63' }] },
    options: { scales: { r: { beginAtZero: true, max: 1 } } }
  });

  const renderDashboardCharts = () => {
    makeChart('keywordsChart', barCfg(['river','night','home','north','wind'], [22,18,15,12,11]));
    const pts = Array.from({ length: 20 }, () => ({ x: Math.random()*10, y: Math.random()*10 }));
    makeChart('themesChart', scatterCfg(pts));
    makeChart('sentimentChart', donutCfg(['Positive','Neutral','Negative'], [48,37,15]));
    makeChart('emotionsChart', radarCfg(['joy','sadness','anger','fear','surprise','disgust'], [0.62,0.22,0.06,0.11,0.18,0.03]));
  };

  return { makeChart, barCfg, scatterCfg, donutCfg, radarCfg, renderDashboardCharts };
})();
