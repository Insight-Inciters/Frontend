// js/charts.js
export const Charts = (() => {
  // Keep refs to created charts so we can destroy them later
  const _instances = {};

  const _byId = (id) => document.getElementById(id);

  const _getNoteForCanvas = (canvasEl) => {
    if (!canvasEl) return null;
    const panel = canvasEl.closest('.panel');
    return panel ? panel.querySelector('.empty-note') : null;
  };

  const _hideNoteFor = (canvasEl) => {
    const note = _getNoteForCanvas(canvasEl);
    if (note) note.hidden = true;
  };

  const _showNoteFor = (canvasEl) => {
    const note = _getNoteForCanvas(canvasEl);
    if (note) note.hidden = false;
  };

  const makeChart = (id, cfg) => {
    const canvas = _byId(id);
    if (!canvas) return;
    // destroy if already exists
    if (_instances[id]) {
      try { _instances[id].destroy(); } catch {}
      delete _instances[id];
    }
    const chart = new Chart(canvas, cfg);
    _instances[id] = chart;
    _hideNoteFor(canvas);
    return chart;
  };

  // ---------- Chart Config Helpers ----------
  const barCfg = (labels, values) => ({
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: '#257881',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false }, tooltip: { intersect: false } },
      scales: {
        x: { grid: { display: false }, ticks: { precision: 0 } },
        y: { grid: { display: false } }
      }
    }
  });

  const scatterCfg = (points) => ({
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Clusters',
        data: points,
        backgroundColor: '#00A6FF',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, grid: { display: false } },
        y: { beginAtZero: true, grid: { display: false } }
      }
    }
  });

  const donutCfg = (labels, values) => ({
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['#517A06','#DBDBDB','#E03131'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12 } }
      }
    }
  });

  const radarCfg = (labels, values) => ({
    type: 'radar',
    data: {
      labels,
      datasets: [{
        data: values,
        fill: true,
        backgroundColor: 'rgba(0,90,99,0.25)',
        borderColor: '#005A63',
        pointBackgroundColor: '#005A63'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { r: { beginAtZero: true, min: 0, max: 1, ticks: { display: false }, grid: { color: '#DBDBDB' } } }
    }
  });

  // ---------- Public render helpers ----------
  const renderDashboardCharts = () => {
    // Example/demo data; replace with your computed values if you have them in LS or fetched.
    makeChart('keywordsChart', barCfg(['river','night','home','north','wind'], [22,18,15,12,11]));

    const pts = Array.from({ length: 20 }, () => ({ x: +(Math.random()*10).toFixed(2), y: +(Math.random()*10).toFixed(2) }));
    makeChart('themesChart', scatterCfg(pts));

    makeChart('sentimentChart', donutCfg(['Positive','Neutral','Negative'], [48,37,15]));

    makeChart('emotionsChart', radarCfg(
      ['joy','sadness','anger','fear','surprise','disgust'],
      [0.62,0.22,0.06,0.11,0.18,0.03]
    ));
  };

  const clearCharts = () => {
    // Destroy chart instances
    Object.keys(_instances).forEach((id) => {
      try { _instances[id].destroy(); } catch {}
      delete _instances[id];
    });
    // Show the "No chart available" for every panel that has a canvas
    document.querySelectorAll('.chartbox canvas').forEach((c) => _showNoteFor(c));
  };

  return { makeChart, barCfg, scatterCfg, donutCfg, radarCfg, renderDashboardCharts, clearCharts };
})();
