import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";

/* ─── FONT INJECTION ─────────────────────────────────── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
    "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap";
document.head.appendChild(fontLink);

/* ─── GLOBAL STYLES (exported so Simulations.jsx can reuse them) ─── */
export const globalStyles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #080808; color: #e8e8e8; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
  @media (min-width: 769px) { *, *::before, *::after { cursor: none !important; } }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0d0d0d; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

  .syne { font-family: 'Syne', sans-serif; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }

  /* ── LOADER ── */
  @keyframes loaderFadeOut { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.04); } }
  @keyframes loaderGridPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes loaderRingCW  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes loaderRingCCW { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
  @keyframes loaderDotPulse { 0%,100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
  @keyframes loaderBrandFlicker { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }

  /* ── ATOM CURSOR ── */
  @keyframes electronSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  /* ── BUTTONS ── */
  .btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 32px; background: #fff; color: #080808;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 0.04em;
    border: none; border-radius: 100px;
    transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease;
    position: relative; overflow: hidden; white-space: nowrap; text-decoration: none;
  }
  @media (max-width: 768px) { .btn-primary { cursor: pointer; font-size: 13px; padding: 12px 24px; } }
  .btn-primary::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
    background-size: 200% 100%; background-position: -200% center; transition: background-position 0.5s ease;
  }
  .btn-primary:hover { transform: scale(1.04); box-shadow: 0 12px 40px rgba(255,255,255,0.2); }
  .btn-primary:hover::after { background-position: 200% center; }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 32px; background: transparent; color: #e8e8e8;
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 14px; letter-spacing: 0.04em;
    border: 1px solid rgba(255,255,255,0.2); border-radius: 100px;
    transition: all 0.3s ease; backdrop-filter: blur(10px); white-space: nowrap; text-decoration: none;
  }
  @media (max-width: 768px) { .btn-ghost { cursor: pointer; font-size: 13px; padding: 12px 24px; } }
  .btn-ghost:hover { border-color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.06); }

  .card-glass {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px; backdrop-filter: blur(20px); transition: all 0.4s cubic-bezier(.16,1,.3,1);
  }
  .card-glass:hover {
    background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.18);
    transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,0,0,0.5);
  }

  .tag {
    display: inline-block; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
    letter-spacing: 0.12em; text-transform: uppercase; color: #999;
    padding: 6px 14px; border: 1px solid rgba(255,255,255,0.12); border-radius: 100px; margin-bottom: 24px;
  }
  .gradient-text {
    background: linear-gradient(135deg, #fff 0%, #999 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .shimmer-text {
    background: linear-gradient(90deg, #888 0%, #fff 40%, #888 60%, #fff 100%); background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: shimmer 3s linear infinite;
  }
  .noise-overlay {
    position: fixed; inset: 0; z-index: 1000; pointer-events: none; opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }
  .section-line { width: 48px; height: 1px; background: linear-gradient(90deg, rgba(255,255,255,0.6), transparent); margin-bottom: 20px; }
  .stat-number {
    font-family: 'Syne', sans-serif; font-size: clamp(36px, 5vw, 64px); font-weight: 800;
    background: linear-gradient(135deg, #fff, #666);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1;
  }

  /* ── RESPONSIVE GRIDS ── */
  .grid-2col    { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
  .grid-4col    { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; }
  .grid-3col    { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .grid-2col-eq { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; }
  @media (max-width: 1024px) { .grid-4col { grid-template-columns: repeat(2,1fr); } .grid-3col { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 768px) {
    .grid-2col { grid-template-columns: 1fr; gap: 48px; }
    .grid-4col { grid-template-columns: 1fr 1fr; }
    .grid-3col { grid-template-columns: 1fr 1fr; }
    .grid-2col-eq { grid-template-columns: 1fr; }
  }
  @media (max-width: 480px) { .grid-4col { grid-template-columns: 1fr; } .grid-3col { grid-template-columns: 1fr; } }

  .sec-pad { padding: 140px 48px; }
  @media (max-width: 1024px) { .sec-pad { padding: 100px 32px; } }
  @media (max-width: 768px)  { .sec-pad { padding: 80px 20px; } }
  @media (max-width: 480px)  { .sec-pad { padding: 64px 16px; } }
  .inner-wrap { max-width: 1200px; margin: 0 auto; }

  /* ── NAVBAR RESPONSIVE ── */
  .nav-links-desktop { display: flex; }
  .nav-cta-desktop   { display: inline-flex; }
  .nav-hamburger     { display: none; }
  @media (max-width: 768px) {
    .nav-links-desktop { display: none !important; }
    .nav-cta-desktop   { display: none !important; }
    .nav-hamburger     { display: flex !important; }
  }
`;

/* ══════════════════════════════════════════════════════
   LOADING SCREEN
══════════════════════════════════════════════════════ */
function LoadingScreen({ onDone }) {
    const canvasRef = useRef(null);
    const [pct, setPct] = useState(0);
    const [displayPct, setDisplayPct] = useState(0);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize();
        const particles = Array.from({ length: 70 }, () => ({
            x: Math.random(), progress: Math.random(),
            size: Math.random() * 1.8 + 0.4, speed: Math.random() * 0.004 + 0.002, dx: (Math.random() - 0.5) * 0.06,
        }));
        let raf;
        const draw = () => {
            const W = canvas.width, H = canvas.height;
            ctx.clearRect(0, 0, W, H);
            particles.forEach(p => {
                p.progress += p.speed;
                if (p.progress > 1) { p.progress = 0; p.x = Math.random(); }
                const alpha = p.progress < 0.1 ? p.progress * 10 : p.progress > 0.85 ? (1 - p.progress) / 0.15 : 1;
                const x = (p.x + p.dx * p.progress) * W;
                const y = H * (1 - p.progress);
                ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${alpha * 0.22})`; ctx.fill();
            });
            raf = requestAnimationFrame(draw);
        };
        draw();
        window.addEventListener("resize", resize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    }, []);

    useEffect(() => {
        const schedule = [[150, 16], [500, 38], [950, 62], [1450, 80], [1950, 92], [2400, 100]];
        const timers = schedule.map(([ms, val]) => setTimeout(() => setPct(val), ms));
        const exitT = setTimeout(() => setExiting(true), 2900);
        const doneT = setTimeout(() => onDone(), 3550);
        return () => { timers.forEach(clearTimeout); clearTimeout(exitT); clearTimeout(doneT); };
    }, []);

    useEffect(() => {
        const iv = setInterval(() => setDisplayPct(p => p < pct ? Math.min(p + 1, pct) : p), 16);
        return () => clearInterval(iv);
    }, [pct]);

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9000, background: "#080808",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden",
            animation: exiting ? "loaderFadeOut 0.65s cubic-bezier(.4,0,.2,1) forwards" : "none",
            pointerEvents: exiting ? "none" : "all",
        }}>
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
            <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "linear-gradient(rgba(255,255,255,0.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.028) 1px,transparent 1px)",
                backgroundSize: "72px 72px", animation: "loaderGridPulse 4s ease-in-out infinite",
            }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 68%)", filter: "blur(30px)", pointerEvents: "none" }} />

            {/* Electron orbits */}
            <div style={{ position: "absolute", width: "min(300px,70vw)", height: "min(300px,70vw)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)", animation: "loaderRingCW 14s linear infinite" }}>
                <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: "rgba(138,180,255,0.9)", boxShadow: "0 0 10px rgba(138,180,255,0.8)" }} />
            </div>
            <div style={{ position: "absolute", width: "min(210px,50vw)", height: "min(210px,50vw)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.05)", animation: "loaderRingCCW 9s linear infinite" }}>
                <div style={{ position: "absolute", bottom: -3, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }} />
            </div>
            <div style={{ position: "absolute", width: "min(140px,34vw)", height: "min(140px,34vw)", borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.06)", animation: "loaderRingCW 6s linear infinite" }} />

            <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, boxShadow: "0 0 40px rgba(255,255,255,0.18)" }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#080808", fontFamily: "Syne,sans-serif" }}>O</span>
                </div>
                <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "clamp(20px,5vw,30px)", letterSpacing: "-0.02em", color: "#fff", marginBottom: 6, animation: "loaderBrandFlicker 2s ease-in-out infinite" }}>
                    OgScience
                </div>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 52, fontFamily: "DM Sans,sans-serif" }}>
                    Simulate the Universe
                </div>
                <div style={{ width: "min(300px,68vw)" }}>
                    <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.09)", borderRadius: 1, overflow: "hidden", marginBottom: 14, position: "relative" }}>
                        <div style={{ position: "absolute", top: -1, width: 12, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.9)", filter: "blur(3px)", left: `calc(${pct}% - 6px)`, transition: "left 0.5s cubic-bezier(.4,0,.2,1)" }} />
                        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,rgba(255,255,255,0.25),rgba(255,255,255,0.85))", borderRadius: 1, transition: "width 0.5s cubic-bezier(.4,0,.2,1)", boxShadow: "0 0 6px rgba(255,255,255,0.3)" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.45)", animation: `loaderDotPulse 1.2s ease-in-out ${i * 0.22}s infinite` }} />
                            ))}
                            <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginLeft: 8, fontFamily: "DM Sans,sans-serif" }}>Initializing Lab</span>
                        </div>
                        <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em" }}>
                            {String(displayPct).padStart(2, "0")}%
                        </span>
                    </div>
                </div>
            </div>

            {[[{ top: 20, left: 20 }, { borderTop: "1px solid rgba(255,255,255,0.13)", borderLeft: "1px solid rgba(255,255,255,0.13)" }],
            [{ top: 20, right: 20 }, { borderTop: "1px solid rgba(255,255,255,0.13)", borderRight: "1px solid rgba(255,255,255,0.13)" }],
            [{ bottom: 20, left: 20 }, { borderBottom: "1px solid rgba(255,255,255,0.13)", borderLeft: "1px solid rgba(255,255,255,0.13)" }],
            [{ bottom: 20, right: 20 }, { borderBottom: "1px solid rgba(255,255,255,0.13)", borderRight: "1px solid rgba(255,255,255,0.13)" }]
            ].map(([pos, border], i) => (
                <div key={i} style={{ position: "absolute", ...pos, width: 22, height: 22, ...border }} />
            ))}
        </div>
    );
}

/* ─── ATOM CURSOR (desktop only) ─────────────────────────
   Nucleus follows the pointer exactly; three tilted electron
   orbits follow with easing; a fading particle trail is drawn behind.
──────────────────────────────────────────────────────── */
export function Cursor() {
    const orbitRef = useRef(null);
    const scaleRef = useRef(null);
    const nucleusRef = useRef(null);
    const trailRef = useRef(null);
    const pos = useRef({ x: -100, y: -100 });
    const actual = useRef({ x: -100, y: -100 });
    const points = useRef([]);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (window.matchMedia("(max-width:768px)").matches) return;
        setShow(true);
        const onMove = e => {
            pos.current = { x: e.clientX, y: e.clientY };
            const hot = e.target.closest && e.target.closest("a,button,input,select,label");
            if (scaleRef.current) scaleRef.current.style.transform = hot ? "scale(1.7)" : "scale(1)";
        };
        window.addEventListener("mousemove", onMove);
        let raf;
        const loop = () => {
            actual.current.x += (pos.current.x - actual.current.x) * 0.14;
            actual.current.y += (pos.current.y - actual.current.y) * 0.14;
            if (orbitRef.current) { orbitRef.current.style.left = actual.current.x + "px"; orbitRef.current.style.top = actual.current.y + "px"; }
            if (nucleusRef.current) { nucleusRef.current.style.left = pos.current.x + "px"; nucleusRef.current.style.top = pos.current.y + "px"; }

            const c = trailRef.current;
            if (c) {
                if (c.width !== window.innerWidth || c.height !== window.innerHeight) { c.width = window.innerWidth; c.height = window.innerHeight; }
                const ctx = c.getContext("2d");
                ctx.clearRect(0, 0, c.width, c.height);
                points.current.push({ x: pos.current.x, y: pos.current.y });
                if (points.current.length > 22) points.current.shift();
                const n = points.current.length;
                points.current.forEach((p, i) => {
                    const k = i / n;
                    ctx.beginPath(); ctx.arc(p.x, p.y, 0.8 + k * 2.2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(138,180,255,${k * 0.35})`; ctx.fill();
                });
            }
            raf = requestAnimationFrame(loop);
        };
        loop();
        return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
    }, []);

    if (!show) return null;
    const orbits = [{ tilt: 0, dur: 2.6 }, { tilt: 60, dur: 3.4 }, { tilt: 120, dur: 4.2 }];
    return (
        <>
            <canvas ref={trailRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9997 }} />
            <div ref={orbitRef} style={{ position: "fixed", width: 0, height: 0, pointerEvents: "none", zIndex: 9998 }}>
                <div ref={scaleRef} style={{ position: "absolute", left: -22, top: -22, width: 44, height: 44, transition: "transform .3s cubic-bezier(.16,1,.3,1)" }}>
                    {orbits.map((o, i) => (
                        <div key={i} style={{ position: "absolute", inset: 0, transform: `rotate(${o.tilt}deg) scaleY(0.38)` }}>
                            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.22)", animation: `electronSpin ${o.dur}s linear infinite` }}>
                                <div style={{ position: "absolute", top: -2.5, left: "50%", marginLeft: -2.5, width: 5, height: 5, borderRadius: "50%", background: "#8ab4ff", boxShadow: "0 0 8px #8ab4ff" }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div ref={nucleusRef} style={{ position: "fixed", width: 7, height: 7, background: "#fff", borderRadius: "50%", pointerEvents: "none", zIndex: 9999, transform: "translate(-50%,-50%)", boxShadow: "0 0 10px rgba(255,255,255,0.8)" }} />
        </>
    );
}

/* ─── THREE.JS HERO: 3D ATOM ─────────────────────────────
   Nucleus of protons/neutrons, three tilted electron orbits,
   glowing electrons, faint electron-cloud shell, drifting particles.
──────────────────────────────────────────────────────── */
function HeroCanvas() {
    const mountRef = useRef(null);
    useEffect(() => {
        const el = mountRef.current; if (!el) return;
        const W = el.clientWidth, H = el.clientHeight;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        el.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
        camera.position.set(0, 0, 7);

        const atom = new THREE.Group();
        atom.position.x = W > 900 ? 2.2 : 0; // keep headline readable on wide screens
        scene.add(atom);

        /* Nucleus */
        const nucleus = new THREE.Group(); atom.add(nucleus);
        const protonMat = new THREE.MeshPhongMaterial({ color: 0xf2f2f2, emissive: 0x222222, shininess: 90 });
        const neutronMat = new THREE.MeshPhongMaterial({ color: 0x4a7bd1, emissive: 0x0b1a33, shininess: 90 });
        const nGeo = new THREE.SphereGeometry(0.2, 24, 24);
        for (let i = 0; i < 14; i++) {
            const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.18 + Math.random() * 0.3);
            const m = new THREE.Mesh(nGeo, i % 2 ? protonMat : neutronMat); m.position.copy(v); nucleus.add(m);
        }

        /* Electron-cloud shell */
        const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 2), new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true, transparent: true, opacity: 0.35 }));
        atom.add(shell);

        /* Orbits + electrons */
        const orbitDefs = [
            { r: 2.0, rot: [Math.PI / 2.3, 0, 0], speed: 1.0 },
            { r: 2.6, rot: [Math.PI / 2.3, 0, Math.PI / 3], speed: -0.75 },
            { r: 3.2, rot: [Math.PI / 2.3, 0, -Math.PI / 3], speed: 0.55 },
        ];
        const electronMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x6fa0ff, transparent: true, opacity: 0.25 });
        const electrons = [];
        orbitDefs.forEach(def => {
            const g = new THREE.Group(); g.rotation.set(...def.rot); atom.add(g);
            g.add(new THREE.Mesh(new THREE.TorusGeometry(def.r, 0.008, 8, 220), new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.7 })));
            [0, Math.PI].forEach(offset => {
                const e = new THREE.Group();
                e.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), electronMat));
                e.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), glowMat));
                g.add(e);
                electrons.push({ mesh: e, angle: offset, r: def.r, speed: def.speed });
            });
        });

        /* Drifting particles */
        const pPos = new Float32Array(900); for (let i = 0; i < 900; i++) pPos[i] = (Math.random() - 0.5) * 16;
        const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
        const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x666666, size: 0.025, transparent: true, opacity: 0.6 }));
        scene.add(points);

        scene.add(new THREE.AmbientLight(0x333333));
        const dl1 = new THREE.DirectionalLight(0xffffff, 0.9); dl1.position.set(3, 3, 4); scene.add(dl1);
        const dl2 = new THREE.DirectionalLight(0x4488ff, 0.6); dl2.position.set(-3, -1, 2); scene.add(dl2);

        let mouse = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, t = 0, raf;
        const onMouse = e => { mouse.x = (e.clientX / window.innerWidth - 0.5) * 2; mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2; };
        window.addEventListener("mousemove", onMouse);

        const animate = () => {
            t += 0.01;
            tgt.x += (mouse.x - tgt.x) * 0.05; tgt.y += (mouse.y - tgt.y) * 0.05;
            atom.rotation.y = t * 0.15 + tgt.x * 0.6;
            atom.rotation.x = 0.25 + tgt.y * 0.35;
            nucleus.rotation.y = t * 0.8; nucleus.rotation.x = t * 0.5;
            nucleus.scale.setScalar(1 + Math.sin(t * 3) * 0.04);
            shell.rotation.y = -t * 0.3;
            electrons.forEach(e => {
                e.angle += e.speed * 0.025;
                e.mesh.position.set(Math.cos(e.angle) * e.r, Math.sin(e.angle) * e.r, 0);
            });
            points.rotation.y = t * 0.02;
            renderer.render(scene, camera); raf = requestAnimationFrame(animate);
        };
        animate();

        const onResize = () => {
            const W2 = el.clientWidth, H2 = el.clientHeight;
            camera.aspect = W2 / H2; camera.updateProjectionMatrix(); renderer.setSize(W2, H2);
            atom.position.x = W2 > 900 ? 2.2 : 0;
        };
        window.addEventListener("resize", onResize);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("mousemove", onMouse); window.removeEventListener("resize", onResize);
            renderer.dispose(); if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        };
    }, []);
    return <div ref={mountRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />;
}

/* ─── PARTICLE BG ─────────────────────────────────────── */
function ParticleBg() {
    const ref = useRef(null);
    useEffect(() => {
        const c = ref.current, ctx = c.getContext("2d");
        let W = c.width = window.innerWidth, H = c.height = window.innerHeight;
        const pts = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 1.5 + 0.5 }));
        let raf;
        const draw = () => { ctx.clearRect(0, 0, W, H); pts.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fill(); }); raf = requestAnimationFrame(draw); };
        draw();
        const onResize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
        window.addEventListener("resize", onResize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
    }, []);
    return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.4 }} />;
}

/* ─── SCROLL REVEAL ──────────────────────────────────── */
function useReveal() {
    const ref = useRef(null); const [v, setV] = useState(false);
    useEffect(() => { const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.08 }); if (ref.current) obs.observe(ref.current); return () => obs.disconnect(); }, []);
    return [ref, v];
}
export function Reveal({ children, delay = 0, style = {} }) {
    const [ref, v] = useReveal();
    return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(40px)", transition: `opacity .9s cubic-bezier(.16,1,.3,1) ${delay}ms,transform .9s cubic-bezier(.16,1,.3,1) ${delay}ms`, ...style }}>{children}</div>;
}

/* ─── NAVBAR ──────────────────────────────────────────── */
function Navbar() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    useEffect(() => { const fn = () => setScrolled(window.scrollY > 40); window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn); }, []);
    const links = [["#HowItWorks", "How It Works"], ["#Subjects", "Subjects"], ["#Featured", "Featured"], ["#About", "About"]];
    return (
        <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 500, padding: "0 clamp(16px,4vw,48px)", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(8,8,8,0.85)" : "transparent", backdropFilter: scrolled ? "blur(24px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none", transition: "all .4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, zIndex: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#080808", fontFamily: "Syne" }}>O</span>
                </div>
                <span className="syne" style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>OgScience</span>
            </div>
            <div className="nav-links-desktop" style={{ gap: 36 }}>
                {links.map(([href, label]) => (
                    <a key={href} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", textDecoration: "none", fontFamily: "DM Sans", letterSpacing: "0.02em", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.55)"}>{label}</a>
                ))}
            </div>
            <button className="btn-primary nav-cta-desktop" onClick={() => navigate("/simulations")} style={{ padding: "10px 24px", fontSize: 13 }}>Explore →</button>
            <button onClick={() => setOpen(!open)} className="nav-hamburger" style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 10px", cursor: "pointer", flexDirection: "column", gap: 4, zIndex: 2 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 18, height: 1.5, background: "#fff", borderRadius: 1, transition: "all .3s", transform: open ? (i === 0 ? "rotate(45deg) translate(4px,4px)" : i === 2 ? "rotate(-45deg) translate(4px,-4px)" : "scaleX(0)") : "none" }} />)}
            </button>
            {open && (
                <div style={{ position: "absolute", top: 68, left: 0, right: 0, background: "rgba(10,10,10,0.97)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "24px clamp(16px,4vw,48px) 32px", display: "flex", flexDirection: "column", gap: 20, zIndex: 1 }}>
                    {links.map(([href, label]) => (
                        <a key={href} href={href} onClick={() => setOpen(false)} style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", textDecoration: "none", fontFamily: "DM Sans" }}>{label}</a>
                    ))}
                    <button className="btn-primary" onClick={() => navigate("/simulations")} style={{ marginTop: 8, justifyContent: "center", cursor: "pointer" }}>Explore →</button>
                </div>
            )}
        </nav>
    );
}

/* ─── HERO ────────────────────────────────────────────── */
function Hero() {
    const navigate = useNavigate();
    return (
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", background: "radial-gradient(ellipse 80% 60% at 50% 0%,rgba(40,40,40,0.4) 0%,transparent 70%)" }}>
            <HeroCanvas />
            {[0.25, 0.5, 0.75].map(p => <div key={p} style={{ position: "absolute", left: `${p * 100}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.03)", zIndex: 1 }} />)}
            <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)", width: "100%", paddingTop: "clamp(100px,15vw,140px)", pointerEvents: "none" }}>
                <div style={{ maxWidth: 680 }}>
                    <div className="tag" style={{ animation: "fadeUp .8s both" }}>Interactive Science Simulations</div>
                    <h1 className="syne" style={{ fontSize: "clamp(40px,8vw,80px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: 28, animation: "fadeUp .9s 100ms both" }}>
                        See Science<br /><span className="shimmer-text">Come Alive</span><br />in Simulation
                    </h1>
                    <p style={{ fontSize: "clamp(14px,1.6vw,18px)", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 480, marginBottom: 44, animation: "fadeUp .9s 200ms both" }}>
                        OgScience turns physics, chemistry, biology and math into hands-on simulations. Change a variable, watch the universe respond — no textbook required.
                    </p>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", animation: "fadeUp .9s 300ms both", pointerEvents: "auto" }}>
                        <button className="btn-primary" onClick={() => navigate("/simulations")}>Explore →</button>
                        <a className="btn-ghost" href="#HowItWorks">How It Works</a>
                    </div>
                    <div style={{ display: "flex", gap: "clamp(24px,4vw,48px)", marginTop: 72, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.07)", flexWrap: "wrap", animation: "fadeUp .9s 400ms both" }}>
                        {[["50+", "Simulations"], ["6", "Science Subjects"], ["100K+", "Learners Reached"]].map(([n, l]) => (
                            <div key={l}>
                                <div className="syne" style={{ fontSize: "clamp(22px,3vw,28px)", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{n}</div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2, animation: "fadeIn 1s 1s both" }}>
                <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom,rgba(255,255,255,0.4),transparent)" }} />
            </div>
        </section>
    );
}

/* ─── ABOUT ───────────────────────────────────────────── */
function About() {
    const navigate = useNavigate();
    const cards = [
        { icon: "⚛️", label: "Interactive by Design", desc: "Drag sliders, change variables, see results instantly" },
        { icon: "📐", label: "Real Equations", desc: "Driven by actual physics, not pre-recorded animations" },
        { icon: "🧪", label: "Learn by Doing", desc: "Experiment freely and build intuition through play" },
        { icon: "🌐", label: "Runs Anywhere", desc: "Works in your browser on phone, tablet or laptop" },
    ];
    return (
        <section className="sec-pad" id="About" style={{ position: "relative", zIndex: 2 }}>
            <div className="inner-wrap">
                <div className="grid-2col">
                    <Reveal>
                        <div className="section-line" />
                        <div className="tag">What is OgScience?</div>
                        <h2 className="syne" style={{ fontSize: "clamp(28px,4.5vw,56px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.025em", marginBottom: 28 }}>
                            Where Concepts Become Experiments
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: 20, fontSize: 15 }}>
                            Equations on a page are hard to feel. A pendulum swinging, a wave interfering, a planet curving around a star — that is where understanding clicks.
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.8, fontSize: 15, marginBottom: 36 }}>
                            OgScience builds simulations of science concepts that students, teachers and curious minds can explore, break and rebuild. Our mission: make science something you can touch.
                        </p>
                        <button className="btn-ghost" onClick={() => navigate("/simulations")}>Try a Simulation →</button>
                    </Reveal>
                    <Reveal delay={150}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            {cards.map((c, i) => (
                                <div key={i} className="card-glass" style={{ padding: "28px 24px" }}>
                                    <div style={{ fontSize: 28, marginBottom: 14 }}>{c.icon}</div>
                                    <div className="syne" style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#fff" }}>{c.label}</div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>{c.desc}</div>
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

/* ─── HOW IT WORKS ────────────────────────────────────── */
function HowItWorks() {
    const steps = [
        { n: "01", icon: "🔭", title: "Pick a Concept", desc: "Browse simulations across physics, chemistry, biology, math and more." },
        { n: "02", icon: "🎛️", title: "Tune Variables", desc: "Adjust angle, mass, frequency, gravity — every slider changes the physics." },
        { n: "03", icon: "📈", title: "Observe Live", desc: "Watch the system evolve in real time with live readouts of key quantities." },
        { n: "04", icon: "💡", title: "Understand Deeply", desc: "Connect what you see to the underlying equation and make it stick." },
    ];
    return (
        <section className="sec-pad" id="HowItWorks" style={{ background: "linear-gradient(180deg,transparent 0%,rgba(20,20,20,0.5) 50%,transparent 100%)", position: "relative", zIndex: 2 }}>
            <div className="inner-wrap">
                <Reveal style={{ textAlign: "center", marginBottom: 80 }}>
                    <div className="tag" style={{ display: "inline-block" }}>Process</div>
                    <h2 className="syne" style={{ fontSize: "clamp(28px,4.5vw,56px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.025em" }}>
                        From Curiosity to Clarity <br /><span className="gradient-text">in 4 Steps</span>
                    </h2>
                </Reveal>
                <div className="grid-4col">
                    {steps.map((s, i) => (
                        <Reveal key={i} delay={i * 100}>
                            <div className="card-glass" style={{ padding: "36px 28px", height: "100%" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                                    <span style={{ fontFamily: "Syne", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>{s.n}</span>
                                    <span style={{ fontSize: 28 }}>{s.icon}</span>
                                </div>
                                <h3 className="syne" style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#fff" }}>{s.title}</h3>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>{s.desc}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── SUBJECTS ────────────────────────────────────────── */
function Subjects() {
    const subjects = [
        { icon: "⚡", title: "Physics", desc: "Motion, waves, optics, electricity and thermodynamics." },
        { icon: "🧪", title: "Chemistry", desc: "Atoms, bonding, reactions and the behaviour of gases." },
        { icon: "🧬", title: "Biology", desc: "Cells, genetics, ecosystems and the machinery of life." }
    ];
    return (
        <section className="sec-pad" id="Subjects" style={{ position: "relative", zIndex: 2 }}>
            <div className="inner-wrap">
                <Reveal style={{ marginBottom: 80 }}>
                    <div className="section-line" />
                    <div className="tag">Subjects</div>
                    <h2 className="syne" style={{ fontSize: "clamp(28px,4.5vw,56px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.025em", maxWidth: 600 }}>
                        Every Branch of <span className="gradient-text">Science</span>, Simulated
                    </h2>
                </Reveal>
                <div className="grid-3col">
                    {subjects.map((s, i) => (
                        <Reveal key={i} delay={i * 60}>
                            <div className="card-glass" style={{ padding: "32px 28px" }}>
                                <div style={{ fontSize: 36, marginBottom: 18 }}>{s.icon}</div>
                                <h3 className="syne" style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: "#fff" }}>{s.title}</h3>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>{s.desc}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── FEATURED SIMULATIONS ────────────────────────────── */
function Featured() {
    const navigate = useNavigate();
    const sims = [
        { name: "Projectile Motion", sector: "Physics · Kinematics", desc: "Launch a projectile and see how angle, speed and gravity shape its path.", tag: "Live", icon: "🎯", color: "#1a1a2a" },
        { name: "Pendulum", sector: "Physics · Oscillations", desc: "Explore period, damping and energy in a swinging pendulum.", tag: "Live", icon: "🕰️", color: "#1a2a2a" },
        { name: "Wave Interference", sector: "Physics · Waves", desc: "Two sources, one pattern — watch constructive and destructive interference form.", tag: "Live", icon: "🌊", color: "#1a2a1a" },
        { name: "Planetary Orbits", sector: "Astronomy · Gravity", desc: "Bend orbits with mass and velocity, from circles to ellipses.", tag: "Soon", icon: "🪐", color: "#2a1a1a" },
    ];
    return (
        <section className="sec-pad" id="Featured" style={{ position: "relative", zIndex: 2 }}>
            <div className="inner-wrap">
                <Reveal style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 60, flexWrap: "wrap", gap: 20 }}>
                    <div>
                        <div className="section-line" />
                        <div className="tag">Featured</div>
                        <h2 className="syne" style={{ fontSize: "clamp(28px,4.5vw,56px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.025em" }}>Simulations to <br /><span className="gradient-text">Start With</span></h2>
                    </div>
                    <button className="btn-ghost" style={{ marginBottom: 8 }} onClick={() => navigate("/simulations")}>View All →</button>
                </Reveal>
                <div className="grid-2col-eq">
                    {sims.map((s, i) => (
                        <Reveal key={i} delay={i * 80}>
                            <div className="card-glass" onClick={() => navigate("/simulations")} style={{ padding: "36px", background: `linear-gradient(135deg,${s.color} 0%,rgba(255,255,255,0.02) 100%)` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.icon}</div>
                                    <span style={{ padding: "4px 12px", borderRadius: 100, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em" }}>{s.tag}</span>
                                </div>
                                <h3 className="syne" style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{s.name}</h3>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.sector}</div>
                                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{s.desc}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── WHY OGSCIENCE ───────────────────────────────────── */
function Why() {
    const navigate = useNavigate();
    const stats = [{ n: "60fps", l: "Real-time physics" }, { n: "0", l: "Installs needed" }, { n: "∞", l: "Experiments to try" }];
    return (
        <section className="sec-pad" style={{ background: "linear-gradient(180deg,transparent 0%,rgba(18,18,18,0.9) 50%,transparent 100%)", position: "relative", zIndex: 2 }}>
            <div className="inner-wrap">
                <div className="grid-2col">
                    <Reveal>
                        <div className="section-line" />
                        <div className="tag">Why OgScience</div>
                        <h2 className="syne" style={{ fontSize: "clamp(28px,4.5vw,56px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.025em", marginBottom: 28 }}>Built for <br /><span className="gradient-text">Curious Minds</span></h2>
                        <p style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.8, fontSize: 15, marginBottom: 16 }}>Every simulation runs live in your browser, powered by the same equations you meet in class — so what you see is what the science predicts.</p>
                        <p style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.8, fontSize: 15, marginBottom: 36 }}>Whether you are a student, a teacher preparing a lesson, or just someone who wonders how things work, there is a simulation for you.</p>
                        <button className="btn-primary" onClick={() => navigate("/simulations")}>Start Exploring →</button>
                    </Reveal>
                    <Reveal delay={150}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            {stats.map((s, i) => (
                                <div key={i} style={{ padding: "28px 32px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "border-color .3s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}>
                                    <span className="stat-number">{s.n}</span>
                                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.l}</span>
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

/* ─── CTA ─────────────────────────────────────────────── */
function CTA() {
    const navigate = useNavigate();
    return (
        <section className="sec-pad" style={{ position: "relative", zIndex: 2 }}>
            <div className="inner-wrap">
                <Reveal>
                    <div style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 32, padding: "clamp(48px,8vw,100px) clamp(24px,6vw,80px)", textAlign: "center", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: "30%", left: "20%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.03)", filter: "blur(80px)", pointerEvents: "none" }} />
                        <div style={{ position: "absolute", bottom: "20%", right: "20%", width: 200, height: 200, borderRadius: "50%", background: "rgba(100,150,255,0.06)", filter: "blur(60px)", pointerEvents: "none" }} />
                        <div className="tag" style={{ display: "inline-block", position: "relative", zIndex: 1 }}>The Lab Is Open</div>
                        <h2 className="syne" style={{ fontSize: "clamp(32px,6vw,72px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: 24, position: "relative", zIndex: 1 }}>
                            Ready to Run<br /><span className="shimmer-text">Your First Experiment?</span>
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "clamp(14px,1.4vw,16px)", maxWidth: 460, margin: "0 auto 48px", lineHeight: 1.7, position: "relative", zIndex: 1 }}>
                            Jump into a simulation, move a slider, and watch science respond.
                        </p>
                        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                            <button className="btn-primary" style={{ fontSize: 15, padding: "16px 40px" }} onClick={() => navigate("/simulations")}>Launch Simulations →</button>
                            <a className="btn-ghost" href="#About" style={{ fontSize: 15, padding: "16px 40px" }}>Learn More</a>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

/* ─── FOOTER ──────────────────────────────────────────── */
function Footer() {
    return (
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "clamp(24px,4vw,48px) clamp(16px,4vw,48px)", maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#080808", fontFamily: "Syne" }}>O</span>
                </div>
                <span className="syne" style={{ fontSize: 14, fontWeight: 700 }}>OgScience</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em" }}>© 2026 OgScience. Making science tangible.</div>
            <div style={{ display: "flex", gap: 24 }}>
                {["Privacy", "Terms", "Contact"].map(l => (
                    <a key={l} href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none", letterSpacing: "0.04em", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.7)"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}>{l}</a>
                ))}
            </div>
        </footer>
    );
}

const Home = () => {
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        const s = document.createElement("style");
        s.textContent = globalStyles;
        document.head.appendChild(s);
        return () => document.head.removeChild(s);
    }, []);
    return (
        <div style={{ background: "#080808", minHeight: "100vh", position: "relative" }}>
            {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
            <div style={{ opacity: loaded ? 1 : 0, transition: "opacity .8s ease .1s", pointerEvents: loaded ? "all" : "none" }}>
                <div className="noise-overlay" />
                <ParticleBg />
                <Cursor />
                <Navbar />
                <Hero />
                <About />
                <HowItWorks />
                <Subjects />
                <Featured />
                <Why />
                <CTA />
                <Footer />
            </div>
        </div>
    );
};

export default Home;