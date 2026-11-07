import { useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────
   Full-screen simulation viewer with a "lab airlock" transition:
   1. two doors slide shut over the page      (0.75s)
   2. a short initialisation screen is shown  (waits for the file to load)
   3. the doors slide apart revealing the simulation
   Closing plays the doors in reverse, then calls onClose().
────────────────────────────────────────────────────────── */

const CSS = `
  @keyframes svSpin { to { transform: rotate(360deg); } }
  @keyframes svSpinRev { to { transform: rotate(-360deg); } }
  @keyframes svScan { 0% { top: -4%; } 100% { top: 104%; } }
  @keyframes svBlink { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
  @keyframes svHud { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }

  body.sim-open, body.sim-open * { cursor: auto !important; }
  body.sim-open .sv-exit { cursor: pointer !important; }

  .sv-root { position: fixed; inset: 0; z-index: 10050; overflow: hidden; background: transparent; font-family: 'DM Sans', sans-serif; }
  .sv-frame { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: #080808; }

  .sv-door {
    position: absolute; top: 0; bottom: 0; width: 50.3%; z-index: 3; background: #080808; will-change: transform;
    transition: transform .75s cubic-bezier(.77,0,.18,1);
    background-image:
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size: 64px 64px;
  }
  .sv-door.l { left: 0; border-right: 1px solid rgba(255,255,255,.18); box-shadow: 8px 0 60px rgba(111,160,255,.12); }
  .sv-door.r { right: 0; border-left: 1px solid rgba(255,255,255,.18); box-shadow: -8px 0 60px rgba(111,160,255,.12); }

  .sv-fx { position: absolute; inset: 0; z-index: 4; pointer-events: none; transition: opacity .35s ease; }
  .sv-scan { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(111,160,255,.8), transparent); box-shadow: 0 0 24px rgba(111,160,255,.7); animation: svScan 1.7s linear infinite; }
  .sv-seam { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: linear-gradient(to bottom, transparent, rgba(255,255,255,.7), transparent); box-shadow: 0 0 20px rgba(255,255,255,.4); }
  .sv-corner { position: absolute; width: 22px; height: 22px; border: 0 solid rgba(255,255,255,.18); }

  .sv-center { position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; text-align: center; padding: 0 20px; }
  .sv-ring { position: relative; width: 112px; height: 112px; margin-bottom: 28px; display: grid; place-items: center; }
  .sv-ring i { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,.12); }
  .sv-ring .a { inset: 0; animation: svSpin 7s linear infinite; }
  .sv-ring .b { inset: 16px; border-style: dashed; border-color: rgba(255,255,255,.1); animation: svSpinRev 5s linear infinite; }
  .sv-ring .a::after { content: ''; position: absolute; top: -4px; left: 50%; margin-left: -4px; width: 8px; height: 8px; border-radius: 50%; background: #8ab4ff; box-shadow: 0 0 12px #8ab4ff; }
  .sv-ring .b::after { content: ''; position: absolute; bottom: -3px; left: 50%; margin-left: -3px; width: 6px; height: 6px; border-radius: 50%; background: #fff; }
  .sv-logo { width: 44px; height: 44px; border-radius: 50%; background: #fff; color: #080808; display: grid; place-items: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; box-shadow: 0 0 40px rgba(255,255,255,.2); }
  .sv-kicker { font-size: 10px; letter-spacing: .24em; text-transform: uppercase; color: rgba(255,255,255,.35); margin-bottom: 10px; animation: svBlink 1.6s ease-in-out infinite; }
  .sv-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(22px, 4.2vw, 36px); letter-spacing: -.02em; color: #fff; margin-bottom: 30px; max-width: 80vw; }
  .sv-track { width: min(280px, 68vw); height: 1px; background: rgba(255,255,255,.1); position: relative; margin-bottom: 12px; }
  .sv-bar { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, rgba(255,255,255,.25), #fff); box-shadow: 0 0 8px rgba(255,255,255,.4); }
  .sv-meta { width: min(280px, 68vw); display: flex; justify-content: space-between; font-size: 10px; letter-spacing: .15em; text-transform: uppercase; color: rgba(255,255,255,.3); }
  .sv-meta b { font-family: 'Syne', sans-serif; font-weight: 700; color: rgba(255,255,255,.55); letter-spacing: .06em; }

  .sv-hud { position: absolute; top: 14px; left: 14px; right: 14px; z-index: 2; display: flex; justify-content: space-between; align-items: center; pointer-events: none; animation: svHud .6s .15s both cubic-bezier(.16,1,.3,1); }
  .sv-chip, .sv-exit {
    pointer-events: auto; display: inline-flex; align-items: center; gap: 10px; height: 42px; padding: 0 18px;
    background: rgba(8,8,8,.62); border: 1px solid rgba(255,255,255,.14); border-radius: 100px;
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: .03em; color: #fff;
  }
  .sv-chip .d { width: 22px; height: 22px; margin-left: -8px; border-radius: 50%; background: #fff; color: #080808; display: grid; place-items: center; font-size: 11px; font-weight: 800; }
  .sv-exit { font-weight: 600; letter-spacing: .04em; transition: all .3s ease; }
  .sv-exit:hover { border-color: rgba(255,255,255,.6); background: rgba(255,255,255,.12); }

  @media (max-width: 600px) { .sv-chip span.t { max-width: 46vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }
`;

export default function SimulationViewer({ title, src, onClose }) {
    const [shut, setShut] = useState(false);       // doors closed?
    const [phase, setPhase] = useState("in");      // in → open → out
    const [loaded, setLoaded] = useState(false);
    const [held, setHeld] = useState(false);       // minimum initialisation time elapsed
    const [pct, setPct] = useState(0);
    const exiting = useRef(false);

    /* inject styles once */
    useEffect(() => {
        if (document.getElementById("og-sv-style")) return;
        const s = document.createElement("style");
        s.id = "og-sv-style"; s.textContent = CSS; document.head.appendChild(s);
    }, []);

    /* lock page scroll + restore native cursor while the simulation is open */
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.body.classList.add("sim-open");
        return () => { document.body.style.overflow = prev; document.body.classList.remove("sim-open"); };
    }, []);

    /* entry: close doors, hold briefly */
    useEffect(() => {
        const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShut(true)));
        const t = setTimeout(() => setHeld(true), 1750);
        return () => { cancelAnimationFrame(raf); clearTimeout(t); };
    }, []);

    /* progress counter */
    useEffect(() => {
        if (phase !== "in") return;
        const iv = setInterval(() => setPct(p => {
            const target = loaded ? 100 : 88;
            return Math.min(target, p + Math.max(0.4, (target - p) * 0.07));
        }), 40);
        return () => clearInterval(iv);
    }, [phase, loaded]);

    /* open doors when both the file and the minimum hold are ready */
    useEffect(() => {
        if (phase === "in" && loaded && held) {
            setPct(100);
            const t = setTimeout(() => { setShut(false); setPhase("open"); }, 280);
            return () => clearTimeout(t);
        }
    }, [phase, loaded, held]);

    const exit = () => {
        if (exiting.current) return;
        exiting.current = true;
        setPhase("out"); setPct(100); setShut(true);
        setTimeout(onClose, 800);
    };

    useEffect(() => {
        const onKey = e => { if (e.key === "Escape") exit(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    /* hide the simulation's own top bar (brand / back link) when it is same-origin — our HUD replaces it */
    const onFrameLoad = e => {
        try { const d = e.target.contentDocument; const tb = d && d.getElementById("topbar"); if (tb) tb.remove(); } catch (_) { /* cross-origin: ignore */ }
        setLoaded(true);
    };

    const doorStyle = side => ({ transform: shut ? "translateX(0)" : `translateX(${side === "l" ? "-102%" : "102%"})` });
    const corner = (pos, border) => <div className="sv-corner" style={{ ...pos, ...border }} />;

    return (
        <div className="sv-root" role="dialog" aria-modal="true" aria-label={title}>
            <iframe
                className="sv-frame"
                src={src}
                title={title}
                allow="fullscreen"
                onLoad={onFrameLoad}
                style={{ opacity: phase === "in" ? 0 : 1 }}
            />

            {phase !== "in" && (
                <div className="sv-hud">
                    <div className="sv-chip"><div className="d">O</div><span className="t">{title}</span></div>
                    <button className="sv-exit" onClick={exit}>Exit Lab ✕</button>
                </div>
            )}

            {/* airlock doors */}
            <div className="sv-door l" style={doorStyle("l")} />
            <div className="sv-door r" style={doorStyle("r")} />

            {/* effects on top of the doors */}
            <div className="sv-fx" style={{ opacity: shut ? 1 : 0, transitionDelay: shut ? ".55s" : "0s" }}>
                <div className="sv-seam" />
                <div className="sv-scan" />
                {corner({ top: 20, left: 20 }, { borderTopWidth: 1, borderLeftWidth: 1 })}
                {corner({ top: 20, right: 20 }, { borderTopWidth: 1, borderRightWidth: 1 })}
                {corner({ bottom: 20, left: 20 }, { borderBottomWidth: 1, borderLeftWidth: 1 })}
                {corner({ bottom: 20, right: 20 }, { borderBottomWidth: 1, borderRightWidth: 1 })}
            </div>

            <div className="sv-center" style={{ opacity: shut ? 1 : 0, transition: `opacity .4s ease ${shut ? ".5s" : "0s"}` }}>
                <div className="sv-ring">
                    <i className="a" /><i className="b" />
                    <div className="sv-logo">O</div>
                </div>
                <div className="sv-kicker">{phase === "out" ? "Leaving the lab" : "Entering the lab"}</div>
                <div className="sv-title">{title}</div>
                <div className="sv-track"><div className="sv-bar" style={{ width: `${pct}%` }} /></div>
                <div className="sv-meta">
                    <span>{phase === "out" ? "Closing session" : "Initialising simulation"}</span>
                    <b>{String(Math.round(pct)).padStart(2, "0")}%</b>
                </div>
            </div>
        </div>
    );
}