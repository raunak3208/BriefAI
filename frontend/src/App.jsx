import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE_URL = "";

const MAROON = "#7C2D12";
const MAROON_LIGHT = "#9A3412";
const MAROON_PALE = "#FEF2EE";
const MAROON_MID = "#C4512A";
const TEAL = "#0D9488";
const TEAL_PALE = "#F0FDFA";
const OFF_WHITE = "#F7F6F3";
const CHARCOAL = "#1E1E1E";
const GRAY_MUTED = "#6B6B6B";
const BORDER = "#E8E6E1";

const TRENDING = [
  "AI & LLMs", "Israel-Iran ceasefire", "Apple WWDC 2026", "Nvidia earnings",
  "India elections", "SpaceX Starship", "Fed interest rates", "Champions League"
];

const CATEGORIES = [
  { id: "global", label: "Global", icon: "🌍" },
  { id: "politics", label: "Politics", icon: "🏛️" },
  { id: "finance", label: "Finance", icon: "📈" },
  { id: "tech", label: "AI & Tech", icon: "🤖" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "science", label: "Science", icon: "🔬" },
  { id: "startups", label: "Startups", icon: "🚀" },
  { id: "entertainment", label: "Entertainment", icon: "🎬" },
];

const MOCK_FEED = [
  { cat: "tech", title: "OpenAI launches GPT-5 with real-time reasoning", time: "2m ago", trend: "+847", sentiment: "positive" },
  { cat: "finance", title: "S&P 500 hits new ATH as Fed signals pause", time: "8m ago", trend: "+312", sentiment: "positive" },
  { cat: "global", title: "G7 summit concludes with AI governance framework", time: "15m ago", trend: "+201", sentiment: "neutral" },
  { cat: "startups", title: "Perplexity raises $500M at $8B valuation", time: "22m ago", trend: "+589", sentiment: "positive" },
  { cat: "politics", title: "EU Parliament votes on digital sovereignty bill", time: "34m ago", trend: "+156", sentiment: "neutral" },
  { cat: "science", title: "CERN discovers new subatomic particle class", time: "1h ago", trend: "+422", sentiment: "positive" },
  { cat: "sports", title: "Real Madrid signs €200M transfer deal", time: "1h ago", trend: "+731", sentiment: "positive" },
  { cat: "entertainment", title: "Dune: Messiah breaks global box office records", time: "2h ago", trend: "+295", sentiment: "positive" },
];

const FEATURES = [
  { icon: "⚡", title: "Real-time summaries", desc: "AI synthesizes breaking news the moment it happens, giving you clarity before the noise settles." },
  { icon: "🎙️", title: "Voice-to-summary", desc: "Speak your query naturally. Our speech recognition understands context and intent, not just keywords." },
  { icon: "🌐", title: "Multi-language", desc: "Read summaries in 40+ languages. We translate and adapt tone for cultural nuance, not just words." },
  { icon: "🧠", title: "Personalized feed", desc: "Your AI news assistant learns from what matters to you, surfacing relevant stories without the noise." },
  { icon: "🔖", title: "Save & organize", desc: "Bookmark summaries, build topic folders, and export your research as clean shareable documents." },
  { icon: "📊", title: "Sentiment analysis", desc: "Understand the emotional tone of any story — bullish, bearish, alarming, or optimistic at a glance." },
];

const sentimentColor = (s) => s === "positive" ? TEAL : s === "negative" ? MAROON : "#8C8C82";
const sentimentBg = (s) => s === "positive" ? TEAL_PALE : s === "negative" ? MAROON_PALE : "#F5F5F3";

function PulsingDot({ color = TEAL }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: color,
        animation: "pulse 2s ease-in-out infinite", display: "inline-block"
      }} />
    </span>
  );
}

function TrendBadge({ value }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: TEAL,
      background: TEAL_PALE, padding: "2px 7px", borderRadius: 20,
      letterSpacing: "0.02em"
    }}>▲ {value}</span>
  );
}

function SentimentPill({ sentiment }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
      textTransform: "uppercase", padding: "3px 9px", borderRadius: 20,
      color: sentimentColor(sentiment), background: sentimentBg(sentiment)
    }}>{sentiment}</span>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "28px 28px 24px", marginBottom: 20 }}>
      {[80, 95, 70, 85, 60].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 20 : 14, width: `${w}%`, borderRadius: 6,
          background: "linear-gradient(90deg, #F0EEE9 25%, #E8E5DF 50%, #F0EEE9 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
          marginBottom: i === 0 ? 18 : 10
        }} />
      ))}
    </div>
  );
}

function TypewriterText({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  useEffect(() => {
    idx.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(interval);
        onDone?.();
      }
    }, 12);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayed}<span style={{ opacity: displayed.length < text.length ? 1 : 0, transition: "opacity 0.3s" }}>▌</span></span>;
}

function SummaryCard({ result, onSave, saved }) {
  const [expanded, setExpanded] = useState(false);
  const [titleDone, setTitleDone] = useState(false);
  const [bodyDone, setBodyDone] = useState(false);

  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
      overflow: "hidden", marginBottom: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)"
    }}>
      <div style={{ borderLeft: `3px solid ${MAROON}`, padding: "28px 28px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, lineHeight: 1.35, color: CHARCOAL, fontFamily: "'DM Serif Display', Georgia, serif" }}>
            <TypewriterText text={result.headline} onDone={() => setTitleDone(true)} />
          </h2>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={onSave} style={{
              width: 34, height: 34, borderRadius: "50%", border: `1px solid ${BORDER}`,
              background: saved ? MAROON_PALE : "#fff", cursor: "pointer", fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>{saved ? "🔖" : "○"}</button>
            <button style={{
              width: 34, height: 34, borderRadius: "50%", border: `1px solid ${BORDER}`,
              background: "#fff", cursor: "pointer", fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>↗</button>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          <SentimentPill sentiment={result.sentiment} />
          {result.categories?.map(c => (
            <span key={c} style={{
              fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
              padding: "3px 9px", borderRadius: 20, background: "#F5F4F0", color: GRAY_MUTED
            }}>{c}</span>
          ))}
          <span style={{ fontSize: 11, color: "#B0ADA6", marginLeft: "auto", alignSelf: "center" }}>
            ~{result.readTime} read
          </span>
        </div>
      </div>

      <div style={{ padding: "0 28px 24px" }}>
        {titleDone && (
          <p style={{ margin: "0 0 20px", fontSize: 15.5, lineHeight: 1.75, color: "#3A3A3A", fontFamily: "inherit" }}>
            <TypewriterText text={result.summary} onDone={() => setBodyDone(true)} />
          </p>
        )}

        {bodyDone && result.bullets && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: MAROON }}>Key Insights</p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {result.bullets.map((b, i) => (
                <li key={i} style={{ display: "flex", gap: 10, marginBottom: 9, fontSize: 14.5, lineHeight: 1.6, color: "#3A3A3A" }}>
                  <span style={{ color: MAROON, flexShrink: 0, fontWeight: 700, marginTop: 1 }}>→</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {bodyDone && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13.5, fontWeight: 600, color: MAROON_MID,
                padding: 0, display: "flex", alignItems: "center", gap: 5,
                marginBottom: expanded ? 16 : 0
              }}
            >
              {expanded ? "▲ Collapse" : "▼ Deep Dive Analysis"}
            </button>

            {expanded && result.deepDive && (
              <div style={{
                background: MAROON_PALE, borderRadius: 10, padding: "16px 18px",
                border: `1px solid rgba(124,45,18,0.1)`
              }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#3A1A0A" }}>{result.deepDive}</p>
              </div>
            )}

            {result.sources && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}`, display: "flex", gap: 16, flexWrap: "wrap" }}>
                {result.sources.map((s, i) => (
                  <span key={i} style={{ fontSize: 12, color: GRAY_MUTED, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: BORDER, display: "inline-block" }} />
                    {s}
                  </span>
                ))}
                <span style={{ fontSize: 12, color: "#B0ADA6", marginLeft: "auto" }}>{result.timestamp}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LiveFeedRow({ item }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "11px 0",
      borderBottom: `1px solid ${BORDER}`, cursor: "pointer",
      transition: "background 0.15s"
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{CATEGORIES.find(c => c.id === item.cat)?.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: CHARCOAL, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</p>
        <p style={{ margin: "2px 0 0", fontSize: 11.5, color: GRAY_MUTED }}>{item.time}</p>
      </div>
      <TrendBadge value={item.trend} />
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [activeNav, setActiveNav] = useState("explore");
  const [activeCat, setActiveCat] = useState("global");
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [liveIdx, setLiveIdx] = useState(0);
  const [error, setError] = useState(null);
  const lastQueryRef = useRef("");

  useEffect(() => {
    const t = setInterval(() => setLiveIdx(i => (i + 1) % MOCK_FEED.length), 4000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = useCallback(async (q) => {
    const question = q || query;
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setSaved(false);
    lastQueryRef.current = question;
    setHistory(h => [question, ...h.filter(x => x !== question).slice(0, 4)]);
    if (resultsRef.current) resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const response = await fetch(`${API_BASE_URL}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${response.status})`);
      }

      const data = await response.json();

      if (!data || !data.headline || !data.summary) {
        throw new Error("The AI returned an empty response. Try rephrasing your query.");
      }

      setResult(data);
    } catch (err) {
      console.error("Summarize error:", err);
      if (err instanceof TypeError) {
        setError({ message: "Unable to reach the server. Make sure the backend is running on port 8000.", canRetry: true });
      } else {
        setError({ message: err.message, canRetry: true });
      }
    }
    setLoading(false);
  }, [query]);

  const handleRetry = useCallback(() => {
    if (lastQueryRef.current) {
      handleSubmit(lastQueryRef.current);
    }
  }, [handleSubmit]);

  const handleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setQuery(transcript);
      handleSubmit(transcript);
    };
    recognition.start();
  };

  const filteredFeed = activeCat === "global" ? MOCK_FEED : MOCK_FEED.filter(i => i.cat === activeCat);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: OFF_WHITE, minHeight: "100vh", color: CHARCOAL }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.35} }
        @keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes ticker { 0%{transform:translateY(0);opacity:1}40%{transform:translateY(-8px);opacity:0}41%{transform:translateY(8px);opacity:0}100%{transform:translateY(0);opacity:1} }
        .nav-item { text-decoration:none;font-size:13.5px;font-weight:500;color:${GRAY_MUTED};padding:6px 0;position:relative;letter-spacing:0.01em;transition:color 0.15s;cursor:pointer; }
        .nav-item:hover { color:${CHARCOAL}; }
        .nav-item.active { color:${CHARCOAL}; }
        .nav-item.active::after { content:"";position:absolute;bottom:-2px;left:0;right:0;height:1.5px;background:${MAROON};border-radius:2px; }
        .chip { padding:7px 14px;border-radius:100px;border:1px solid ${BORDER};background:#fff;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:all 0.15s;color:${GRAY_MUTED}; }
        .chip:hover { border-color:${MAROON_MID};color:${MAROON};background:${MAROON_PALE}; }
        .cat-btn { padding:7px 14px;border-radius:8px;border:none;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:5px; }
        .feature-card { background:#fff;border:1px solid ${BORDER};border-radius:14px;padding:24px;transition:transform 0.2s,box-shadow 0.2s; }
        .feature-card:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.06); }
        .main-input { width:100%;border:1.5px solid ${BORDER};border-radius:14px;padding:18px 56px 18px 20px;font-size:16px;font-family:inherit;background:#fff;color:${CHARCOAL};outline:none;transition:border-color 0.2s,box-shadow 0.2s;resize:none;height:60px;line-height:1.3; }
        .main-input:focus { border-color:${MAROON};box-shadow:0 0 0 3px rgba(124,45,18,0.08); }
        .summarize-btn { width:100%;padding:16px;border-radius:12px;border:none;background:${MAROON};color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:background 0.15s,transform 0.1s;letter-spacing:0.01em;font-family:inherit; }
        .summarize-btn:hover { background:${MAROON_LIGHT}; }
        .summarize-btn:active { transform:scale(0.99); }
        .summarize-btn:disabled { opacity:0.6;cursor:not-allowed; }
        @media(max-width:768px){
          .grid-3{grid-template-columns:1fr!important;}
          .grid-2{grid-template-columns:1fr!important;}
          .hide-mobile{display:none!important;}
          .hero-title{font-size:36px!important;}
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(247,246,243,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BORDER}`, padding: "0 24px"
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: MAROON,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontSize: 14, color: "#fff" }}>⬡</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: CHARCOAL }}>Brief<span style={{ color: MAROON }}>AI</span></span>
          </div>

          <div className="hide-mobile" style={{ display: "flex", gap: 24, flex: 1 }}>
            {["Explore", "Trending", "Categories", "Saved", "AI Feed"].map(n => (
              <span key={n} className={`nav-item${activeNav === n.toLowerCase().replace(" ", "") ? " active" : ""}`}
                onClick={() => setActiveNav(n.toLowerCase().replace(" ", ""))}>{n}</span>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: GRAY_MUTED }}>
              <PulsingDot color={TEAL} />
              <span className="hide-mobile">Live</span>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: MAROON, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#fff", fontWeight: 700, cursor: "pointer"
            }}>A</div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "72px 24px 56px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: MAROON_PALE, border: `1px solid rgba(124,45,18,0.15)`, borderRadius: 100, padding: "5px 14px", marginBottom: 28 }}>
          <PulsingDot color={MAROON} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: MAROON, letterSpacing: "0.04em", textTransform: "uppercase" }}>AI-Powered · Real-Time · 2026</span>
        </div>

        <h1 className="hero-title" style={{
          fontSize: 58, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.035em",
          color: CHARCOAL, margin: "0 0 18px", fontFamily: "'DM Serif Display', Georgia, serif"
        }}>
          Understand the World<br /><em style={{ fontStyle: "italic", color: MAROON }}>in Seconds.</em>
        </h1>

        <p style={{ fontSize: 18, color: GRAY_MUTED, margin: "0 0 40px", lineHeight: 1.6, fontWeight: 300 }}>
          Ask anything. BriefAI synthesizes global news into sharp, intelligent summaries — instantly.
        </p>

        {/* Live ticker */}
        <div style={{
          background: CHARCOAL, borderRadius: 10, padding: "10px 16px", marginBottom: 28,
          display: "flex", alignItems: "center", gap: 12, textAlign: "left"
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: MAROON_MID, flexShrink: 0 }}>Live</span>
          <span style={{
            fontSize: 13.5, color: "#E8E6E1", animation: "ticker 4s ease-in-out infinite",
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis"
          }}>{MOCK_FEED[liveIdx].icon} {MOCK_FEED[liveIdx].title}</span>
        </div>

        {/* Input area */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            ref={inputRef}
            className="main-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmit()}
            placeholder='Ask anything — "What happened in AI this week?"'
          />
          <button
            onClick={handleVoice}
            style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              background: listening ? MAROON_PALE : "none", border: "none", cursor: "pointer",
              fontSize: 20, padding: 4, borderRadius: 8, transition: "background 0.15s"
            }}
          >🎙️</button>
        </div>

        <button className="summarize-btn" onClick={() => handleSubmit()} disabled={loading || !query.trim()}>
          {loading ? "Analyzing..." : "Summarize →"}
        </button>

        {history.length > 0 && (
          <div style={{ marginTop: 14, textAlign: "left" }}>
            <p style={{ fontSize: 12, color: GRAY_MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Recent</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {history.map((h, i) => (
                <span key={i} className="chip" onClick={() => { setQuery(h); handleSubmit(h); }} style={{ fontSize: 12 }}>
                  ↺ {h.slice(0, 40)}{h.length > 40 ? "…" : ""}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Trending chips */}
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 12, color: GRAY_MUTED, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, textAlign: "left" }}>Trending now</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TRENDING.map(t => (
              <span key={t} className="chip" onClick={() => { setQuery(t); handleSubmit(t); }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <div ref={resultsRef} style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 40px" }}>
        {loading && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "12px 16px", background: MAROON_PALE, borderRadius: 10, border: `1px solid rgba(124,45,18,0.1)` }}>
              <span style={{ animation: "pulse 1s ease-in-out infinite", fontSize: 16 }}>⬡</span>
              <span style={{ fontSize: 14, color: MAROON, fontWeight: 500 }}>BriefAI is analyzing your query…</span>
            </div>
            <SkeletonCard />
          </div>
        )}

        {result && !loading && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <SummaryCard result={result} onSave={() => setSaved(s => !s)} saved={saved} />
          </div>
        )}

        {error && !loading && (
          <div style={{
            animation: "fadeUp 0.3s ease",
            background: "#fff", border: `1px solid rgba(124,45,18,0.2)`, borderRadius: 16,
            padding: "28px", textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: MAROON, marginBottom: 8 }}>
              Something went wrong
            </p>
            <p style={{ fontSize: 14, color: GRAY_MUTED, marginBottom: 20, lineHeight: 1.6 }}>
              {error.message}
            </p>
            {error.canRetry && (
              <button
                onClick={handleRetry}
                style={{
                  padding: "10px 24px", borderRadius: 10, border: `1px solid ${MAROON}`,
                  background: MAROON_PALE, color: MAROON, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit"
                }}
              >
                ↻ Try Again
              </button>
            )}
          </div>
        )}

        {!result && !loading && !error && (
          <div style={{ textAlign: "center", padding: "40px 0", color: GRAY_MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>◎</div>
            <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Your summary will appear here</p>
            <p style={{ fontSize: 13.5, opacity: 0.7 }}>Ask about any topic — news, finance, science, sports, or geopolitics</p>
          </div>
        )}
      </div>

      {/* Trending Dashboard */}
      <section style={{ background: "#fff", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: "48px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "'DM Serif Display', Georgia, serif" }}>Trending Now</h2>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: GRAY_MUTED }}>Live feed · Updates every 60 seconds</p>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CATEGORIES.map(c => (
                <button key={c.id} className="cat-btn" onClick={() => setActiveCat(c.id)}
                  style={{
                    background: activeCat === c.id ? MAROON : OFF_WHITE,
                    color: activeCat === c.id ? "#fff" : GRAY_MUTED,
                    border: `1px solid ${activeCat === c.id ? MAROON : BORDER}`
                  }}>
                  <span>{c.icon}</span> {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div>
              {(filteredFeed.length > 0 ? filteredFeed : MOCK_FEED).slice(0, 4).map((item, i) => (
                <div key={i} onClick={() => { setQuery(item.title); handleSubmit(item.title); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  <LiveFeedRow item={item} />
                </div>
              ))}
            </div>
            <div style={{ background: OFF_WHITE, borderRadius: 14, padding: 20 }}>
              <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GRAY_MUTED }}>Trending Score</p>
              {MOCK_FEED.slice(0, 5).map((item, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, color: CHARCOAL, fontWeight: 500 }}>{CATEGORIES.find(c => c.id === item.cat)?.icon} {item.cat.charAt(0).toUpperCase() + item.cat.slice(1)}</span>
                    <span style={{ fontSize: 12, color: GRAY_MUTED }}>{item.trend}</span>
                  </div>
                  <div style={{ height: 4, background: BORDER, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4,
                      width: `${(parseInt(item.trend.replace("+", "")) / 900 * 100)}%`,
                      background: i === 0 ? MAROON : i === 1 ? TEAL : MAROON_MID
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 12px", fontFamily: "'DM Serif Display', Georgia, serif" }}>
            Intelligence, <em style={{ fontStyle: "italic", color: MAROON }}>by design.</em>
          </h2>
          <p style={{ fontSize: 16, color: GRAY_MUTED, maxWidth: 480, margin: "0 auto" }}>
            Every feature built to help you stay informed without the overwhelm.
          </p>
        </div>

        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ fontSize: 26, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: CHARCOAL }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: GRAY_MUTED, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ background: CHARCOAL, padding: "56px 24px", textAlign: "center" }}>
        <h2 style={{
          fontSize: 32, fontWeight: 700, color: "#fff", margin: "0 0 12px",
          letterSpacing: "-0.025em", fontFamily: "'DM Serif Display', Georgia, serif"
        }}>Your daily briefing,<em style={{ fontStyle: "italic", color: MAROON_MID }}> in seconds.</em></h2>
        <p style={{ fontSize: 16, color: "#9C9A96", marginBottom: 28, maxWidth: 440, margin: "0 auto 28px" }}>
          Join 120,000+ professionals who start their day with BriefAI.
        </p>
        <button
          onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); inputRef.current?.focus(); }}
          style={{
            padding: "14px 32px", background: MAROON, color: "#fff", border: "none",
            borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
            transition: "background 0.15s", fontFamily: "inherit"
          }}>
          Start summarizing →
        </button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "28px 24px", background: OFF_WHITE }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: MAROON, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, color: "#fff" }}>⬡</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: CHARCOAL }}>Brief<span style={{ color: MAROON }}>AI</span></span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#B0ADA6" }}>© 2026 BriefAI · Powered by Mistral AI + Tavily</p>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy", "Terms", "API", "Contact"].map(l => (
              <span key={l} style={{ fontSize: 13, color: GRAY_MUTED, cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
