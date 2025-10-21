from typing import Dict, Any, List
import re
import numpy as np
from collections import Counter
from textblob import TextBlob
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.cluster import KMeans

# -------------------- Helpers --------------------
def clean_text(t: str) -> str:
    t = t.replace("\r\n", "\n")
    t = re.sub(r"[ \t]+", " ", t)
    return t.strip()

def split_paragraphs(text: str) -> List[str]:
    return [p.strip() for p in text.split("\n\n") if p.strip()] or [text]

# -------------------- 1. Keywords & Frequencies --------------------
def compute_keywords(docs: List[str], top_n: int = 50) -> Dict[str, Any]:
    vec = CountVectorizer(
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 2),
        max_features=5000,
        token_pattern=r"(?u)\b[a-zA-Z][a-zA-Z]+\b",
    )
    X = vec.fit_transform(docs)
    feats = vec.get_feature_names_out()
    counts = np.asarray(X.sum(axis=0)).ravel()
    order = np.argsort(-counts)[:top_n]
    return {
        "vocabulary": [{"term": feats[i], "freq": int(counts[i])} for i in order]
    }

# -------------------- 2. Themes & Clusters --------------------
def compute_themes(text: str, max_k: int = 4) -> Dict[str, Any]:
    chunks = split_paragraphs(text)
    vec = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=3500)
    X = vec.fit_transform(chunks)
    k = min(max(2, len(chunks)//2), max_k) if len(chunks) > 2 else 2
    km = KMeans(n_clusters=k, n_init=10, random_state=42).fit(X)
    terms = vec.get_feature_names_out()
    clusters = []
    for ci in range(k):
        center = km.cluster_centers_[ci]
        top = center.argsort()[-10:][::-1]
        clusters.append({
            "label": f"Theme {ci+1}",
            "size": int((km.labels_ == ci).sum()),
            "top_terms": [terms[j] for j in top],
        })
    return {"clusters": clusters}

# -------------------- 3. Sentiment Overview --------------------
def compute_sentiment(text: str) -> Dict[str, Any]:
    blob = TextBlob(text)
    pol, sub = blob.sentiment.polarity, blob.sentiment.subjectivity
    if pol > 0.1: mood = "Positive"
    elif pol < -0.1: mood = "Negative"
    else: mood = "Neutral"
    return {"overview": mood, "polarity": pol, "subjectivity": sub}

# -------------------- 4. Sensory & Emotional Patterns --------------------
SENSORY = {
    "visual": {"see","look","light","dark","bright","color","shadow","eyes","shine"},
    "auditory": {"hear","sound","whisper","ring","echo","noise","voice"},
    "tactile": {"touch","soft","hard","rough","smooth","warm","cold","texture"},
    "olfactory": {"smell","odor","fragrance","scent"},
    "gustatory": {"taste","sweet","bitter","sour","salty"},
}
EMOTION_WORDS = {"love","fear","joy","sad","anger","hope","grief","delight","proud"}

def compute_sensory(text: str) -> Dict[str, Any]:
    words = [w.lower().strip(".,!?;:") for w in text.split()]
    freq = Counter(words)
    sensory_counts = {k: int(sum(freq.get(w,0) for w in vocab)) for k,vocab in SENSORY.items()}
    emotions = int(sum(freq.get(w,0) for w in EMOTION_WORDS))
    return {"sensory": sensory_counts, "emotion_word_hits": emotions}

# -------------------- Main Analysis --------------------
def full_analysis(filename: str, raw_text: str) -> Dict[str, Any]:
    text = clean_text(raw_text)
    docs = [text]
    return {
        "meta": {"filename": filename, "word_count": len(text.split())},
        "original_text": text,
        "keywords": compute_keywords(docs),
        "themes": compute_themes(text),
        "sentiment": compute_sentiment(text),
        "sensory": compute_sensory(text),
    }
