export const Analysis = (() => {
  const STOP = new Set([
    'the','a','an','and','or','but','if','then','else','for','to','of','in','on','at','by','is','are','was','were','be','been','being','am','i','you','he','she','it','we','they',
    'me','him','her','us','them','my','your','his','her','its','our','their','this','that','these','those','as','with','from','about','into','over','after','before','so','than',
    'too','very','not','no','yes','do','does','did','doing','done','there','here','out','up','down','off','again','once','just','only','also','can','could','should','would','will',
    'shall','may','might','must'
  ]);

  const POS = new Set(['good','great','love','loved','loving','happy','joy','wonderful','excellent','amazing','positive','bright','success','strong','beautiful','calm','peace','hope','brave','kind','smile','grace','gift','win','wins','winning']);
  const NEG = new Set(['bad','worse','worst','hate','hated','angry','anger','sad','awful','terrible','poor','negative','dark','failure','weak','ugly','fear','pain','worry','loss','lose','losing','cry','cried','tired','broken']);

  const tokens = (t) => (t.match(/\b[\p{L}\p{N}’'-]+\b/gu) || [])
    .map(w => w.toLowerCase())
    .map(x => x.replace(/^[’'-]+|[’'-]+$/g, ''))
    .filter(x => x && !STOP.has(x));

  const topKeywords = (text, n = 5) => {
    const c = new Map();
    for (const t of tokens(text)) c.set(t, (c.get(t) || 0) + 1);
    return [...c].sort((a, b) => b[1] - a[1]).slice(0, n);
  };

  const sentiment = (text) => {
    const toks = tokens(text);
    let pos = 0, neg = 0;
    for (const t of toks) {
      if (POS.has(t)) pos++;
      else if (NEG.has(t)) neg++;
    }
    const total = Math.max(1, pos + neg + Math.round(toks.length / 60));
    return { pos: Math.round((pos / total) * 100), neg: Math.round((neg / total) * 100) };
  };

  const quickSummary = (text) => {
    if (!text || !text.trim()) return '';
    const kws = topKeywords(text, 5).map(k => k[0]);
    const s = sentiment(text);
    let out = '';
    if (kws.length) out += `Top themes: ${kws.join(', ')}. `;
    out += `Sentiment ~ ${s.pos}% positive / ${s.neg}% negative.`;
    return out;
  };

  return { tokens, topKeywords, sentiment, quickSummary };
})();
