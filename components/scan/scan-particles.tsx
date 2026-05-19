"use client";

import { useEffect, useRef } from "react";

/**
 * Tiny canvas of 14 dots drifting upward with random horizontal sway.
 * Hidden under prefers-reduced-motion. Pure decoration — no role.
 */
export function ScanParticles({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = (canvas.width = canvas.clientWidth * window.devicePixelRatio);
    let h = (canvas.height = canvas.clientHeight * window.devicePixelRatio);

    const onResize = () => {
      w = canvas.width = canvas.clientWidth * window.devicePixelRatio;
      h = canvas.height = canvas.clientHeight * window.devicePixelRatio;
    };
    window.addEventListener("resize", onResize);

    type Particle = {
      x: number;
      y: number;
      vy: number;
      sway: number;
      swayPhase: number;
      size: number;
      alpha: number;
      life: number;
      maxLife: number;
    };

    const N = 16;
    const colors = ["#00D26A", "#3B82F6", "#F472B6"];
    const spawn = (): Particle => {
      const maxLife = 4_500 + Math.random() * 3_000;
      return {
        x: Math.random() * w,
        y: h + 10,
        vy: 0.15 + Math.random() * 0.45,
        sway: 6 + Math.random() * 14,
        swayPhase: Math.random() * Math.PI * 2,
        size: (1.2 + Math.random() * 1.8) * window.devicePixelRatio,
        alpha: 0,
        life: 0,
        maxLife,
      };
    };
    const particles: Particle[] = Array.from({ length: N }).map(spawn);

    const start = performance.now();
    function tick(now: number) {
      const dt = now - start;
      ctx!.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += 16;
        if (p.life > p.maxLife || p.y < -10) {
          particles[i] = spawn();
          continue;
        }
        p.y -= p.vy * window.devicePixelRatio;
        const offsetX =
          Math.sin((dt + p.swayPhase * 1000) / 1200 + i) * p.sway * window.devicePixelRatio * 0.1;
        const targetX = p.x + offsetX;
        // Fade in then out
        const norm = p.life / p.maxLife;
        p.alpha = norm < 0.2 ? norm / 0.2 : norm > 0.8 ? (1 - norm) / 0.2 : 1;
        const color = colors[i % colors.length];
        ctx!.beginPath();
        ctx!.arc(targetX, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = color + Math.floor(Math.max(0, Math.min(1, p.alpha)) * 200)
          .toString(16)
          .padStart(2, "0");
        ctx!.shadowBlur = 12 * window.devicePixelRatio;
        ctx!.shadowColor = color;
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ctx.clearRect(0, 0, w, h);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] h-full w-full"
    />
  );
}
