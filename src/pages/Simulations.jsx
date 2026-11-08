import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { globalStyles, Cursor, Reveal } from "./Home";
import SimulationCard from "../components/Simulationcard";

/* ─────────────────────────────────────────────────────────
   ADD YOUR SIMULATIONS HERE
   title : shown on the card
   image : cover image (put files in /public, e.g. /public/covers/…)
   src   : the simulation's html file (e.g. /public/simulations/…)
   category : optional — only used for the filter chips (not displayed on cards)
───────────────────────────────────────────────────────── */
const SIMULATIONS = [
    { title: "Crystal Field Theory", image: "/CFT_COVER.jpg", src: "/sims/chemistry/Cft.html", category: "Chemistry" },
    { title: "De Broglie Hypothesis", image: "/DEBROGLIE_COVER.jpg", src: "/sims/chemistry/DeBroglie.html", category: "Chemistry" },
    { title: "Valence Bond Theory: Orbital Overlap", image: "/VBT_COVER.jpg", src: "/sims/chemistry/Vbt.html", category: "Chemistry" },
    { title: "Rotational Mechanics", image: "/VBT_COVER.jpg", src: "/sims/physics/rollingmotion.html", category: "Physics" },
    { title: "YDSE Interference", image: "/VBT_COVER.jpg", src: "/sims/physics/ydse.html", category: "Physics" },
    { title: "Electromagnetism (Lenz's Law)", image: "/VBT_COVER.jpg", src: "/sims/physics/electromagnetism.html", category: "Physics" },
    { title: "Ideal Gas Lab", image: "/VBT_COVER.jpg", src: "/sims/chemistry/ideal-gas-lab.html", category: "Chemistry" },
    { title: "Projectile Motion", image: "/VBT_COVER.jpg", src: "/sims/physics/projectile-arena.html", category: "Physics" }
];

/* ─── PAGE-SPECIFIC STYLES ─── */
const extraStyles = `
  .chip { padding: 8px 18px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: rgba(255,255,255,0.55); font-family: 'DM Sans', sans-serif; font-size: 12px; letter-spacing: 0.06em; transition: all .25s ease; }
  .chip:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
  .chip.active { background: #fff; color: #080808; border-color: #fff; }
  .search-input { width: 100%; max-width: 320px; padding: 12px 20px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; transition: border-color .25s; }
  .search-input:focus { border-color: rgba(255,255,255,0.4); }
  .search-input::placeholder { color: rgba(255,255,255,0.3); }
  .sim-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 22px; }
`;

const Simulations = () => {
    const navigate = useNavigate();
    const [cat, setCat] = useState("All");
    const [q, setQ] = useState("");
    const [scrolled, setScrolled] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);

    useEffect(() => {
        const s = document.createElement("style");
        s.textContent = globalStyles + extraStyles;
        document.head.appendChild(s);
        window.scrollTo(0, 0);
        const fn = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", fn);
        return () => { document.head.removeChild(s); window.removeEventListener("scroll", fn); };
    }, []);

    /* the atom cursor can't follow the mouse inside an iframe, so hide it while a simulation is open */
    useEffect(() => {
        const check = () => setViewerOpen(document.body.classList.contains("sim-open"));
        const mo = new MutationObserver(check);
        mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        return () => mo.disconnect();
    }, []);

    const cats = useMemo(() => {
        const set = Array.from(new Set(SIMULATIONS.map(s => s.category).filter(Boolean)));
        return set.length ? ["All", ...set] : [];
    }, []);

    const list = useMemo(() => SIMULATIONS.filter(s =>
        (cat === "All" || s.category === cat) && s.title.toLowerCase().includes(q.toLowerCase())
    ), [cat, q]);

    return (
        <div style={{ background: "#080808", minHeight: "100vh", position: "relative" }}>
            <div className="noise-overlay" />
            {!viewerOpen && <Cursor />}
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
                        Pick a concept, step into the lab and watch the science respond in real time.
                    </p>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", animation: "fadeUp .9s 300ms both" }}>
                        <input className="search-input" placeholder="Search simulations…" value={q} onChange={e => setQ(e.target.value)} />
                        {cats.length > 0 && (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {cats.map(c => <button key={c} className={`chip ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="sec-pad" style={{ position: "relative", zIndex: 2, paddingTop: 40 }}>
                <div className="inner-wrap">
                    {list.length === 0 && (
                        <div style={{ color: "rgba(255,255,255,0.35)", textAlign: "center", padding: 60 }}>
                            {SIMULATIONS.length === 0 ? "No simulations yet — add some to the SIMULATIONS array." : "No simulations match your search."}
                        </div>
                    )}
                    <div className="sim-grid">
                        {list.map((s, i) => (
                            <Reveal key={s.src} delay={i * 60}>
                                <SimulationCard title={s.title} image={s.image} src={s.src} />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px clamp(16px,4vw,48px)", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em", position: "relative", zIndex: 2 }}>
                © 2026 OgScience. Making science tangible.
            </footer>
        </div>
    );
};

export default Simulations;