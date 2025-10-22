// js/analysis.js
export const Analysis = (() => {
  // ---------- Stopwords & Lexicons ----------
  const STOP = new Set([
    'the','a','an','and','or','but','if','then','else','for','to','of','in','on','at','by','is','are','was','were','be','been','being','am','i','you','he','she','it','we','they',
    'me','him','her','us','them','my','your','his','its','our','their','this','that','these','those','as','with','from','about','into','over','after','before','so','than',
    'too','very','not','no','yes','do','does','did','doing','done','there','here','out','up','down','off','again','once','just','only','also','can','could','should','would','will',
    'shall','may','might','must'
  ]);

  const POS = new Set([
    'good','great','love','loved','loving','happy','joy','wonderful','excellent','amazing','positive','bright','success','strong','beautiful','calm','peace','hope','brave','kind','smile','grace','gift','win','wins','winning'
  ]);
  const NEG = new Set([
    'bad','worse','worst','hate','hated','angry','anger','sad','awful','terrible','poor','negative','dark','failure','weak','ugly','fear','pain','worry','loss','lose','losing','cry','cried','tired','broken'
  ]);

  // ---------- Utilities ----------
  const fold = (s='') =>
    s.normalize('NFD').replace(/\p{Diacritic}+/gu,''); // remove accents

  const wordish = (t='') =>
    (t.match(/\b[#@]?[\p{L}\p{N}](?:[\p{L}\p{N}’'_-]*[\p{L}\p{N}])?\b/gu) || []);

  const tokens = (t) =>
    wordish(fold(t))
      .map(w => w.toLowerCase())
      .map(x => x.replace(/^[’'_ -]+|[’'_ -]+$/g,''))     // trim punctuation dashes
      .filter(x => x && !STOP.has(x));

  const wordCount = (t) => (wordish(t).length);

  const readTimeMin = (w) => Math.max(1, Math.ceil(w / 200));

  // ---------- Keyword / N-gram helpers ----------
  const countMap = (arr) => {
    const m = new Map();
    for (const x of arr) m.set(x, (m.get(x) || 0) + 1);
    return m;
  };

  const topKeywords = (text, n = 5, {minCount = 1} = {}) => {
    const c = countMap(tokens(text));
    const ranked = [...c.entries()]
      .filter(([,v]) => v >= minCount)
      .sort((a,b) => b[1]-a[1])
      .slice(0, n);
    return ranked; // [ [term, count], ... ]
  };

  const topBigrams = (text, n = 5, {minCount = 1} = {}) => {
    const toks = tokens(text);
    const pairs = [];
    for (let i=0;i<toks.length-1;i++){
      pairs.push(`${toks[i]} ${toks[i+1]}`);
    }
    const c = countMap(pairs);
    return [...c.entries()]
      .filter(([,v]) => v >= minCount)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,n);
  };

  // ---------- Sentiment ----------
  const sentiment = (text) => {
    const toks = tokens(text);
    // naive negation handling: "not X" flips once
    let pos = 0, neg = 0;
    for (let i=0;i<toks.length;i++){
      const t = toks[i];
      const prev = toks[i-1];
      const isNegation = prev === 'not' || prev === "n't" || prev === 'no';
      if (POS.has(t)) { isNegation ? neg++ : pos++; }
      else if (NEG.has(t)) { isNegation ? pos++ : neg++; }
    }
    const total = Math.max(1, pos + neg + Math.round(toks.length / 60));
    return { pos: Math.round((pos / total) * 100), neg: Math.round((neg / total) * 100) };
  };

  // ---------- Quick summary string ----------
  const quickSummary = (text) => {
    if (!text || !text.trim()) return '';
    const kws = topKeywords(text, 5).map(([k]) => k);
    const s = sentiment(text);
    let out = '';
    if (kws.length) out += `Top themes: ${kws.join(', ')}. `;
    out += `Sentiment ~ ${s.pos}% positive / ${s.neg}% negative.`;
    return out;
  };

  // ---------- Chart adapters (return plain data objects) ----------
  // For Keywords (horizontal bar)
  const toChartKeywords = (text, n = 7) => {
    const top = topKeywords(text, n);
    const labels = top.map(([k]) => k);
    const values = top.map(([,v]) => v);
    return { labels, values };
  };

  // For Themes (scatter) – simple density proxy using bigrams index
  const toChartThemes = (text, count = 25) => {
    // Create reproducible pseudo points from bigrams
    const bigs = topBigrams(text, count, {minCount:1});
    const points = bigs.map(([bg,i], idx) => {
      // quick hash → 0..1
      let h = 0; for (let c of bg) h = (h*31 + c.charCodeAt(0)) >>> 0;
      const x = ((h & 0xffff) / 0xffff) * 10;
      const y = (((h>>>16) & 0xffff) / 0xffff) * 10;
      return { x: +x.toFixed(2), y: +y.toFixed(2) };
    });
    // pad if not enough
    while(points.length < count) points.push({x: Math.random()*10, y: Math.random()*10});
    return points.slice(0, count);
  };

  // For Sentiment (doughnut)
  const toChartSentiment = (text) => {
    const s = sentiment(text);
    const pos = s.pos, neg = s.neg, neu = Math.max(0, 100 - pos - neg);
    return { labels: ['Positive','Neutral','Negative'], values: [pos, neu, neg] };
  };

  // For Emotions (radar) – lightweight lexicon (very small demo)
  const EMO = {
    joy: new Set(['joy','happy','delight','smile','cheer','pleasure','glad']),
    sadness: new Set(['sad','sorrow','down','unhappy','cry','tears']),
    anger: new Set(['anger','angry','mad','furious','rage']),
    fear: new Set(['fear','afraid','scared','anxious','anxiety','worry']),
    surprise: new Set(['surprise','astonished','amazed','wow','unexpected']),
    disgust: new Set(['disgust','gross','nasty','revolting','sickening'])
  };
  const toChartEmotions = (text) => {
    const toks = tokens(text);
    const totals = Object.fromEntries(Object.keys(EMO).map(k => [k,0]));
    for (const t of toks){
      for (const k of Object.keys(EMO)){
        if (EMO[k].has(t)) totals[k]++;
      }
    }
    const max = Math.max(1, ...Object.values(totals));
    const labels = Object.keys(totals);
    const values = labels.map(k => +(totals[k] / max).toFixed(2)); // normalize 0..1
    return { labels, values };
  };

  // ---------- Export ----------
  return {
    // core text utilities
    tokens, wordCount, readTimeMin,
    // analytics
    topKeywords, topBigrams, sentiment, quickSummary,
    // chart adapters
    toChart: {
      keywords: toChartKeywords,
      themes: toChartThemes,
      sentiment: toChartSentiment,
      emotions: toChartEmotions
    }
  };
})();
