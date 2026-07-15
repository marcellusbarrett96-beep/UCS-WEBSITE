import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Trash2, Anchor, TrendingUp, TrendingDown, Minus, X, Loader2, RefreshCw, Newspaper, Pencil, Check, Layers, Globe2, Boxes } from "lucide-react";

// ---------- Constants ----------

const STARTER_COINS = [
  { name: "XRP", ticker: "XRP" },
  { name: "XDC Network", ticker: "XDC" },
  { name: "Stellar", ticker: "XLM" },
  { name: "Hedera", ticker: "HBAR" },
  { name: "Flare", ticker: "FLR" },
];

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes — news only

const makeCoin = (name, ticker) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name,
  ticker: ticker.toUpperCase(),
});

// ---------- Storage helpers ----------
// This uses the visitor's browser (localStorage) to remember their coin list.
// Swap these three functions for real API calls to a database later if you
// want everyone to share the same data instead of each visitor having their own.

const COINS_KEY = "ucs:coins";
const NEWS_KEY = "ucs:news";
const PROFILES_KEY = "ucs:profiles";

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("UCS: failed to save", key, e);
  }
}

async function loadState() {
  return {
    coins: readLocal(COINS_KEY),
    news: readLocal(NEWS_KEY),
    profiles: readLocal(PROFILES_KEY),
  };
}
async function saveCoins(coins) { writeLocal(COINS_KEY, coins); }
async function saveNews(news) { writeLocal(NEWS_KEY, news); }
async function saveProfiles(profiles) { writeLocal(PROFILES_KEY, profiles); }

// ---------- Sentiment helpers ----------

function sentimentStyle(sentiment) {
  if (sentiment === "bullish") return { color: "#3F8F6E", Icon: TrendingUp, label: "Bullish" };
  if (sentiment === "bearish") return { color: "#B0483C", Icon: TrendingDown, label: "Bearish" };
  return { color: "#8B8578", Icon: Minus, label: "Neutral" };
}

function timeAgo(ts) {
  if (!ts) return "never";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

// ---------- Data source: shared server cache (Vercel KV) ----------
// The scheduled job (api/refresh-news.js) keeps the default coins current
// automatically, on a schedule, regardless of whether anyone has this page
// open. The browser's job is just to read that cache — cheap and fast.
// If a coin isn't cached yet (e.g. a custom one a visitor just added),
// refreshOne() fetches it live and caches it for next time.

async function getCached(ticker) {
  const res = await fetch(`/api/get-news?ticker=${encodeURIComponent(ticker)}`);
  if (!res.ok) return null;
  return await res.json();
}

async function refreshOne(coin, type) {
  const res = await fetch("/api/refresh-one", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: coin.name, ticker: coin.ticker, type }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `API error ${res.status}`);
  }
  return await res.json();
}

async function fetchCoinNews(coin) {
  const cached = await getCached(coin.ticker);
  if (cached?.news && Date.now() - cached.news.fetchedAt < REFRESH_MS) {
    return cached.news;
  }
  return await refreshOne(coin, "news");
}

async function fetchCoinProfile(coin) {
  const cached = await getCached(coin.ticker);
  if (cached?.profile) return cached.profile;
  return await refreshOne(coin, "profile");
}

// ---------- Editable explainer card ----------

function ExplainerCard({ icon: Icon, title, text, loading, onEditSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text || "");

  useEffect(() => { setDraft(text || ""); }, [text]);

  return (
    <div className="border border-[#252B33] rounded-lg p-4 bg-[#141A21] mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[#8B8578]">
          <Icon className="w-3.5 h-3.5 text-[#C9A227]" /> {title}
        </span>
        {!loading && (
          <button
            onClick={() => {
              if (editing) { onEditSave(draft); }
              setEditing((e) => !e);
            }}
            className="ucs-focus text-[#5A5548] hover:text-[#C9A227] transition-colors"
            aria-label={editing ? "Save" : "Edit"}
          >
            {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-[#5A5548] py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Researching…
        </div>
      ) : editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="ucs-focus w-full bg-[#0F1720] border border-[#3A3F47] rounded px-2.5 py-2 text-[13px] text-[#C9C2B0] leading-relaxed"
        />
      ) : (
        <p className="text-[13px] text-[#C9C2B0] leading-relaxed">
          {text || "No explanation yet."}
        </p>
      )}
    </div>
  );
}

// ---------- News panel ----------

function NewsPanel({ coin, entry, onRefresh }) {
  const status = entry?.status || "idle";
  const s = entry?.sentiment ? sentimentStyle(entry.sentiment) : null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#8B8578] flex items-center gap-1.5">
          <Newspaper className="w-3.5 h-3.5" /> Developments, Acquisitions &amp; Settlements
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#5A5548] font-mono">
            {status === "loading" ? "scanning…" : `scanned ${timeAgo(entry?.fetchedAt)}`}
          </span>
          <button onClick={onRefresh} disabled={status === "loading"} className="ucs-focus text-[#5A5548] hover:text-[#C9A227] transition-colors disabled:opacity-40" aria-label="Refresh news">
            <RefreshCw className={`w-3.5 h-3.5 ${status === "loading" ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {status === "loading" && !entry?.summary && (
        <div className="flex items-center gap-2 text-[13px] text-[#5A5548] py-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning the web for {coin.ticker}…
        </div>
      )}

      {status === "error" && (
        <div className="text-[13px] text-[#B0483C] py-2">
          Couldn't reach live market data. <button onClick={onRefresh} className="ucs-focus underline">Try again</button>.
        </div>
      )}

      {s && (
        <div className="mb-4 flex items-start gap-3 border border-[#252B33] rounded-lg px-3 py-3 bg-[#141A21]">
          <s.Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: s.color }} />
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wide" style={{ color: s.color }}>{s.label} sentiment</span>
            <span className="block text-[13px] text-[#C9C2B0] mt-0.5">{entry.summary}</span>
          </div>
        </div>
      )}

      {entry?.headlines?.length > 0 && (
        <ul className="space-y-2">
          {entry.headlines.map((h, i) => {
            const hs = sentimentStyle(h.tone);
            return (
              <li key={i} className="flex items-start gap-2.5 border-l-2 pl-3 py-1" style={{ borderColor: hs.color }}>
                <div className="min-w-0">
                  <span className="block text-[13px] text-[#EDE6D6]">{h.title}</span>
                  <span className="block text-[10px] text-[#5A5548] font-mono mt-0.5">{h.source}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {status === "ready" && entry?.headlines?.length === 0 && (
        <p className="text-[13px] text-[#5A5548] italic">No notable headlines surfaced in this scan.</p>
      )}
    </div>
  );
}

// ---------- Main App ----------

export default function App() {
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTicker, setNewTicker] = useState("");
  const [news, setNews] = useState({});
  const [profiles, setProfiles] = useState({});
  const coinsRef = useRef(coins);
  coinsRef.current = coins;

  useEffect(() => {
    (async () => {
      const { coins: c, news: n, profiles: p } = await loadState();
      const initialCoins = c && c.length ? c : STARTER_COINS.map((s) => makeCoin(s.name, s.ticker));
      setCoins(initialCoins);
      setNews(n || {});
      setProfiles(p || {});
      setSelectedId(initialCoins[0]?.id ?? null);
      setLoading(false);
      if (!c) await saveCoins(initialCoins);
    })();
  }, []);

  const persistCoins = useCallback((next) => { setCoins(next); saveCoins(next); }, []);
  const persistNews = useCallback((next) => { setNews(next); saveNews(next); }, []);
  const persistProfiles = useCallback((next) => { setProfiles(next); saveProfiles(next); }, []);

  const runNewsFetch = useCallback(async (coin) => {
    if (!coin) return;
    setNews((prev) => {
      const next = { ...prev, [coin.id]: { ...(prev[coin.id] || {}), status: "loading" } };
      persistNews(next);
      return next;
    });
    try {
      const result = await fetchCoinNews(coin);
      setNews((prev) => { const next = { ...prev, [coin.id]: result }; persistNews(next); return next; });
    } catch (e) {
      console.error("UCS: news fetch failed", e);
      setNews((prev) => { const next = { ...prev, [coin.id]: { ...(prev[coin.id] || {}), status: "error" } }; persistNews(next); return next; });
    }
  }, [persistNews]);

  const runProfileFetch = useCallback(async (coin) => {
    if (!coin) return;
    setProfiles((prev) => {
      const next = { ...prev, [coin.id]: { ...(prev[coin.id] || {}), status: "loading" } };
      persistProfiles(next);
      return next;
    });
    try {
      const result = await fetchCoinProfile(coin);
      setProfiles((prev) => { const next = { ...prev, [coin.id]: result }; persistProfiles(next); return next; });
    } catch (e) {
      console.error("UCS: profile fetch failed", e);
      setProfiles((prev) => { const next = { ...prev, [coin.id]: { ...(prev[coin.id] || {}), status: "error" } }; persistProfiles(next); return next; });
    }
  }, [persistProfiles]);

  const editProfileField = (coinId, field, value) => {
    const next = { ...profiles, [coinId]: { ...(profiles[coinId] || {}), [field]: value } };
    persistProfiles(next);
  };

  useEffect(() => {
    const coin = coins.find((c) => c.id === selectedId);
    if (!coin) return;
    const newsEntry = news[coin.id];
    const newsStale = !newsEntry?.fetchedAt || Date.now() - newsEntry.fetchedAt > REFRESH_MS;
    if (newsStale && newsEntry?.status !== "loading") runNewsFetch(coin);

    const profileEntry = profiles[coin.id];
    if (!profileEntry?.generatedAt && profileEntry?.status !== "loading") runProfileFetch(coin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, coins.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      const coin = coinsRef.current.find((c) => c.id === selectedId);
      if (coin) runNewsFetch(coin);
    }, REFRESH_MS);
    return () => clearInterval(interval);
  }, [selectedId, runNewsFetch]);

  const selected = coins.find((c) => c.id === selectedId) || null;

  const addCoin = () => {
    if (!newName.trim() || !newTicker.trim()) return;
    const coin = makeCoin(newName.trim(), newTicker.trim());
    const next = [...coins, coin];
    persistCoins(next);
    setSelectedId(coin.id);
    setNewName(""); setNewTicker(""); setShowAdd(false);
  };

  const removeCoin = (id) => {
    const next = coins.filter((c) => c.id !== id);
    persistCoins(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
    const nn = { ...news }; delete nn[id]; persistNews(nn);
    const np = { ...profiles }; delete np[id]; persistProfiles(np);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1720] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#C9A227] animate-spin" />
      </div>
    );
  }

  const profile = selected ? profiles[selected.id] : null;
  const profileLoading = profile?.status === "loading" && !profile?.generatedAt;

  return (
    <div className="min-h-screen bg-[#0F1720] text-[#EDE6D6]">
      <header className="border-b border-[#252B33] px-5 py-4 flex items-baseline justify-between">
        <div>
          <h1 className="ucs-display text-2xl tracking-tight">Utility Coin <span className="text-[#C9A227]">Scope</span></h1>
          <p className="text-[11px] text-[#8B8578] tracking-[0.15em] uppercase mt-0.5">UCS — learn the utility, track the market</p>
        </div>
        <Anchor className="w-5 h-5 text-[#3A3F47]" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] max-w-5xl mx-auto">
        <aside className="border-r border-[#252B33] md:min-h-[calc(100vh-73px)]">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[#252B33]">
            <span className="text-[11px] uppercase tracking-[0.15em] text-[#8B8578]">Coins</span>
            <button onClick={() => setShowAdd(true)} className="ucs-focus text-[#C9A227] hover:text-[#EDE6D6] transition-colors" aria-label="Add coin">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <ul>
            {coins.map((c) => {
              const entry = news[c.id];
              const s = entry?.sentiment ? sentimentStyle(entry.sentiment) : null;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className={`ucs-focus w-full text-left px-4 py-3 flex items-center gap-2 border-b border-[#1A1F26] hover:bg-[#161C24] transition-colors ${c.id === selectedId ? "bg-[#161C24]" : ""}`}
                  >
                    {s ? <s.Icon className="w-3.5 h-3.5 shrink-0" style={{ color: s.color }} /> : <span className="w-3.5" />}
                    <span>
                      <span className="block text-sm font-semibold">{c.ticker}</span>
                      <span className="block text-[11px] text-[#8B8578]">{c.name}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {showAdd && (
            <div className="p-4 border-b border-[#252B33] bg-[#141A21]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-[0.15em] text-[#8B8578]">New coin</span>
                <button onClick={() => setShowAdd(false)} className="ucs-focus text-[#8B8578] hover:text-[#EDE6D6]"><X className="w-3.5 h-3.5" /></button>
              </div>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="ucs-focus w-full bg-[#0F1720] border border-[#3A3F47] rounded px-2 py-1.5 text-sm mb-2 placeholder:text-[#5A5548]" />
              <input value={newTicker} onChange={(e) => setNewTicker(e.target.value)} placeholder="Ticker" className="ucs-focus w-full bg-[#0F1720] border border-[#3A3F47] rounded px-2 py-1.5 text-sm mb-3 placeholder:text-[#5A5548]" />
              <button onClick={addCoin} className="ucs-focus w-full bg-[#C9A227] text-[#0F1720] rounded py-1.5 text-sm font-semibold hover:bg-[#DCB639] transition-colors">Add coin</button>
            </div>
          )}
        </aside>

        <main className="px-6 py-6">
          {!selected ? (
            <div className="text-[#8B8578] text-sm">No coins yet. Add one from the list on the left.</div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="ucs-display text-3xl">{selected.name}</h2>
                  <span className="font-mono text-sm text-[#8B8578]">{selected.ticker}</span>
                </div>
                <button onClick={() => removeCoin(selected.id)} className="ucs-focus text-[#5A5548] hover:text-[#B0483C] transition-colors" aria-label="Remove coin">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <ExplainerCard
                icon={Layers}
                title="Utility & Use Case"
                text={profile?.utility}
                loading={profileLoading}
                onEditSave={(v) => editProfileField(selected.id, "utility", v)}
              />
              <ExplainerCard
                icon={Globe2}
                title="Market Integration"
                text={profile?.marketIntegration}
                loading={profileLoading}
                onEditSave={(v) => editProfileField(selected.id, "marketIntegration", v)}
              />
              <ExplainerCard
                icon={Boxes}
                title="Tokenized Real-World Assets"
                text={profile?.rwaCorrelation}
                loading={profileLoading}
                onEditSave={(v) => editProfileField(selected.id, "rwaCorrelation", v)}
              />

              {!profileLoading && (
                <button
                  onClick={() => runProfileFetch(selected)}
                  className="ucs-focus text-[10px] uppercase tracking-wider text-[#5A5548] hover:text-[#C9A227] transition-colors mb-6 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Re-research this coin
                </button>
              )}

              <div className="border-t border-[#252B33] pt-6">
                <NewsPanel coin={selected} entry={news[selected.id]} onRefresh={() => runNewsFetch(selected)} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
