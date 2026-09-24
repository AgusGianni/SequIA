import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  Zap, Droplet, Droplets, Sparkles, ChevronDown, HelpCircle, BookOpen,
  Calculator, ListChecks, Link2, RotateCcw, Info, ExternalLink, Award, Sliders,
  Factory, Server, Waves, Gamepad2, Wind, Snowflake, Wallet, TrendingUp,
  TrendingDown, AlertTriangle, Users, MessageSquare, ArrowUp,
  Leaf, CheckCircle2, XCircle, Brain, Compass, Thermometer, Plus, Smartphone, Share2, SquarePlus, X
} from "lucide-react";

const STORAGE_KEY = "huellaia:v1";
const COMMUNITY_SOURCES_KEY = "huellaia:community-sources:v1";

// --- Datos base, con fuente ---
// Google, "Measuring the environmental impact of delivering AI at Google Scale" (2025)
const GOOGLE_ELECTRICITY_WH = 0.24;   // Wh por prompt de texto mediano en Gemini Apps
const GOOGLE_DIRECT_WATER_ML = 0.26;  // mL de agua directa (in situ) por el mismo prompt

// Estimación citada por Acero y Roca (2026) para mega centros de datos de IA como Stargate
// Argentina: 7,1 m³ de agua por cada MWh generado (agua directa + indirecta combinadas).
// Acá se usa como aproximación de la parte indirecta, sumada aparte al agua directa por consulta.
const GRID_WATER_INTENSITY_L_PER_KWH = 7.1; // agua indirecta por kWh, estimación aplicada a mega centros de datos como los que se evalúan en Argentina

const PHONE_CHARGE_KWH = 0.015;  // carga típica de batería de celular (~15 Wh)
const GLASS_OF_WATER_ML = 250;

const emptyState = {
  calc: { mode: "texto", units: 20 },
  quizLastScore: null,
};

const numFmt = (n, d = 2) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: d }).format(n);

function formatWater(ml) {
  if (ml < 1000) return `${numFmt(ml, ml < 10 ? 2 : 1)} mL`;
  return `${numFmt(ml / 1000, 1)} L`;
}
function formatEnergy(wh) {
  if (wh < 1000) return `${numFmt(wh, wh < 10 ? 2 : 1)} Wh`;
  return `${numFmt(wh / 1000, 2)} kWh`;
}

// Anima un número hacia su nuevo valor cada vez que cambia (conteo animado
// tipo "juice" de videojuego, en vez de saltar directo al valor final).
function useAnimatedNumber(target, duration = 550) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  useEffect(() => {
    const start = prevRef.current;
    const delta = target - start;
    if (delta === 0) return;
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + delta * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

export default function App() {
  const [data, setData] = useState(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("inicio");
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") document.title = "Sed de Datos — El costo oculto de la IA";
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setData({
            calc: { ...emptyState.calc, ...(parsed.calc || {}) },
            quizLastScore: typeof parsed.quizLastScore === "number" ? parsed.quizLastScore : null,
          });
        }
      } catch (e) {
        // sin datos previos, arrancamos con los valores por defecto
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const updateData = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      window.storage.set(STORAGE_KEY, JSON.stringify(next), false).catch(() => {});
      return next;
    });
  }, []);

  const setCalc = (patch) => updateData(prev => ({ ...prev, calc: { ...prev.calc, ...patch } }));
  const setQuizLastScore = (score) => updateData(prev => ({ ...prev, quizLastScore: score }));

  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!loaded) {
    return (
      <div style={splashStyles.wrap}>
        <GlobalStyle />
        <div className="hi-splash-logo" style={splashStyles.badge}>
          <BrandMark size={38} />
        </div>
        <h1 className="hi-splash-title" style={splashStyles.title}>Sed de Datos</h1>
        <p className="hi-splash-tag" style={splashStyles.tag}>El costo oculto de cada consulta</p>
        <div style={{ display: "flex", gap: 6, marginTop: 26 }}>
          <span className="hi-dot" style={{ ...splashStyles.dot, animationDelay: "0s" }} />
          <span className="hi-dot" style={{ ...splashStyles.dot, animationDelay: ".15s" }} />
          <span className="hi-dot" style={{ ...splashStyles.dot, animationDelay: ".3s" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <GlobalStyle />
      <div style={styles.shell}>
        <Header onInstallClick={() => setShowInstallGuide(true)} />
        <Nav tab={tab} setTab={setTab} />

        {tab === "inicio" && <Inicio setTab={setTab} />}
        {tab === "calculadora" && <CalculadoraTab calc={data.calc} setCalc={setCalc} setTab={setTab} />}
        {tab === "laboratorio" && <LaboratorioTab setTab={setTab} />}
        {tab === "aprender" && <Aprender setTab={setTab} />}
        {tab === "quiz" && <QuizTab lastScore={data.quizLastScore} setLastScore={setQuizLastScore} setTab={setTab} />}
        {tab === "juego" && <Juego />}
        {tab === "faq" && <FaqTab setTab={setTab} />}
        {tab === "fuentes" && <Fuentes setTab={setTab} />}
      </div>
      {showInstallGuide && <InstallGuideModal onClose={() => setShowInstallGuide(false)} />}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Volver arriba"
          style={{
            position: "fixed", bottom: 20, right: 20, width: 44, height: 44, borderRadius: "50%",
            background: "var(--acc-blue)", border: "none", color: "var(--on-accent)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 18px rgba(20,24,31,0.18)", zIndex: 50
          }}
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
      :root {
        --bg: #F7F4EE;
        --paper: #FFFFFF;
        --paper-soft: #FBF8F2;
        --ink: #14181F;
        --ink-soft: #5B6472;
        --line: #E4DFD3;
        --on-accent: #FFFFFF;
        --dark-panel: #06264A;
        --acc-red: #C0504D;
        --acc-red-bg: #FBEAEA;
        --acc-green: #2F8F5B;
        --acc-green-bg: #E7F5EC;
        --acc-mustard: #B8792C;
        --acc-mustard-bg: #FBF0E0;
        --acc-blue: #2952E3;
        --acc-blue-bg: #E7EDFC;
        --acc-purple: #6C4FC9;
        --acc-purple-bg: #EDE9FA;
        --acc-teal: #1C8C82;
        --acc-teal-bg: #E3F5F2;
        --acc-rose: #B4497A;
        --acc-rose-bg: #FBEAF2;
        --acc-graphite: #5B6472;
        --acc-graphite-bg: #ECEEF1;
        --acc-indigo: #4A4FB0;
        --acc-indigo-bg: #E9EAF8;
        --acc-copper: #A85A2A;
        --acc-copper-bg: #F7E9DD;
        --acc-orange: #FF6A00;
        --acc-orange-bg: #FFE9DA;
        --logo-cyan: #4FD6FF;
        --font-display: 'Inter', sans-serif;
        --font-body: 'Inter', sans-serif;
        --font-mono: 'IBM Plex Mono', monospace;
      }
      * { box-sizing: border-box; }
      @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(41,82,227,0.45); }
        50% { box-shadow: 0 0 0 8px rgba(41,82,227,0); }
      }
      .hi-glow { animation: glowPulse 2.2s ease-in-out infinite; }
      @keyframes riseIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-4px); opacity: 1; } }
      @keyframes splashLogo { 0% { opacity: 0; transform: scale(0.7); } 60% { opacity: 1; transform: scale(1.06); } 100% { opacity: 1; transform: scale(1); } }
      @keyframes splashFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fillBar { from { width: 0; } }
      @keyframes daySlide { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
      .hi-day-enter { animation: daySlide .3s ease-out both; }
      .hi-card { animation: riseIn .35s ease-out both; }
      .hi-spin { animation: spin 0.8s linear infinite; }
      .hi-dot { animation: bounce 1.2s ease-in-out infinite; }
      .hi-splash-logo { animation: splashLogo .5s cubic-bezier(.2,.8,.3,1.2) both; }
      .hi-splash-title { animation: splashFade .4s ease-out .15s both; }
      .hi-splash-tag { animation: splashFade .4s ease-out .25s both; }
      .hi-row:hover { background: var(--paper-soft); }
      .hi-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
      .hi-btn:active { transform: translateY(0); }
      .hi-bar { animation: fillBar .5s ease-out both; }
      input[type=range] { accent-color: var(--acc-blue); }
      .hi-btn:focus-visible, input:focus-visible, a:focus-visible {
        outline: 2px solid var(--acc-blue); outline-offset: 2px; border-radius: 4px;
      }
      @keyframes heroPulse {
        0%, 100% { filter: drop-shadow(0 0 4px rgba(41,82,227,0.35)); }
        50% { filter: drop-shadow(0 0 14px rgba(41,82,227,0.65)); }
      }
      .hi-hero-pulse { animation: heroPulse 2.8s ease-in-out infinite; }
      .hi-lift { transition: transform .18s ease, box-shadow .18s ease; }
      .hi-lift:hover { transform: translateY(-3px) scale(1.015); box-shadow: 0 10px 24px rgba(20,24,31,0.14); }
      @keyframes logoPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(41,82,227,0.35); }
        50% { box-shadow: 0 0 0 7px rgba(41,82,227,0); }
      }
      .hi-logo-pulse { animation: logoPulse 2.6s ease-in-out infinite; }
      .hi-range { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 4px; cursor: pointer; }
      .hi-range::-webkit-slider-runnable-track { height: 6px; border-radius: 4px; background: transparent; }
      .hi-range::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%;
        background: var(--paper); border: 3px solid var(--thumb-color, var(--acc-blue)); margin-top: -5px;
        box-shadow: 0 1px 3px rgba(20,24,31,0.3);
      }
      .hi-range::-moz-range-track { height: 6px; border-radius: 4px; background: var(--paper-soft); }
      .hi-range::-moz-range-progress { height: 6px; border-radius: 4px; background: var(--thumb-color, var(--acc-blue)); }
      .hi-range::-moz-range-thumb {
        width: 16px; height: 16px; border-radius: 50%; background: var(--paper); border: 3px solid var(--thumb-color, var(--acc-blue));
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
          scroll-behavior: auto !important;
        }
      }
    `}</style>
  );
}

const styles = {
  app: {
    minHeight: "100%", padding: "24px 12px", fontFamily: "var(--font-body)", color: "var(--ink)",
    backgroundColor: "var(--bg)",
    backgroundImage: "radial-gradient(rgba(41,82,227,0.16) 1.3px, transparent 1.3px)",
    backgroundSize: "22px 22px",
  },
  shell: { maxWidth: 720, margin: "0 auto" },
};

const splashStyles = {
  wrap: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "var(--font-body)", padding: 24, textAlign: "center" },
  badge: { width: 78, height: 78, borderRadius: 20, background: "var(--paper)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(41,82,227,0.12)" },
  title: { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", margin: "18px 0 0", letterSpacing: "-0.01em" },
  tag: { fontSize: 12.5, color: "var(--ink-soft)", margin: "6px 0 0", letterSpacing: "0.02em" },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "var(--acc-blue)", display: "inline-block" },
};

// Marca de la app: el mismo logo de 3 puntos conectados que usa el sitio web
// "Sed de Datos", para que ambos productos compartan identidad visual.
function BrandMark({ size = 30, dark = false }) {
  const color = dark ? "var(--logo-cyan)" : "var(--acc-blue)";
  return (
    <svg className="hi-logo-pulse" width={size} height={size} viewBox="0 0 30 30" fill="none" style={{ flexShrink: 0, borderRadius: "50%" }}>
      <circle cx="8" cy="8" r="6" fill={color} />
      <circle cx="8" cy="22" r="4" fill={color} />
      <circle cx="22" cy="15" r="3" fill={color} />
      <path d="M8 8L8 22M8 8L22 15" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// Instructivo para "instalar" la web app en la pantalla de inicio de un
// iPhone (Safari no tiene instalación automática como Android/Chrome, así
// que hay que guiar el paso manual: Compartir → Agregar a inicio).
function InstallGuideModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(20,24,31,0.55)", zIndex: 100,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="hi-card"
        style={{
          background: "var(--paper)", borderRadius: "20px 20px 0 0", padding: "22px 20px 28px",
          width: "100%", maxWidth: 460, position: "relative",
        }}
      >
        <button onClick={onClose} aria-label="Cerrar" style={{
          position: "absolute", top: 14, right: 14, background: "var(--paper-soft)", border: "none",
          borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <X size={15} color="var(--ink-soft)" />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--acc-blue-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Smartphone size={19} color="var(--acc-blue)" />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>Instalá Sed de Datos</div>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 18px" }}>
          Agregala a tu pantalla de inicio y abrila como una app, sin pasar por el navegador cada vez. Funciona desde <strong>Safari</strong> en iPhone.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--paper-soft)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--acc-blue)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>1</div>
            <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, flex: 1 }}>Tocá el ícono de <strong>Compartir</strong></p>
            <Share2 size={20} color="var(--acc-blue)" style={{ flexShrink: 0 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--paper-soft)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--acc-blue)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>2</div>
            <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, flex: 1 }}>Elegí <strong>"Agregar a pantalla de inicio"</strong></p>
            <SquarePlus size={20} color="var(--acc-blue)" style={{ flexShrink: 0 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--paper-soft)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--acc-blue)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>3</div>
            <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, flex: 1 }}>Confirmá tocando <strong>"Añadir"</strong></p>
            <CheckCircle2 size={20} color="var(--acc-green)" style={{ flexShrink: 0 }} />
          </div>
        </div>

        <button onClick={onClose} className="hi-btn" style={{ ...primaryBtn, width: "100%", justifyContent: "center", marginTop: 18, background: "var(--acc-blue)", color: "#FFFFFF" }}>
          Entendido
        </button>
      </div>
    </div>
  );
}

function Header({ onInstallClick }) {
  return (
    <div style={{ background: "var(--paper)", borderRadius: 10, padding: "16px 20px", marginBottom: 14, borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandMark />
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, margin: 0, color: "var(--ink)", lineHeight: 1.1, letterSpacing: "-0.01em" }}>Sed de Datos</h1>
            <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "3px 0 0" }}>El costo oculto de cada consulta</p>
          </div>
        </div>
        <button onClick={onInstallClick} aria-label="Instalar como app" title="Instalar como app" className="hi-btn" style={{
          background: "var(--paper-soft)", border: "1px solid var(--line)", borderRadius: "50%",
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
        }}>
          <Smartphone size={16} color="var(--acc-blue)" />
        </button>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "inicio", label: "Inicio", icon: Sparkles, color: "var(--acc-blue)" },
  { id: "aprender", label: "Aprender", icon: BookOpen, color: "var(--acc-blue)" },
  { id: "calculadora", label: "Calculadora", icon: Calculator, color: "var(--acc-blue)" },
  { id: "laboratorio", label: "Laboratorio", icon: Sliders, color: "var(--acc-blue)" },
  { id: "quiz", label: "Cuestionario", icon: ListChecks, color: "var(--acc-blue)" },
  { id: "faq", label: "Preguntas frecuentes", icon: HelpCircle, color: "var(--acc-blue)" },
  { id: "fuentes", label: "Fuentes", icon: Link2, color: "var(--acc-blue)" },
];

function Nav({ tab, setTab }) {
  const gameActive = tab === "juego";
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setTab("juego")}
        className={gameActive ? "hi-btn" : "hi-btn hi-glow"}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "14px 16px", borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 6,
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15,
          background: gameActive ? "var(--dark-panel)" : "linear-gradient(90deg, var(--dark-panel), var(--acc-blue))",
          color: "var(--on-accent)",
        }}
      >
        <Gamepad2 size={18} /> {gameActive ? "Estás jugando Sed de Datos" : "🎮 Jugar Sed de Datos"}
      </button>

      <div className="hi-card" style={{ display: "flex", gap: 4, background: "var(--paper-soft)", borderRadius: 4, padding: 4, flexWrap: "wrap" }}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} className="hi-btn" aria-current={active ? "page" : undefined} style={{
              flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "7px 6px", borderRadius: 3, border: "none", cursor: "pointer",
              fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 10.5,
              background: active ? item.color : "transparent",
              color: active ? "var(--on-accent)" : "var(--ink-soft)",
              transition: "background .15s, transform .15s"
            }}>
              <Icon size={12} /> {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const primaryBtn = {
  background: "var(--ink)", color: "var(--paper)", border: "none", borderRadius: 6,
  padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6
};
const ghostBtn = {
  background: "transparent", border: "1px solid var(--line)", borderRadius: 6, padding: "8px 14px",
  fontSize: 12.5, fontFamily: "var(--font-body)", color: "var(--ink-soft)", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600
};
const pillBadge = (color, bg) => ({
  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
  color, textTransform: "uppercase", letterSpacing: "0.06em",
  background: bg, border: `1px solid ${color}`, borderRadius: 20, padding: "5px 12px"
});

// Glifo decorativo grande (gota + circuito) para el fondo del hero de Inicio,
// reutilizando la misma identidad visual del logo y del hero del juego.
function HeroGlyph() {
  return (
    <svg width="220" height="260" viewBox="0 0 120 150" style={{
      position: "absolute", right: -30, top: -20, opacity: 0.14, pointerEvents: "none",
    }} aria-hidden="true">
      <defs>
        <linearGradient id="hiHeroGlyphGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--acc-blue)" />
          <stop offset="100%" stopColor="var(--dark-panel)" />
        </linearGradient>
        <clipPath id="hiHeroGlyphClip">
          <path d="M60 8 C40 45, 14 72, 14 98 C14 120, 35 136, 60 136 C85 136, 106 120, 106 98 C106 72, 80 45, 60 8 Z" />
        </clipPath>
      </defs>
      <path d="M60 8 C40 45, 14 72, 14 98 C14 120, 35 136, 60 136 C85 136, 106 120, 106 98 C106 72, 80 45, 60 8 Z" fill="url(#hiHeroGlyphGrad)" />
      <g clipPath="url(#hiHeroGlyphClip)" stroke="var(--paper)" strokeWidth="2" fill="none">
        <line x1="0" y1="55" x2="120" y2="55" />
        <line x1="0" y1="78" x2="120" y2="78" />
        <line x1="0" y1="101" x2="120" y2="101" />
        <line x1="35" y1="8" x2="35" y2="140" />
        <line x1="60" y1="8" x2="60" y2="140" />
        <line x1="85" y1="8" x2="85" y2="140" />
      </g>
    </svg>
  );
}

function Inicio({ setTab }) {
  return (
    <div>
      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 12, padding: "30px 24px", marginBottom: 14, border: "1px solid var(--line)", position: "relative", overflow: "hidden" }}>
        <HeroGlyph />
        <div style={{ position: "relative" }}>
          <span style={pillBadge("var(--acc-blue)", "var(--acc-blue-bg)")}>◈ El costo oculto de la IA</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 27, lineHeight: 1.3, margin: "16px 0 12px", color: "var(--ink)", letterSpacing: "-0.01em" }}>
            Cada consulta a una IA gasta <span style={{ color: "var(--acc-orange)" }}>electricidad</span> y también <span style={{ color: "var(--acc-blue)" }}>agua</span>.
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.7, margin: "0 0 20px", maxWidth: 480 }}>
            La mayoría piensa solo en la luz que consumen los centros de datos. Pocos saben que también usan agua para refrigerarse, y que generar esa electricidad tiene, además, su propio gasto de agua escondido.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setTab("juego")} className="hi-btn hi-glow" style={{ ...primaryBtn, background: "linear-gradient(90deg, var(--dark-panel), var(--acc-blue))", color: "#FFFFFF" }}>
              <Gamepad2 size={14} /> Jugar Sed de Datos
            </button>
            <button onClick={() => setTab("calculadora")} className="hi-btn" style={ghostBtn}>
              <Calculator size={13} /> Calculá tu huella
            </button>
          </div>
        </div>
      </div>

      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 12, color: "var(--ink)" }}>
          Dos tipos de consumo de agua
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          <div className="hi-lift" style={{ background: "var(--acc-blue)", borderRadius: 8, padding: 14, border: "1px solid rgba(255,255,255,0.12)", animationDelay: "0ms" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Server size={15} color="#FFFFFF" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>Agua directa</span>
            </div>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.55, margin: 0 }}>
              La que se usa dentro del centro de datos para enfriar los servidores, muchas veces por evaporación en torres de refrigeración.
            </p>
          </div>
          <div className="hi-lift" style={{ background: "var(--dark-panel)", borderRadius: 8, padding: 14, border: "1px solid rgba(255,255,255,0.12)", animationDelay: "60ms" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Factory size={15} color="#FFFFFF" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>Agua indirecta</span>
            </div>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.55, margin: 0 }}>
              La que consumen las centrales eléctricas para generar la electricidad que llega al centro de datos, sobre todo las térmicas.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
        <StatBox icon={Droplet} color="var(--acc-blue)" bg="var(--acc-blue-bg)" value="0,26 mL" label="Agua directa en el centro de datos por esa misma consulta" delay={0} />
        <StatBox icon={Factory} color="var(--dark-panel)" bg="var(--acc-blue-bg)" value="≈7,1 L" label="Agua indirecta por cada kWh generado en un mega centro de datos como los que se están evaluando en Argentina" delay={60} />
        <StatBox icon={Zap} color="var(--acc-blue)" bg="var(--acc-blue-bg)" value="0,24 Wh" label="Electricidad por consulta de texto mediana (Gemini, 2025)" delay={120} />
      </div>

      <div className="hi-card" style={{ background: "var(--paper-soft)", borderRadius: 10, padding: "14px 16px", borderLeft: "4px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Info size={16} color="var(--ink-soft)" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.6, margin: 0 }}>
            Estos números varían enormemente según el modelo, el centro de datos, la tecnología de refrigeración y la matriz eléctrica de cada país. Los que ves acá son los mejores datos públicos disponibles, no un promedio universal — mirá la sección Fuentes para el detalle.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, color, bg, value, label, delay }) {
  const prevRef = useRef(value);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (prevRef.current !== value) {
      setPulse(true);
      prevRef.current = value;
      const t = setTimeout(() => setPulse(false), 550);
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <div
      className="hi-card"
      style={{
        background: bg, borderRadius: 10, padding: 14, borderLeft: `3px solid ${color}`,
        boxShadow: pulse ? `0 0 0 3px ${color}55` : "0 0 0 0 transparent",
        transition: "box-shadow .55s ease",
        animationDelay: delay ? `${delay}ms` : undefined,
      }}
    >
      <Icon size={16} color={color} style={{ marginBottom: 8 }} />
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 19, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--ink-soft)", lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

// Gauge semicircular tipo "sala de control": arco animado + número que
// cuenta hacia el nuevo valor, en vez de una barra de progreso plana.
function Gauge({ value, color, label }) {
  const animated = useAnimatedNumber(value);
  const prevRef = useRef(value);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (prevRef.current !== value) {
      setPulse(true);
      prevRef.current = value;
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [value]);
  const r = 50;
  const arcLength = Math.PI * r;
  const filled = Math.max(0, Math.min(arcLength, arcLength * (animated / 100)));
  return (
    <div className="hi-card" style={{
      background: "var(--paper-soft)", borderRadius: 10, padding: "12px 14px 10px", textAlign: "center",
      boxShadow: pulse ? `0 0 0 3px ${color}55` : "0 0 0 0 transparent", transition: "box-shadow .6s ease",
    }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 150, margin: "0 auto" }}>
        <svg viewBox="0 0 120 64" style={{ width: "100%", display: "block" }}>
          <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--paper)" strokeWidth="10" strokeLinecap="round" />
          <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${filled} ${arcLength}`} />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: -2, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color }}>
          {Math.round(animated)}
        </div>
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// Avatar circular de personaje: reemplaza el emoji suelto junto al texto por
// una insignia consistente, para que los personajes se sientan como
// personajes y no como una etiqueta de color.
function CharacterAvatar({ character, size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: character.color + "22", border: `1.5px solid ${character.color}`,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5,
    }}>
      {character.emoji}
    </div>
  );
}

// Hero visual de la pantalla de inicio del juego: una silueta simple de
// centro de datos con una gota de agua pulsando arriba.
function DataCenterHero() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
      <svg width="108" height="132" viewBox="0 0 120 150" className="hi-hero-pulse">
        <defs>
          <linearGradient id="hiDropGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--acc-blue)" />
            <stop offset="100%" stopColor="var(--dark-panel)" />
          </linearGradient>
          <clipPath id="hiDropClip">
            <path d="M60 8 C40 45, 14 72, 14 98 C14 120, 35 136, 60 136 C85 136, 106 120, 106 98 C106 72, 80 45, 60 8 Z" />
          </clipPath>
        </defs>
        <path d="M60 8 C40 45, 14 72, 14 98 C14 120, 35 136, 60 136 C85 136, 106 120, 106 98 C106 72, 80 45, 60 8 Z" fill="url(#hiDropGrad)" />
        <g clipPath="url(#hiDropClip)" opacity="0.4" stroke="var(--paper)" strokeWidth="2" fill="none">
          <line x1="0" y1="55" x2="120" y2="55" />
          <line x1="0" y1="78" x2="120" y2="78" />
          <line x1="0" y1="101" x2="120" y2="101" />
          <line x1="35" y1="8" x2="35" y2="140" />
          <line x1="60" y1="8" x2="60" y2="140" />
          <line x1="85" y1="8" x2="85" y2="140" />
        </g>
        <g clipPath="url(#hiDropClip)" fill="var(--paper)" opacity="0.55">
          <circle cx="35" cy="55" r="3.2" />
          <circle cx="60" cy="78" r="3.2" />
          <circle cx="85" cy="101" r="3.2" />
          <circle cx="35" cy="101" r="3.2" />
          <circle cx="85" cy="55" r="3.2" />
        </g>
      </svg>
    </div>
  );
}

function PlayCTA({ setTab, text }) {
  return (
    <button
      onClick={() => setTab("juego")}
      className="hi-btn hi-glow"
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        marginTop: 14, padding: "16px 18px", borderRadius: 10, border: "none", cursor: "pointer",
        background: "linear-gradient(90deg, var(--dark-panel), var(--acc-blue))", color: "#FFFFFF"
      }}
    >
      <div style={{ textAlign: "left" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14.5 }}>🎮 {text || "¿Y si manejaras vos un centro de datos?"}</div>
        <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 2 }}>Probá gestionar tu propio centro de datos de IA</div>
      </div>
      <Gamepad2 size={22} />
    </button>
  );
}

const CALC_MODES = {
  texto: {
    label: "CONSULTAS DE TEXTO POR DÍA", min: 1, max: 200, step: 1, defaultValue: 20,
    whPerUnit: 0.34, directLPerUnit: 0.015,
    note: "Estimación ilustrativa: 0,34 Wh/consulta (OpenAI), 10–25 ml de agua directa por consulta (UC Riverside / OCDE-Cornell) y 0,5–2,5 L de agua por kWh generado en plantas térmicas.",
  },
  imagen: {
    label: "IMÁGENES GENERADAS POR DÍA", min: 1, max: 50, step: 1, defaultValue: 5,
    whPerUnit: 55, directLPerUnit: 3.5,
    note: "Estimación ilustrativa: 0,01–0,1 kWh y 2–5 L de agua directa por imagen generada. Varía según resolución, modelo y cantidad de intentos.",
  },
};
const CALC_L_PER_KWH_INDIRECT = 1.5;

function CalculadoraTab({ calc, setCalc, setTab }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const mode = calc.mode || "texto";
  const cfg = CALC_MODES[mode];
  const units = calc.units ?? cfg.defaultValue;

  const selectMode = (m) => setCalc({ mode: m, units: CALC_MODES[m].defaultValue });

  const results = useMemo(() => {
    const directL = units * cfg.directLPerUnit;
    const energyWhDay = units * cfg.whPerUnit;
    const energyWhMonth = energyWhDay * 30;
    const indirectL = (energyWhDay / 1000) * CALC_L_PER_KWH_INDIRECT;
    const totalL = directL + indirectL;
    const glasses = Math.max(1, Math.round((totalL * 1000) / GLASS_OF_WATER_ML));
    return { directL, energyWhDay, energyWhMonth, indirectL, totalL, glasses };
  }, [units, cfg]);

  const sliderPct = ((units - cfg.min) / (cfg.max - cfg.min)) * 100;

  return (
    <div>
      <div style={{ background: "var(--dark-panel)", borderRadius: 20, padding: "24px 18px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1.3px, transparent 1.3px)", backgroundSize: "20px 20px", opacity: 0.08, pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", margin: "0 0 10px" }}>CALCULADORA.</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "#FFFFFF", margin: "0 0 16px" }}>¿Cuánto gastás vos?</h2>

          <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button onClick={() => selectMode("texto")} className="hi-btn" style={{
                flex: 1, padding: "9px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
                border: `1px solid ${mode === "texto" ? "var(--acc-blue)" : "var(--line)"}`,
                background: mode === "texto" ? "var(--acc-blue)" : "var(--paper)",
                color: mode === "texto" ? "#FFFFFF" : "var(--ink)",
              }}>Texto</button>
              <button onClick={() => selectMode("imagen")} className="hi-btn" style={{
                flex: 1, padding: "9px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
                border: `1px solid ${mode === "imagen" ? "var(--acc-blue)" : "var(--line)"}`,
                background: mode === "imagen" ? "var(--acc-blue)" : "var(--paper)",
                color: mode === "imagen" ? "#FFFFFF" : "var(--ink)",
              }}>Imagen</button>
            </div>

            <div style={{ background: "var(--paper-soft)", border: "1px solid var(--line)", borderRadius: 16, padding: 18, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)" }}>{cfg.label}</label>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)" }}>{units}</span>
              </div>
              <input
                type="range" className="hi-range" min={cfg.min} max={cfg.max} step={cfg.step} value={units}
                onChange={e => setCalc({ units: Number(e.target.value) })}
                style={{
                  background: `linear-gradient(to right, var(--acc-blue) 0%, var(--acc-blue) ${sliderPct}%, var(--line) ${sliderPct}%, var(--line) 100%)`,
                  "--thumb-color": "var(--acc-blue)",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-soft)", marginTop: 8, fontFamily: "var(--font-mono)" }}>
                <span>{cfg.min}</span><span>{cfg.max}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 10 }}>
              <div style={{ background: "var(--acc-blue-bg)", borderRadius: 16, padding: 18 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--acc-blue)", margin: "0 0 4px" }}>AGUA TOTAL · POR DÍA</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "var(--ink)", margin: 0 }}>{numFmt(results.totalL, 2)} L</p>
                <p style={{ fontSize: 11, color: "var(--acc-blue)", margin: "4px 0 0" }}>directa + indirecta</p>
              </div>
              <div style={{ background: "var(--acc-blue-bg)", borderRadius: 16, padding: 18 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--acc-blue)", margin: "0 0 4px" }}>ELECTRICIDAD · POR DÍA</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "var(--ink)", margin: 0 }}>{formatEnergy(results.energyWhDay)}</p>
                <p style={{ fontSize: 11, color: "var(--acc-blue)", margin: "4px 0 0" }}>≈ {formatEnergy(results.energyWhMonth)} al mes</p>
              </div>
            </div>

            <div style={{ background: "var(--paper-soft)", border: "1px solid var(--line)", borderRadius: 16, padding: "14px 16px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--ink-soft)", flexWrap: "wrap" }}>
                <span>Directa: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)" }}>{numFmt(results.directL, 2)} L</span></span>
                <span>Indirecta: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)" }}>{numFmt(results.indirectL, 2)} L</span></span>
              </div>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0 }}>
                Equivale a <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--acc-blue)" }}>{results.glasses}</span> {results.glasses === 1 ? "vaso" : "vasos"} de agua (250 ml) por día
              </p>
            </div>

            <div style={{ borderRadius: 16, border: "1px solid var(--line)", overflow: "hidden" }}>
              <div style={{ padding: 18, background: "var(--paper-soft)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", margin: "0 0 4px", letterSpacing: "0.03em" }}>TU ESTIMACIÓN</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "0 0 14px" }}>Es una estimación, no una medición directa.</p>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-soft)", margin: "0 0 8px", letterSpacing: "0.03em" }}>SE CALCULÓ A PARTIR DE:</p>
                <ul style={{ fontSize: 12, color: "var(--ink-soft)", margin: "0 0 14px", paddingLeft: 18, lineHeight: 1.7 }}>
                  <li>Consumo energético estimado por consulta</li>
                  <li>Factor hídrico de generación eléctrica</li>
                  <li>Tipo de consulta (texto o imagen)</li>
                  <li>Infraestructura de referencia (promedios publicados)</li>
                </ul>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                  <div><span style={{ display: "block", color: "var(--ink)", fontWeight: 700, marginBottom: 2 }}>Fuente</span><span style={{ color: "var(--ink-soft)" }}>OpenAI, UC Riverside</span></div>
                  <div><span style={{ display: "block", color: "var(--ink)", fontWeight: 700, marginBottom: 2 }}>Año</span><span style={{ color: "var(--ink-soft)" }}>2023–2024</span></div>
                  <div><span style={{ display: "block", color: "var(--ink)", fontWeight: 700, marginBottom: 2 }}>Metodología</span><span style={{ color: "var(--ink-soft)" }}>Rango medio publicado</span></div>
                </div>
              </div>
              <button onClick={() => setWhyOpen(o => !o)} aria-expanded={whyOpen} className="hi-btn" style={{
                width: "100%", cursor: "pointer", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                fontSize: 12, fontWeight: 700, color: "var(--acc-blue)", background: "var(--paper)", border: "none", borderTop: "1px solid var(--line)",
              }}>
                ¿Por qué este número puede cambiar?
                <ChevronDown size={14} style={{ transform: whyOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }} />
              </button>
              {whyOpen && (
                <div style={{ padding: "4px 18px 18px", background: "var(--paper)" }}>
                  <p style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.6, margin: "0 0 10px" }}>
                    Cada empresa mide con su propio hardware, su propio sistema de refrigeración y su propia ubicación geográfica. Que Google, Microsoft u OpenAI publiquen números distintos entre sí no significa que alguno esté mintiendo: miden modelos y centros de datos diferentes, en climas distintos, con metodologías que todavía no están estandarizadas a nivel de la industria.
                  </p>
                  <p style={{ fontSize: 11, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 }}>{cfg.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PlayCTA setTab={setTab} text="Ahora escalalo: gestioná un data center entero" />
    </div>
  );
}

const LAB_PRESETS = [
  { id: "eficiente", label: "🌱 Eficiente", demand: 800, tempMult: 80, efficiency: 50, renewable: 80 },
  { id: "promedio", label: "⚖️ Promedio", demand: 1500, tempMult: 100, efficiency: 20, renewable: 30 },
  { id: "derrochador", label: "🔥 Derrochador", demand: 3500, tempMult: 150, efficiency: 0, renewable: 5 },
];

function LabSlider({ icon: Icon, label, value, onChange, min, max, step, suffix, color }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>
          <Icon size={14} color={color} /> {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, color, background: color + "22", padding: "2px 9px", borderRadius: 20 }}>
          {value}{suffix}
        </span>
      </div>
      <input
        type="range" className="hi-range" min={min} max={max} step={step || 1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, var(--paper-soft) ${pct}%, var(--paper-soft) 100%)`,
          "--thumb-color": color,
        }}
      />
    </div>
  );
}

// Medidor visual de agua: una gota que se llena de abajo hacia arriba según
// el agua total del día, para traducir el número a algo que se ve de un
// vistazo en vez de solo leerse.
function WaterDropletMeter({ liters, maxLiters = 8 }) {
  const pct = Math.max(0.03, Math.min(1, liters / maxLiters));
  const fillY = 136 - pct * 128;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <svg width="86" height="104" viewBox="0 0 120 150">
        <defs>
          <clipPath id="hiLabDropClip">
            <path d="M60 8 C40 45, 14 72, 14 98 C14 120, 35 136, 60 136 C85 136, 106 120, 106 98 C106 72, 80 45, 60 8 Z" />
          </clipPath>
        </defs>
        <path d="M60 8 C40 45, 14 72, 14 98 C14 120, 35 136, 60 136 C85 136, 106 120, 106 98 C106 72, 80 45, 60 8 Z" fill="var(--paper-soft)" stroke="var(--acc-blue)" strokeWidth="2" />
        <g clipPath="url(#hiLabDropClip)">
          <rect x="0" y={fillY} width="120" height="150" fill="var(--acc-blue)" opacity="0.85" style={{ transition: "y .3s ease" }} />
        </g>
      </svg>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--acc-blue)", marginTop: 2 }}>{numFmt(liters, 2)} L/día</div>
      <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>agua total</div>
    </div>
  );
}

function LaboratorioTab({ setTab }) {
  const [demand, setDemand] = useState(1500);
  const [tempMult, setTempMult] = useState(100);
  const [efficiency, setEfficiency] = useState(20);
  const [renewable, setRenewable] = useState(30);

  const whPerQuery = GOOGLE_ELECTRICITY_WH * (1 - efficiency / 100);
  const dailyKWh = (demand * whPerQuery) / 1000;
  const dailyDirectWaterMl = demand * GOOGLE_DIRECT_WATER_ML * (tempMult / 100);
  const dailyIndirectWaterL = dailyKWh * GRID_WATER_INTENSITY_L_PER_KWH * (1 - renewable / 100);
  const dailyTotalWaterL = dailyIndirectWaterL + dailyDirectWaterMl / 1000;

  const animKWh = useAnimatedNumber(dailyKWh, 280);
  const animTotalWaterL = useAnimatedNumber(dailyTotalWaterL, 280);
  const animDirectL = useAnimatedNumber(dailyDirectWaterMl / 1000, 280);
  const animIndirectL = useAnimatedNumber(dailyIndirectWaterL, 280);

  const glasses = (animTotalWaterL * 1000) / GLASS_OF_WATER_ML;
  const phoneCharges = animKWh / PHONE_CHARGE_KWH;

  const applyPreset = (p) => { setDemand(p.demand); setTempMult(p.tempMult); setEfficiency(p.efficiency); setRenewable(p.renewable); };

  const chartData = [
    { name: "Directa", value: Number(animDirectL.toFixed(3)) },
    { name: "Indirecta", value: Number(animIndirectL.toFixed(3)) },
  ];

  return (
    <div>
      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, marginBottom: 14, borderTop: "4px solid var(--acc-blue)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Sliders size={17} color="var(--acc-blue)" />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--acc-blue)" }}>Laboratorio de experimentos</div>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "0 0 14px" }}>
          Movés las variables y ves cómo cambian el agua y la energía, en vivo. Es una simulación educativa con las mismas constantes que usa el resto de la app, no representa un centro de datos real.
        </p>

        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {LAB_PRESETS.map(p => (
            <button key={p.id} onClick={() => applyPreset(p)} className="hi-btn" style={{ ...ghostBtn, flex: "1 1 auto", justifyContent: "center" }}>
              {p.label}
            </button>
          ))}
        </div>

        <LabSlider icon={Users} label="Demanda de IA (consultas/día)" value={demand} onChange={setDemand} min={100} max={5000} step={100} suffix="" color="var(--acc-blue)" />
        <LabSlider icon={Thermometer} label="Temperatura ambiente (% sobre lo normal)" value={tempMult} onChange={setTempMult} min={50} max={200} step={5} suffix="%" color="var(--acc-orange)" />
        <LabSlider icon={TrendingUp} label="Eficiencia de los modelos" value={efficiency} onChange={setEfficiency} min={0} max={60} step={5} suffix="%" color="var(--acc-blue)" />
        <LabSlider icon={Wind} label="Energía renovable" value={renewable} onChange={setRenewable} min={0} max={90} step={5} suffix="%" color="var(--acc-orange)" />
      </div>

      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 12 }}>
        <WaterDropletMeter liters={animTotalWaterL} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Gauge value={Math.round(Math.min(100, (efficiency / 60) * 70 + (renewable / 90) * 30))} color="var(--acc-blue)" label="Eficiencia energética" />
          <Gauge value={Math.round(Math.max(0, Math.min(100, 100 - ((tempMult - 50) / 150) * 100)))} color="var(--acc-orange)" label="Presión por temperatura" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 14 }}>
        <StatBox icon={Zap} color="var(--acc-blue)" bg="var(--acc-blue-bg)" value={formatEnergy(animKWh * 1000)} label="Energía por día" delay={0} />
        <StatBox icon={Droplets} color="var(--acc-orange)" bg="var(--acc-orange-bg)" value={`${numFmt(animTotalWaterL, 1)} L`} label="Agua total por día" delay={40} />
        <StatBox icon={Droplet} color="var(--acc-blue)" bg="var(--acc-blue-bg)" value={formatWater(animDirectL * 1000)} label="Agua directa por día" delay={80} />
        <StatBox icon={Waves} color="var(--acc-orange)" bg="var(--acc-orange-bg)" value={`${numFmt(animIndirectL, 1)} L`} label="Agua indirecta por día" delay={120} />
      </div>

      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 10, color: "var(--ink)" }}>
          Agua directa vs. indirecta (por día, en litros)
        </div>
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fontFamily: "var(--font-body)", fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fontFamily: "var(--font-body)", fill: "var(--ink)" }} axisLine={false} tickLine={false} width={62} />
              <Tooltip formatter={v => `${numFmt(v, 2)} L`} contentStyle={{ fontFamily: "var(--font-body)", fontSize: 12, borderRadius: 6, background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <Cell fill="var(--acc-blue)" />
                <Cell fill="var(--acc-orange)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 8, color: "var(--ink)" }}>Para ponerlo en contexto</div>
        <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, margin: 0 }}>
          Con estos valores, un solo día equivale a <strong style={{ color: "var(--acc-blue)" }}>{numFmt(glasses, 0)} vasos de agua</strong> y
          {" "}<strong style={{ color: "var(--acc-orange)" }}>{numFmt(phoneCharges, 1)} cargas de celular</strong>. Probá mover una sola variable a la vez para ver qué es lo que más pesa.
        </p>
      </div>

      <PlayCTA setTab={setTab} text="Ahora probá gestionarlo día a día, con presupuesto y eventos de por medio" />
    </div>
  );
}

function ResultBox({ icon: Icon, color, bg, label, value }) {
  return (
    <div className="hi-card" style={{ background: bg, borderRadius: 10, padding: 14, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color }}>
        <Icon size={14} />
        <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 19, color }}>{value}</div>
    </div>
  );
}

// Ilustraciones vectoriales para las tarjetas de Aprender: una mini-escena
// por tema, en el mismo estilo plano y con los mismos colores del resto de
// la app, en vez de un ícono genérico suelto.

function RefrigerationArt() {
  return (
    <svg viewBox="0 0 300 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <g stroke="var(--acc-orange)" strokeWidth="1.6" fill="none" opacity="0.55" strokeLinecap="round">
        <path d="M138 40 C 132 28, 145 22, 140 10" />
        <path d="M150 40 C 145 26, 160 20, 153 6" />
        <path d="M163 40 C 159 24, 174 18, 166 4" />
      </g>
      <rect x="115" y="40" width="70" height="52" rx="4" fill="var(--paper)" opacity="0.5" stroke="var(--acc-orange)" strokeWidth="1" />
      <g fill="var(--acc-orange)">
        <circle cx="126" cy="50" r="2.4" />
        <circle cx="126" cy="61" r="2.4" fill="var(--dark-panel)" />
        <circle cx="126" cy="72" r="2.4" fill="var(--acc-orange)" />
      </g>
      <g stroke="var(--paper)" strokeWidth="2" opacity="0.6">
        <line x1="136" y1="47" x2="176" y2="47" />
        <line x1="136" y1="58" x2="176" y2="58" />
        <line x1="136" y1="69" x2="176" y2="69" />
        <line x1="136" y1="80" x2="176" y2="80" />
      </g>
      <g fill="var(--dark-panel)" opacity="0.4">
        <circle cx="103" cy="78" r="3" />
        <circle cx="197" cy="66" r="2.5" />
        <circle cx="108" cy="60" r="2" />
      </g>
    </svg>
  );
}

// Electricidad: una torre de alta tensión con un rayo, y gotas cayendo desde
// los cables — el agua indirecta escondida detrás de generar electricidad.
function ElectricityArt() {
  return (
    <svg viewBox="0 0 300 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <g stroke="var(--acc-blue)" strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round">
        <path d="M150 15 L150 85" />
        <path d="M120 30 L180 30" />
        <path d="M110 50 L190 50" />
        <path d="M120 70 L180 70" />
        <path d="M150 15 L130 45" />
        <path d="M150 15 L170 45" />
        <path d="M150 85 L130 55" />
        <path d="M150 85 L170 55" />
      </g>
      <path d="M154 34 L145 52 L153 52 L146 68 L163 46 L154 46 Z" fill="var(--dark-panel)" opacity="0.9" />
      <g fill="var(--acc-blue)" opacity="0.55">
        <circle cx="115" cy="60" r="2.6" />
        <circle cx="185" cy="62" r="2.6" />
        <circle cx="122" cy="78" r="2" />
        <circle cx="178" cy="80" r="2" />
      </g>
    </svg>
  );
}

// Escala: una gota chica en el centro con más y más gotas creciendo hacia
// afuera, representando cómo un gasto mínimo se multiplica a escala global.
function ScaleArt() {
  const ring = (r, n, size, opacity) => Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2;
    return { x: 150 + Math.cos(angle) * r, y: 50 + Math.sin(angle) * r * 0.55, size, opacity };
  });
  const drops = [...ring(20, 5, 3, 0.5), ...ring(38, 8, 3.6, 0.4), ...ring(58, 10, 4.2, 0.3)];
  return (
    <svg viewBox="0 0 300 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      {drops.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.size} fill="var(--acc-orange)" opacity={d.opacity} />
      ))}
      <circle cx="150" cy="50" r="8" fill="var(--acc-orange)" />
      <circle cx="147" cy="47" r="2" fill="var(--paper)" opacity="0.6" />
    </svg>
  );
}

// Entrenamiento: un rack más alto de lo normal con una barra de progreso
// cargando, y una gota grande al lado — mucho más consumo que el uso diario.
function TrainingArt() {
  return (
    <svg viewBox="0 0 300 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect x="128" y="12" width="46" height="76" rx="4" fill="var(--paper)" opacity="0.5" stroke="var(--acc-orange)" strokeWidth="1" />
      <g fill="var(--acc-orange)">
        <circle cx="137" cy="22" r="2.2" />
        <circle cx="137" cy="33" r="2.2" fill="var(--dark-panel)" />
        <circle cx="137" cy="44" r="2.2" />
        <circle cx="137" cy="55" r="2.2" fill="var(--dark-panel)" />
        <circle cx="137" cy="66" r="2.2" />
        <circle cx="137" cy="77" r="2.2" fill="var(--dark-panel)" />
      </g>
      <g stroke="var(--paper)" strokeWidth="1.6" opacity="0.6">
        <line x1="145" y1="20" x2="166" y2="20" />
        <line x1="145" y1="31" x2="166" y2="31" />
        <line x1="145" y1="42" x2="166" y2="42" />
        <line x1="145" y1="53" x2="166" y2="53" />
        <line x1="145" y1="64" x2="166" y2="64" />
        <line x1="145" y1="75" x2="166" y2="75" />
      </g>
      <path d="M205 20 C195 38, 185 52, 205 62 C225 52, 215 38, 205 20 Z" fill="var(--acc-orange)" opacity="0.85" />
      <path d="M200 15 C190 33, 180 47, 200 57 C220 47, 210 33, 200 15 Z" fill="none" stroke="var(--acc-orange)" strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

// Transparencia: dos reportes superpuestos con cifras distintas y una lupa,
// mostrando que cada empresa mide y cuenta las cosas de otra manera.
function TransparencyArt() {
  return (
    <svg viewBox="0 0 300 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect x="118" y="22" width="54" height="66" rx="4" fill="var(--paper)" opacity="0.55" stroke="var(--acc-blue)" strokeWidth="1" transform="rotate(-6 145 55)" />
      <rect x="132" y="18" width="54" height="66" rx="4" fill="var(--paper)" opacity="0.75" stroke="var(--acc-blue)" strokeWidth="1.2" transform="rotate(4 159 51)" />
      <g stroke="var(--acc-blue)" strokeWidth="1.6" opacity="0.7" transform="rotate(4 159 51)">
        <line x1="140" y1="32" x2="178" y2="32" />
        <line x1="140" y1="42" x2="170" y2="42" />
        <line x1="140" y1="52" x2="178" y2="52" />
        <line x1="140" y1="62" x2="164" y2="62" />
      </g>
      <circle cx="205" cy="64" r="12" fill="none" stroke="var(--dark-panel)" strokeWidth="2.4" opacity="0.85" />
      <line x1="213" y1="72" x2="222" y2="81" stroke="var(--dark-panel)" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

// Contexto: una taza de café bien grande al lado de una gota chiquita — la
// comparación de escala que ayuda a poner el número en perspectiva.
function ContextArt() {
  return (
    <svg viewBox="0 0 300 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <path d="M118 38 h48 v30 a24 20 0 0 1 -48 0 Z" fill="var(--paper)" opacity="0.6" stroke="var(--acc-orange)" strokeWidth="1.4" />
      <path d="M166 44 q16 -2 16 12 q0 14 -16 12" fill="none" stroke="var(--acc-orange)" strokeWidth="2" opacity="0.7" />
      <g stroke="var(--acc-orange)" strokeWidth="1.6" fill="none" opacity="0.5" strokeLinecap="round">
        <path d="M128 30 C 125 24, 132 20, 129 14" />
        <path d="M140 30 C 137 24, 144 20, 141 14" />
      </g>
      <path d="M205 58 C 201 65, 197 70, 205 76 C 213 70, 209 65, 205 58 Z" fill="var(--dark-panel)" opacity="0.85" />
    </svg>
  );
}

const ARTICLES = [
  {
    icon: Waves, color: "acc-orange", topic: "Refrigeración", art: RefrigerationArt,
    title: "El agua que ves: enfriar los servidores",
    text: "Muchos centros de datos usan torres de refrigeración evaporativa: el agua absorbe el calor y se evapora. Hasta un 85% de esa agua no vuelve a la red de distribución."
  },
  {
    icon: Factory, color: "acc-blue", topic: "Electricidad", art: ElectricityArt,
    title: "El agua que no ves: generar la electricidad",
    text: "Las centrales térmicas (carbón, gas, nuclear) usan grandes volúmenes de agua para producir vapor y enfriar turbinas. La eólica y la solar fotovoltaica consumen mucha menos."
  },
  {
    icon: Sparkles, color: "acc-orange", topic: "Escala", art: ScaleArt,
    title: "Una gota se hace un océano",
    text: "0,26 mL por consulta parece nada. Pero multiplicado por miles de millones de consultas diarias en todo el mundo, la cifra global se mide en miles de millones de litros por año."
  },
  {
    icon: Server, color: "acc-orange", topic: "Entrenamiento", art: TrainingArt,
    title: "Entrenar cuesta más que usar",
    text: "Un estudio estimó que entrenar GPT-3 evaporó unos 700.000 litros de agua directa para refrigeración, y unos 5,4 millones de litros si se suma el consumo indirecto."
  },
  {
    icon: Info, color: "acc-blue", topic: "Transparencia", art: TransparencyArt,
    title: "No todas las empresas cuentan lo mismo",
    text: "Google reportó 0,26 mL de agua directa por consulta mediana en Gemini. Mistral reportó 45 mL para una consulta de 400 tokens, incluyendo agua directa e indirecta. Son metodologías distintas, no siempre comparables."
  },
  {
    icon: Droplets, color: "acc-orange", topic: "Contexto", art: ContextArt,
    title: "¿Es mucho o es poco?",
    text: "Una sola consulta consume menos agua que preparar una taza de café. El problema no es la consulta individual, sino la escala y la falta de datos claros sobre el consumo indirecto."
  },
];

function Aprender({ setTab }) {
  return (
    <div>
      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 16, marginBottom: 14, borderTop: "4px solid var(--acc-blue)" }}>
        <span style={pillBadge("var(--acc-blue)", "var(--acc-blue-bg)")}>ARTÍCULOS</span>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--ink)", margin: "10px 0 4px" }}>Ideas para desarrollar el tema</div>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: 0 }}>
          Seis ideas clave para entender de dónde viene el costo hídrico y eléctrico de la IA.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {ARTICLES.map((a, i) => {
          const Icon = a.icon;
          const Art = a.art;
          return (
            <div key={a.title} className="hi-card hi-lift" style={{ background: "var(--paper)", borderRadius: 10, overflow: "hidden", animationDelay: `${i * 50}ms`, border: "1px solid var(--line)" }}>
              <div style={{
                height: 96, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                background: `linear-gradient(160deg, var(--${a.color}-bg), var(--bg))`
              }}>
                {Art ? <Art /> : <Icon size={30} color={`var(--${a.color})`} strokeWidth={1.6} />}
              </div>
              <div style={{ padding: 16 }}>
                <span style={{
                  display: "inline-block", fontSize: 10.5, fontWeight: 700, color: `var(--${a.color})`,
                  background: `var(--${a.color}-bg)`, borderRadius: 20, padding: "3px 10px", marginBottom: 10
                }}>{a.topic}</span>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--ink)", marginBottom: 6, lineHeight: 1.3 }}>{a.title}</div>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55, margin: 0 }}>{a.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <PlayCTA setTab={setTab} text="Ya leíste la teoría, ahora ponela a prueba" />
    </div>
  );
}

const QUIZ_QUESTIONS = [
  {
    q: "¿Con qué frecuencia usás una IA como ChatGPT o Gemini en tu día a día?",
    options: [
      { text: "Nunca la usé", points: 0 },
      { text: "Un par de veces por semana", points: 1 },
      { text: "Todos los días, para tareas puntuales", points: 2 },
      { text: "Todo el día, para casi todo", points: 4 },
    ],
  },
  {
    q: "¿Para qué la usás más seguido?",
    options: [
      { text: "Resolver dudas rápidas o estudiar", points: 1 },
      { text: "Escribir o resumir textos", points: 1 },
      { text: "Programar o revisar código", points: 2 },
      { text: "Generar imágenes", points: 3 },
      { text: "Generar video", points: 4 },
    ],
  },
  {
    q: "Cuando generás una imagen o video con IA, ¿cuántos intentos hacés antes de quedarte con uno?",
    options: [
      { text: "Ni siquiera genero imágenes o video", points: 0 },
      { text: "1 o 2 intentos", points: 1 },
      { text: "Varios intentos hasta que quede bien", points: 2 },
      { text: "Muchísimos, soy bastante exigente", points: 3 },
    ],
  },
  {
    q: "¿Sabías que generar una sola imagen puede gastar más agua que 100 consultas de texto?",
    options: [
      { text: "No, ni idea", points: 0, note: "no_sabia" },
      { text: "Tenía una idea aproximada", points: 0, note: "idea_aprox" },
      { text: "Sí, ya lo sabía", points: 0, note: "sabia" },
    ],
  },
  {
    q: "Si pudieras cambiar un hábito para reducir tu huella, ¿cuál elegirías?",
    options: [
      { text: "Agrupar mis consultas en vez de abrir muchas cortas", points: 0, commitment: "Agrupar tus consultas en una sola conversación en vez de abrir muchas cortas." },
      { text: "Generar menos imágenes de prueba", points: 0, commitment: "Pensar mejor el pedido antes de generar varias imágenes de prueba." },
      { text: "Elegir modelos más livianos para tareas simples", points: 0, commitment: "Usar un modelo más liviano cuando la tarea sea simple." },
      { text: "Ninguno, no creo que haga falta", points: 0, commitment: "Seguir como hasta ahora, con más información sobre el tema." },
    ],
  },
];

const QUIZ_RESULT_TIERS = [
  { max: 2, title: "Huella mínima", body: "Tu uso de IA es bajo o casi nulo, así que tu consumo directo de agua y electricidad también lo es. Igual, vale la pena entender el tema: cada vez más apps suman IA por dentro sin que te des cuenta." },
  { max: 5, title: "Huella baja a moderada", body: "Usás la IA de forma puntual y razonable. Con hábitos simples —como agrupar consultas— podés mantener tu huella en niveles bajos sin dejar de aprovechar la herramienta." },
  { max: 8, title: "Huella considerable", body: "Tu uso es frecuente y variado, lo que empieza a sumar en agua y electricidad. No hace falta dejar de usarla, pero sí prestar atención a cuánto y para qué la usás, sobre todo si generás imágenes seguido." },
  { max: 11, title: "Huella alta", body: "Usás la IA a diario y para tareas que consumen bastante, como imágenes o video. Es el perfil que más se beneficiaría de ajustar hábitos: cada imagen de más puede pesar varios litros de agua." },
];

const QUIZ_AWARENESS_NOTES = {
  no_sabia: "Ahora ya lo sabés: una imagen puede pesar más que un centenar de consultas de texto.",
  idea_aprox: "Tu intuición no estaba mal: las imágenes y videos son, por lejos, lo más costoso.",
  sabia: "Ya lo sabías, así que seguramente ya estés más atento a cómo las usás.",
};

function quizResultForScore(points) {
  return QUIZ_RESULT_TIERS.find(r => points <= r.max) || QUIZ_RESULT_TIERS[QUIZ_RESULT_TIERS.length - 1];
}

function QuizTab({ lastScore, setLastScore, setTab }) {
  const [step, setStep] = useState(0);
  const [points, setPoints] = useState(0);
  const [awareness, setAwareness] = useState(null);
  const [commitment, setCommitment] = useState("");
  const [finished, setFinished] = useState(false);

  const question = QUIZ_QUESTIONS[step];

  const choose = (opt) => {
    const newPoints = points + (opt.points || 0);
    setPoints(newPoints);
    if (opt.note) setAwareness(opt.note);
    if (opt.commitment) setCommitment(opt.commitment);
    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      setFinished(true);
      setLastScore(newPoints);
    }
  };

  const restart = () => {
    setStep(0); setPoints(0); setAwareness(null); setCommitment(""); setFinished(false);
  };

  if (finished) {
    const result = quizResultForScore(points);
    return (
      <div style={{ background: "var(--acc-orange)", borderRadius: 20, padding: "24px 18px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1.3px, transparent 1.3px)", backgroundSize: "20px 20px", opacity: 0.1, pointerEvents: "none" }} />
        <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 14, padding: 20, position: "relative" }}>
          <div style={{ background: "var(--acc-blue-bg)", borderRadius: 14, padding: "18px 20px", marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--acc-blue)", margin: "0 0 6px", letterSpacing: "0.04em" }}>TU RESULTADO</p>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, color: "var(--ink)", marginBottom: 8 }}>{result.title}</div>
            <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, margin: 0 }}>
              {result.body} {QUIZ_AWARENESS_NOTES[awareness] || ""}
            </p>
          </div>
          {commitment && (
            <div style={{ background: "var(--paper-soft)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", margin: "0 0 6px", letterSpacing: "0.04em" }}>TU COMPROMISO</p>
              <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, lineHeight: 1.5 }}>{commitment}</p>
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            <button onClick={() => setTab("calculadora")} className="hi-btn" style={{ ...primaryBtn, background: "var(--acc-orange)", color: "#FFFFFF" }}>
              <Calculator size={14} /> Calculá el número exacto
            </button>
            <button onClick={restart} className="hi-btn" style={ghostBtn}>
              <RotateCcw size={14} /> Volver a intentar
            </button>
          </div>
          <PlayCTA setTab={setTab} text="Ahora ponelo en práctica gestionando tu propio centro de datos" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--acc-orange)", borderRadius: 20, padding: "24px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1.3px, transparent 1.3px)", backgroundSize: "20px 20px", opacity: 0.1, pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", margin: "0 0 10px" }}>CUESTIONARIO.</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "#FFFFFF", margin: "0 0 4px" }}>¿Qué tan grande es tu huella?</h2>
        <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", margin: "0 0 16px" }}>{QUIZ_QUESTIONS.length} preguntas rápidas. No hay respuestas correctas ni incorrectas.</p>
        {step === 0 && lastScore !== null && (
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.75)", margin: "0 0 16px" }}>Tu última vuelta dio "{quizResultForScore(lastScore).title}".</p>
        )}

        <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 600 }}>Pregunta {step + 1} de {QUIZ_QUESTIONS.length}</span>
            {step > 0 && <button onClick={restart} className="hi-btn" style={{ background: "none", border: "none", padding: 0, color: "var(--acc-orange)", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>Volver a empezar</button>}
          </div>
          <div style={{ height: 6, background: "var(--paper-soft)", border: "1px solid var(--line)", borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ width: `${((step) / QUIZ_QUESTIONS.length) * 100 + (100 / QUIZ_QUESTIONS.length)}%`, height: "100%", background: "var(--acc-orange)", transition: "width .3s ease" }} />
          </div>

          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 16, lineHeight: 1.4 }}>
            {question.q}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            {question.options.map((opt, i) => (
              <button key={i} onClick={() => choose(opt)} className="hi-btn hi-lift" style={{
                textAlign: "left", padding: "11px 14px", borderRadius: 10,
                border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)"
              }}>
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const FAQS = [
  { q: "¿Cuánta agua gasta realmente una consulta a un chatbot de IA?", a: "Depende de qué estudio mires. La Calculadora de esta app usa una estimación de 0,015 L (15 mL) de agua directa por consulta de texto, basada en OpenAI y UC Riverside. El simulador 'Sed de Datos' usa en cambio la medición que Google publicó específicamente para Gemini: 0,26 mL de agua directa. Ninguna es 'la' cifra universal." },
  { q: "¿Por qué esta cifra es tan distinta a la que vi en otro lado?", a: "Porque cada estudio mide una IA distinta con una metodología distinta. Google midió específicamente Gemini y publicó 0,26 mL de agua directa por consulta (esa es la que usa el simulador del juego). La Calculadora, en cambio, usa la estimación de UC Riverside para ChatGPT (10–25 mL) y el consumo eléctrico que reportó OpenAI (0,34 Wh, contra los 0,24 Wh de Google). Ninguna cifra es 'la correcta': son mediciones de compañías y modelos distintos, con supuestos distintos sobre el hardware y la refrigeración. Por eso en toda la app aclaramos de qué empresa o estudio sale cada número." },
  { q: "¿Por qué se habla de agua si los centros de datos consumen electricidad?", a: "Porque la electricidad y el agua están conectadas de dos formas: los servidores necesitan refrigeración (a veces con agua) y, además, generar esa electricidad —sobre todo en plantas térmicas— también requiere agua." },
  { q: "¿Qué diferencia hay entre agua 'directa' e 'indirecta'?", a: "La directa es la que se usa dentro del centro de datos para enfriar los equipos. La indirecta es la que consumen las centrales eléctricas para producir la electricidad que ese centro de datos consume." },
  { q: "¿Todos los modelos de IA gastan lo mismo?", a: "No. Depende del tamaño del modelo, el largo de la consulta, la eficiencia del hardware, el tipo de refrigeración del centro de datos y la matriz eléctrica de la región. Por eso las cifras publicadas varían tanto entre empresas." },
  { q: "¿El entrenamiento de un modelo gasta más agua que su uso diario?", a: "El entrenamiento de un modelo grande puede consumir cientos de miles o millones de litros de una sola vez. Pero como se usa millones de veces después, el consumo acumulado del uso diario a gran escala también termina siendo enorme." },
  { q: "¿Esta agua se pierde para siempre?", a: "Gran parte del agua usada en refrigeración evaporativa se evapora y no vuelve directamente a la red de distribución local, aunque sigue dentro del ciclo del agua a nivel más amplio." },
  { q: "¿Se puede reducir este impacto?", a: "Sí: modelos más eficientes, centros de datos con refrigeración que use menos agua, y electricidad generada con fuentes que requieren poca agua (eólica, solar) reducen bastante la huella por consulta." },
];

function Accordion({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
      <button onClick={() => setOpen(o => !o)} className="hi-btn" aria-expanded={open} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", padding: 0, color: "var(--ink)"
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
          <HelpCircle size={15} color="var(--acc-blue)" style={{ flexShrink: 0 }} />
          {q}
        </span>
        <ChevronDown size={16} color="var(--ink-soft)" style={{ flexShrink: 0, marginLeft: 8, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }} />
      </button>
      {open && <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, margin: "10px 0 0 23px" }}>{a}</p>}
    </div>
  );
}

function FaqTab({ setTab }) {
  return (
    <div>
      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <HelpCircle size={17} color="var(--acc-blue)" />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--acc-blue)" }}>Preguntas frecuentes</div>
        </div>
        {FAQS.map(item => <Accordion key={item.q} q={item.q} a={item.a} />)}
      </div>
      <PlayCTA setTab={setTab} text="¿Con todo esto claro? Demostralo jugando" />
    </div>
  );
}

/* =========================================================================
   JUEGO — Gestor de Centro de Datos
   Simulador de decisiones por turnos: elegís dificultad, y durante varios
   días atendés demanda de consultas de IA balanceando presupuesto,
   capacidad, eficiencia, energía renovable y reputación pública, mientras
   un puntaje de sostenibilidad y eventos aleatorios (algunos con decisión
   propia) te complican los planes. Todo calculado con las mismas
   constantes reales que usa el resto de la app.
   ========================================================================= */

// Afirmaciones para la mecánica "Mito / Dato / Depende": aparecen cada tantos
// días de partida y están basadas en los mismos datos y fuentes que el resto
// de la app (ver pestaña Fuentes).
const TRIVIA_BANK = [
  {
    id: "t1",
    statement: "Una consulta de texto a una IA siempre consume exactamente la misma cantidad de agua, sin importar el modelo o el centro de datos.",
    answer: "falso",
    explanation: "Varía muchísimo según el modelo, el hardware, la tecnología de refrigeración y la matriz eléctrica del lugar donde está el centro de datos. Google reportó 0,26 mL de agua directa por prompt mediano en Gemini, pero eso no es un promedio universal.",
  },
  {
    id: "t2",
    statement: "Toda el agua que consume la IA se usa directamente para enfriar los servidores.",
    answer: "falso",
    explanation: "Gran parte es agua indirecta: la que se gasta para generar la electricidad que alimenta al centro de datos. Para mega centros de datos como los que se evalúan en Argentina (ej. Stargate, en Neuquén), se estimó un promedio de 7,1 litros de agua por kWh entre consumo directo e indirecto.",
  },
  {
    id: "t3",
    statement: "Generar una imagen con IA consume más energía que una consulta de texto típica.",
    answer: "verdadero",
    explanation: "En promedio sí: estudios como el de Luccioni et al. (2024) midieron un consumo bastante mayor por imagen generada que por un prompt de texto mediano, aunque también varía según el modelo y la resolución.",
  },
  {
    id: "t4",
    statement: "Usar más energía renovable en un centro de datos reduce automáticamente su huella hídrica total.",
    answer: "depende",
    explanation: "Reduce el agua indirecta (la de generar electricidad), pero no toca el agua directa que se usa para refrigeración. Y algunas fuentes renovables, como la hidroeléctrica, también tienen su propio consumo de agua asociado.",
  },
  {
    id: "t5",
    statement: "Construir un centro de datos en una zona de clima frío elimina el problema del consumo de agua.",
    answer: "depende",
    explanation: "El clima frío reduce la necesidad de refrigeración activa, pero el centro de datos sigue consumiendo agua indirecta a través de la electricidad que usa, y eso depende de la matriz energética de esa región.",
  },
  {
    id: "t6",
    statement: "Todas las empresas de IA publican cifras oficiales y comparables sobre su consumo de agua.",
    answer: "falso",
    explanation: "No todas publican datos, y las que lo hacen usan metodologías distintas (qué cuentan como agua directa o indirecta, qué modelo midieron), por lo que las cifras de distintas empresas no siempre son comparables entre sí.",
  },
];

function pickTrivia(usedIds) {
  const available = TRIVIA_BANK.filter(t => !usedIds.includes(t.id));
  const pool = available.length > 0 ? available : TRIVIA_BANK;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Escenarios de "fuente confiable": una periodista (u otra voz) trae un dato
// dudoso sobre consumo de agua y hay que elegir, entre varias fuentes, cuál
// es la que realmente sostiene el número con metodología verificable.
const SOURCE_SCENARIOS = [
  {
    id: "s1",
    prompt: "\"Circula un dato que dice que una consulta de IA gasta 5 litros de agua. ¿En qué fuente te basás para tu nota?\"",
    sources: [
      { id: "peer", label: "Estudio con metodología publicada por una empresa (Google, 2025)", type: "Informe técnico", reliable: true,
        detail: "Es la fuente más confiable: publica su metodología y una cifra medida (0,26 mL por prompt mediano), aunque solo vale para ese modelo puntual." },
      { id: "viral", label: "Publicación viral en redes sociales", type: "Red social", reliable: false,
        detail: "No cita metodología ni fuente. Esa cifra suele mezclar el consumo de entrenar un modelo grande con el de una consulta cotidiana, que son cosas muy distintas." },
      { id: "press", label: "Nota que cita 'fuentes de la industria' sin nombrarlas", type: "Prensa sin atribución", reliable: false,
        detail: "Puede ser un buen punto de partida, pero sin saber a qué estudio original se refiere, no se puede verificar el número." },
      { id: "noSource", label: "Un comentario en un foro sin ningún link", type: "Sin fuente", reliable: false,
        detail: "Sin fuente verificable no hay forma de confirmar si el dato es real o inventado." },
    ],
  },
  {
    id: "s2",
    prompt: "Alguien afirma que \"toda el agua de la IA se gasta enfriando los servidores\". ¿En qué fuente te basás para corregirlo?",
    sources: [
      { id: "lbnl", label: "Informe del Lawrence Berkeley National Laboratory (2023)", type: "Laboratorio de investigación", reliable: true,
        detail: "Mide específicamente el agua usada para generar la electricidad (agua indirecta), que en muchos casos pesa más que la usada para refrigerar." },
      { id: "company", label: "Comunicado de una empresa sin datos públicos", type: "Comunicado sin metodología", reliable: false,
        detail: "Dice ser 'eficiente con el agua' pero no publica ninguna cifra ni metodología verificable." },
      { id: "blog", label: "Blog personal que repite una cifra sin decir de dónde sale", type: "Blog sin cita", reliable: false,
        detail: "Repite un número sin poder rastrear su origen." },
      { id: "meme", label: "Un meme con una estadística \"impactante\"", type: "Red social", reliable: false,
        detail: "Los memes priorizan el impacto sobre la precisión y casi nunca citan la fuente original." },
    ],
  },
  {
    id: "s3",
    prompt: "\"Me dijeron que entrenar un modelo grande gasta lo mismo que millones de consultas normales. ¿Cómo lo confirmo?\"",
    sources: [
      { id: "arxiv", label: "Paper académico con datos de entrenamiento (arXiv)", type: "Paper revisado", reliable: true,
        detail: "Es la fuente que mide específicamente el consumo de entrenar un modelo grande, un proceso mucho más intensivo que responder consultas sueltas." },
      { id: "exec", label: "Declaración de un ejecutivo en una entrevista de TV", type: "Declaración pública", reliable: false,
        detail: "Puede sonar convincente, pero sin publicar números ni metodología no se puede verificar lo que dice." },
      { id: "forward", label: "Un mensaje reenviado por WhatsApp", type: "Cadena de mensajes", reliable: false,
        detail: "Las cadenas suelen perder contexto y exagerar cifras a medida que se reenvían." },
      { id: "anon", label: "Un usuario anónimo en un foro técnico", type: "Foro sin verificar", reliable: false,
        detail: "Puede tener razón, pero sin credenciales ni fuente citada no hay forma de confirmarlo." },
    ],
  },
];

function pickSourceScenario(usedIds) {
  const available = SOURCE_SCENARIOS.filter(s => !usedIds.includes(s.id));
  const pool = available.length > 0 ? available : SOURCE_SCENARIOS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Misiones narrativas: dividen la partida en 6 etapas con nombre propio,
// cada una con un objetivo opcional que da una pequeña bonificación si se
// cumple. No afectan el balance base del juego si no se cumplen — solo dan
// contexto de historia y una recompensa extra si te esforzás por algo puntual.
const MISSION_DEFS = [
  {
    id: "m1", title: "Puesta en marcha",
    narrative: "Firmaste el contrato: tenés que levantar el centro de datos y empezar a atender consultas de IA sin fundir el presupuesto en el primer tramo.",
    hint: "Terminá esta etapa con presupuesto positivo.",
    evaluate: (s) => s.budget > 0,
    bonus: { type: "reputation", amount: 3 }, bonusLabel: "+3 reputación por arrancar con las cuentas en orden",
  },
  {
    id: "m2", title: "Asegurar el suministro",
    narrative: "El directorio quiere garantías de que no vas a depender solo de la red eléctrica convencional.",
    hint: "Llegá a 30% de energía renovable.",
    evaluate: (s) => s.renewable >= 30,
    bonus: { type: "sustainability", amount: 3 }, bonusLabel: "+3 sostenibilidad por diversificar la energía",
  },
  {
    id: "m3", title: "Cuidar el agua",
    narrative: "Empiezan los reclamos por el uso de agua de la zona. Necesitás demostrar que estás invirtiendo en reducirlo.",
    hint: "Llegá a 30% de enfriamiento eficiente.",
    evaluate: (s) => s.cooling >= 30,
    bonus: { type: "sustainability", amount: 3 }, bonusLabel: "+3 sostenibilidad por invertir en enfriamiento",
  },
  {
    id: "m4", title: "La demanda explota",
    narrative: "Un pico de uso de IA satura las proyecciones. Si no tenés capacidad, vas a dejar consultas sin atender.",
    hint: "Mantené las consultas no atendidas por debajo del 5% del total.",
    evaluate: (s) => (s.totalUnmet / Math.max(1, s.totalServed + s.totalUnmet)) < 0.05,
    bonus: { type: "reputation", amount: 3 }, bonusLabel: "+3 reputación por sostener el servicio",
  },
  {
    id: "m5", title: "Bajo la lupa",
    narrative: "Una periodista y vecinos de la zona empiezan a hacer preguntas sobre el impacto ambiental de tu empresa.",
    hint: "Mantené la reputación por encima de 50.",
    evaluate: (s) => s.reputation >= 50,
    bonus: { type: "sustainability", amount: 3 }, bonusLabel: "+3 sostenibilidad por sostener la confianza pública",
  },
  {
    id: "m6", title: "Balance final",
    narrative: "Se acerca el cierre de esta etapa: la empresa te pide presentar tu balance ambiental completo.",
    hint: "Terminá con la sostenibilidad por encima de 50.",
    evaluate: (s) => s.sustainability >= 50,
    bonus: { type: "reputation", amount: 5 }, bonusLabel: "+5 reputación por un cierre transparente",
  },
];

function missionIndexForDay(day, totalDays, count) {
  const idx = Math.floor(((day - 1) / totalDays) * count);
  return Math.min(count - 1, Math.max(0, idx));
}

const GAME_DIFFICULTIES = {
  facil: { label: "Fácil", days: 10, budget: 11000, demandBase: 420, demandStep: 95, severity: 0.75, threshold: 2.6 },
  normal: { label: "Normal", days: 12, budget: 8000, demandBase: 500, demandStep: 130, severity: 1, threshold: 2.2 },
  dificil: { label: "Difícil", days: 14, budget: 5800, demandBase: 600, demandStep: 170, severity: 1.3, threshold: 1.8 },
};

// Zonas donde se puede construir el centro de datos: cada una modifica el
// punto de partida y los multiplicadores de agua directa/indirecta durante
// toda la partida. No hay una zona objetivamente mejor — cada una trae un
// equilibrio distinto entre agua, energía y costos.
function multiplierLabel(mult) {
  const pct = Math.round((mult - 1) * 100);
  if (pct === 0) return "normal";
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

function zoneEffectChips(z) {
  return [
    { icon: Droplet, label: "Agua directa", value: multiplierLabel(z.waterDirectMult), tone: z.waterDirectMult > 1 ? "var(--acc-red)" : z.waterDirectMult < 1 ? "var(--acc-green)" : "var(--ink-soft)" },
    { icon: Factory, label: "Agua indirecta", value: multiplierLabel(z.waterIndirectMult), tone: z.waterIndirectMult > 1 ? "var(--acc-red)" : z.waterIndirectMult < 1 ? "var(--acc-green)" : "var(--ink-soft)" },
    { icon: Wind, label: "Renovable al arrancar", value: `${z.startRenewable}%`, tone: "var(--acc-blue)" },
    { icon: Snowflake, label: "Enfriamiento al arrancar", value: `${z.startCooling}%`, tone: "var(--acc-blue)" },
    { icon: Wallet, label: "Presupuesto inicial", value: multiplierLabel(z.budgetMult), tone: z.budgetMult > 1 ? "var(--acc-green)" : z.budgetMult < 1 ? "var(--acc-red)" : "var(--ink-soft)" },
  ];
}

const ZONES = [
  { id: "seca", label: "Zona A — Muy seca", emoji: "🏜️",
    desc: "Clima árido con sol casi todo el año. El agua escasea, pero el potencial solar es excelente.",
    startRenewable: 35, startCooling: 0, waterDirectMult: 1.3, waterIndirectMult: 0.85, budgetMult: 1.0 },
  { id: "humeda", label: "Zona B — Abundante agua", emoji: "🌧️",
    desc: "Cerca de un río caudaloso. El agua sobra, pero el terreno y la logística salen caros.",
    startRenewable: 15, startCooling: 5, waterDirectMult: 0.7, waterIndirectMult: 1.0, budgetMult: 0.85 },
  { id: "fria", label: "Zona C — Clima frío", emoji: "❄️",
    desc: "Frío casi todo el año: el aire exterior ayuda a refrigerar los servidores sin tanta agua.",
    startRenewable: 20, startCooling: 20, waterDirectMult: 0.85, waterIndirectMult: 1.0, budgetMult: 1.0 },
];

// Agua "de infraestructura": la que se gasta fabricando el hardware (minería,
// semiconductores, ensamblaje) y no en operar el centro de datos día a día.
// Es una cifra ilustrativa, no una medición precisa — muy difícil de atribuir
// por servidor — pero ayuda a visualizar que existe un tercer tipo de huella
// además de la directa y la indirecta.
const INFRA_WATER_L_PER_CAPACITY_UNIT = 0.03;

function freshGameState(diffKey, zone) {
  const diff = GAME_DIFFICULTIES[diffKey];
  const initialCapacity = 800;
  return {
    diffKey, diff, zone,
    day: 1,
    startingBudget: Math.round(diff.budget * zone.budgetMult),
    budget: Math.round(diff.budget * zone.budgetMult),
    capacity: initialCapacity,
    cooling: zone.startCooling,
    renewable: zone.startRenewable,
    efficiency: 0,
    resilience: 0,
    audited: false,
    sustainability: 60,
    reputation: 55,
    lowSustainStreak: 0,
    purchases: { cooling: 0, renewable: 0, capacity: 0, efficiency: 0, resilience: 0 },
    totalServed: 0,
    totalUnmet: 0,
    totalKWh: 0,
    totalWaterL: 0,
    totalDirectWaterL: 0,
    totalIndirectWaterL: 0,
    totalInfraWaterL: Number((initialCapacity * INFRA_WATER_L_PER_CAPACITY_UNIT).toFixed(2)),
    totalRevenue: 0,
    totalFines: 0,
    history: [],
    event: null,
    eventChoiceResolved: true,
    demand: null,
    dayResult: null,
    finished: false,
    knowledge: { correct: 0, total: 0 },
    trivia: null,
    usedTriviaIds: [],
    usedSourceIds: [],
    currentMissionIndex: 0,
    missionsLog: [],
    missionNote: null,
  };
}

function actionCost(base, purchases) {
  return Math.round(base * (1 + purchases * 0.25));
}

const GAME_ACTION_DEFS = [
  { id: "cooling", label: "Enfriamiento eficiente", icon: Snowflake, color: "var(--acc-teal)", base: 1500,
    desc: "+15% de eficiencia de enfriamiento (reduce el agua directa por consulta)." },
  { id: "renewable", label: "Energía renovable", icon: Wind, color: "var(--acc-green)", base: 1200,
    desc: "+15% de energía renovable (reduce el agua indirecta por consulta)." },
  { id: "capacity", label: "Ampliar capacidad", icon: Server, color: "var(--acc-blue)", base: 2000,
    desc: "+400 consultas/día de capacidad para no perder demanda." },
  { id: "efficiency", label: "Optimizar modelos", icon: Sliders, color: "var(--acc-mustard)", base: 1800,
    desc: "-10% de electricidad por consulta (modelos más chicos o mejor optimizados)." },
  { id: "resilience", label: "Infraestructura resiliente", icon: Factory, color: "var(--acc-purple)", base: 1000,
    desc: "Reduce a la mitad el impacto de olas de calor, sequías y cortes de agua." },
  { id: "audit", label: "Auditoría y transparencia", icon: Award, color: "var(--acc-rose)", base: 800,
    desc: "+8 de reputación al instante y baja el riesgo de escándalos mediáticos." },
  { id: "save", label: "Ahorrar presupuesto", icon: Wallet, color: "var(--acc-graphite)", base: 0,
    desc: "No invertís nada este día. Guardás plata para más adelante." },
];

function costFor(action, state) {
  if (action.id === "save" || action.id === "audit") return action.base;
  return actionCost(action.base, state.purchases[action.id] || 0);
}

const GAME_EVENTS = [
  { id: "calm", weight: 30, label: "Día tranquilo", emoji: "☀️", desc: "Sin sorpresas, operación normal.", kind: "modifier", waterDirectMult: 1, waterIndirectMult: 1, demandMult: 1, capacityMult: 1, renewableBonus: 0 },
  { id: "heatwave", weight: 11, label: "Ola de calor", emoji: "🔥", desc: "El enfriamiento necesita más agua de lo normal.", kind: "modifier", waterDirectMult: 1.4, waterIndirectMult: 1, demandMult: 1, capacityMult: 1, renewableBonus: 0, resistible: true },
  { id: "drought", weight: 10, label: "Sequía regional", emoji: "🌵", desc: "La red eléctrica local recurre a generación más sedienta.", kind: "modifier", waterDirectMult: 1, waterIndirectMult: 1.6, demandMult: 1, capacityMult: 1, renewableBonus: 0, resistible: true },
  { id: "cutback", label: "Recorte de agua municipal", emoji: "🚱", weight: 8, desc: "El municipio limita el agua disponible para refrigeración.", kind: "modifier", waterDirectMult: 1.8, waterIndirectMult: 1, demandMult: 1, capacityMult: 1, renewableBonus: 0, resistible: true },
  { id: "viral", weight: 11, label: "Consulta viral", emoji: "📈", desc: "Un pico de demanda inesperado golpea el data center.", kind: "modifier", waterDirectMult: 1, waterIndirectMult: 1, demandMult: 1.8, capacityMult: 1, renewableBonus: 0 },
  { id: "windy", weight: 9, label: "Día ventoso", emoji: "🌬️", desc: "La red eléctrica regional tira de más energía eólica hoy.", kind: "modifier", waterDirectMult: 1, waterIndirectMult: 1, demandMult: 1, capacityMult: 1, renewableBonus: 25 },
  { id: "maintenance", weight: 8, label: "Mantenimiento programado", emoji: "🔧", desc: "Parte de la capacidad está fuera de línea hoy.", kind: "modifier", waterDirectMult: 1, waterIndirectMult: 1, demandMult: 1, capacityMult: 0.7, renewableBonus: 0 },
  { id: "goodpress", weight: 8, label: "Buena prensa", emoji: "🎉", desc: "Un artículo destaca tus buenas prácticas.", kind: "modifier", waterDirectMult: 1, waterIndirectMult: 1, demandMult: 1, capacityMult: 1, renewableBonus: 0, reputationBonus: 10 },
  { id: "journalist", weight: 5, label: "Una periodista pregunta por tu consumo de agua", emoji: "📰", kind: "choice",
    character: { name: "La periodista", emoji: "📰", color: "var(--acc-rose)" },
    desc: "\"Necesito saber de dónde salen esos números de consumo de agua que publican.\"",
    options: [
      { id: "transparent", label: "Responder con transparencia", effect: "+6 reputación (+10 si ya hiciste una auditoría)",
        resolve: (s) => {
          const bonus = s.audited ? 10 : 6;
          return { patch: { reputation: Math.min(100, s.reputation + bonus) },
            note: s.audited ? "Respondiste con transparencia y mostraste tu auditoría: +10 de reputación." : "Respondiste con transparencia: +6 de reputación." };
        } },
      { id: "dodge", label: "Evadir la pregunta", effect: "50% de nada, 50% de -10 reputación",
        resolve: (s) => Math.random() < 0.5
          ? { patch: { reputation: Math.max(0, s.reputation - 10) }, note: "Evadiste la pregunta y se filtró igual: -10 de reputación." }
          : { patch: {}, note: "Evadiste la pregunta y no pasó nada... por ahora." } },
    ] },
  { id: "scientist", weight: 6, label: "La científica pide financiar un estudio de impacto", emoji: "🔬", kind: "choice",
    character: { name: "La científica", emoji: "🔬", color: "var(--acc-blue)" },
    desc: "\"Necesitamos datos antes de seguir escalando. Denme presupuesto para medir bien el consumo real.\"",
    options: [
      { id: "fund", label: "Financiar el estudio ($900)", effect: "-$900, +8% de eficiencia permanente",
        resolve: (s) => s.budget < 900
          ? { patch: {}, note: "Quisiste financiar el estudio pero no te alcanzó el presupuesto." }
          : { patch: { budget: s.budget - 900, efficiency: Math.min(60, s.efficiency + 8) }, note: "Financiaste el estudio de la científica: +8% de eficiencia permanente." } },
      { id: "skip", label: "Seguir creciendo sin esperar", effect: "-5 sostenibilidad",
        resolve: (s) => ({ patch: { sustainability: Math.max(0, s.sustainability - 5) }, note: "Decidiste no esperar los datos: -5 de sostenibilidad." } ) },
    ] },
  { id: "ceo", weight: 6, label: "El CEO exige acelerar el crecimiento", emoji: "💼", kind: "choice",
    character: { name: "El CEO", emoji: "💼", color: "var(--acc-copper)" },
    desc: "\"Tenemos que crecer ya. Dupliquemos turnos y capacidad, después vemos el impacto.\"",
    options: [
      { id: "accelerate", label: "Acelerar el crecimiento", effect: "+400 capacidad, -10 reputación",
        resolve: (s) => ({ patch: { capacity: s.capacity + 400, reputation: Math.max(0, s.reputation - 10) }, note: "Aceleraste el crecimiento por pedido del CEO: +400 de capacidad, pero -10 de reputación." }) },
      { id: "cautious", label: "Crecer con cautela", effect: "+5 reputación",
        resolve: (s) => ({ patch: { reputation: Math.min(100, s.reputation + 5) }, note: "Le explicaste al CEO que ibas a crecer con cautela: +5 de reputación." }) },
    ] },
  { id: "neighbor", weight: 6, label: "Una vecina reclama por el agua del barrio", emoji: "🏘️", kind: "choice",
    character: { name: "Una vecina", emoji: "🏘️", color: "var(--acc-teal)" },
    desc: "\"Necesitamos esa agua para la comunidad. ¿Van a reducir el consumo o no?\"",
    options: [
      { id: "commit", label: "Comprometerte a reducir el agua directa ($700)", effect: "-$700, +10% de enfriamiento",
        resolve: (s) => s.budget < 700
          ? { patch: {}, note: "Quisiste comprometerte pero no te alcanzó el presupuesto para las obras." }
          : { patch: { budget: s.budget - 700, cooling: Math.min(90, s.cooling + 10) }, note: "Te comprometiste con la vecina e invertiste en reducir el agua directa: +10% de enfriamiento." } },
      { id: "reject", label: "Rechazar el pedido", effect: "-15 reputación",
        resolve: (s) => ({ patch: { reputation: Math.max(0, s.reputation - 15) }, note: "Rechazaste el pedido de la vecina: -15 de reputación." }) },
    ] },
  { id: "engineer", weight: 6, label: "El ingeniero propone optimizar los modelos", emoji: "🧑‍💻", kind: "choice",
    character: { name: "El ingeniero", emoji: "🧑‍💻", color: "var(--acc-mustard)" },
    desc: "\"Puedo optimizar los modelos que usamos y bajar el consumo por consulta. Necesito presupuesto.\"",
    options: [
      { id: "fund", label: "Financiar la optimización ($1000)", effect: "-$1000, +10% de eficiencia",
        resolve: (s) => s.budget < 1000
          ? { patch: {}, note: "No te alcanzó el presupuesto para financiar al ingeniero." }
          : { patch: { budget: s.budget - 1000, efficiency: Math.min(60, s.efficiency + 10) }, note: "Financiaste al ingeniero: +10% de eficiencia." } },
      { id: "later", label: "Decirle que no por ahora", effect: "sin cambios",
        resolve: () => ({ patch: {}, note: "Le dijiste al ingeniero que esperara. Por ahora no cambia nada." }) },
    ] },
  { id: "official", weight: 6, label: "Un funcionario anuncia una nueva regulación ambiental", emoji: "🏛️", kind: "choice",
    character: { name: "El funcionario", emoji: "🏛️", color: "var(--acc-purple)" },
    desc: "\"Hay una nueva regulación sobre uso de agua en centros de datos. Tienen que adaptarse.\"",
    options: [
      { id: "comply", label: "Cumplir de inmediato ($600)", effect: "-$600, +8 reputación, +3 sostenibilidad",
        resolve: (s) => s.budget < 600
          ? { patch: {}, note: "Quisiste cumplir pero no te alcanzó el presupuesto." }
          : { patch: { budget: s.budget - 600, reputation: Math.min(100, s.reputation + 8), sustainability: Math.min(100, s.sustainability + 3) }, note: "Cumpliste con la nueva regulación de inmediato: +8 reputación, +3 sostenibilidad." } },
      { id: "delay", label: "Demorar el cumplimiento", effect: "-8 reputación, -3 sostenibilidad",
        resolve: (s) => ({ patch: { reputation: Math.max(0, s.reputation - 8), sustainability: Math.max(0, s.sustainability - 3) }, note: "Demoraste el cumplimiento: el riesgo regulatorio te pasó factura ahora: -8 reputación, -3 sostenibilidad." }) },
    ] },
  { id: "sourcecheck", weight: 7, label: "Un dato dudoso sobre consumo de agua empieza a circular", emoji: "🔍", kind: "sources",
    character: { name: "La periodista", emoji: "📰", color: "var(--acc-rose)" } },
];

function pickEvent() {
  const total = GAME_EVENTS.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of GAME_EVENTS) {
    if (r < e.weight) return e;
    r -= e.weight;
  }
  return GAME_EVENTS[0];
}

function rollDemand(day, diff, event) {
  const base = diff.demandBase + day * diff.demandStep;
  const noise = 0.85 + Math.random() * 0.3;
  const mult = event.kind === "modifier" ? event.demandMult : 1;
  return Math.round(base * noise * mult);
}

function gradeFor(score) {
  if (score >= 85) return { letter: "A", label: "Data center consciente", color: "var(--acc-green)" };
  if (score >= 65) return { letter: "B", label: "Bastante equilibrado", color: "var(--acc-teal)" };
  if (score >= 45) return { letter: "C", label: "A mitad de camino", color: "var(--acc-mustard)" };
  if (score >= 25) return { letter: "D", label: "Creció a las apuradas", color: "var(--acc-purple)" };
  return { letter: "F", label: "Data center voraz", color: "var(--acc-red)" };
}

function reputationGrade(score) {
  if (score >= 80) return { label: "Muy confiable", color: "var(--acc-green)" };
  if (score >= 55) return { label: "Reputación estable", color: "var(--acc-teal)" };
  if (score >= 30) return { label: "Bajo sospecha", color: "var(--acc-mustard)" };
  return { label: "Reputación dañada", color: "var(--acc-red)" };
}

// --- Fase 5: 5 puntajes de cierre, finales múltiples y ranking ficticio ---

function computeScores(state) {
  const conocimiento = state.knowledge.total > 0 ? Math.round((state.knowledge.correct / state.knowledge.total) * 100) : 50;
  const gestionHidrica = Math.round(Math.min(100, (state.cooling + state.renewable) / 1.8));
  const eficiencia = Math.round(Math.min(100, (state.efficiency / 60) * 70 + (state.renewable / 90) * 30));
  const transparencia = Math.round(Math.min(100, state.reputation * (state.audited ? 1.1 : 1)));
  const impacto = Math.round(state.sustainability);
  return { conocimiento, gestionHidrica, eficiencia, transparencia, impacto };
}

const ENDING_DEFS = [
  { id: "crisis-hidrica", emoji: "💧", title: "Crisis hídrica", color: "var(--acc-red)", bg: "var(--acc-red-bg)",
    match: (s, sc) => sc.impacto < 30,
    tagline: "Tu centro de datos se volvió insostenible: el consumo de agua terminó pesando más que cualquier otro resultado de la gestión." },
  { id: "crisis-confianza", emoji: "📢", title: "Crisis de confianza", color: "var(--acc-rose)", bg: "var(--acc-rose-bg)",
    match: (s, sc) => sc.transparencia < 30,
    tagline: "Entre evasivas y decisiones opacas, perdiste la confianza pública. Los números ambientales ya no le importan a nadie si no confían en vos." },
  { id: "innovador", emoji: "🏆", title: "Innovador", color: "var(--acc-purple)", bg: "var(--acc-purple-bg)",
    match: (s, sc) => sc.eficiencia >= 70 && sc.gestionHidrica >= 70 && sc.conocimiento >= 70,
    tagline: "Invertiste en entender el problema y en resolverlo con tecnología: tu centro de datos es un caso de estudio de cómo achicar la huella hídrica de la IA." },
  { id: "sostenible", emoji: "🌱", title: "Centro de datos sostenible", color: "var(--acc-green)", bg: "var(--acc-green-bg)",
    match: (s, sc) => sc.impacto >= 70 && sc.transparencia >= 60,
    tagline: "Encontraste la forma de crecer sin pisotear el agua ni la confianza pública. No fue el camino más rápido, pero sí el más sólido." },
  { id: "gigante", emoji: "💰", title: "Gigante tecnológico", color: "var(--acc-copper)", bg: "var(--acc-copper-bg)",
    match: (s, sc) => s.capacity >= 1600 && sc.impacto < 60,
    tagline: "Tu centro de datos creció rapidísimo y factura mucho, pero el costo ambiental quedó relegado a un segundo plano." },
  { id: "equilibrio", emoji: "⚖️", title: "Equilibrio", color: "var(--acc-teal)", bg: "var(--acc-teal-bg)",
    match: () => true,
    tagline: "No fuiste el más sostenible ni el más rentable, pero mantuviste todo dentro de rangos razonables. Un resultado prolijo, sin extremos." },
];

function computeEnding(state, scores) {
  return ENDING_DEFS.find(e => e.match(state, scores)) || ENDING_DEFS[ENDING_DEFS.length - 1];
}

function rankTitle(avg) {
  if (avg >= 85) return "🥇 Investigador";
  if (avg >= 70) return "🥈 Gestor responsable";
  if (avg >= 55) return "🥉 Explorador";
  if (avg >= 40) return "Aprendiz";
  return "Debutante";
}

function ScoreBar({ icon: Icon, color, label, value }) {
  return (
    <div className="hi-card" style={{ background: "var(--paper-soft)", borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
          <Icon size={12} color={color} /> {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, color }}>{value}/100</span>
      </div>
      <div style={{ height: 6, background: "var(--paper)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, transition: "width .3s ease" }} />
      </div>
    </div>
  );
}

function computeAchievements(state) {
  const list = [];
  if (state.totalUnmet === 0) list.push({ label: "Cero demanda perdida", icon: Users, color: "var(--acc-blue)" });
  if (state.sustainability >= 90) list.push({ label: "Sostenibilidad ejemplar", icon: Droplets, color: "var(--acc-teal)" });
  if (state.reputation >= 90) list.push({ label: "Confianza pública total", icon: Award, color: "var(--acc-rose)" });
  if (state.purchases.efficiency + state.purchases.cooling + state.purchases.renewable >= 6) list.push({ label: "Ingeniería a fondo", icon: Sliders, color: "var(--acc-mustard)" });
  if (state.totalFines === 0) list.push({ label: "Nunca multado", icon: Wallet, color: "var(--acc-green)" });
  if (state.budget >= state.startingBudget) list.push({ label: "Creció sin gastar de más", icon: TrendingUp, color: "var(--acc-purple)" });
  return list;
}

// Guía paso a paso en lenguaje llano, pensada para alguien que nunca escuchó
// hablar de la huella hídrica de la IA. No asume ningún conocimiento previo.
const GUIDE_STEPS = [
  {
    icon: Gamepad2, color: "var(--acc-blue)", title: "¿Qué es este juego?",
    body: "Vos estás a cargo de un centro de datos: el lugar físico donde viven los servidores que hacen funcionar cosas como ChatGPT o Gemini. Tu trabajo es atender las consultas de gente que usa esa IA, sin quedarte sin plata, sin gastar de más y sin perder la confianza de la gente.",
  },
  {
    icon: Droplets, color: "var(--acc-orange)", title: "¿Y por qué agua? Pensé que era solo electricidad",
    body: "Cada vez que alguien le pregunta algo a una IA, los servidores se calientan y hay que enfriarlos — muchas veces con agua. Además, generar la electricidad que esos servidores usan también gasta agua en las centrales eléctricas. Eso es lo que se llama la 'huella hídrica' de la IA: agua que no se ve, pero se gasta igual.",
  },
  {
    icon: Wallet, color: "var(--dark-panel)", title: "Los números que vas a cuidar",
    body: "💧 Agua y ⚡ Energía: cuánto gastaste en total. 💰 Presupuesto: la plata que tenés para invertir — si llega a cero, no podés hacer más mejoras. 🌱 Sostenibilidad: qué tan responsable fuiste con el ambiente. 🏆 Reputación: cuánto confía la gente en vos. Si la sostenibilidad se mantiene muy baja muchos días seguidos, te llega una multa.",
  },
  {
    icon: ListChecks, color: "var(--acc-blue)", title: "Qué hacés en cada día de partida",
    body: "Cada día llega una cantidad de consultas para atender. Vos elegís UNA sola cosa: invertir en algo (por ejemplo, mejorar el enfriamiento o sumar energía renovable) o ahorrar ese día sin gastar nada. Ojo: comprar la misma mejora muchas veces la va poniendo cada vez más cara.",
  },
  {
    icon: Users, color: "var(--acc-orange)", title: "Te vas a cruzar con personajes y sorpresas",
    body: "Una científica, un CEO, vecinos, un ingeniero, un funcionario y una periodista te van a plantear decisiones en el camino. También aparecen preguntas cortas de 'Mito, Dato o Depende' y casos donde tenés que elegir qué fuente de información es confiable. Todo esto suma o resta a tus números — no hace falta saber la respuesta de antemano, se explica en el momento.",
  },
  {
    icon: Award, color: "var(--dark-panel)", title: "Cómo termina la partida",
    body: "La partida está dividida en 6 'misiones' con nombre propio que te van guiando. Al final, según cómo jugaste, te toca uno de 6 finales posibles (desde 'Centro de datos sostenible' hasta 'Crisis hídrica') y un ranking con 5 puntajes distintos, no solo un número único.",
  },
  {
    icon: Info, color: "var(--acc-blue)", title: "Para arrancar",
    body: "No hace falta entender todo de una: elegí una zona, después la dificultad 'Fácil', y andá probando. Cada botón te avisa qué efecto va a tener antes de que lo elijas, así que podés leer y decidir con calma en cada día.",
  },
];

function HowToPlayGuide({ onDone }) {
  const [step, setStep] = useState(0);
  const current = GUIDE_STEPS[step];
  const Icon = current.icon;
  const isLast = step === GUIDE_STEPS.length - 1;
  return (
    <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, marginBottom: 12, borderTop: `4px solid ${current.color}` }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {GUIDE_STEPS.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= step ? current.color : "var(--paper-soft)", transition: "background .2s" }} />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon size={18} color={current.color} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>Paso {step + 1} de {GUIDE_STEPS.length}</span>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: current.color, marginBottom: 10 }}>{current.title}</div>
      <p style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.7, margin: "0 0 20px" }}>{current.body}</p>
      <div style={{ display: "flex", gap: 8 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="hi-btn" style={ghostBtn}>Anterior</button>
        )}
        <button
          onClick={() => isLast ? onDone() : setStep(s => s + 1)}
          className="hi-btn"
          style={{ ...primaryBtn, flex: 1, justifyContent: "center", background: current.color, color: "var(--on-accent)" }}
        >
          {isLast ? "Entendido, vamos a jugar" : "Siguiente"}
        </button>
      </div>
      {!isLast && (
        <button onClick={onDone} className="hi-btn" style={{ ...ghostBtn, marginTop: 8, width: "100%", justifyContent: "center" }}>
          Saltar la guía
        </button>
      )}
    </div>
  );
}

function Juego() {
  const [zone, setZone] = useState(null);
  const [diffKey, setDiffKey] = useState(null);
  const [state, setState] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [priorWaterKnowledge, setPriorWaterKnowledge] = useState([]);
  const [showGuide, setShowGuide] = useState(false);

  const startGame = (key) => {
    const fresh = freshGameState(key, zone);
    let event = pickEvent();
    if (event.kind === "sources") {
      const scenario = pickSourceScenario([]);
      event = { ...event, scenario };
      fresh.usedSourceIds = [scenario.id];
    }
    fresh.event = event;
    fresh.eventChoiceResolved = event.kind !== "choice" && event.kind !== "sources";
    fresh.demand = rollDemand(1, fresh.diff, event);
    setDiffKey(key);
    setState(fresh);
    setChosen(null);
    setIntroDismissed(false);
    setPriorWaterKnowledge([]);
  };

  const resolveEventChoice = (optionId) => {
    setState(s => {
      const option = s.event.options.find(o => o.id === optionId);
      if (!option) return s;
      const { patch, note } = option.resolve(s);
      return { ...s, ...patch, eventChoiceResolved: true, eventChoiceNote: note };
    });
  };

  const resolveSourceChoice = (sourceId) => {
    setState(s => {
      const scenario = s.event.scenario;
      if (!scenario) return s;
      const source = scenario.sources.find(src => src.id === sourceId);
      if (!source) return s;
      const reliableSource = scenario.sources.find(src => src.reliable);
      let reputation = s.reputation;
      let knowledge = s.knowledge;
      let note;
      if (source.reliable) {
        reputation = Math.min(100, reputation + 8);
        knowledge = { correct: knowledge.correct + 1, total: knowledge.total + 1 };
        note = `Elegiste bien: "${source.label}" es la fuente confiable. ${source.detail} +8 de reputación.`;
      } else {
        reputation = Math.max(0, reputation - 5);
        knowledge = { correct: knowledge.correct, total: knowledge.total + 1 };
        note = `"${source.label}" no es confiable: ${source.detail} La fuente correcta era "${reliableSource.label}". -5 de reputación.`;
      }
      return { ...s, reputation, knowledge, eventChoiceResolved: true, eventChoiceNote: note };
    });
  };

  if (showGuide) {
    return <HowToPlayGuide onDone={() => setShowGuide(false)} />;
  }

  if (!zone) {
    return (
      <div>
        <DataCenterHero />
        <div style={{ background: "var(--dark-panel)", borderRadius: 16, padding: 20, marginBottom: 12, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1.2px, transparent 1.2px)", backgroundSize: "20px 20px", opacity: 0.08, pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Gamepad2 size={17} color="#FFFFFF" />
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#FFFFFF" }}>Sed de Datos</div>
            </div>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", margin: "0 0 12px" }}>
              Antes de arrancar, elegí dónde construir el centro de datos. No hay una zona objetivamente mejor: cada una cambia el equilibrio entre agua, energía y costos.
            </p>
            <button onClick={() => setShowGuide(true)} className="hi-btn" style={{ ...primaryBtn, width: "100%", justifyContent: "center", background: "var(--acc-orange)", color: "#FFFFFF" }}>
              📖 ¿Primera vez? Ver la guía paso a paso
            </button>
          </div>
        </div>

        {ZONES.map(z => (
          <button
            key={z.id}
            onClick={() => setZone(z)}
            className="hi-btn hi-lift"
            style={{
              width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 8, cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.12)", background: "var(--dark-panel)", marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>{z.emoji} {z.label}</div>
              <ArrowRightIcon color="#FFFFFF" />
            </div>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)", margin: "0 0 10px", lineHeight: 1.5 }}>{z.desc}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 6 }}>
              {zoneEffectChips(z).map(chip => {
                const ChipIcon = chip.icon;
                return (
                  <div key={chip.label} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "5px 8px" }}>
                    <ChipIcon size={12} color={chip.tone} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.65)", flex: 1 }}>{chip.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: chip.tone, fontFamily: "var(--font-mono)" }}>{chip.value}</span>
                  </div>
                );
              })}
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (!state) {
    return (
      <div>
        <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, marginBottom: 12, borderTop: "4px solid var(--acc-blue)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Gamepad2 size={17} color="var(--acc-blue)" />
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--acc-blue)" }}>Sed de Datos</div>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: 0 }}>
            {zone.emoji} Construyendo en {zone.label.replace(/^Zona [A-C] — /, "")}. Elegí una dificultad para arrancar.
          </p>
        </div>

        {Object.entries(GAME_DIFFICULTIES).map(([key, d]) => (
          <button
            key={key}
            onClick={() => startGame(key)}
            className="hi-btn hi-lift"
            style={{
              width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 8, cursor: "pointer",
              border: "1px solid var(--line)", background: "var(--paper)", marginBottom: 8,
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{d.label}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{d.days} días · presupuesto inicial ${numFmt(Math.round(d.budget * zone.budgetMult), 0)}</div>
            </div>
            <ArrowRightIcon />
          </button>
        ))}

        <button onClick={() => setZone(null)} className="hi-btn" style={{ ...ghostBtn, marginTop: 4, marginRight: 8 }}>
          <RotateCcw size={13} /> Cambiar zona
        </button>
        <button onClick={() => setShowGuide(true)} className="hi-btn" style={{ ...ghostBtn, marginTop: 4, marginRight: 8 }}>
          📖 Ver guía paso a paso
        </button>
        <button onClick={() => setShowHelp(h => !h)} className="hi-btn" aria-expanded={showHelp} style={{ ...ghostBtn, marginTop: 4 }}>
          <Info size={13} /> {showHelp ? "Ocultar" : "Resumen rápido"}
        </button>
        {showHelp && (
          <div className="hi-card" style={{ background: "var(--paper-soft)", borderRadius: 8, padding: 14, marginTop: 8, fontSize: 12.5, color: "var(--ink)", lineHeight: 1.6 }}>
            Ya elegiste la zona y la dificultad. Cada día llega una demanda de consultas: elegís una inversión (enfriamiento, renovables, más capacidad, eficiencia de modelos, resiliencia o auditoría) o ahorrás.
            Comprar la misma mejora varias veces la hace más cara. Tu <strong>sostenibilidad</strong> sube o baja según cuánta agua gastás por consulta atendida,
            y tu <strong>reputación</strong> según la demanda que dejás sin atender y las decisiones que tomás. En el camino te vas a cruzar con <strong>personajes</strong> que te plantean decisiones,
            preguntas de <strong>Mito/Dato/Depende</strong> y casos donde tenés que elegir la fuente confiable. Las <strong>misiones</strong> marcan el rumbo de la partida, y si la sostenibilidad
            queda muy baja varios días seguidos, te llega una multa. Al final, tu resultado se resume en uno de 6 finales posibles y un ranking de 5 categorías.
          </div>
        )}
      </div>
    );
  }

  const diff = state.diff;

  const resolveDay = () => {
    if (!chosen) return;
    const actionDef = GAME_ACTION_DEFS.find(a => a.id === chosen);
    const cost = costFor(actionDef, state);
    const canAfford = state.budget >= cost;
    const event = state.event;
    const resistFactor = state.resilience > 0 && event.resistible ? Math.max(0.5, 1 - state.resilience * 0.15) : 1;

    let { budget, capacity, cooling, renewable, efficiency, resilience, audited, reputation, purchases } = state;
    purchases = { ...purchases };
    let infraWaterAdded = 0;
    if (canAfford) {
      budget -= cost;
      if (actionDef.id === "cooling") { cooling = Math.min(90, cooling + 15); purchases.cooling++; }
      if (actionDef.id === "renewable") { renewable = Math.min(90, renewable + 15); purchases.renewable++; }
      if (actionDef.id === "capacity") { capacity += 400; purchases.capacity++; infraWaterAdded = 400 * INFRA_WATER_L_PER_CAPACITY_UNIT; }
      if (actionDef.id === "efficiency") { efficiency = Math.min(60, efficiency + 10); purchases.efficiency++; }
      if (actionDef.id === "resilience") { resilience = resilience + 1; purchases.resilience++; }
      if (actionDef.id === "audit") { audited = true; reputation = Math.min(100, reputation + 8); }
    }

    const effectiveCapacity = Math.round(capacity * (event.kind === "modifier" ? event.capacityMult : 1));
    const eventRenewableBonus = event.kind === "modifier" ? event.renewableBonus : 0;
    const effectiveRenewable = Math.min(95, renewable + eventRenewableBonus);
    const demand = state.demand;
    const served = Math.min(demand, effectiveCapacity);
    const unmet = Math.max(0, demand - effectiveCapacity);

    const whPerQuery = GOOGLE_ELECTRICITY_WH * (1 - efficiency / 100);
    const kWh = (served * whPerQuery) / 1000;
    const waterDirectMultRaw = event.kind === "modifier" ? event.waterDirectMult : 1;
    const waterDirectMult = (1 + (waterDirectMultRaw - 1) * resistFactor) * state.zone.waterDirectMult;
    const waterIndirectMultRaw = event.kind === "modifier" ? event.waterIndirectMult : 1;
    const waterIndirectMult = (1 + (waterIndirectMultRaw - 1) * resistFactor) * state.zone.waterIndirectMult;
    const waterDirectMl = served * GOOGLE_DIRECT_WATER_ML * (1 - cooling / 100) * waterDirectMult;
    const waterIndirectL = kWh * GRID_WATER_INTENSITY_L_PER_KWH * (1 - effectiveRenewable / 100) * waterIndirectMult;
    const waterTotalL = waterIndirectL + waterDirectMl / 1000 + infraWaterAdded;

    const repMultiplier = 0.7 + (reputation / 100) * 0.6;
    const revenue = served * 0.13 * repMultiplier;

    const waterPerQueryMl = served > 0 ? (waterTotalL * 1000) / served : 0;
    let sustainDelta = 0;
    if (served > 0) {
      sustainDelta += waterPerQueryMl <= diff.threshold ? 2 : -Math.min(10, Math.round((waterPerQueryMl - diff.threshold) * 3 * diff.severity));
    }
    let repDelta = 0;
    if (unmet > 0) repDelta -= Math.min(8, Math.round(unmet / 200));
    if (event.id === "goodpress") repDelta += event.reputationBonus;

    const newSustainability = Math.max(0, Math.min(100, state.sustainability + sustainDelta));
    const newReputation = Math.max(0, Math.min(100, reputation + repDelta));
    budget += revenue;

    const lowSustainStreak = newSustainability < 35 ? state.lowSustainStreak + 1 : 0;
    let fine = 0;
    if (lowSustainStreak >= 2) {
      fine = 800;
      budget -= fine;
    }

    const dayResult = {
      day: state.day, event, served, unmet, kWh, waterDirectMl, waterIndirectL, waterTotalL,
      revenue, sustainDelta, repDelta, fine, actionTaken: canAfford ? actionDef : null, blocked: !canAfford, cost
    };

    // Cada 3 días (incluido el primero) aparece una afirmación Mito/Dato/Depende
    const triggersTrivia = state.day % 3 === 1;

    setState(s => {
      const triviaItem = triggersTrivia ? pickTrivia(s.usedTriviaIds) : null;
      return {
        ...s,
        budget, capacity, cooling, renewable, efficiency, resilience, audited, purchases,
        sustainability: newSustainability,
        reputation: newReputation,
        lowSustainStreak,
        totalServed: s.totalServed + served,
        totalUnmet: s.totalUnmet + unmet,
        totalKWh: s.totalKWh + kWh,
        totalWaterL: s.totalWaterL + waterTotalL,
        totalDirectWaterL: s.totalDirectWaterL + waterDirectMl / 1000,
        totalIndirectWaterL: s.totalIndirectWaterL + waterIndirectL,
        totalInfraWaterL: s.totalInfraWaterL + infraWaterAdded,
        totalRevenue: s.totalRevenue + revenue,
        totalFines: s.totalFines + fine,
        history: [...s.history, dayResult],
        dayResult,
        trivia: triviaItem ? { ...triviaItem, chosen: null } : null,
        usedTriviaIds: triviaItem ? [...s.usedTriviaIds, triviaItem.id] : s.usedTriviaIds,
      };
    });
  };

  const answerTrivia = (choice) => {
    setState(s => {
      if (!s.trivia || s.trivia.chosen) return s;
      const correct = choice === s.trivia.answer;
      return {
        ...s,
        trivia: { ...s.trivia, chosen: choice, correct },
        knowledge: { correct: s.knowledge.correct + (correct ? 1 : 0), total: s.knowledge.total + 1 },
      };
    });
  };

  const nextDay = () => {
    setChosen(null);
    setState(s => {
      const day = s.day + 1;
      const finished = day > diff.days;
      const oldIdx = missionIndexForDay(s.day, diff.days, MISSION_DEFS.length);
      const newIdx = finished ? MISSION_DEFS.length : missionIndexForDay(day, diff.days, MISSION_DEFS.length);

      let reputation = s.reputation;
      let sustainability = s.sustainability;
      let missionsLog = s.missionsLog;
      let missionNote = null;

      if (newIdx !== oldIdx) {
        const missionDef = MISSION_DEFS[oldIdx];
        const met = missionDef.evaluate(s);
        if (met && missionDef.bonus) {
          if (missionDef.bonus.type === "reputation") reputation = Math.min(100, reputation + missionDef.bonus.amount);
          if (missionDef.bonus.type === "sustainability") sustainability = Math.min(100, sustainability + missionDef.bonus.amount);
        }
        missionsLog = [...missionsLog, { id: missionDef.id, title: missionDef.title, met, bonusLabel: missionDef.bonusLabel }];
        missionNote = { title: missionDef.title, met, bonusLabel: missionDef.bonusLabel };
      }

      if (finished) return { ...s, finished: true, dayResult: null, reputation, sustainability, missionsLog, missionNote };

      let event = pickEvent();
      let usedSourceIds = s.usedSourceIds;
      if (event.kind === "sources") {
        const scenario = pickSourceScenario(usedSourceIds);
        event = { ...event, scenario };
        usedSourceIds = [...usedSourceIds, scenario.id];
      }
      return {
        ...s, day, event, reputation, sustainability, missionsLog, missionNote, usedSourceIds,
        currentMissionIndex: newIdx,
        eventChoiceResolved: event.kind !== "choice" && event.kind !== "sources",
        eventChoiceNote: null,
        demand: rollDemand(day, diff, event),
        dayResult: null,
        trivia: null,
      };
    });
  };

  const restart = () => {
    setState(null);
    setDiffKey(null);
    setChosen(null);
    setZone(null);
    setIntroDismissed(false);
    setPriorWaterKnowledge([]);
  };

  if (state.finished) {
    const glasses = (state.totalWaterL * 1000) / GLASS_OF_WATER_ML;
    const phoneCharges = state.totalKWh / PHONE_CHARGE_KWH;
    const achievements = computeAchievements(state);
    const scores = computeScores(state);
    const ending = computeEnding(state, scores);
    const avgScore = Math.round((scores.conocimiento + scores.gestionHidrica + scores.eficiencia + scores.transparencia + scores.impacto) / 5);

    return (
      <div>
        <div className="hi-card" style={{ background: ending.bg, borderRadius: 12, padding: "22px 20px", marginBottom: 14, textAlign: "center", border: `1px solid ${ending.color}` }}>
          <div style={{ fontSize: 34, marginBottom: 6 }}>{ending.emoji}</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: ending.color, marginBottom: 6 }}>{ending.title}</div>
          <p style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.6, margin: "0 auto", maxWidth: 480 }}>{ending.tagline}</p>
        </div>

        <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Ranking de esta partida</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{rankTitle(avgScore)} · {avgScore}/100</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8, marginBottom: 14 }}>
          <ScoreBar icon={Brain} color="var(--acc-indigo)" label="Conocimiento" value={scores.conocimiento} />
          <ScoreBar icon={Droplets} color="var(--acc-teal)" label="Gestión hídrica" value={scores.gestionHidrica} />
          <ScoreBar icon={Zap} color="var(--acc-mustard)" label="Eficiencia energética" value={scores.eficiencia} />
          <ScoreBar icon={MessageSquare} color="var(--acc-rose)" label="Transparencia" value={scores.transparencia} />
          <ScoreBar icon={Leaf} color="var(--acc-green)" label="Impacto ambiental" value={scores.impacto} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 14 }}>
          <StatBox icon={Users} color="var(--acc-blue)" bg="var(--acc-blue-bg)" value={numFmt(state.totalServed, 0)} label="Consultas atendidas" />
          <StatBox icon={Zap} color="var(--acc-mustard)" bg="var(--acc-mustard-bg)" value={formatEnergy(state.totalKWh * 1000)} label="Electricidad total" />
          <StatBox icon={Droplets} color="var(--acc-teal)" bg="var(--acc-teal-bg)" value={`${numFmt(state.totalWaterL, 1)} L`} label="Agua total" />
          <StatBox icon={Wallet} color="var(--acc-green)" bg="var(--acc-green-bg)" value={`$${numFmt(state.budget, 0)}`} label="Presupuesto final" />
        </div>

        {state.totalFines > 0 && (
          <div className="hi-card" style={{ background: "var(--acc-red-bg)", border: "1px solid var(--acc-red)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, color: "var(--acc-red)" }}>
            Pagaste ${numFmt(state.totalFines, 0)} en multas por sostener la sostenibilidad demasiado baja demasiado tiempo.
          </div>
        )}

        {state.missionsLog && state.missionsLog.length > 0 && (
          <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Compass size={15} color="var(--acc-purple)" />
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>Bitácora de misiones</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {state.missionsLog.map((m, i) => (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "7px 0", borderBottom: i < state.missionsLog.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <span style={{ color: "var(--ink)" }}>{m.title}</span>
                  <span style={{ color: m.met ? "var(--acc-green)" : "var(--ink-soft)", fontWeight: 700, fontSize: 11 }}>{m.met ? "Cumplida" : "No cumplida"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {achievements.length > 0 && (
          <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, marginBottom: 10, color: "var(--ink)" }}>Logros de esta partida</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {achievements.map(ach => {
                const Icon = ach.icon;
                return (
                  <span key={ach.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ach.color + "22", color: ach.color, borderRadius: 20, padding: "6px 12px", fontSize: 11.5, fontWeight: 600 }}>
                    <Icon size={12} /> {ach.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 10, color: "var(--ink)" }}>El agua invisible de tu partida</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--ink-soft)" }}>💧 Agua directa (refrigeración)</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{numFmt(state.totalDirectWaterL, 1)} L</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--ink-soft)" }}>⚡ Agua indirecta (generar electricidad)</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{numFmt(state.totalIndirectWaterL, 1)} L</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--ink-soft)" }}>🖥️ Agua de infraestructura (fabricar hardware)</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{numFmt(state.totalInfraWaterL, 1)} L</span>
            </div>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 }}>
            Antes de jugar dijiste que ya conocías {priorWaterKnowledge.length} de las 3 formas de consumo de agua de la IA.
          </p>
        </div>

        <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 8, color: "var(--ink)" }}>Para ponerlo en contexto</div>
          <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, margin: 0 }}>
            Tu data center gastó el equivalente a <strong style={{ color: "var(--acc-teal)" }}>{numFmt(glasses, 0)} vasos de agua</strong> y
            {" "}<strong style={{ color: "var(--acc-blue)" }}>{numFmt(phoneCharges, 0)} cargas de celular</strong> a lo largo de {diff.days} días atendiendo consultas de IA en dificultad {diff.label.toLowerCase()}, en {zone.label.toLowerCase()}.
          </p>
        </div>

        <button onClick={restart} className="hi-btn" style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
          <RotateCcw size={14} /> Jugar de nuevo
        </button>
      </div>
    );
  }

  if (!introDismissed) {
    const WATER_TYPES = [
      { id: "direct", label: "Agua directa", desc: "La que se usa para refrigerar los servidores del centro de datos." },
      { id: "indirect", label: "Agua indirecta", desc: "La que se gasta generando la electricidad que alimenta al centro de datos." },
      { id: "infra", label: "Agua de infraestructura", desc: "La que se gasta fabricando el hardware: minería, semiconductores, ensamblaje." },
    ];
    const toggleKnown = (id) => {
      setPriorWaterKnowledge(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    return (
      <div>
        <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, marginBottom: 14, borderTop: "4px solid var(--acc-teal)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Droplets size={17} color="var(--acc-teal)" />
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--acc-teal)" }}>El agua invisible</div>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.6, margin: "0 0 14px" }}>
            La huella hídrica de un centro de datos de IA no es una sola cosa: se reparte en tres tipos bien distintos. Antes de arrancar, marcá cuáles ya conocías.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {WATER_TYPES.map(w => {
              const known = priorWaterKnowledge.includes(w.id);
              return (
                <button key={w.id} onClick={() => toggleKnown(w.id)} className="hi-btn" style={{
                  textAlign: "left", padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${known ? "var(--acc-teal)" : "var(--line)"}`,
                  background: known ? "var(--acc-teal-bg)" : "var(--paper-soft)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    {known ? <CheckCircle2 size={14} color="var(--acc-teal)" /> : <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid var(--ink-soft)" }} />}
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{w.label}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "0 0 0 22px" }}>{w.desc}</p>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 10.5, color: "var(--ink-soft)", fontStyle: "italic", margin: "0 0 14px" }}>
            La cifra de agua de infraestructura que vas a ver en el resultado final es una aproximación ilustrativa — es muy difícil de medir con precisión por servidor.
          </p>
          <button onClick={() => setIntroDismissed(true)} className="hi-btn" style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
            Empezar a jugar <ArrowRightIcon />
          </button>
        </div>
      </div>
    );
  }

  const canAffordChosen = chosen ? state.budget >= costFor(GAME_ACTION_DEFS.find(a => a.id === chosen), state) : true;

  return (
    <div key={`${state.day}-${state.dayResult ? "result" : "action"}`} className="hi-day-enter">
      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, marginBottom: 12, borderTop: "4px solid var(--acc-blue)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Gamepad2 size={17} color="var(--acc-blue)" />
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--acc-blue)" }}>Sed de Datos</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-soft)" }}>Día {state.day} / {diff.days} · {diff.label} · {zone.emoji}</span>
            <button onClick={() => setShowGuide(true)} className="hi-btn" aria-label="Ver guía paso a paso" title="Ver guía paso a paso" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--ink-soft)", display: "flex" }}>
              <Info size={15} />
            </button>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0 }}>
          Atendé consultas de IA sin descuidar el agua, la electricidad y tu reputación pública.
        </p>
      </div>

      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: "12px 16px", marginBottom: 12, borderLeft: "4px solid var(--acc-purple)" }}>
        {state.missionNote && (
          <div style={{ marginBottom: 8, fontSize: 12, color: state.missionNote.met ? "var(--acc-green)" : "var(--ink-soft)" }}>
            {state.missionNote.met ? "✅" : "➖"} Misión "{state.missionNote.title}" {state.missionNote.met ? "cumplida" : "no cumplida"}
            {state.missionNote.met ? ` — ${state.missionNote.bonusLabel}` : ""}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Compass size={14} color="var(--acc-purple)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--acc-purple)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Misión {state.currentMissionIndex + 1}/{MISSION_DEFS.length} · {MISSION_DEFS[state.currentMissionIndex].title}
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink)", margin: "0 0 4px", lineHeight: 1.5 }}>{MISSION_DEFS[state.currentMissionIndex].narrative}</p>
        <p style={{ fontSize: 11, color: "var(--ink-soft)", margin: 0 }}>Objetivo: {MISSION_DEFS[state.currentMissionIndex].hint}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
        <StatBox icon={Droplets} color="var(--acc-teal)" bg="var(--acc-teal-bg)" value={`${numFmt(state.totalWaterL, 1)} L`} label="Agua acumulada" delay={0} />
        <StatBox icon={Zap} color="var(--acc-mustard)" bg="var(--acc-mustard-bg)" value={formatEnergy(state.totalKWh * 1000)} label="Energía acumulada" delay={40} />
        <StatBox icon={Wallet} color="var(--acc-green)" bg="var(--acc-green-bg)" value={`$${numFmt(state.budget, 0)}`} label="Presupuesto" delay={80} />
        <StatBox icon={Leaf} color={gradeFor(state.sustainability).color} bg="var(--acc-graphite-bg)" value={`${state.sustainability}`} label="Impacto ambiental" delay={120} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: 8, marginBottom: 12 }}>
        <StatBox icon={Server} color="var(--acc-blue)" bg="var(--acc-blue-bg)" value={numFmt(state.capacity, 0)} label="Capacidad/día" />
        <StatBox icon={Snowflake} color="var(--acc-teal)" bg="var(--acc-teal-bg)" value={`${state.cooling}%`} label="Enfriamiento" />
        <StatBox icon={Wind} color="var(--acc-purple)" bg="var(--acc-purple-bg)" value={`${state.renewable}%`} label="Renovable" />
        <StatBox icon={Sliders} color="var(--acc-mustard)" bg="var(--acc-mustard-bg)" value={`${state.efficiency}%`} label="Eficiencia" />
        <StatBox icon={Factory} color="var(--acc-rose)" bg="var(--acc-rose-bg)" value={numFmt(state.resilience, 0)} label="Resiliencia" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <Gauge value={state.sustainability} color={gradeFor(state.sustainability).color} label="Sostenibilidad" />
        <Gauge value={state.reputation} color={reputationGrade(state.reputation).color} label="Reputación" />
      </div>

      {state.lowSustainStreak >= 1 && (
        <div role="alert" className="hi-card" style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--acc-red-bg)", border: "1px solid var(--acc-red)", borderRadius: 8, padding: "9px 12px", marginBottom: 12 }}>
          <AlertTriangle size={14} color="var(--acc-red)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: "var(--acc-red)" }}>Sostenibilidad muy baja hace {state.lowSustainStreak} día{state.lowSustainStreak > 1 ? "s" : ""}: si sigue así, te multan.</span>
        </div>
      )}

      {state.event && state.event.kind === "modifier" && state.event.id !== "calm" && !state.dayResult && (
        <div className="hi-card" style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "var(--acc-mustard-bg)", border: "1px solid var(--acc-mustard)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
          <AlertTriangle size={15} color="var(--acc-mustard)" style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--acc-mustard)" }}>{state.event.emoji} {state.event.label}</div>
            <div style={{ fontSize: 12, color: "var(--ink)" }}>{state.event.desc}</div>
          </div>
        </div>
      )}

      {state.event && state.event.kind === "choice" && !state.eventChoiceResolved && (
        <div className="hi-card" style={{ background: "var(--acc-indigo-bg, var(--paper-soft))", border: `1px solid ${state.event.character ? state.event.character.color : "var(--acc-purple)"}`, borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
          {state.event.character ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <CharacterAvatar character={state.event.character} />
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: state.event.character.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{state.event.character.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: state.event.character.color }}>
                  {state.event.label}{state.event.emoji !== state.event.character.emoji ? ` ${state.event.emoji}` : ""}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--acc-purple)", marginBottom: 4 }}>{state.event.emoji} {state.event.label}</div>
          )}
          <div style={{ fontSize: 12, color: "var(--ink)", marginBottom: 10, fontStyle: "italic" }}>{state.event.desc}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {state.event.options.map(opt => (
              <button key={opt.id} onClick={() => resolveEventChoice(opt.id)} className="hi-btn" style={{ textAlign: "left", padding: "9px 12px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--paper)", cursor: "pointer" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{opt.effect}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {state.event && state.event.kind === "sources" && !state.eventChoiceResolved && state.event.scenario && (
        <div className="hi-card" style={{ background: "var(--acc-indigo-bg, var(--paper-soft))", border: `1px solid ${state.event.character ? state.event.character.color : "var(--acc-rose)"}`, borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
          {state.event.character ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <CharacterAvatar character={state.event.character} />
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: state.event.character.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{state.event.character.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: state.event.character.color }}>
                  {state.event.label}{state.event.emoji !== state.event.character.emoji ? ` ${state.event.emoji}` : ""}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--acc-rose)", marginBottom: 4 }}>{state.event.emoji} {state.event.label}</div>
          )}
          <div style={{ fontSize: 12, color: "var(--ink)", marginBottom: 10, fontStyle: "italic" }}>{state.event.scenario.prompt}</div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>ⓘ ¿Cuál es la fuente confiable?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {state.event.scenario.sources.map(src => (
              <button key={src.id} onClick={() => resolveSourceChoice(src.id)} className="hi-btn" style={{ textAlign: "left", padding: "9px 12px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--paper)", cursor: "pointer" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{src.label}</div>
                <div style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>{src.type}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {state.eventChoiceNote && !state.dayResult && (
        <div className="hi-card" style={{ background: "var(--paper-soft)", borderRadius: 8, padding: "9px 12px", marginBottom: 12, fontSize: 12, color: "var(--ink-soft)" }}>
          {state.eventChoiceNote}
        </div>
      )}

      {state.eventChoiceResolved && !state.dayResult && (
        <>
          <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Demanda de consultas hoy</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>{numFmt(state.demand, 0)}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {GAME_ACTION_DEFS.map(action => {
              const Icon = action.icon;
              const cost = costFor(action, state);
              const affordable = state.budget >= cost;
              const active = chosen === action.id;
              const disabledAudit = action.id === "audit" && state.audited;
              return (
                <button
                  key={action.id}
                  onClick={() => !disabledAudit && setChosen(action.id)}
                  className="hi-btn"
                  aria-disabled={disabledAudit}
                  aria-pressed={active}
                  style={{
                    textAlign: "left", padding: "11px 14px", borderRadius: 8, cursor: disabledAudit ? "default" : "pointer",
                    border: `1px solid ${active ? action.color : "var(--line)"}`,
                    background: active ? "var(--paper-soft)" : "var(--paper)",
                    opacity: (affordable && !disabledAudit) ? 1 : 0.5,
                    display: "flex", alignItems: "center", gap: 10
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: action.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} color={action.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>
                      {action.label} {cost > 0 && <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--ink-soft)" }}>· ${numFmt(cost, 0)}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                      {disabledAudit ? "Ya hiciste una auditoría esta partida." : action.desc}
                      {!affordable && !disabledAudit ? " (no te alcanza el presupuesto)" : ""}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={resolveDay}
            disabled={!chosen}
            className="hi-btn"
            style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: chosen ? 1 : 0.5, cursor: chosen ? "pointer" : "default" }}
          >
            Confirmar día <ArrowRightIcon />
          </button>
        </>
      )}

      {state.dayResult && (
        <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, border: "1px solid var(--line)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 10, color: "var(--ink)" }}>
            Resultado del día {state.dayResult.day}
          </div>
          {state.dayResult.blocked && (
            <p style={{ fontSize: 12, color: "var(--acc-red)", marginBottom: 8 }}>No te alcanzó el presupuesto, así que no se aplicó ninguna inversión hoy.</p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8, marginBottom: 10 }}>
            <ResultBox icon={Users} color="var(--acc-blue)" bg="var(--acc-blue-bg)" label="Atendidas" value={numFmt(state.dayResult.served, 0)} />
            <ResultBox icon={Zap} color="var(--acc-mustard)" bg="var(--acc-mustard-bg)" label="Electricidad" value={formatEnergy(state.dayResult.kWh * 1000)} />
            <ResultBox icon={Droplets} color="var(--acc-teal)" bg="var(--acc-teal-bg)" label="Agua total" value={`${numFmt(state.dayResult.waterTotalL, 2)} L`} />
          </div>
          {state.dayResult.unmet > 0 && (
            <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>
              No se pudo atender a {numFmt(state.dayResult.unmet, 0)} consultas por falta de capacidad.
            </p>
          )}
          {state.dayResult.fine > 0 && (
            <p style={{ fontSize: 12, color: "var(--acc-red)", marginBottom: 6 }}>
              Multa por sostenibilidad baja sostenida: -${numFmt(state.dayResult.fine, 0)}.
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: state.dayResult.sustainDelta >= 0 ? "var(--acc-green)" : "var(--acc-red)" }}>
              {state.dayResult.sustainDelta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {state.dayResult.sustainDelta >= 0 ? "+" : ""}{state.dayResult.sustainDelta} sostenibilidad
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: state.dayResult.repDelta >= 0 ? "var(--acc-green)" : "var(--acc-red)" }}>
              {state.dayResult.repDelta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {state.dayResult.repDelta >= 0 ? "+" : ""}{state.dayResult.repDelta} reputación
            </span>
          </div>
          {state.trivia && (
            <div className="hi-card" style={{ background: "var(--acc-indigo-bg)", border: "1px solid var(--acc-indigo)", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Brain size={14} color="var(--acc-indigo)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--acc-indigo)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Mito / Dato / Depende</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5, margin: "0 0 10px" }}>{state.trivia.statement}</p>
              {!state.trivia.chosen ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => answerTrivia("verdadero")} className="hi-btn" style={{ flex: 1, padding: "8px 6px", borderRadius: 6, border: "1px solid var(--acc-green)", background: "var(--acc-green-bg)", color: "var(--acc-green)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Verdadero</button>
                  <button onClick={() => answerTrivia("falso")} className="hi-btn" style={{ flex: 1, padding: "8px 6px", borderRadius: 6, border: "1px solid var(--acc-red)", background: "var(--acc-red-bg)", color: "var(--acc-red)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Falso</button>
                  <button onClick={() => answerTrivia("depende")} className="hi-btn" style={{ flex: 1, padding: "8px 6px", borderRadius: 6, border: "1px solid var(--acc-mustard)", background: "var(--acc-mustard-bg)", color: "var(--acc-mustard)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Depende</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "var(--paper)", borderRadius: 6, padding: "10px 12px" }}>
                  {state.trivia.correct
                    ? <CheckCircle2 size={16} color="var(--acc-green)" style={{ flexShrink: 0, marginTop: 1 }} />
                    : <XCircle size={16} color="var(--acc-red)" style={{ flexShrink: 0, marginTop: 1 }} />}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: state.trivia.correct ? "var(--acc-green)" : "var(--acc-red)", marginBottom: 3 }}>
                      {state.trivia.correct ? "¡Correcto!" : `Incorrecto — la respuesta era "${state.trivia.answer}"`}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 }}>{state.trivia.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={nextDay}
            disabled={!!state.trivia && !state.trivia.chosen}
            className="hi-btn"
            style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: (state.trivia && !state.trivia.chosen) ? 0.5 : 1, cursor: (state.trivia && !state.trivia.chosen) ? "default" : "pointer" }}
          >
            {state.day >= diff.days ? "Ver resultado final" : "Día siguiente"}
          </button>
        </div>
      )}

      {state.history.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setShowHistory(h => !h)} className="hi-btn" aria-expanded={showHistory} style={ghostBtn}>
            <ChevronDown size={13} style={{ transform: showHistory ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }} />
            {showHistory ? "Ocultar historial" : "Ver historial de días"}
          </button>
          {showHistory && (
            <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 14, marginTop: 8, maxHeight: 220, overflowY: "auto" }}>
              {state.history.slice().reverse().map(h => (
                <div key={h.day} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line)", fontSize: 11.5 }}>
                  <span style={{ color: "var(--ink-soft)" }}>Día {h.day} · {h.event.emoji}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{numFmt(h.served, 0)} consultas · {numFmt(h.waterTotalL, 2)} L</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ArrowRightIcon({ color }) {
  return <span style={{ fontSize: 14, color: color || "currentColor" }}>→</span>;
}


const SOURCES = [
  { title: "¿Cuánta energía consume la IA de Google? Hicimos los cálculos", org: "Blog oficial de Google (2025)", url: "https://blog.google/intl/es-419/actualizaciones-de-producto/en-la-nube/cuanta-energia-consume-la-ia-de-google-hicimos-los-calculos/", desc: "El anuncio oficial de Google, en español: metodología y cifras (0,24 Wh y 0,26 mL de agua directa por prompt mediano en Gemini)." },
  { title: "Measuring the environmental impact of delivering AI at Google Scale", org: "arXiv 2508.15734 (2025) — documento técnico en inglés", url: "https://arxiv.org/abs/2508.15734v1", desc: "El paper técnico completo detrás del anuncio de Google, con el detalle de la metodología. Solo está disponible en inglés." },
  { title: "Cinco gotas de agua: el costo que dice Google tiene un prompt en Gemini", org: "Digital Trends en Español (2025)", url: "https://es.digitaltrends.com/android/cinco-gotas-de-agua-el-costo-que-dice-google-tiene-un-prompt-en-gemini/", desc: "Cobertura en español que suma las críticas de investigadores (Shaolei Ren, Alex de Vries-Gao) sobre lo que el estudio de Google no cuenta: el agua indirecta." },
  { title: "Google: el indicador Gemini medio utiliza 0,24 vatios-hora de energía y consume 0,26 ml de agua", org: "Data Center Dynamics en español (2025)", url: "https://www.datacenterdynamics.com/es/noticias/google-el-indicador-gemini-medio-utiliza-024-vatios-hora-de-energ%C3%ADa-y-consume-026-ml-de-agua/", desc: "Edición en español de Data Center Dynamics: compara las cifras de Google con las de OpenAI." },
  { title: "Consejos para investigar el consumo masivo de agua por parte de los centros de datos", org: "Global Investigative Journalism Network, GIJN (en español)", url: "https://gijn.org/es/articulos/investigar-consumo-masivo-de-agua-por-centros-de-datos/", desc: "Explica en español la diferencia entre agua directa e indirecta en centros de datos de EE.UU., con los datos del Lawrence Berkeley National Laboratory." },
  { title: "La huella hídrica invisible de la inteligencia artificial", org: "Consejo Latinoamericano de Ética en Tecnología (2026)", url: "https://somosclet.org/la-huella-hidrica-invisible-de-la-inteligencia-artificial/", desc: "Análisis en español sobre agua directa e indirecta, con los mismos datos del Lawrence Berkeley (800 mil millones de litros indirectos en 2023)." },
  { title: "Miden el impacto ecológico de usar ChatGPT-3: 2 litros de agua por 10 a 50 consultas", org: "LA NACIÓN (2024)", url: "https://www.lanacion.com.ar/tecnologia/miden-el-impacto-ecologico-de-usar-chatgpt-3-2-litros-de-agua-por-10-a-50-consultas-nid18102024/", desc: "Cobertura en español del estudio 'Making AI Less Thirsty' sobre el entrenamiento de GPT-3: unos 700.000 litros de agua directa." },
  { title: "¿Cuánta agua consume realmente la IA?", org: "Nation.es (2026)", url: "https://nation.es/cuanta-agua-consume-realmente-la-ia/", desc: "Compara en español las cifras de Google, Mistral y la Universidad de California Riverside, y explica por qué no son directamente comparables entre sí." },
  { title: "Guerra de recursos: el megaproyecto de OpenAI por US$ 25.000M tensiona el agua, la energía y el cobre en Argentina", org: "Acero y Roca (2026)", url: "https://aceroyroca.com/2026/08/08/noticias-openai-stargate-data-center-cobre-rigi-argentina/", desc: "Cobertura en español de Stargate Argentina (Neuquén, hasta 500 MW), con la estimación de 7,1 m³ de agua por cada MWh generado (directa e indirecta) para este tipo de mega centros de datos." },
];

// Intenta usar la capacidad "db" (funciona en una página ya publicada); si no
// está disponible devuelve null y el llamador cae a window.storage (funciona
// en la vista previa del chat, pero no en una página publicada).
async function getDbCapability() {
  try {
    if (typeof window !== "undefined" && window.claude && typeof window.claude.use === "function") {
      const db = await window.claude.use("db");
      return db || null;
    }
  } catch (e) {
    // sin capacidad db disponible en este contexto
  }
  return null;
}

function Fuentes({ setTab }) {
  const [community, setCommunity] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [form, setForm] = useState({ title: "", org: "", url: "", desc: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDbCapability();
        if (db) {
          const snap = await db.collection("community_sources").get();
          const rawDocs = (snap && snap.docs) ? snap.docs : (Array.isArray(snap) ? snap : []);
          const list = rawDocs
            .map(d => (typeof d.data === "function" ? d.data() : d))
            .filter(Boolean);
          if (list.length > 0) setCommunity(list);
          setLoadingCommunity(false);
          return;
        }
      } catch (e) {
        // la capacidad db falló en este contexto, caemos a window.storage
      }
      try {
        const res = await window.storage.get(COMMUNITY_SOURCES_KEY, true);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          if (Array.isArray(parsed)) setCommunity(parsed);
        }
      } catch (e) {
        // todavía no hay fuentes cargadas por la comunidad
      } finally {
        setLoadingCommunity(false);
      }
    })();
  }, []);

  const updateForm = (patch) => { setForm(f => ({ ...f, ...patch })); setFormError(""); };

  const submitSource = async () => {
    const title = form.title.trim();
    const org = form.org.trim();
    const url = form.url.trim();
    const desc = form.desc.trim();
    if (!title) { setFormError("Falta el título de la fuente."); return; }
    if (!/^https?:\/\/.+/i.test(url)) { setFormError("El link tiene que empezar con http:// o https://"); return; }

    setSubmitting(true);
    const entry = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, title, org, url, desc, addedAt: Date.now() };

    try {
      const db = await getDbCapability();
      if (db) {
        await db.doc(`community_sources/${entry.id}`).set(entry);
        setCommunity(c => [...c, entry]);
        setForm({ title: "", org: "", url: "", desc: "" });
        setFormSuccess(true);
        setTimeout(() => setFormSuccess(false), 3500);
        setSubmitting(false);
        return;
      }
    } catch (e) {
      // la capacidad db falló en este contexto, caemos a window.storage
    }

    const next = [...community, entry];
    try {
      const result = await window.storage.set(COMMUNITY_SOURCES_KEY, JSON.stringify(next), true);
      if (result) {
        setCommunity(next);
        setForm({ title: "", org: "", url: "", desc: "" });
        setFormSuccess(true);
        setTimeout(() => setFormSuccess(false), 3500);
      } else {
        setFormError("No se pudo guardar la fuente. Probá de nuevo en un momento.");
      }
    } catch (e) {
      setFormError("No se pudo guardar la fuente. Probá de nuevo en un momento.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%", background: "var(--paper-soft)", border: "1px solid var(--line)", borderRadius: 6,
    padding: "9px 11px", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--font-body)", marginBottom: 10,
  };

  return (
    <div>
      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 16, marginBottom: 14, borderTop: "4px solid var(--acc-blue)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Link2 size={17} color="var(--acc-blue)" />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--acc-blue)" }}>Fuentes</div>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: 0 }}>
          Todos los datos de esta app están basados en estudios y disclosures públicos. Podés leer el original en cada enlace. El simulador "Sed de Datos" usa como base principal la metodología que Google publicó para Gemini; la Calculadora usa la de OpenAI y UC Riverside — otras empresas y estudios miden distinto y a veces dan cifras más altas o más bajas; lo aclaramos en cada sección donde puede generar confusión.
        </p>
      </div>
      {SOURCES.map((s, i) => (
        <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="hi-card hi-row hi-lift" style={{
          display: "block", background: "var(--paper)", borderRadius: 8, padding: 14, marginBottom: 8,
          textDecoration: "none", border: "1px solid var(--line)", animationDelay: `${i * 40}ms`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: "var(--acc-blue)", fontWeight: 600, marginBottom: 6 }}>{s.org}</div>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
            </div>
            <ExternalLink size={14} color="var(--ink-soft)" style={{ flexShrink: 0, marginTop: 2 }} />
          </div>
        </a>
      ))}

      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 16, margin: "20px 0 10px", borderTop: "4px solid var(--dark-panel)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Users size={17} color="var(--dark-panel)" />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--dark-panel)" }}>Fuentes de la comunidad</div>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: 0 }}>
          Cualquiera que use esta app puede sumar un enlace acá abajo. Son públicas: las va a poder ver cualquier otra persona que entre a esta sección.
        </p>
      </div>

      {loadingCommunity ? (
        <p style={{ fontSize: 12, color: "var(--ink-soft)", padding: "6px 2px" }}>Cargando fuentes de la comunidad…</p>
      ) : community.length === 0 ? (
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", padding: "6px 2px" }}>Todavía no hay fuentes agregadas por la comunidad. ¡Sé el primero!</p>
      ) : (
        community.map((s, i) => (
          <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="hi-card hi-row hi-lift" style={{
            display: "block", background: "var(--paper)", borderRadius: 8, padding: 14, marginBottom: 8,
            textDecoration: "none", border: "1px solid var(--dark-panel)", animationDelay: `${i * 40}ms`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{s.title}</div>
                {s.org && <div style={{ fontSize: 11, color: "var(--dark-panel)", fontWeight: 600, marginBottom: 6 }}>{s.org}</div>}
                {s.desc && <p style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 }}>{s.desc}</p>}
              </div>
              <ExternalLink size={14} color="var(--ink-soft)" style={{ flexShrink: 0, marginTop: 2 }} />
            </div>
          </a>
        ))
      )}

      <div className="hi-card" style={{ background: "var(--paper)", borderRadius: 10, padding: 18, margin: "12px 0 14px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 10, color: "var(--ink)" }}>Sumar una fuente</div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)" }}>Título *</label>
        <input type="text" value={form.title} onChange={e => updateForm({ title: e.target.value })} placeholder="Nombre del estudio o artículo" style={inputStyle} maxLength={140} />
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)" }}>Organización o autor</label>
        <input type="text" value={form.org} onChange={e => updateForm({ org: e.target.value })} placeholder="Ej: MIT Technology Review (2026)" style={inputStyle} maxLength={100} />
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)" }}>Link *</label>
        <input type="url" value={form.url} onChange={e => updateForm({ url: e.target.value })} placeholder="https://..." style={inputStyle} maxLength={300} />
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)" }}>Por qué es relevante (opcional)</label>
        <textarea value={form.desc} onChange={e => updateForm({ desc: e.target.value })} placeholder="Una o dos líneas sobre qué aporta esta fuente" rows={2} maxLength={280} style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font-body)" }} />

        {formError && (
          <p style={{ fontSize: 12, color: "var(--acc-red)", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={13} /> {formError}
          </p>
        )}
        {formSuccess && (
          <p style={{ fontSize: 12, color: "var(--acc-green)", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={13} /> ¡Gracias! Tu fuente ya está publicada para todos.
          </p>
        )}

        <button onClick={submitSource} disabled={submitting} className="hi-btn" style={{ ...primaryBtn, opacity: submitting ? 0.6 : 1, cursor: submitting ? "default" : "pointer" }}>
          <Plus size={14} /> {submitting ? "Guardando…" : "Agregar fuente"}
        </button>
      </div>

      <div style={{ marginTop: 6 }}>
        <PlayCTA setTab={setTab} text="Con todas las fuentes a mano, probá tomar vos las decisiones" />
      </div>
    </div>
  );
}

