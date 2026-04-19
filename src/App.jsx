import { useState, useEffect, useRef } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CA = "YOUR_CONTRACT_ADDRESS_HERE";
const TITLE = "BUY THE D◎G";

// ─── SPIRAL CANVAS ───────────────────────────────────────────────────────────
// TRUE Archimedean spiral: r = b·θ
// One continuous polyline from centre outward. Black bg, white line.
function Spiral({ hypnosis, mouse }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  // Mutable state kept in a ref so the draw closure always sees fresh values
  // without triggering re-renders.
  const stateRef  = useRef({
    rotation   : 0,   // current rotation offset (radians)
    zoom       : 1,   // current zoom (eased)
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const st = stateRef.current;

      // ── Advance rotation ──────────────────────────────────────────────────
      // Idle: barely perceptible. Hypnosis: fast.
      st.rotation += hypnosis ? 0.018 : 0.0035;

      // ── Ease zoom ────────────────────────────────────────────────────────
      const targetZoom = hypnosis ? 1.22 : 1.0;
      st.zoom += (targetZoom - st.zoom) * 0.035;

      // ── Clear ────────────────────────────────────────────────────────────
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // ── Transform: center + parallax + zoom ──────────────────────────────
      const parallaxStrength = hypnosis ? 32 : 14;
      const cx = W / 2 + mouse.x * parallaxStrength;
      const cy = H / 2 + mouse.y * parallaxStrength;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(st.zoom, st.zoom);
      ctx.rotate(st.rotation);

      // ── Draw the Archimedean spiral ───────────────────────────────────────
      // r = b * θ  where b controls spacing between successive turns.
      // We step θ from 0 to θ_max in tiny increments.
      // θ_max is chosen so the outermost loop reaches the screen corner.
      const maxR = Math.sqrt(W * W + H * H) * 0.54; // radius to fill screen

      // b = spacing between turns / (2π)
      // Tighter in hypnosis so more loops are visible.
      const spacing = hypnosis ? 22 : 32; // px between successive loops
      const b = spacing / (2 * Math.PI);

      // How many full turns fit before r > maxR?
      const θmax = maxR / b;

      // Step size: smaller = smoother curve. 0.04 rad ≈ 2.3° per step.
      const dθ = 0.04;

      ctx.beginPath();
      // lineWidth = spacing/2 makes the white arm exactly as wide as the black gap
      ctx.lineWidth   = spacing / 2;
      ctx.strokeStyle = hypnosis
        ? "rgba(255,255,255,1.0)"
        : "rgba(255,255,255,0.95)";
      ctx.lineCap  = "butt";   // butt caps keep band edges clean (no round overlap)
      ctx.lineJoin = "round";

      for (let θ = 0; θ <= θmax; θ += dθ) {
        const r = b * θ;
        const x = r * Math.cos(θ);
        const y = r * Math.sin(θ);
        θ === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.restore();

      // ── Radial vignette ───────────────────────────────────────────────────
      const vAlpha = hypnosis ? 0.68 : 0.50;
      const vg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.62);
      vg.addColorStop(0,   "transparent");
      vg.addColorStop(0.5, "transparent");
      vg.addColorStop(1,   `rgba(0,0,0,${vAlpha})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  // Restart loop when hypnosis toggles (speed + spacing change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hypnosis]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position  : "fixed",
        inset     : 0,
        zIndex    : 0,
        filter    : hypnosis
          ? "contrast(1.55) brightness(1.1)"
          : "contrast(1.05) brightness(0.97)",
        transition: "filter 0.9s ease",
      }}
    />
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [hypnosis, setHypnosis] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [mouse,    setMouse]    = useState({ x: 0, y: 0 });

  // Smooth normalised mouse offset (–0.5 to +0.5)
  const mouseRef      = useRef({ x: 0, y: 0 });
  const mouseLerpRef  = useRef({ x: 0, y: 0 });
  const lerpRafRef    = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth  - 0.5),
        y: (e.clientY / window.innerHeight - 0.5),
      };
    };
    const onTouch = (e) => {
      const t = e.touches[0];
      mouseRef.current = {
        x: (t.clientX / window.innerWidth  - 0.5),
        y: (t.clientY / window.innerHeight - 0.5),
      };
    };

    // Lerp loop — smooth mouse tracking
    const lerp = () => {
      const target = mouseRef.current;
      const curr   = mouseLerpRef.current;
      const k      = 0.06;
      curr.x += (target.x - curr.x) * k;
      curr.y += (target.y - curr.y) * k;
      setMouse({ x: curr.x, y: curr.y });
      lerpRafRef.current = requestAnimationFrame(lerp);
    };
    lerpRafRef.current = requestAnimationFrame(lerp);

    window.addEventListener("mousemove",  onMove);
    window.addEventListener("touchmove",  onTouch, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      cancelAnimationFrame(lerpRafRef.current);
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("touchmove",  onTouch);
      window.removeEventListener("touchstart", onTouch);
    };
  }, []);

  const copyCA = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(CA).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Dog parallax offset (foreground moves less than spiral = depth)
  const dogX = mouse.x * -18;
  const dogY = mouse.y * -14;

  return (
    <div
      style={{
        minHeight      : "100vh",
        display        : "flex",
        flexDirection  : "column",
        alignItems     : "center",
        justifyContent : "center",
        userSelect     : "none",
        fontFamily     : "'Bebas Neue', 'Impact', sans-serif",
        cursor         : hypnosis ? "crosshair" : "default",
      }}
    >
      {/* ── Fonts + keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');

        @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatDog{
          0%,100%{transform:translateY(0px)}
          50%    {transform:translateY(-14px)}
        }
        @keyframes glowPulse{
          0%,100%{text-shadow:-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000,0 0 18px #fff,0 0 36px #fff}
          50%    {text-shadow:-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000,0 0 40px #fff,0 0 80px #ccc,0 0 120px #aaa}
        }
        @keyframes btnPulse{
          0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}
          50%    {box-shadow:0 0 0 6px rgba(255,255,255,0.08)}
        }

        *{box-sizing:border-box;margin:0;padding:0}
        html,body{min-height:100%;overflow-y:auto;background:#000}
        ::-webkit-scrollbar{width:2px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.2)}
      `}</style>

      {/* ── Spiral (z:0) ── */}
      <Spiral hypnosis={hypnosis} mouse={mouse} />

      {/* ── Hypnosis dim veil — covers background intensity difference (z:2) ── */}
      <div style={{
        position  : "fixed",
        inset     : 0,
        zIndex    : 2,
        background: hypnosis ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)",
        transition: "background 0.8s ease",
        pointerEvents: "none",
      }} />

      {/* ── Content layer (z:10) ── */}
      <div style={{
        position       : "relative",
        zIndex         : 10,
        display        : "flex",
        flexDirection  : "column",
        alignItems     : "center",
        justifyContent : "center",
        padding        : "40px 16px",
        transform      : `translate(${dogX * 0.3}px, ${dogY * 0.3}px)`,
        transition     : "transform 0.1s linear",
        width          : "100%",
      }}>

        {/* ─ TITLE ─ */}
        <h1 style={{
          color        : "#fff",
          fontSize     : "clamp(56px, 10vw, 130px)",
          letterSpacing: "clamp(6px, 1.2vw, 18px)",
          lineHeight   : 1,
          textAlign    : "center",
          marginBottom : "0",
          fontWeight   : "400",
          animation    : hypnosis
            ? "glowPulse 2s ease infinite"
            : "fadeUp 1s ease forwards",
          textShadow   : hypnosis
            ? undefined
            : "0 0 60px rgba(255,255,255,0.18), 0 2px 0 rgba(0,0,0,0.8), 0 8px 40px rgba(0,0,0,0.95)",
        }}>
          {TITLE}
        </h1>

        {/* ─ DOG ─ */}
        <div style={{
          transform : `translate(${dogX}px, ${dogY}px) scale(${hypnosis ? 1.07 : 1})`,
          transition: "transform 0.12s linear, scale 1s cubic-bezier(.34,1.56,.64,1)",
          animation : "floatDog 5s ease-in-out infinite",
          filter    : `drop-shadow(0 0 ${hypnosis ? 60 : 24}px rgba(255,255,255,${hypnosis ? 0.45 : 0.12})) drop-shadow(0 24px 48px rgba(0,0,0,0.9))`,
          willChange: "transform",
          flexShrink: 0,
        }}>
          <img
            src="/dog.png"
            alt="The Dog"
            draggable={false}
            style={{
              width    : "min(60vw, 420px)",
              minWidth : "320px",
              maxWidth : "420px",
              height   : "auto",
              display  : "block",
            }}
            onError={(e) => {
              if (!e.target.dataset.tried) {
                e.target.dataset.tried = "1";
                e.target.src = "/dog1.png";
              }
            }}
          />
        </div>

        {/* ─ CA ─ */}
        <button
          onClick={copyCA}
          style={{
            marginTop    : "clamp(10px, 1.8vh, 22px)",
            background   : copied ? "rgba(180,255,180,0.12)" : "rgba(0,0,0,0.55)",
            border       : `1px solid ${copied ? "rgba(180,255,180,0.5)" : "rgba(255,255,255,0.32)"}`,
            borderRadius : "4px",
            padding      : "11px 22px",
            color        : copied ? "#b8ffb8" : "#fff",
            fontFamily   : "'Space Mono', monospace",
            fontSize     : "clamp(9px, 1.6vw, 13px)",
            letterSpacing: "1.5px",
            cursor       : "pointer",
            backdropFilter: "blur(14px)",
            transition   : "all 0.3s ease",
            display      : "flex",
            alignItems   : "center",
            gap          : "10px",
            maxWidth     : "min(92vw, 520px)",
            textShadow   : "-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background    = "rgba(255,255,255,0.13)";
            e.currentTarget.style.borderColor   = "rgba(255,255,255,0.65)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background    = copied ? "rgba(180,255,180,0.12)" : "rgba(0,0,0,0.55)";
            e.currentTarget.style.borderColor   = copied ? "rgba(180,255,180,0.5)" : "rgba(255,255,255,0.32)";
          }}
        >
          <span style={{ opacity: 0.5, flexShrink: 0, fontSize: "15px" }}>
            {copied ? "✓" : "⎘"}
          </span>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {copied ? "COPIED!" : CA}
          </span>
        </button>

        {/* ─ HYPNOSIS BUTTON ─ */}
        <button
          onClick={() => setHypnosis(h => !h)}
          style={{
            marginTop     : "clamp(8px, 1.5vh, 16px)",
            background    : hypnosis ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.55)",
            border        : `2px solid ${hypnosis ? "#fff" : "rgba(255,255,255,0.68)"}`,
            borderRadius  : "4px",
            padding       : "13px 40px",
            color         : hypnosis ? "#000" : "#fff",
            fontFamily    : "'Bebas Neue', sans-serif",
            fontSize      : "clamp(15px, 2.8vw, 22px)",
            letterSpacing : "6px",
            cursor        : "pointer",
            transition    : "all 0.45s cubic-bezier(.34,1.56,.64,1)",
            animation     : hypnosis ? "btnPulse 2s ease infinite" : "none",
            backdropFilter: "blur(14px)",
            boxShadow     : hypnosis
              ? "0 0 24px rgba(255,255,255,0.35), inset 0 0 12px rgba(255,255,255,0.1)"
              : "0 4px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
            textShadow    : hypnosis ? "none" : "0 1px 4px rgba(0,0,0,0.8)",
          }}
          onMouseEnter={(e) => {
            if (!hypnosis) {
              e.currentTarget.style.background  = "rgba(255,255,255,0.12)";
              e.currentTarget.style.transform   = "scale(1.04)";
              e.currentTarget.style.boxShadow   = "0 6px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.12)";
            }
          }}
          onMouseLeave={(e) => {
            if (!hypnosis) {
              e.currentTarget.style.background  = "rgba(0,0,0,0.55)";
              e.currentTarget.style.transform   = "scale(1)";
              e.currentTarget.style.boxShadow   = "0 4px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.08)";
            }
          }}
        >
          {hypnosis ? "◉  EXIT HYPNOSIS  ◉" : "◎  ENTER HYPNOSIS  ◎"}
        </button>
      </div>
    </div>
  );
}


