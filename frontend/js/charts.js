// js/charts.js
export const Charts = (() => {
  // ---------- internals ----------
  const registry = new Map(); // id -> Chart instance

  const ID_TO_SECTION = {
    keywordsChart: 'keywords',
    themesChart: 'themes',
    sentimentChart: 'sentiment',
    emotionsChart: 'emotions'
  };

  const ensureCanvas = (id) => {
    // Try direct lookup first
    let el = document.getElementById(id);
    if (el) return el;

    // Fallback: mount a canvas inside the correct .chartbox via data-section
    const section = ID_TO_SECTION[id];
    if (section) {
      const host = document.querySelector(`[data-section="${section}"] .chartbox`);
      if (host) {
        el = document.createElement('canvas');
        el.id = id;
        // Make the host a clean, white container (no decorative bg/pattern)
        host.style.background = '#fff';
        host.style.borderStyle = 'solid';
        host.style.borderColor = 'var(--dark-teal)';
        host.style.minHeight = '280px';
        // Hide the empty-note in this panel if present
        const note = host.parentElement?.querySelector('.empty-note');
        if (note) note.style.display = 'none';
        host.appendChild(el);
        return el;
      }
    }
    return null;
  };

  const prepHost = (canvas, height = 300) => {
    const box = canvas?.parentElement;
    if (!box) return;
    // Ensure the chart can grow
    if (!box.style.height) box.style.height = `${height}px`;
    // White background for "has data" state
    box.style.background = '#fff';
    box.style.borderStyle = 'solid';
    box.style.borderColor = 'var(--dark-teal)';
  };

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 350 },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    layout: { padding: 8 }
  };

  const makeChart = (id, cfg, preferredHeight = 300) => {
    const canvas = ensureCanvas(id);
    if (!canvas) return;

    // Clean re-render
    if (registry.has(id)) {
      try { registry.get(id).destroy(); } catch {}
      registry.delete(id);
    }

    prepHost(canvas, preferredHeight);
    const chart = new Chart(canvas, cfg);
    registry.set(id, chart);
    return chart;
  };

  // ---------- configs ----------
  const barCfg = (labels, values) => ({
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Frequency',
        data: values,
        backgroundColor: '#257881',
        borderRadius: 6,
        barThickness: 'flex'
      }]
    },
    options: {
      ...baseOpts,
      indexAxis: 'y',
      scales: {
        x: { beginAtZero: true, grid: { display: false }, ticks: { precision: 0 } },
        y: { grid: { display: false } }
      }
    }
  });

  const scatterCfg = (points) => ({
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Theme clusters',
        data: points,             // [{x, y}]
        backgroundColor: '#00A6FF',
        pointRadius: 4
      }]
    },
    options: {
      ...baseOpts,
      scales: {
        x: { beginAtZero: true, grid: { color: '#eee' } },
        y: { beginAtZero: true, grid: { color: '#eee' } }
      }
    }
  });

  const donutCfg = (labels, values) => ({
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['#517A06','#DBDBDB','#E03131']
      }]
    },
    options: {
      ...baseOpts,
      plugins: { 
        ...baseOpts.plugins,
        legend: { display: true, position: 'bottom' }
      },
      cutout: '58%'
    }
  });

  const radarCfg = (labels, values) => ({
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Emotion intensity',
        data: values,
        fill: true,
        backgroundColor: 'rgba(0,90,99,0.25)',
        borderColor: '#005A63',
        pointBackgroundColor: '#005A63'
      }]
    },
    options: {
      ...baseOpts,
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: 1,
          angleLines: { color: '#DBDBDB' },
          grid: { color: '#DBDBDB' },
          ticks: { showLabelBackdrop: false }
        }
      }
    }
  });

  // ---------- dashboard preset (demo data) ----------
  const renderDashboardCharts = () => {
    makeChart('keywordsChart', barCfg(
      ['river','night','home','north','wind','stone','road'],
      [22,18,15,12,11,9,7]
    ), 320);

    const pts = Array.from({ length: 25 }, () => ({ x: +(Math.random()*10).toFixed(2), y: +(Math.random()*10).toFixed(2) }));
    makeChart('themesChart', scatterCfg(pts), 320);

    makeChart('sentimentChart', donutCfg(['Positive','Neutral','Negative'], [48,37,15]), 300);

    makeChart('emotionsChart', radarCfg(['joy','sadness','anger','fear','surprise','disgust'], [0.62,0.22,0.06,0.11,0.18,0.03]), 340);
  };

  return {
    makeChart,
    barCfg,
    scatterCfg,
    donutCfg,
    radarCfg,
    renderDashboardCharts
  };
})();
