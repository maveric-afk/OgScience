import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { globalStyles, Cursor, Reveal } from "./Home";

/* ─── EXTRA STYLES (page-specific) ───────────────────── */
const extraStyles = `
  .og-range { -webkit-appearance: none; appearance: none; width: 100%; height: 2px; background: rgba(255,255,255,0.18); border-radius: 2px; outline: none; }
  .og-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 0 12px rgba(255,255,255,0.5); border: none; }
  .og-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #fff; border: none; box-shadow: 0 0 12px rgba(255,255,255,0.5); }
  .chip { padding: 8px 18px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: rgba(255,255,255,0.55); font-family: 'DM Sans', sans-serif; font-size: 12px; letter-spacing: 0.06em; transition: all .25s ease; }
  .chip:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
  .chip.active { background: #fff; color: #080808; border-color: #fff; }
  .search-input { width: 100%; max-width: 320px; padding: 12px 20px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; transition: border-color .25s; }
  .search-input:focus { border-color: rgba(255,255,255,0.4); }
  .search-input::placeholder { color: rgba(255,255,255,0.3); }
  .sim-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
  @media (max-width: 900px) { .sim-layout { grid-template-columns: 1fr; } }
  @keyframes modalIn { from { opacity: 0; transform: translateY(24px) scale(.98); } to { opacity: 1; transform: none; } }
`;

/* ─── SIMULATION CATALOGUE ───────────────────────────── */
const SIMS = [
    { id: "projectile", title: "Projectile Motion", cat: "Physics", icon: "🎯", live: true, desc: "Launch a projectile and see how angle, speed and gravity shape its path." },
    { id: "pendulum", title: "Pendulum", cat: "Physics", icon: "🕰️", live: true, desc: "Explore period, damping and amplitude in a swinging pendulum." },
    { id: "waves", title: "Wave Interference", cat: "Physics", icon: "🌊", live: true, desc: "Two coherent sources create bright and dark bands of interference." },
    { id: "bonding", title: "Chemical Bonding", cat: "Chemistry", icon: "🧪", live: false, desc: "Watch atoms share and transfer electrons to form molecules." },
    { id: "gas", title: "Ideal Gas Law", cat: "Chemistry", icon: "🎈", live: false, desc: "Change pressure, volume and temperature of a box of particles." },
    { id: "cells", title: "Cell Division", cat: "Biology", icon: "🧬", live: false, desc: "Step through mitosis and meiosis, phase by phase." },
];
const CATS = ["All", ...Array.from(new Set(SIMS.map(s => s.cat)))];

const DEFAULTS = {
    projectile: { angle: 45, speed: 30, gravity: 9.8 },
    pendulum: { length: 1.5, gravity: 9.8, damping: 0.05, angle0: 50 },
    waves: { wavelength: 40, frequency: 1.2, separation: 140 },
};

/* ─── CANVAS DRAWING ─────────────────────────────────── */
const BLUE = "138,180,255";

function drawGrid(ctx, W, H) {
    ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function glowDot(ctx, x, y, r, rgb = "255,255,255") {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, `rgba(${rgb},0.5)`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

function projectileMath(p) {
    const th = p.angle * Math.PI / 180;
    const vx = p.speed * Math.cos(th), vy = p.speed * Math.sin(th);
    const T = 2 * vy / p.gravity;
    return { vx, vy, T, R: vx * T, Hm: vy * vy / (2 * p.gravity) };
}

const DRAW = {
    projectile(ctx, W, H, p, st, dt) {
        ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H); drawGrid(ctx, W, H);
        const { vx, vy, T, R, Hm } = projectileMath(p);
        const pad = 50, gy = H - 50;
        const s = Math.min((W - pad * 2) / Math.max(R, 1), (gy - 40) / Math.max(Hm, 1));
        const X = t => pad + vx * t * s, Y = t => gy - (vy * t - 0.5 * p.gravity * t * t) * s;

        ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();

        ctx.setLineDash([4, 7]); ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.beginPath(); for (let i = 0; i <= 60; i++) { const t = T * i / 60; i ? ctx.lineTo(X(t), Y(t)) : ctx.moveTo(X(t), Y(t)); } ctx.stroke();
        ctx.setLineDash([]);

        if (st.running) { st.t += dt; if (st.t >= T) { st.t = T; st.running = false; } }
        st.t = Math.min(st.t, T);

        ctx.strokeStyle = `rgba(${BLUE},0.9)`; ctx.lineWidth = 2;
        ctx.beginPath(); for (let i = 0; i <= 60; i++) { const t = st.t * i / 60; i ? ctx.lineTo(X(t), Y(t)) : ctx.moveTo(X(t), Y(t)); } ctx.stroke();

        // launch angle arc
        ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(pad, gy, 36, -p.angle * Math.PI / 180, 0); ctx.stroke();
        glowDot(ctx, X(st.t), Y(st.t), 6, BLUE);
    },

    pendulum(ctx, W, H, p, st, dt) {
        ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H); drawGrid(ctx, W, H);
        const steps = 8, h = Math.min(dt, 0.033) / steps;
        for (let i = 0; i < steps; i++) {
            const a = -(p.gravity / p.length) * Math.sin(st.th) - p.damping * 2 * st.w;
            st.w += a * h; st.th += st.w * h;
        }
        const px = W / 2, py = 50, s = (H - 110) / 3.2;
        const bx = px + Math.sin(st.th) * p.length * s, by = py + Math.cos(st.th) * p.length * s;
        st.trail.push({ x: bx, y: by }); if (st.trail.length > 70) st.trail.shift();

        st.trail.forEach((q, i) => { ctx.fillStyle = `rgba(${BLUE},${(i / st.trail.length) * 0.35})`; ctx.beginPath(); ctx.arc(q.x, q.y, 2.5, 0, Math.PI * 2); ctx.fill(); });
        ctx.setLineDash([3, 6]); ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + p.length * s + 20); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.fillRect(px - 60, py - 8, 120, 2);
        glowDot(ctx, bx, by, 11, BLUE);
    },

    waves(ctx, W, H, p, st, dt) {
        st.t += dt;
        ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);
        const k = 2 * Math.PI / p.wavelength, w = 2 * Math.PI * p.frequency;
        const cy = H / 2, sx = 50, y1 = cy - p.separation / 2, y2 = cy + p.separation / 2, step = 5;
        for (let x = 0; x < W; x += step) {
            for (let y = 0; y < H; y += step) {
                const r1 = Math.hypot(x - sx, y - y1), r2 = Math.hypot(x - sx, y - y2);
                const v = (Math.sin(k * r1 - w * st.t) / (1 + r1 / 250) + Math.sin(k * r2 - w * st.t) / (1 + r2 / 250)) / 2;
                ctx.fillStyle = v > 0 ? `rgba(255,255,255,${Math.min(v * 1.1, 1) * 0.85})` : `rgba(${BLUE},${Math.min(-v * 1.1, 1) * 0.6})`;
                ctx.fillRect(x, y, step, step);
            }
        }
        glowDot(ctx, sx, y1, 5); glowDot(ctx, sx, y2, 5);
    },
};

function initState(id, p) {
    if (id === "projectile") return { t: 0, running: false };
    if (id === "pendulum") return { th: p.angle0 * Math.PI / 180, w: 0, trail: [] };
    return { t: 0 };
}

function getStats(id, p) {
    if (id === "projectile") {
        const m = projectileMath(p);
        return [["Range", `${m.R.toFixed(1)} m`], ["Max height", `${m.Hm.toFixed(1)} m`], ["Flight time", `${m.T.toFixed(2)} s`]];
    }
    if (id === "pendulum") {
        const T = 2 * Math.PI * Math.sqrt(p.length / p.gravity);
        return [["Period (small angle)", `${T.toFixed(2)} s`], ["Frequency", `${(1 / T).toFixed(2)} Hz`]];
    }
    const k = 2 * Math.PI / p.wavelength;
    return [["Wave speed", `${(p.wavelength * p.frequency).toFixed(0)} px/s`], ["Wavenumber k", `${k.toFixed(3)} rad/px`], ["Period", `${(1 / p.frequency).toFixed(2)} s`]];
}

const FORMULAS = {
    projectile: "R = v²·sin(2θ) / g",
    pendulum: "T = 2π √(L / g)",
    waves: "Δ = n·λ  (constructive)",
};

/* ─── UI PIECES ──────────────────────────────────────── */
function Slider({ label, unit = "", min, max, step = 1, value, onChange }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>
                <span style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                <span className="syne" style={{ color: "#fff", fontWeight: 700 }}>{value}{unit}</span>
            </div>
            <input type="range" className="og-range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} />
        </div>
    );
}

const CONTROLS = {
    projectile: [
        { key: "angle", label: "Launch angle", unit: "°", min: 5, max: 85, step: 1 },
        { key: "speed", label: "Initial speed", unit: " m/s", min: 10, max: 60, step: 1 },
        { key: "gravity", label: "Gravity", unit: " m/s²", min: 1, max: 25, step: 0.1 },
    ],
    pendulum: [
        { key: "length", label: "Length", unit: " m", min: 0.5, max: 3, step: 0.1 },
        { key: "gravity", label: "Gravity", unit: " m/s²", min: 1, max: 25, step: 0.1 },
        { key: "damping", label: "Damping", unit: "", min: 0, max: 0.5, step: 0.01 },
        { key: "angle0", label: "Start angle", unit: "°", min: 10, max: 80, step: 1 },
    ],
    waves: [
        { key: "wavelength", label: "Wavelength", unit: " px", min: 20, max: 80, step: 1 },
        { key: "frequency", label: "Frequency", unit: " Hz", min: 0.5, max: 3, step: 0.1 },
        { key: "separation", label: "Source separation", unit: " px", min: 40, max: 300, step: 5 },
    ],
};

/* ─── SIMULATION VIEWER (modal) ──────────────────────── */
function Viewer({ sim, onClose }) {
    const canvasRef = useRef(null);
    const [params, setParams] = useState(DEFAULTS[sim.id]);
    const pRef = useRef(params); pRef.current = params;
    const stRef = useRef(initState(sim.id, params));

    useEffect(() => {
        const c = canvasRef.current, ctx = c.getContext("2d"), W = c.width, H = c.height;
        let raf, last = performance.now();
        const loop = now => {
            const dt = Math.min((now - last) / 1000, 0.05); last = now;
            DRAW[sim.id](ctx, W, H, pRef.current, stRef.current, dt);
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [sim.id]);

    useEffect(() => {
        const onKey = e => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, []);

    // pendulum: restart when start angle changes
    useEffect(() => { if (sim.id === "pendulum") Object.assign(stRef.current, initState("pendulum", params)); }, [params.angle0]);

    const reset = () => { setParams(DEFAULTS[sim.id]); Object.assign(stRef.current, initState(sim.id, DEFAULTS[sim.id])); };
    const stats = getStats(sim.id, params);

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(14px)", overflowY: "auto", padding: "clamp(16px,4vw,48px)", animation: "fadeIn .3s both" }}>
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: 1180, margin: "0 auto", background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "clamp(20px,3vw,36px)", animation: "modalIn .5s cubic-bezier(.16,1,.3,1) both" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16 }}>
                    <div>
                        <div className="tag" style={{ marginBottom: 12 }}>{sim.cat}</div>
                        <h2 className="syne" style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 800, letterSpacing: "-0.02em" }}>{sim.icon} {sim.title}</h2>
                    </div>
                    <button className="btn-ghost" onClick={onClose} style={{ padding: "10px 20px" }}>Close ✕</button>
                </div>

                <div className="sim-layout">
                    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", background: "#0a0a0a", alignSelf: "start" }}>
                        <canvas ref={canvasRef} width={760} height={420} style={{ width: "100%", height: "auto", display: "block" }} />
                    </div>

                    <div className="card-glass" style={{ padding: 24, transform: "none" }}>
                        <div className="syne" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>Controls</div>
                        {CONTROLS[sim.id].map(c => (
                            <Slider key={c.key} label={c.label} unit={c.unit} min={c.min} max={c.max} step={c.step} value={params[c.key]} onChange={v => setParams(prev => ({ ...prev, [c.key]: v }))} />
                        ))}

                        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                            {sim.id === "projectile" && <button className="btn-primary" style={{ padding: "10px 22px", fontSize: 13 }} onClick={() => { stRef.current.t = 0; stRef.current.running = true; }}>Launch ▶</button>}
                            {sim.id === "pendulum" && <button className="btn-primary" style={{ padding: "10px 22px", fontSize: 13 }} onClick={() => Object.assign(stRef.current, initState("pendulum", pRef.current))}>Release ▶</button>}
                            <button className="btn-ghost" style={{ padding: "10px 22px", fontSize: 13 }} onClick={reset}>Reset</button>
                        </div>

                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
                            {stats.map(([l, v]) => (
                                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 10 }}>
                                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{l}</span>
                                    <span className="syne" style={{ fontWeight: 700, color: "#fff" }}>{v}</span>
                                </div>
                            ))}
                            <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(138,180,255,0.08)", border: "1px solid rgba(138,180,255,0.2)", fontFamily: "monospace", fontSize: 12, color: "rgba(138,180,255,0.95)", textAlign: "center" }}>
                                {FORMULAS[sim.id]}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── PAGE ───────────────────────────────────────────── */
const Simulations = () => {
    const navigate = useNavigate();
    const [cat, setCat] = useState("All");
    const [q, setQ] = useState("");
    const [active, setActive] = useState(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const s = document.createElement("style");
        s.textContent = globalStyles + extraStyles;
        document.head.appendChild(s);
        window.scrollTo(0, 0);
        const fn = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", fn);
        return () => { document.head.removeChild(s); window.removeEventListener("scroll", fn); };
    }, []);

    const list = useMemo(() => SIMS.filter(s =>
        (cat === "All" || s.cat === cat) && (s.title + s.desc + s.cat).toLowerCase().includes(q.toLowerCase())
    ), [cat, q]);

    return (
        <div style={{ background: "#080808", minHeight: "100vh", position: "relative" }}>
            <div className="noise-overlay" />
            <Cursor />
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 70% 50% at 50% 0%,rgba(40,40,60,0.45) 0%,transparent 70%)" }} />

            {/* Navbar */}
            <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 500, padding: "0 clamp(16px,4vw,48px)", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(8,8,8,0.85)" : "transparent", backdropFilter: scrolled ? "blur(24px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none", transition: "all .4s ease" }}>
                <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#080808", fontFamily: "Syne" }}>O</span>
                    </div>
                    <span className="syne" style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>OgScience</span>
                </div>
                <button className="btn-ghost" onClick={() => navigate("/")} style={{ padding: "9px 22px", fontSize: 13 }}>← Home</button>
            </nav>

            {/* Header */}
            <section className="sec-pad" style={{ position: "relative", zIndex: 2, paddingBottom: 40, paddingTop: "clamp(120px,16vw,170px)" }}>
                <div className="inner-wrap">
                    <div className="tag" style={{ animation: "fadeUp .8s both" }}>The Lab</div>
                    <h1 className="syne" style={{ fontSize: "clamp(40px,7vw,80px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: 24, animation: "fadeUp .9s 100ms both" }}>
                        Explore <span className="shimmer-text">Simulations</span>
                    </h1>
                    <p style={{ fontSize: "clamp(14px,1.6vw,18px)", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 520, marginBottom: 40, animation: "fadeUp .9s 200ms both" }}>
                        Pick a concept, change the variables and watch the science respond in real time.
                    </p>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", animation: "fadeUp .9s 300ms both" }}>
                        <input className="search-input" placeholder="Search simulations…" value={q} onChange={e => setQ(e.target.value)} />
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {CATS.map(c => <button key={c} className={`chip ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="sec-pad" style={{ position: "relative", zIndex: 2, paddingTop: 40 }}>
                <div className="inner-wrap">
                    {list.length === 0 && <div style={{ color: "rgba(255,255,255,0.35)", textAlign: "center", padding: 60 }}>No simulations match your search.</div>}
                    <div className="grid-3col" style={{ gap: 20 }}>
                        {list.map((s, i) => (
                            <Reveal key={s.id} delay={i * 50}>
                                <div className="card-glass" onClick={() => s.live && setActive(s)} style={{ padding: "32px 28px", height: "100%", opacity: s.live ? 1 : 0.6, display: "flex", flexDirection: "column" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                        <div style={{ fontSize: 34 }}>{s.icon}</div>
                                        <span style={{ padding: "4px 12px", borderRadius: 100, background: s.live ? "rgba(138,180,255,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${s.live ? "rgba(138,180,255,0.3)" : "rgba(255,255,255,0.1)"}`, fontSize: 11, color: s.live ? "rgba(138,180,255,0.95)" : "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>{s.live ? "● Live" : "Coming soon"}</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{s.cat}</div>
                                    <h3 className="syne" style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{s.title}</h3>
                                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginBottom: 24, flex: 1 }}>{s.desc}</p>
                                    {s.live && <div className="syne" style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Launch →</div>}
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px clamp(16px,4vw,48px)", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em", position: "relative", zIndex: 2 }}>
                © 2026 OgScience. Making science tangible.
            </footer>

            {active && <Viewer key={active.id} sim={active} onClose={() => setActive(null)} />}
        </div>
    );
};

export default Simulations;