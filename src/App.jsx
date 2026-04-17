import { useState, useEffect, useRef, useCallback } from "react";

// ─── EMBEDDED DOG IMAGE (Image 1 - white background, best for compositing) ───
// We'll use the uploaded image via a public URL reference
// Since this is a React project, images go in /public or /src/assets
// We reference them as imported assets below

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

// ─── SPIRAL CANVAS BACKGROUND ───────────────────────────────────────────────
function SpiralCanvas({ speed, distortion, hypnosis }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2 + distortion.x * 0.04;
      const cy = H / 2 + distortion.y * 0.04;

      const rings = hypnosis ? 28 : 18;
      const maxR = Math.sqrt(W * W + H * H) * 0.72;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleRef.current);

      // Fill entire background black first
      ctx.fillStyle = "#050505";
      ctx.fillRect(-W, -H, W * 2, H * 2);

      // Draw spiral rings — white bands are very thin (0.08 of ring spacing)
      for (let i = 1; i <= rings; i++) {
        const r = (i / rings) * maxR;
        // White band is only 8% of the ring gap — thin line, dark dominant
        const bandWidth = (maxR / rings) * 0.08;
        const innerR = r - bandWidth;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.arc(0, 0, Math.max(0, innerR), 0, Math.PI * 2, true);
        ctx.fillStyle = hypnosis ? "rgba(255,255,255,0.9)" : "rgba(220,220,220,0.75)";
        ctx.fill();
      }

      ctx.restore();

      // Vignette
      const vignette = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, hypnosis ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.4)");
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
  }, [speed, distortion, hypnosis]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        transition: "filter 0.8s ease",
        filter: hypnosis ? "contrast(1.3) saturate(0)" : "contrast(1.1) saturate(0)",
      }}
    />
  );
}

// ─── ROTATING SPIRAL EYE SVG ─────────────────────────────────────────────────
function SpiralEye({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
      <circle cx="50" cy="50" r="50" fill="white" />
      <g style={{ animation: "eyeSpin 1.8s linear infinite", transformOrigin: "50px 50px" }}>
        {[48, 38, 28, 20, 13, 7, 3].map((r, i) => (
          <circle key={i} cx="50" cy="50" r={r} fill="none" stroke="black" strokeWidth={i < 3 ? 3 : i < 5 ? 2.5 : 2} />
        ))}
        {[43, 33, 23, 16, 10, 5].map((r, i) => (
          <path
            key={`arc-${i}`}
            d={`M ${50 + r} 50 A ${r} ${r} 0 0 1 50 ${50 - r}`}
            fill="black"
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="6" fill="black" />
      <circle cx="44" cy="44" r="3" fill="white" opacity="0.7" />
    </svg>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [scrollY, setScrollY] = useState(0);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hypnosis, setHypnosis] = useState(false);
  const [copied, setCopied] = useState(false);
  const [glitch, setGlitch] = useState(false);

  // Distortion offset from cursor center
  const distortion = {
    x: cursor.x - window.innerWidth / 2,
    y: cursor.y - window.innerHeight / 2,
  };

  // Speed varies with scroll + hypnosis
  const baseSpeed = 1 + scrollY * 0.003;
  const spiralSpeed = hypnosis ? baseSpeed * 3.5 : baseSpeed;

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    const onMove = (e) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener("scroll", onScroll);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  // Glitch effect on hypnosis toggle
  const toggleHypnosis = () => {
    setGlitch(true);
    setTimeout(() => setGlitch(false), 500);
    setHypnosis((h) => !h);
  };

  const copyCA = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Floating animation offset
  const floatOffset = Math.sin(Date.now() * 0.001) * 10; // Will re-render via RAF below
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id;
    const loop = () => { setTick((t) => t + 1); id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const floatY = Math.sin(tick * 0.018) * 12;
  const floatRot = Math.sin(tick * 0.011) * 1.5;

  // Parallax dog offset from cursor
  const dogParallaxX = distortion.x * 0.015;
  const dogParallaxY = distortion.y * 0.015;

  return (
    <div
      style={{
        minHeight: "100vh",
        overflow: "hidden",
        fontFamily: "'Bebas Neue', 'Impact', sans-serif",
        cursor: hypnosis ? "crosshair" : "default",
        userSelect: "none",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');

        @keyframes eyeSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes floatIn {
          from { opacity: 0; transform: translateY(40px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes glitchFlash {
          0% { filter: invert(0); }
          20% { filter: invert(1) hue-rotate(90deg); }
          40% { filter: invert(0); }
          60% { filter: invert(1) hue-rotate(200deg); }
          80% { filter: invert(0); }
          100% { filter: invert(0); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(255,255,255,0.3); }
          50% { transform: scale(1.04); box-shadow: 0 0 60px rgba(255,255,255,0.7); }
        }

        @keyframes ctaGlow {
          0%, 100% { text-shadow: 0 0 20px #fff, 0 0 40px #fff; }
          50% { text-shadow: 0 0 40px #fff, 0 0 80px #aaa, 0 0 120px #888; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Black stroke on all text for legibility over spiral ── */
        .stroke-text {
          paint-order: stroke fill;
          text-shadow:
            -1px -1px 0 #000,
             1px -1px 0 #000,
            -1px  1px 0 #000,
             1px  1px 0 #000,
            0 2px 8px rgba(0,0,0,0.9),
            0 4px 20px rgba(0,0,0,0.7);
        }

        .stroke-text-heavy {
          paint-order: stroke fill;
          text-shadow:
            -2px -2px 0 #000,
             2px -2px 0 #000,
            -2px  2px 0 #000,
             2px  2px 0 #000,
            -1px  0   0 #000,
             1px  0   0 #000,
             0   -1px 0 #000,
             0    1px 0 #000,
            0 4px 24px rgba(0,0,0,0.95),
            0 0  40px rgba(0,0,0,0.8);
        }

        .stroke-mono {
          text-shadow:
            -1px -1px 0 #000,
             1px -1px 0 #000,
            -1px  1px 0 #000,
             1px  1px 0 #000,
            0 2px 12px rgba(0,0,0,0.95);
        }

        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #fff; }
      `}</style>

      {/* Animated spiral background */}
      <SpiralCanvas speed={spiralSpeed} distortion={distortion} hypnosis={hypnosis} />

      {/* Glitch overlay */}
      {glitch && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          animation: "glitchFlash 0.5s ease forwards",
          pointerEvents: "none",
          background: "rgba(255,255,255,0.05)",
        }} />
      )}

      {/* ── HERO SECTION ── */}
      <div style={{
        position: "relative",
        zIndex: 10,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}>

        {/* Title */}
        <div style={{
          animation: "slideUp 1s ease forwards",
          textAlign: "center",
          marginBottom: "8px",
        }}>
          <div className="stroke-mono" style={{
            fontSize: "clamp(14px, 3vw, 22px)",
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "8px",
            fontFamily: "'Space Mono', monospace",
            marginBottom: "4px",
          }}>
            ◈ SOLANA MEMECOIN ◈
          </div>
          <h1 className="stroke-text-heavy" style={{
            fontSize: "clamp(52px, 12vw, 120px)",
            color: "#fff",
            letterSpacing: "4px",
            lineHeight: 0.9,
            textShadow: hypnosis
              ? "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 40px #fff, 0 0 80px #fff, 0 0 120px rgba(255,255,255,0.5)"
              : undefined,
            animation: hypnosis ? "ctaGlow 1.5s ease infinite" : "none",
            transition: "text-shadow 0.8s ease",
          }}>
            BUY THE<br />
            <span style={{ fontSize: "1.1em", letterSpacing: "8px" }}>D◎G</span>
          </h1>
        </div>

        {/* ── DOG with spiral eyes overlay ── */}
        <div
          style={{
            position: "relative",
            transform: `translate(${dogParallaxX}px, ${floatY + dogParallaxY}px) rotate(${floatRot}deg) scale(${hypnosis ? 1.35 : 1})`,
            transition: "transform 0.1s linear, scale 0.8s cubic-bezier(0.34,1.56,0.64,1)",
            animation: "floatIn 1.2s ease forwards",
            filter: `drop-shadow(0 20px 60px rgba(0,0,0,0.8)) drop-shadow(0 0 ${hypnosis ? "60px" : "20px"} rgba(255,255,255,${hypnosis ? 0.4 : 0.1}))`,
            zIndex: 20,
            marginTop: "-20px",
          }}
        >
          {/* Dog image */}
          <img
            src="/dog.png"
            alt="The Dog"
            style={{
              width: "clamp(220px, 40vw, 420px)",
              height: "auto",
              display: "block",
              imageRendering: "crisp-edges",
            }}
            onError={(e) => {
              // Fallback: try other filenames
              if (e.target.src.includes("dog.png")) e.target.src = "/dog1.png";
              else if (e.target.src.includes("dog1.png")) e.target.src = "/doge.png";
            }}
          />

          {/* Spiral Eyes Overlay - positioned over dog's eyes */}
          <div style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "clamp(8px, 3vw, 22px)",
            pointerEvents: "none",
          }}>
            <SpiralEye size={Math.min(52, window.innerWidth * 0.085)} />
            <SpiralEye size={Math.min(52, window.innerWidth * 0.085)} />
          </div>

          {/* Rubber duck kept as-is (it's in the image) */}
        </div>

        {/* ── CONTRACT ADDRESS ── */}
        <div style={{
          animation: "slideUp 1.4s ease forwards",
          marginTop: "clamp(16px, 3vw, 32px)",
          zIndex: 20,
        }}>
          <div className="stroke-mono" style={{
            fontSize: "clamp(9px, 1.8vw, 13px)",
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "4px",
            fontFamily: "'Space Mono', monospace",
            textAlign: "center",
            marginBottom: "8px",
          }}>
            CONTRACT ADDRESS
          </div>
          <button
            onClick={copyCA}
            style={{
              background: copied
                ? "rgba(255,255,255,0.25)"
                : "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "4px",
              padding: "12px 24px",
              color: "#fff",
              fontFamily: "'Space Mono', monospace",
              fontSize: "clamp(9px, 1.5vw, 13px)",
              letterSpacing: "2px",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              maxWidth: "90vw",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.18)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = copied ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }}
          >
            <span style={{ opacity: 0.6, flexShrink: 0 }}>
              {copied ? "✓" : "⎘"}
            </span>
            <span style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: copied ? "#b8ffb8" : "#fff",
              transition: "color 0.3s",
            }}>
              {copied ? "COPIED TO CLIPBOARD" : CONTRACT_ADDRESS}
            </span>
          </button>
        </div>

        {/* ── HYPNOSIS MODE BUTTON ── */}
        <button
          onClick={toggleHypnosis}
          style={{
            marginTop: "clamp(20px, 4vw, 40px)",
            background: hypnosis
              ? "rgba(255,255,255,0.95)"
              : "transparent",
            border: `2px solid ${hypnosis ? "#000" : "rgba(255,255,255,0.8)"}`,
            borderRadius: "2px",
            padding: "14px 40px",
            color: hypnosis ? "#000" : "#fff",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(16px, 3vw, 22px)",
            letterSpacing: "6px",
            cursor: "pointer",
            transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
            animation: hypnosis ? "pulse 2s ease infinite" : "none",
            zIndex: 20,
            position: "relative",
          }}
          onMouseEnter={(e) => {
            if (!hypnosis) {
              e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              e.currentTarget.style.transform = "scale(1.05)";
            }
          }}
          onMouseLeave={(e) => {
            if (!hypnosis) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "scale(1)";
            }
          }}
        >
          {hypnosis ? "◉ ESCAPE THE SPIRAL ◉" : "◎ ENTER HYPNOSIS ◎"}
        </button>

        {/* Social links row */}
        <div style={{
          display: "flex",
          gap: "32px",
          marginTop: "32px",
          zIndex: 20,
          animation: "slideUp 1.8s ease forwards",
        }}>
          {["X/TWITTER", "TELEGRAM", "DEXSCREENER"].map((label) => (
            <a
              key={label}
              href="#"
              style={{
                color: "rgba(255,255,255,0.6)",
                fontFamily: "'Space Mono', monospace",
                fontSize: "clamp(8px, 1.5vw, 11px)",
                letterSpacing: "3px",
                textDecoration: "none",
                transition: "color 0.3s",
                textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 8px rgba(0,0,0,0.9)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* ── HYPNOSIS MODE OVERLAY ── */}
      {hypnosis && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)",
          pointerEvents: "none",
          animation: "floatIn 0.6s ease forwards",
        }}>
          {/* Big CTA text */}
          <div className="stroke-text-heavy" style={{
            color: "#fff",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(28px, 8vw, 80px)",
            letterSpacing: "10px",
            textAlign: "center",
            lineHeight: 1,
            animation: "ctaGlow 2s ease infinite",
            marginBottom: "20px",
          }}>
            BUY THE D◎G
          </div>

          {/* Zoomed dog */}
          <div style={{
            position: "relative",
            filter: "drop-shadow(0 0 80px rgba(255,255,255,0.5))",
            animation: "pulse 3s ease infinite",
            transform: `translateY(${floatY * 0.5}px)`,
          }}>
            <img
              src="/dog.png"
              alt="The Dog"
              style={{
                width: "clamp(280px, 55vw, 560px)",
                height: "auto",
              }}
              onError={(e) => {
                if (e.target.src.includes("dog.png")) e.target.src = "/dog1.png";
              }}
            />
            <div style={{
              position: "absolute",
              top: "35%",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "clamp(10px, 3vw, 26px)",
              pointerEvents: "none",
            }}>
              <SpiralEye size={Math.min(68, window.innerWidth * 0.1)} />
              <SpiralEye size={Math.min(68, window.innerWidth * 0.1)} />
            </div>
          </div>

          {/* CTA Subtitle */}
          <div className="stroke-mono" style={{
            color: "rgba(255,255,255,0.9)",
            fontFamily: "'Space Mono', monospace",
            fontSize: "clamp(10px, 2vw, 16px)",
            letterSpacing: "6px",
            marginTop: "16px",
            animation: "ctaGlow 2.5s ease infinite 0.5s",
          }}>
            YOU CANNOT RESIST
          </div>

          {/* Ripple rings */}
          {[0, 0.5, 1].map((delay) => (
            <div key={delay} style={{
              position: "absolute",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.3)",
              animation: `ripple 3s ease-out ${delay}s infinite`,
              pointerEvents: "none",
            }} />
          ))}
        </div>
      )}

      {/* ── SCROLL SECTION ── */}
      <div style={{
        position: "relative",
        zIndex: 10,
        padding: "80px 20px",
        maxWidth: "800px",
        margin: "0 auto",
        textAlign: "center",
      }}>
        <div className="stroke-text-heavy" style={{
          color: "rgba(255,255,255,0.25)",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(60px, 15vw, 160px)",
          lineHeight: 0.85,
          letterSpacing: "2px",
          pointerEvents: "none",
        }}>
          MUCH<br />WOW
        </div>

        <div style={{
          marginTop: "60px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
        }}>
          {[
            { label: "TOTAL SUPPLY", value: "1,000,000,000" },
            { label: "TAX", value: "0%" },
            { label: "MINT", value: "REVOKED" },
            { label: "LP", value: "BURNED" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "24px 16px",
              backdropFilter: "blur(10px)",
              background: "rgba(255,255,255,0.04)",
            }}>
              <div className="stroke-mono" style={{
                color: "rgba(255,255,255,0.6)",
                fontFamily: "'Space Mono', monospace",
                fontSize: "10px",
                letterSpacing: "4px",
                marginBottom: "8px",
              }}>{label}</div>
              <div className="stroke-text-heavy" style={{
                color: "#fff",
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(20px, 4vw, 32px)",
                letterSpacing: "2px",
              }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Bottom CA copy */}
        <div style={{ marginTop: "60px" }}>
          <div className="stroke-mono" style={{
            color: "rgba(255,255,255,0.7)",
            fontFamily: "'Space Mono', monospace",
            fontSize: "10px",
            letterSpacing: "4px",
            marginBottom: "10px",
          }}>CONTRACT ADDRESS</div>
          <button
            onClick={copyCA}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "2px",
              padding: "14px 28px",
              color: copied ? "#b8ffb8" : "rgba(255,255,255,0.7)",
              fontFamily: "'Space Mono', monospace",
              fontSize: "clamp(9px, 1.5vw, 12px)",
              letterSpacing: "2px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              maxWidth: "90vw",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? "✓ COPIED" : `⎘  ${CONTRACT_ADDRESS}`}
          </button>
        </div>

        <div className="stroke-mono" style={{
          marginTop: "80px",
          color: "rgba(255,255,255,0.4)",
          fontFamily: "'Space Mono', monospace",
          fontSize: "10px",
          letterSpacing: "3px",
        }}>
          THE DOG STARES INTO THE SPIRAL. THE SPIRAL STARES BACK.
        </div>
      </div>
    </div>
  );
}
