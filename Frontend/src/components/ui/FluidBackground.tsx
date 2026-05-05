import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import bgImage from "@/assets/liquid-metal-bg.png";

const tints: Record<string, string> = {
  landing:   "rgba(10, 10, 30, 0.50)",
  auth:      "rgba(40, 12, 0, 0.55)",
  dashboard: "rgba(5, 0, 50, 0.55)",
  wardrobe:  "rgba(25, 0, 50, 0.55)",
  recommend: "rgba(0, 35, 15, 0.55)",
  outfits:   "rgba(25, 0, 40, 0.55)",
  analytics: "rgba(0, 25, 45, 0.55)",
};

function getTint(pathname: string): string {
  if (pathname === "/login" || pathname === "/register") return tints.auth;
  if (pathname.includes("/wardrobe")) return tints.wardrobe;
  if (pathname.includes("/recommend")) return tints.recommend;
  if (pathname.includes("/outfits")) return tints.outfits;
  if (pathname.includes("/analytics")) return tints.analytics;
  if (pathname.includes("/dashboard")) return tints.dashboard;
  return tints.landing;
}

export const FluidBackground = () => {
  const location = useLocation();

  // DOM refs — we mutate these directly to avoid React re-renders on every mousemove
  const imgRef     = useRef<HTMLImageElement>(null);
  const lightRef   = useRef<HTMLDivElement>(null);
  const tintRef    = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number>(0);

  // Smooth lerp targets
  const mouse  = useRef({ x: 0.5, y: 0.5 });
  const smooth = useRef({ x: 0.5, y: 0.5 });

  // Per-route tint update
  useEffect(() => {
    if (tintRef.current) {
      tintRef.current.style.backgroundColor = getTint(location.pathname);
    }
  }, [location.pathname]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = e.clientY / window.innerHeight;
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    const animate = () => {
      // Lerp smooth position toward mouse — feels fluid, not snappy
      const lf = 0.06; // lower = more lag/fluid
      smooth.current.x += (mouse.current.x - smooth.current.x) * lf;
      smooth.current.y += (mouse.current.y - smooth.current.y) * lf;

      const sx = smooth.current.x;
      const sy = smooth.current.y;

      // Parallax: image shifts subtly opposite to cursor (max ±2%)
      if (imgRef.current) {
        const tx = (sx - 0.5) * -4; // percent
        const ty = (sy - 0.5) * -4;
        imgRef.current.style.transform = `scale(1.06) translate(${tx}%, ${ty}%)`;
      }

      // Light spot: follows cursor, simulates chrome specular reflection
      if (lightRef.current) {
        const lx = sx * 100; // percentage across viewport
        const ly = sy * 100;
        lightRef.current.style.background =
          `radial-gradient(ellipse 35% 30% at ${lx}% ${ly}%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -10,
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* Base liquid metal image */}
      <img
        ref={imgRef}
        src={bgImage}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          opacity: 0.88,
          willChange: "transform",
          transform: "scale(1.06) translate(0%,0%)",
        }}
      />

      {/* Cursor-tracked chrome specular light — the interactive "liquid" feel */}
      <div
        ref={lightRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          willChange: "background",
          mixBlendMode: "screen",
        }}
      />

      {/* Per-route color tint */}
      <div
        ref={tintRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: getTint(location.pathname),
          transition: "background-color 1.5s ease",
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />

      {/* Edge vignette — keeps text readable */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
