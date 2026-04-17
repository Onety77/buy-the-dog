import { useState, useEffect, useRef } from "react";

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

// ─── TRUE ARCHIMEDEAN SPIRAL CANVAS ──────────────────────────────────────────
// One continuous line from center spiralling outward. Works on mobile via touch.
function SpiralCanvas({ speed, distortion, hypnosis, intensity }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const angleRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Solid dark background
      ctx.fillStyle = "#060606";
      ctx.fillRect(0, 0, W, H);

      // Center shifts with distortion (amplified in hypnosis)
      const distScale = hypnosis ? 0.10 : 0.045;
      const cx = W / 2 + distortion.x * distScale;
      const cy = H / 2 + distortion.y * distScale;

      const maxR   = Math.sqrt(W * W + H * H) * 0.8;
      // spacing between successive loops of the spiral arm
      const spacing = hypnosis ? 7 : 10;
      const turns   = maxR / spacing;
      // enough steps for a smooth curve at any screen size
      const steps   = Math.ceil(turns * 2 * Math.PI * 2);

      ctx.save();
      ctx.translate(cx, cy);

      // Line style
      ctx.strokeStyle = hypnosis
        ? `rgba(255,255,255,${0.55 + intensity * 0.38})`
        : "rgba(205,205,205,0.6)";
      ctx.lineWidth   = hypnosis ? 1.1 + intensity * 0.9 : 0.95;
      ctx.lineCap     = "round";
      ctx.lineJoin    = "round";

      // Archimedean spiral: r = spacing * θ / (2π), rotated by angleRef
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * turns * 2 * Math.PI;
        const r     = (theta / (2 * Math.PI)) * spacing;
        const angle = theta + angleRef.current;
        const x     = r * Math.cos(angle);
        const y     = r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else         ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Vignette — deepen during hypnosis
      const vigR = Math.max(W, H) * 0.65;
      const vignette = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, vigR);
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, hypnosis
        ? `rgba(0,0,0,${0.72 + intensity * 0.22})`
        : "rgba(0,0,0,0.52)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      angleRef.current += speed * 0.003;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [speed, distortion, hypnosis, intensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position  : "fixed",
        inset     : 0,
        zIndex    : 0,
        transition: "filter 0.8s ease",
        filter    : hypnosis ? "contrast(1.35)" : "contrast(1.1)",
      }}
    />
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [scrollY,   setScrollY]   = useState(0);
  const [cursor,    setCursor]    = useState({
    x: typeof window !== "undefined" ? window.innerWidth  / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });
  const [hypnosis,  setHypnosis]  = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [glitch,    setGlitch]    = useState(false);
  const [intensity, setIntensity] = useState(0); // 0–1, spikes on interaction
  const intensityRef    = useRef(0);
  const intensityAnimId = useRef(null);

  // ── Intensity helpers ──────────────────────────────────────────────────────
  const decayIntensity = () => {
    cancelAnimationFrame(intensityAnimId.current);
    const step = () => {
      intensityRef.current = Math.max(0, intensityRef.current - 0.018);
      setIntensity(intensityRef.current);
      if (intensityRef.current > 0) intensityAnimId.current = requestAnimationFrame(step);
    };
    intensityAnimId.current = requestAnimationFrame(step);
  };

  const boostIntensity = (val = 1) => {
    cancelAnimationFrame(intensityAnimId.current);
    intensityRef.current = Math.min(1, Math.max(intensityRef.current, val));
    setIntensity(intensityRef.current);
    decayIntensity();
  };

  // ── Global pointer / touch / scroll listeners ──────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
      boostIntensity(0.5);
    };
    const onMove = (e) => {
      setCursor({ x: e.clientX, y: e.clientY });
      if (hypnosis) boostIntensity(0.55);
    };
    const onTouchStart = (e) => {
      const t = e.touches[0];
      setCursor({ x: t.clientX, y: t.clientY });
      boostIntensity(0.85);
    };
    const onTouchMove = (e) => {
      const t = e.touches[0];
      setCursor({ x: t.clientX, y: t.clientY });
      boostIntensity(1.0);
    };

    window.addEventListener("scroll",     onScroll,     { passive: true });
    window.addEventListener("mousemove",  onMove);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: true });
    return () => {
      window.removeEventListener("scroll",     onScroll);
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
    };
  }, [hypnosis]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const distortion = {
    x: cursor.x - (typeof window !== "undefined" ? window.innerWidth  / 2 : 0),
    y: cursor.y - (typeof window !== "undefined" ? window.innerHeight / 2 : 0),
  };
  // In hypnosis, amplify the centre-shift by interaction intensity
  const distortionForCanvas = {
    x: distortion.x * (hypnosis ? 1 + intensity * 3.5 : 1),
    y: distortion.y * (hypnosis ? 1 + intensity * 3.5 : 1),
  };

  const baseSpeed   = 1 + scrollY * 0.003;
  const spiralSpeed = hypnosis ? baseSpeed * 3.8 : baseSpeed;

  // ── Hypnosis toggle ─────────────────────────────────────────────────────────
  const toggleHypnosis = () => {
    setGlitch(true);
    setTimeout(() => setGlitch(false), 500);
    setHypnosis((h) => !h);
    boostIntensity(1);
  };

  // ── Copy CA ─────────────────────────────────────────────────────────────────
  const copyCA = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Float tick (RAF) ────────────────────────────────────────────────────────
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id;
    const loop = () => { setTick((t) => t + 1); id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const floatY        = Math.sin(tick * 0.018) * 12;
  const floatRot      = Math.sin(tick * 0.011) * 1.5;
  const dogParallaxX  = distortion.x * 0.015;
  const dogParallaxY  = distortion.y * 0.015;

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight : "100vh",
      overflow  : "hidden",
      fontFamily: "'Bebas Neue', 'Impact', sans-serif",
      cursor    : hypnosis ? "crosshair" : "default",
      userSelect: "none",
    }}>

      {/* ── Fonts & global keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');

        @keyframes floatIn {
          from { opacity:0; transform: translateY(40px) scale(0.92); }
          to   { opacity:1; transform: translateY(0)    scale(1);    }
        }
        @keyframes hypnoDogIn {
          from { opacity:0; transform: scale(0.72) translateY(28px); }
          to   { opacity:1; transform: scale(1)    translateY(0);    }
        }
        @keyframes glitchFlash {
          0%   { filter: invert(0); }
          20%  { filter: invert(1) hue-rotate(90deg);  }
          40%  { filter: invert(0); }
          60%  { filter: invert(1) hue-rotate(200deg); }
          80%  { filter: invert(0); }
          100% { filter: invert(0); }
        }
        @keyframes pulse {
          0%,100% { transform: scale(1);    box-shadow: 0 0 30px rgba(255,255,255,0.3); }
          50%     { transform: scale(1.04); box-shadow: 0 0 60px rgba(255,255,255,0.7); }
        }
        @keyframes ctaGlow {
          0%,100% { text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 18px #fff, 0 0 36px #fff; }
          50%     { text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 38px #fff, 0 0 76px #aaa, 0 0 110px #777; }
        }
        @keyframes slideUp {
          from { opacity:0; transform: translateY(30px); }
          to   { opacity:1; transform: translateY(0);    }
        }
        @keyframes ripple {
          0%   { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.8); opacity: 0; }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar       { width: 3px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); }

        /* Legibility helpers */
        .sh  { text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 10px rgba(0,0,0,0.95); }
        .sh2 { text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000,
                             -1px 0 0 #000, 1px 0 0 #000, 0 -1px 0 #000, 0 1px 0 #000,
                             0 4px 24px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.8); }
      `}</style>

      {/* Spiral */}
      <SpiralCanvas
        speed={spiralSpeed}
        distortion={distortionForCanvas}
        hypnosis={hypnosis}
        intensity={intensity}
      />

      {/* Glitch flash */}
      {glitch && (
        <div style={{
          position    : "fixed", inset: 0, zIndex: 100,
          animation   : "glitchFlash 0.5s ease forwards",
          pointerEvents: "none",
          background  : "rgba(255,255,255,0.04)",
        }} />
      )}

      {/* ══════════════════════════════════
           HERO
      ══════════════════════════════════ */}
      <div style={{
        position       : "relative",
        zIndex         : 10,
        minHeight      : "100vh",
        display        : "flex",
        flexDirection  : "column",
        alignItems     : "center",
        justifyContent : "center",
        padding        : "20px",
      }}>

        {/* Title */}
        <div style={{ animation: "slideUp 1s ease forwards", textAlign: "center", marginBottom: "4px" }}>
          <h1 className="sh2" style={{
            fontSize     : "clamp(52px, 12vw, 120px)",
            color        : "#fff",
            letterSpacing: "4px",
            lineHeight   : 0.9,
            animation    : hypnosis ? "ctaGlow 1.5s ease infinite" : "none",
            transition   : "text-shadow 0.8s ease",
          }}>
            BUY THE<br />
            <span style={{ fontSize: "1.1em", letterSpacing: "8px" }}>D◎G</span>
          </h1>
        </div>

        {/* Dog */}
        <div style={{
          position  : "relative",
          transform : `translate(${dogParallaxX}px, ${floatY + dogParallaxY}px) rotate(${floatRot}deg) scale(${hypnosis ? 1.25 : 1})`,
          transition: "scale 0.8s cubic-bezier(0.34,1.56,0.64,1)",
          animation : "floatIn 1.2s ease forwards",
          filter    : `drop-shadow(0 20px 60px rgba(0,0,0,0.85)) drop-shadow(0 0 ${hypnosis ? "60px" : "18px"} rgba(255,255,255,${hypnosis ? 0.3 : 0.07}))`,
          zIndex    : 20,
          marginTop : "-8px",
        }}>
          <img
            src="/dog.png"
            alt="The Dog"
            style={{ width: "clamp(220px, 40vw, 420px)", height: "auto", display: "block" }}
            onError={(e) => {
              if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = "/dog1.png"; }
            }}
          />
        </div>

        {/* Contract Address */}
        <div style={{ animation: "slideUp 1.4s ease forwards", marginTop: "clamp(14px, 3vw, 28px)", zIndex: 20 }}>
          <div className="sh" style={{
            fontSize     : "clamp(9px, 1.8vw, 12px)",
            color        : "rgba(255,255,255,0.85)",
            letterSpacing: "4px",
            fontFamily   : "'Space Mono', monospace",
            textAlign    : "center",
            marginBottom : "8px",
          }}>
            CONTRACT ADDRESS
          </div>
          <button
            onClick={copyCA}
            onPointerEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
              boostIntensity(0.6);
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.background = copied ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
            }}
            style={{
              background   : copied ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)",
              border       : "1px solid rgba(255,255,255,0.28)",
              borderRadius : "3px",
              padding      : "12px 22px",
              color        : copied ? "#b8ffb8" : "#fff",
              fontFamily   : "'Space Mono', monospace",
              fontSize     : "clamp(9px, 1.5vw, 13px)",
              letterSpacing: "2px",
              cursor       : "pointer",
              backdropFilter: "blur(10px)",
              transition   : "all 0.3s ease",
              display      : "flex",
              alignItems   : "center",
              gap          : "10px",
              maxWidth     : "90vw",
              textShadow   : "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
            }}
          >
            <span style={{ opacity: 0.55, flexShrink: 0 }}>{copied ? "✓" : "⎘"}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {copied ? "COPIED TO CLIPBOARD" : CONTRACT_ADDRESS}
            </span>
          </button>
        </div>

        {/* Hypnosis button */}
        <button
          onClick={toggleHypnosis}
          onPointerEnter={() => boostIntensity(0.5)}
          onMouseEnter={(e) => { if (!hypnosis) { e.currentTarget.style.background = "rgba(255,255,255,0.13)"; e.currentTarget.style.transform = "scale(1.05)"; } }}
          onMouseLeave={(e) => { if (!hypnosis) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; } }}
          style={{
            marginTop    : "clamp(18px, 4vw, 34px)",
            background   : hypnosis ? "rgba(255,255,255,0.92)" : "transparent",
            border       : `2px solid ${hypnosis ? "#111" : "rgba(255,255,255,0.72)"}`,
            borderRadius : "2px",
            padding      : "13px 36px",
            color        : hypnosis ? "#000" : "#fff",
            fontFamily   : "'Bebas Neue', sans-serif",
            fontSize     : "clamp(16px, 3vw, 22px)",
            letterSpacing: "6px",
            cursor       : "pointer",
            transition   : "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
            animation    : hypnosis ? "pulse 2s ease infinite" : "none",
            zIndex       : 20,
            position     : "relative",
            textShadow   : hypnosis ? "none" : "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
          }}
        >
          {hypnosis ? "◉ ESCAPE THE SPIRAL ◉" : "◎ ENTER HYPNOSIS ◎"}
        </button>

        {/* Social links */}
        <div style={{
          display        : "flex",
          gap            : "28px",
          marginTop      : "26px",
          zIndex         : 20,
          flexWrap       : "wrap",
          justifyContent : "center",
          animation      : "slideUp 1.8s ease forwards",
        }}>
          {["X/TWITTER", "TELEGRAM", "DEXSCREENER"].map((label) => (
            <a
              key={label}
              href="#"
              onPointerEnter={(e) => { e.currentTarget.style.color = "#fff"; boostIntensity(0.55); }}
              onPointerLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
              style={{
                color        : "rgba(255,255,255,0.5)",
                fontFamily   : "'Space Mono', monospace",
                fontSize     : "clamp(8px, 1.5vw, 11px)",
                letterSpacing: "3px",
                textDecoration: "none",
                transition   : "color 0.3s",
                textShadow   : "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 8px rgba(0,0,0,0.9)",
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════
           HYPNOSIS OVERLAY
           No opaque box — the live spiral IS
           the background. Dog + name + CA float.
      ══════════════════════════════════ */}
      {hypnosis && (
        <div
          onClick={toggleHypnosis}
          onMouseMove={(e)  => { setCursor({ x: e.clientX, y: e.clientY }); boostIntensity(0.85); }}
          onTouchStart={(e) => { const t = e.touches[0]; setCursor({ x: t.clientX, y: t.clientY }); boostIntensity(1); }}
          onTouchMove={(e)  => { const t = e.touches[0]; setCursor({ x: t.clientX, y: t.clientY }); boostIntensity(1); }}
          style={{
            position       : "fixed",
            inset          : 0,
            zIndex         : 50,
            display        : "flex",
            flexDirection  : "column",
            alignItems     : "center",
            justifyContent : "center",
            animation      : "floatIn 0.5s ease forwards",
            cursor         : "crosshair",
            // intentionally no background — the canvas below shows through
          }}
        >
          {/* Coin name — glowing */}
          <div
            className="sh2"
            style={{
              color        : "#fff",
              fontFamily   : "'Bebas Neue', sans-serif",
              fontSize     : "clamp(40px, 10vw, 100px)",
              letterSpacing: "10px",
              textAlign    : "center",
              lineHeight   : 0.95,
              animation    : "ctaGlow 1.8s ease infinite",
              marginBottom : "8px",
              pointerEvents: "none",
            }}
          >
            BUY THE<br />D◎G
          </div>

          {/* Dog — zoomed, floating, no box */}
          <div style={{
            position     : "relative",
            filter       : `drop-shadow(0 0 ${50 + intensity * 70}px rgba(255,255,255,${0.38 + intensity * 0.42}))`,
            animation    : "hypnoDogIn 0.6s ease forwards",
            transform    : `translateY(${floatY * 0.6}px) scale(${1 + intensity * 0.07})`,
            pointerEvents: "none",
          }}>
            <img
              src="/dog.png"
              alt="The Dog"
              style={{ width: "clamp(260px, 50vw, 500px)", height: "auto" }}
              onError={(e) => {
                if (!e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = "/dog1.png"; }
              }}
            />
          </div>

          {/* CA — tappable inside hypnosis */}
          <button
            onClick={(e) => { e.stopPropagation(); copyCA(); boostIntensity(1); }}
            onPointerEnter={() => boostIntensity(0.8)}
            style={{
              marginTop    : "16px",
              background   : copied ? "rgba(184,255,184,0.13)" : "rgba(0,0,0,0.45)",
              border       : `1px solid ${copied ? "rgba(184,255,184,0.5)" : "rgba(255,255,255,0.32)"}`,
              borderRadius : "3px",
              padding      : "12px 22px",
              color        : copied ? "#b8ffb8" : "#fff",
              fontFamily   : "'Space Mono', monospace",
              fontSize     : "clamp(9px, 1.5vw, 13px)",
              letterSpacing: "2px",
              cursor       : "pointer",
              backdropFilter: "blur(12px)",
              transition   : "all 0.3s ease",
              display      : "flex",
              alignItems   : "center",
              gap          : "10px",
              maxWidth     : "88vw",
              textShadow   : "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
            }}
          >
            <span style={{ opacity: 0.5, flexShrink: 0 }}>{copied ? "✓" : "⎘"}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {copied ? "COPIED!" : CONTRACT_ADDRESS}
            </span>
          </button>

          {/* Exit hint */}
          <div className="sh" style={{
            marginTop    : "22px",
            color        : "rgba(255,255,255,0.3)",
            fontFamily   : "'Space Mono', monospace",
            fontSize     : "10px",
            letterSpacing: "4px",
            pointerEvents: "none",
          }}>
            TAP ANYWHERE TO EXIT
          </div>

          {/* Ripple rings — size + opacity pulse with intensity */}
          {[0, 0.65, 1.3].map((delay) => (
            <div key={delay} style={{
              position     : "absolute",
              width        : `${180 + intensity * 120}px`,
              height       : `${180 + intensity * 120}px`,
              borderRadius : "50%",
              border       : `${1 + intensity * 2}px solid rgba(255,255,255,${0.18 + intensity * 0.28})`,
              animation    : `ripple ${2.4 - intensity * 0.7}s ease-out ${delay}s infinite`,
              pointerEvents: "none",
            }} />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════
           TOKENOMICS SCROLL SECTION
      ══════════════════════════════════ */}
      <div style={{
        position : "relative",
        zIndex   : 10,
        padding  : "70px 20px 100px",
        maxWidth : "800px",
        margin   : "0 auto",
        textAlign: "center",
      }}>
        <div style={{
          display             : "grid",
          gridTemplateColumns : "repeat(auto-fit, minmax(175px, 1fr))",
          gap                 : "18px",
        }}>
          {[
            { label: "TOTAL SUPPLY", value: "1,000,000,000" },
            { label: "TAX",          value: "0%"             },
            { label: "MINT",         value: "REVOKED"        },
            { label: "LP",           value: "BURNED"         },
          ].map(({ label, value }) => (
            <div key={label} style={{
              border        : "1px solid rgba(255,255,255,0.12)",
              padding       : "22px 14px",
              backdropFilter: "blur(10px)",
              background    : "rgba(0,0,0,0.38)",
            }}>
              <div className="sh" style={{
                color        : "rgba(255,255,255,0.58)",
                fontFamily   : "'Space Mono', monospace",
                fontSize     : "10px",
                letterSpacing: "4px",
                marginBottom : "8px",
              }}>{label}</div>
              <div className="sh2" style={{
                color        : "#fff",
                fontFamily   : "'Bebas Neue', sans-serif",
                fontSize     : "clamp(20px, 4vw, 32px)",
                letterSpacing: "2px",
              }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Bottom CA */}
        <div style={{ marginTop: "54px" }}>
          <div className="sh" style={{
            color        : "rgba(255,255,255,0.62)",
            fontFamily   : "'Space Mono', monospace",
            fontSize     : "10px",
            letterSpacing: "4px",
            marginBottom : "10px",
          }}>CONTRACT ADDRESS</div>
          <button
            onClick={copyCA}
            style={{
              background   : "rgba(0,0,0,0.42)",
              border       : "1px solid rgba(255,255,255,0.18)",
              borderRadius : "2px",
              padding      : "13px 26px",
              color        : copied ? "#b8ffb8" : "rgba(255,255,255,0.78)",
              fontFamily   : "'Space Mono', monospace",
              fontSize     : "clamp(9px, 1.5vw, 12px)",
              letterSpacing: "2px",
              cursor       : "pointer",
              transition   : "all 0.3s ease",
              maxWidth     : "90vw",
              overflow     : "hidden",
              textOverflow : "ellipsis",
              whiteSpace   : "nowrap",
              textShadow   : "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
            }}
          >
            {copied ? "✓ COPIED" : `⎘  ${CONTRACT_ADDRESS}`}
          </button>
        </div>

        <div className="sh" style={{
          marginTop    : "68px",
          color        : "rgba(255,255,255,0.32)",
          fontFamily   : "'Space Mono', monospace",
          fontSize     : "10px",
          letterSpacing: "3px",
        }}>
          THE DOG STARES INTO THE SPIRAL. THE SPIRAL STARES BACK.
        </div>
      </div>
    </div>
  );
}
