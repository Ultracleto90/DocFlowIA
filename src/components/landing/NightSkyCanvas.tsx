'use client';

import { useEffect, useRef } from 'react';

interface StarPoint {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  phase: number;
  speed: number;
}

interface TopologyNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  highlight: boolean;
}

export function NightSkyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const supportsHover = window.matchMedia(
      '(hover: hover) and (pointer: fine)',
    ).matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const pointer = {
      targetX: -9999,
      targetY: -9999,
      x: -9999,
      y: -9999,
      active: false,
    };

    let stars: StarPoint[] = [];
    let nodes: TopologyNode[] = [];
    let isDark = document.documentElement.classList.contains('dark');

    function seedScene() {
      const starCount = width < 640 ? 42 : 76;
      const nodeCount = width < 640 ? 14 : 24;

      stars = Array.from({ length: starCount }, (_, i) => ({
        x: ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * width,
        y: ((Math.sin(i * 78.233) * 19341.123) % 1 + 1) % 1 * height,
        r: (i % 3 === 0 ? 1.5 : 0.9),
        baseAlpha: 0.25 + (i % 5) * 0.12,
        phase: i * 0.7,
        speed: 0.0008 + (i % 4) * 0.0004,
      }));

      nodes = Array.from({ length: nodeCount }, (_, i) => {
        const seedA = ((Math.sin(i * 45.164) * 29431.7) % 1 + 1) % 1;
        const seedB = ((Math.sin(i * 91.317) * 15823.3) % 1 + 1) % 1;
        return {
          x: seedA * width,
          y: seedB * height,
          vx: ((i % 2 === 0 ? 1 : -1) * (0.08 + (i % 3) * 0.04)),
          vy: ((i % 3 === 0 ? 1 : -1) * (0.06 + (i % 4) * 0.03)),
          radius: i % 4 === 0 ? 2.4 : 1.7,
          highlight: i % 4 === 0,
        };
      });
    }

    function resize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedScene();
    }

    resize();

    const observer = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
      if (prefersReducedMotion) {
        drawFrame(0);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    function onMouseMove(e: MouseEvent) {
      if (!supportsHover) return;
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.active = true;
    }

    function onMouseLeave() {
      pointer.active = false;
    }

    window.addEventListener('resize', resize, { passive: true });
    if (supportsHover && !prefersReducedMotion) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseleave', onMouseLeave, { passive: true });
    }

    function drawFrame(timeMs: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const scrollOffset = window.scrollY || 0;
      const starShift = (scrollOffset * 0.05) % height;
      const nodeShift = (scrollOffset * 0.12) % height;

      // Subtle nocturnal sky gradient wash
      if (isDark) {
        const skyGrad = ctx.createRadialGradient(
          width * 0.82,
          Math.max(90, 120 - scrollOffset * 0.08),
          12,
          width * 0.82,
          Math.max(90, 120 - scrollOffset * 0.08),
          Math.max(width * 0.45, 340),
        );
        skyGrad.addColorStop(0, 'rgba(34, 211, 238, 0.10)');
        skyGrad.addColorStop(0.45, 'rgba(99, 102, 241, 0.07)');
        skyGrad.addColorStop(1, 'rgba(5, 11, 24, 0)');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Subtle moon + atmospheric halo in upper right quadrant
      const moonX = width * 0.85;
      const moonY = Math.max(-120, 118 - scrollOffset * 0.14);
      if (moonY > -100 && moonY < height + 100) {
        const halo = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 110);
        if (isDark) {
          halo.addColorStop(0, 'rgba(237, 244, 255, 0.24)');
          halo.addColorStop(0.4, 'rgba(34, 211, 238, 0.08)');
          halo.addColorStop(1, 'rgba(5, 11, 24, 0)');
        } else {
          halo.addColorStop(0, 'rgba(31, 67, 140, 0.10)');
          halo.addColorStop(0.5, 'rgba(8, 145, 178, 0.05)');
          halo.addColorStop(1, 'rgba(235, 242, 250, 0)');
        }
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 110, 0, Math.PI * 2);
        ctx.fill();

        // Crisp lunar crescent disk
        ctx.save();
        ctx.beginPath();
        ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? 'rgba(237, 244, 255, 0.78)'
          : 'rgba(31, 67, 140, 0.16)';
        ctx.fill();

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(moonX + 9, moonY - 5, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Twinkling background stars
      for (const star of stars) {
        const y = (star.y - starShift + height) % height;
        const twinkle = prefersReducedMotion
          ? 1
          : 0.65 + 0.35 * Math.sin(timeMs * star.speed + star.phase);
        const alpha = star.baseAlpha * twinkle;

        ctx.fillStyle = isDark
          ? `rgba(219, 234, 254, ${alpha.toFixed(3)})`
          : `rgba(31, 67, 140, ${(alpha * 0.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lerp pointer
      if (pointer.active) {
        pointer.x += (pointer.targetX - pointer.x) * 0.12;
        pointer.y += (pointer.targetY - pointer.y) * 0.12;
      }

      // Constellation / code-topology nodes
      const maxLinkDist = width < 640 ? 120 : 165;
      const pointerDist = 175;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
        }

        const drawY = (node.y - nodeShift + height) % height;

        // Node-to-node constellation filaments
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const otherY = (other.y - nodeShift + height) % height;
          const dx = node.x - other.x;
          const dy = drawY - otherY;
          const dist = Math.hypot(dx, dy);

          if (dist < maxLinkDist) {
            const strength = (1 - dist / maxLinkDist) * (isDark ? 0.22 : 0.12);
            ctx.strokeStyle = isDark
              ? `rgba(123, 168, 255, ${strength.toFixed(3)})`
              : `rgba(31, 67, 140, ${strength.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, drawY);
            ctx.lineTo(other.x, otherY);
            ctx.stroke();
          }
        }

        // Subtle cursor topology attraction line
        let nearCursor = false;
        if (pointer.active && !prefersReducedMotion) {
          const pdx = node.x - pointer.x;
          const pdy = drawY - pointer.y;
          const pdist = Math.hypot(pdx, pdy);
          if (pdist < pointerDist) {
            nearCursor = true;
            const pStrength = (1 - pdist / pointerDist) * (isDark ? 0.34 : 0.2);
            ctx.strokeStyle = isDark
              ? `rgba(34, 211, 238, ${pStrength.toFixed(3)})`
              : `rgba(8, 145, 178, ${pStrength.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, drawY);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = node.highlight || nearCursor
          ? isDark
            ? 'rgba(34, 211, 238, 0.78)'
            : 'rgba(8, 145, 178, 0.55)'
          : isDark
            ? 'rgba(165, 180, 252, 0.45)'
            : 'rgba(31, 67, 140, 0.28)';

        ctx.beginPath();
        ctx.arc(node.x, drawY, nearCursor ? node.radius + 0.8 : node.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let rafId = 0;
    if (prefersReducedMotion) {
      drawFrame(0);
    } else {
      const tick = (now: number) => {
        drawFrame(now);
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      observer.disconnect();
      window.removeEventListener('resize', resize);
      if (supportsHover && !prefersReducedMotion) {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
