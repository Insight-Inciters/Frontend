// js/features.js
import { Analysis } from './analysis.js';
import { Charts } from './charts.js';

const state = {
  charts: {}, // hold instances to destroy if needed
};

function textFromStorage() {
  return localStorage.getItem('ink_text') || '';
}
function metaFromStorage() {
  try { return JSON.parse(localStorage.getItem('ink_report_meta') || 'null'); } catch { return null; }
}

/* -------- Helpers -------- */
function destroyChart(id) {
  const c = state.charts[id];
  if (c && typeof c.destroy === 'function') {
    c.destroy();
  }
  delete state.charts[id];
}
function ensureDestroyed(ids) { ids.forEach(destroyChart); }

function exportSectionToPDF(sectionId) {
  const target = document.getElementById(sectionId);
  if (!target) return;
  const { jsPDF } = window.jspdf || {};
  if (!window.html2canvas || !jsPDF) {
    alert('PDF libraries not found.');
    return;
  }
  const meta = metaFromStorage();
  const baseName = (meta?.name || sectionId || 'Features')
    .toString().trim().replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'') || 'Features';
  const stamp = new Date().toISOString().slice(0,10);

  // render after next paint (ensures charts are drawn)
  requestAnimationFrame(async () => {
    const canvas = await window.html2canvas(target, {
      scale: Math.min(2, window.devicePixelRatio || 2),
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
    });
    const img = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p','mm','a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableW = pageW - margin*2;
    const imgW = usableW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let pos = margin;
    pdf.addImage(img, 'JPEG', margin, pos, imgW, imgH);
    let hLeft = imgH - (pageH - margin*2);
    while (hLeft > 0) {
      pdf.addPage();
      pos = margin - (imgH - hLeft);
      pdf.addImage(img, 'JPEG', margin, pos, imgW, imgH);
      hLeft -= (pageH - margin*2);
    }
    pdf.save(`${baseName}-${sectionId}-${stamp}.pdf`);
  });
}

/* -------- Chart builders for each section -------- */
function buildKeywordsCharts(text) {
  // Top tokens
  const top = Analysis.topKeywords(text, 10); // [[token,count],...]
  const labels = top.map(([t]) => t);
  const values = top.map(([,c]) => c);

  // Keyword frequency (horizontal bar)
  destroyChart('kwFrequencyChart');
  state.charts['kwFrequencyChart'] = Charts.makeChart('kwFrequencyChart', {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Frequency', data: values }] },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // Simple bigrams
  const toks = Analysis.tokens(text);
  const bigrams = new Map();
  for (let i=0;i<toks.length-1;i++){
    const pair = `${toks[i]} ${toks[i+1]}`;
    bigrams.set(pair, (bigrams.get(pair)||0)+1);
  }
  const topBi = [...bigrams.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
  const biLabels = topBi.map(([k])=>k);
  const biValues = topBi.map(([,v])=>v);

  destroyChart('kwNgramChart');
  state.charts['kwNgramChart'] = Charts.makeChart('kwNgramChart', {
    type: 'bar',
    data: { labels: biLabels, datasets: [{ label: 'Top Bigrams', data: biValues }] },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // Suggestions (dummy: inverse frequency emphasis)
  const sugVals = values.map(v => Math.max(1, Math.round(values[0] / v)));
  destroyChart('kwSuggestionsChart');
  state.charts['kwSuggestionsChart'] = Charts.makeChart('kwSuggestionsChart', {
    type: 'radar',
    data: { labels, datasets: [{ label:'Edit Impact', data: sugVals }] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // badges + list + preview
  document.getElementById('kw-unique').textContent = new Set(toks).size.toLocaleString();
  document.getElementById('kw-top').textContent = labels[0] || '—';

  const listEl = document.getElementById('kw-list');
  listEl.innerHTML = '';
  labels.forEach((token, i) => {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = `${token} — ${values[i]}`;
    a.style.display='block'; a.style.padding='6px 2px';
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const re = new RegExp(`\\b(${token})\\b`, 'gi');
      const html = (text || '').replace(re,'<mark>$1</mark>');
      document.getElementById('kw-doc').innerHTML = html || '<em>No preview available.</em>';
    });
    listEl.appendChild(a);
  });
}

function buildThemesCharts(text) {
  // Fake two scatter plots using token ranks for positions (for demo)
  const top = Analysis.topKeywords(text, 20);
  const pts = top.map(([,count], i) => ({ x: i + Math.random(), y: count + Math.random() * 2, r: 4 }));

  destroyChart('themesGraphChart');
  state.charts['themesGraphChart'] = Charts.makeChart('themesGraphChart', {
    type: 'scatter',
    data: { datasets: [{ label:'Clusters', data: pts }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
  });

  // Description distribution (bar)
  const labels = top.map(([t])=>t);
  const values = top.map(([,c])=>c);
  destroyChart('themesDescChart');
  state.charts['themesDescChart'] = Charts.makeChart('themesDescChart', {
    type:'bar',
    data:{ labels, datasets:[{ label:'Theme Weight', data: values }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
  });

  // Badges
  document.getElementById('th-count').textContent = Math.max(3, Math.round(top.length/5));
  document.getElementById('th-top').textContent = labels[0] || '—';

  // Suggestions (pie of top 5)
  destroyChart('themesSuggestionsChart');
  state.charts['themesSuggestionsChart'] = Charts.makeChart('themesSuggestionsChart', {
    type:'doughnut',
    data:{ labels: labels.slice(0,5), datasets:[{ data: values.slice(0,5) }] },
    options:{ responsive:true, maintainAspectRatio:false }
  });
}

function buildSentimentCharts(text) {
  const s = Analysis.sentiment(text);
  const pos = s.pos;
  const neg = s.neg;
  const neu = Math.max(0, 100 - pos - neg);

  // Donut
  destroyChart('sentimentDonutChart');
  state.charts['sentimentDonutChart'] = Charts.makeChart('sentimentDonutChart', {
    type:'doughnut',
    data:{ labels:['Positive','Neutral','Negative'], datasets:[{ data:[pos,neu,neg] }] },
    options:{ responsive:true, maintainAspectRatio:false }
  });

  // Timeline: split text into ~12 chunks and compute positivity
  const sentences = (text.match(/[^.!?]+[.!?]+/g) || [text]).map(s=>s.trim()).filter(Boolean);
  const chunkSize = Math.max(1, Math.ceil(sentences.length / 12));
  const lineVals = [];
  for (let i=0;i<sentences.length;i+=chunkSize) {
    const chunk = sentences.slice(i, i+chunkSize).join(' ');
    lineVals.push(Analysis.sentiment(chunk).pos);
  }
  destroyChart('sentimentTimelineChart');
  state.charts['sentimentTimelineChart'] = Charts.makeChart('sentimentTimelineChart', {
    type:'line',
    data:{ labels: lineVals.map((_,i)=>`Part ${i+1}`), datasets:[{ label:'Positivity %', data: lineVals }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
  });

  // Badges
  document.getElementById('se-pos').textContent = `${pos}%`;
  document.getElementById('se-neu').textContent = `${neu}%`;
  document.getElementById('se-neg').textContent = `${neg}%`;

  // Suggestions (radar)
  destroyChart('sentimentSuggestionsChart');
  state.charts['sentimentSuggestionsChart'] = Charts.makeChart('sentimentSuggestionsChart', {
    type:'radar',
    data:{ labels:['Clarity','Tone','Pacing','Focus','Originality'], datasets:[{ data:[60, pos, 50, 55, 48] }] },
    options:{ responsive:true, maintainAspectRatio:false }
  });
}

function buildEmotionsCharts(text) {
  // Tiny emotion lexicon
  const emoMap = {
    joy:['joy','happy','delight','pleased','smile','love'],
    sadness:['sad','sorrow','tears','gloom','grief'],
    anger:['anger','angry','rage','mad','furious'],
    fear:['fear','scare','scared','afraid','terror','worry'],
    surprise:['surprise','surprised','astonished','amazed','shock'],
    disgust:['disgust','gross','nausea','revolting','repulsed']
  };
  const toks = Analysis.tokens(text);
  const counts = Object.fromEntries(Object.keys(emoMap).map(k=>[k,0]));
  toks.forEach(t=>{
    for (const [k,words] of Object.entries(emoMap)) {
      if (words.includes(t)) counts[k] += 1;
    }
  });
  const labels = Object.keys(counts);
  const values = labels.map(k=>counts[k]);
  const max = Math.max(1, ...values);
  const norm = values.map(v => Number((v / max).toFixed(2)));

  // Radar
  destroyChart('emotionsRadarChart');
  state.charts['emotionsRadarChart'] = Charts.makeChart('emotionsRadarChart', {
    type:'radar',
    data:{ labels, datasets:[{ label:'Emotion Strength', data: norm }] },
    options:{ responsive:true, maintainAspectRatio:false }
  });

  // Bar
  destroyChart('emotionsBarChart');
  state.charts['emotionsBarChart'] = Charts.makeChart('emotionsBarChart', {
    type:'bar',
    data:{ labels, datasets:[{ label:'Counts', data: values }] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
  });

  // Arc (line)
  const arc = [];
  const chunk = Math.max(1, Math.floor(toks.length/20));
  for (let i=0; i<toks.length; i+=chunk) {
    const slice = toks.slice(i, i+chunk);
    const joy = slice.filter(w=>emoMap.joy.includes(w)).length;
    const sad = slice.filter(w=>emoMap.sadness.includes(w)).length;
    arc.push(Math.max(0, joy - sad)); // naive arc
  }
  destroyChart('emotionsArcChart');
  state.charts['emotionsArcChart'] = Charts.makeChart('emotionsArcChart', {
    type:'line',
    data:{ labels: arc.map((_,i)=>`S${i+1}`), datasets:[{ label:'Emotional Arc', data: arc }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
  });

  // Dominant
  const domIdx = values.indexOf(Math.max(...values));
  document.getElementById('em-dominant').textContent = labels[domIdx] || '—';

  // Suggestions
  destroyChart('emotionsSuggestionsChart');
  state.charts['emotionsSuggestionsChart'] = Charts.makeChart('emotionsSuggestionsChart', {
    type:'doughnut',
    data:{ labels, datasets:[{ data: values }] },
    options:{ responsive:true, maintainAspectRatio:false }
  });
}

/* -------- Init & wiring -------- */
function activateTabFromHashOrStorage() {
  const target = (location.hash || '').replace('#','') || localStorage.getItem('ink_target_section') || 'keywords';
  const tabBtn = document.querySelector(`.feature-tab[data-target="${target}"]`);
  if (tabBtn) tabBtn.click(); // triggers CSS/ARIA from your page script
  history.replaceState(null,'',`#${target}`);
}

function wireBackButtons() {
  document.querySelectorAll('.btn.back').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if (history.length > 1) history.back(); else window.location.href='dashboard.html';
    });
  });
}

function wireSectionExports() {
  const map = {
    exportKw: 'keywords',
    exportTh: 'themes',
    exportSe: 'sentiment',
    exportEm: 'emotions',
  };
  Object.entries(map).forEach(([btnId, secId])=>{
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener('click', ()=> exportSectionToPDF(secId));
  });
}

window.addEventListener('DOMContentLoaded', () => {
  wireBackButtons();
  wireSectionExports();

  const text = textFromStorage();

  if (text && text.trim().length) {
    // Build all charts once so switching tabs feels instant
    buildKeywordsCharts(text);
    buildThemesCharts(text);
    buildSentimentCharts(text);
    buildEmotionsCharts(text);
  } else {
    // No data: clean up any existing charts
    ensureDestroyed(Object.keys(state.charts));
  }

  // Focus the right tab/section
  activateTabFromHashOrStorage();

  // Keep the chosen tab for roundtrips
  document.querySelectorAll('.feature-tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.target;
      try { localStorage.setItem('ink_target_section', id); } catch {}
    });
  });
});
