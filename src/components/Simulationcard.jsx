import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import SimulationViewer from "../components/SimulationViewer";

/* ──────────────────────────────────────────────────────────
   <SimulationCard title="Projectile Motion"
                   image="/covers/projectile.jpg"
                   src="/simulations/projectile.html" />

   title : text shown on the card (and in the lab-entry transition)
   image : cover image URL (falls back to a styled placeholder)
   src   : the simulation's .html file — opened inside the site with a
           lab-door transition instead of navigating away
────────────────────────────────────────────────────────── */

const CSS = `
  .og-sc {
    position: relative; display: flex; flex-direction: column; height: 100%;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px; overflow: hidden; outline: none; user-select: none;
    transition: transform .5s cubic-bezier(.16,1,.3,1), border-color .4s ease, box-shadow .5s ease, background .4s ease;
  }
  .og-sc:hover, .og-sc:focus-visible {
    transform: translateY(-6px); background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.2); box-shadow: 0 24px 60px rgba(0,0,0,.55);
  }
  .og-sc-media { position: relative; aspect-ratio: 16 / 10; overflow: hidden; background: #0d0d0d; }
  .og-sc-media img {
    position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block;
    filter: brightness(.82) saturate(.95);
    transition: transform .9s cubic-bezier(.16,1,.3,1), filter .5s ease;
  }
  .og-sc:hover .og-sc-media img, .og-sc:focus-visible .og-sc-media img { transform: scale(1.07); filter: brightness(1) saturate(1.05); }
  .og-sc-ph {
    position: absolute; inset: 0; display: grid; place-items: center;
    background:
      linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px) 0 0 / 28px 28px,
      linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px) 0 0 / 28px 28px,
      radial-gradient(circle at 50% 40%, rgba(111,160,255,.12), transparent 65%), #0d0d0d;
  }
  .og-sc-ph span { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 56px; color: rgba(255,255,255,.14); }
  .og-sc-shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(8,8,8,.9) 0%, rgba(8,8,8,.15) 55%, transparent 100%); pointer-events: none; }

  /* lab-style corner brackets on hover */
  .og-sc-media::before, .og-sc-media::after {
    content: ''; position: absolute; width: 22px; height: 22px; z-index: 2; opacity: 0;
    transition: opacity .4s ease, transform .5s cubic-bezier(.16,1,.3,1); pointer-events: none;
  }
  .og-sc-media::before { top: 14px; left: 14px; border-top: 1px solid rgba(255,255,255,.7); border-left: 1px solid rgba(255,255,255,.7); transform: translate(8px, 8px); }
  .og-sc-media::after { bottom: 14px; right: 14px; border-bottom: 1px solid rgba(255,255,255,.7); border-right: 1px solid rgba(255,255,255,.7); transform: translate(-8px, -8px); }
  .og-sc:hover .og-sc-media::before, .og-sc:hover .og-sc-media::after,
  .og-sc:focus-visible .og-sc-media::before, .og-sc:focus-visible .og-sc-media::after { opacity: 1; transform: none; }

  .og-sc-launch {
    position: absolute; left: 50%; top: 50%; z-index: 3; transform: translate(-50%, -38%); opacity: 0;
    padding: 12px 26px; border-radius: 100px; background: #fff; color: #080808; white-space: nowrap;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: .05em;
    transition: opacity .35s ease, transform .5s cubic-bezier(.16,1,.3,1); pointer-events: none;
    box-shadow: 0 12px 40px rgba(255,255,255,.25);
  }
  .og-sc:hover .og-sc-launch, .og-sc:focus-visible .og-sc-launch { opacity: 1; transform: translate(-50%, -50%); }

  .og-sc-body { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 18px 20px 20px; flex: 1; }
  .og-sc-body h3 { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; line-height: 1.2; letter-spacing: -0.01em; color: #fff; }
  .og-sc-arrow {
    flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center;
    border: 1px solid rgba(255,255,255,.18); color: #fff; font-size: 15px;
    transition: all .4s cubic-bezier(.16,1,.3,1);
  }
  .og-sc:hover .og-sc-arrow, .og-sc:focus-visible .og-sc-arrow { background: #fff; color: #080808; border-color: #fff; transform: rotate(45deg); }
`;

function useCardStyles() {
    useEffect(() => {
        if (document.getElementById("og-sc-style")) return;
        const s = document.createElement("style");
        s.id = "og-sc-style";
        s.textContent = CSS;
        document.head.appendChild(s);
    }, []);
}

export default function SimulationCard({ title, image, src }) {
    useCardStyles();
    const [open, setOpen] = useState(false);
    const [imgFailed, setImgFailed] = useState(false);

    const launch = () => setOpen(true);

    return (
        <>
            <div
                className="og-sc"
                role="button"
                tabIndex={0}
                aria-label={`Launch ${title}`}
                onClick={launch}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); launch(); } }}
            >
                <div className="og-sc-media">
                    {image && !imgFailed ? (
                        <img src={image} alt={title} loading="lazy" onError={() => setImgFailed(true)} />
                    ) : (
                        <div className="og-sc-ph"><span>{(title || "?").charAt(0)}</span></div>
                    )}
                    <div className="og-sc-shade" />
                    <div className="og-sc-launch">Launch →</div>
                </div>
                <div className="og-sc-body">
                    <h3>{title}</h3>
                    <div className="og-sc-arrow">↗</div>
                </div>
            </div>

            {/* Portal keeps the full-screen viewer unaffected by any transformed parent (e.g. scroll-reveal wrappers) */}
            {open && createPortal(
                <SimulationViewer title={title} src={src} onClose={() => setOpen(false)} />,
                document.body
            )}
        </>
    );
}