import React, { useEffect, useRef } from 'react';

interface CircuitBgProps {
  className?: string;
}

interface Node3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  vz: number;
  connections: number[];
  pulse: number;
  pulseSpeed: number;
  color: 'blue' | 'violet';
}

interface Signal3D {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  pulse: number;
}

export const CircuitBackground: React.FC<CircuitBgProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isHovering: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    let nodes: Node3D[] = [];
    let signals: Signal3D[] = [];
    let particles: Particle3D[] = [];

    // Colors matching brand identity
    const colors = {
      electricBlue: '#438EFF',
      violet: '#8874FF',
      cyan: '#53A7FF',
      gridDark: 'rgba(67, 142, 255, 0.035)',
      gridLight: 'rgba(37, 99, 235, 0.025)',
      traceDark: 'rgba(67, 142, 255, 0.12)',
      traceLight: 'rgba(37, 99, 235, 0.08)',
      particleBlue: 'rgba(67, 142, 255, 0.7)',
      particleViolet: 'rgba(136, 116, 255, 0.7)',
    };

    function resize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx!.scale(dpr, dpr);
      init();
    }

    function init() {
      const nodeCount = isMobile ? 18 : Math.min(36, Math.max(22, Math.floor((width * height) / 38000)));
      const particleCount = isMobile ? 25 : 60;

      // Initialize 3D Nodes
      nodes = Array.from({ length: nodeCount }, (_, i) => {
        const x = (Math.random() - 0.5) * width * 1.2;
        const y = (Math.random() - 0.5) * height * 1.2;
        const z = 0.6 + Math.random() * 1.4; // 0.6 = close, 2.0 = deep
        return {
          x,
          y,
          z,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          vz: (Math.random() - 0.5) * 0.002,
          connections: [],
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.02,
          color: i % 3 === 0 ? 'violet' : 'blue',
        };
      });

      // Build connections between nearby nodes in 3D
      nodes.forEach((node, i) => {
        node.connections = [];
        nodes.forEach((other, j) => {
          if (i !== j) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dz = (node.z - other.z) * 300;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < 260 && node.connections.length < (isMobile ? 2 : 3)) {
              node.connections.push(j);
            }
          }
        });
      });

      // Initialize signals traveling on traces
      const signalCount = isMobile ? 4 : 8;
      signals = Array.from({ length: signalCount }, () => createSignal());

      // Initialize floating background micro-particles
      particles = Array.from({ length: particleCount }, () => {
        const baseAlpha = 0.2 + Math.random() * 0.5;
        return {
          x: (Math.random() - 0.5) * width * 1.4,
          y: (Math.random() - 0.5) * height * 1.4,
          z: 0.5 + Math.random() * 1.8,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2 - 0.05,
          size: 1 + Math.random() * 2,
          alpha: baseAlpha,
          baseAlpha,
          pulse: Math.random() * Math.PI * 2,
        };
      });
    }

    function createSignal(): Signal3D {
      const fromNode = Math.floor(Math.random() * nodes.length);
      const conn = nodes[fromNode]?.connections;
      const toNode = conn && conn.length > 0 ? conn[Math.floor(Math.random() * conn.length)] : fromNode;
      const useViolet = Math.random() > 0.6;
      return {
        fromNode,
        toNode,
        progress: 0,
        speed: 0.006 + Math.random() * 0.008,
        color: useViolet ? colors.violet : colors.electricBlue,
      };
    }

    // Mouse move tracking for subtle parallax
    const handleMouseMove = (e: MouseEvent) => {
      const cx = width / 2;
      const cy = height / 2;
      mouseRef.current.targetX = (e.clientX - cx) * 0.04;
      mouseRef.current.targetY = (e.clientY - cy) * 0.04;
      mouseRef.current.isHovering = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
      mouseRef.current.isHovering = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    function project3D(x: number, y: number, z: number, parallaxX: number, parallaxY: number) {
      const depth = Math.max(0.4, z);
      const screenX = width / 2 + (x + parallaxX * (1.5 - depth)) / depth;
      const screenY = height / 2 + (y + parallaxY * (1.5 - depth)) / depth;
      const scale = 1 / depth;
      return { screenX, screenY, scale };
    }

    function drawGrid(parallaxX: number, parallaxY: number) {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      ctx!.strokeStyle = isDark ? colors.gridDark : colors.gridLight;
      ctx!.lineWidth = 0.5;

      const gridSize = 80;
      const startX = ((parallaxX * 0.3) % gridSize) - gridSize;
      const startY = ((parallaxY * 0.3) % gridSize) - gridSize;

      for (let x = startX; x < width + gridSize; x += gridSize) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, height);
        ctx!.stroke();
      }

      for (let y = startY; y < height + gridSize; y += gridSize) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(width, y);
        ctx!.stroke();
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse parallax interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      const pX = mouseRef.current.x;
      const pY = mouseRef.current.y;

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

      // 1. Draw subtle digital perspective grid
      drawGrid(pX, pY);

      // 2. Animate and draw 3D micro-particles
      particles.forEach((p) => {
        if (!prefersReduced) {
          p.x += p.vx;
          p.y += p.vy;
          p.pulse += 0.02;
          // Wrap around edges
          const boundX = width * 0.7;
          const boundY = height * 0.7;
          if (p.x < -boundX) p.x = boundX;
          if (p.x > boundX) p.x = -boundX;
          if (p.y < -boundY) p.y = boundY;
          if (p.y > boundY) p.y = -boundY;
        }

        const proj = project3D(p.x, p.y, p.z, pX * 0.6, pY * 0.6);
        if (proj.screenX < -20 || proj.screenX > width + 20 || proj.screenY < -20 || proj.screenY > height + 20) {
          return;
        }

        const alpha = Math.max(0.05, p.baseAlpha + Math.sin(p.pulse) * 0.15) * (isDark ? 1 : 0.6);
        ctx!.fillStyle = p.z > 1.2 ? `rgba(136, 116, 255, ${alpha})` : `rgba(67, 142, 255, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(proj.screenX, proj.screenY, Math.max(0.8, p.size * proj.scale), 0, Math.PI * 2);
        ctx!.fill();
      });

      // 3. Update nodes in 3D
      if (!prefersReduced) {
        nodes.forEach((node) => {
          node.x += node.vx;
          node.y += node.vy;
          node.pulse += node.pulseSpeed;

          const boundX = width * 0.6;
          const boundY = height * 0.6;
          if (node.x < -boundX || node.x > boundX) node.vx *= -1;
          if (node.y < -boundY || node.y > boundY) node.vy *= -1;
        });
      }

      // Pre-calculate projections
      const projections = nodes.map((node) => project3D(node.x, node.y, node.z, pX, pY));

      // 4. Draw circuit traces between connected nodes
      nodes.forEach((node, i) => {
        const fromProj = projections[i];
        if (!fromProj) return;

        node.connections.forEach((j) => {
          if (j <= i) return; // Draw each connection once
          const toProj = projections[j];
          if (!toProj) return;

          const dx = toProj.screenX - fromProj.screenX;
          const dy = toProj.screenY - fromProj.screenY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 380) return;

          // Depth-weighted alpha
          const avgScale = (fromProj.scale + toProj.scale) * 0.5;
          const alpha = (1 - dist / 380) * 0.18 * avgScale * (isDark ? 1 : 0.7);

          ctx!.strokeStyle = node.color === 'violet' ? `rgba(136, 116, 255, ${alpha})` : `rgba(67, 142, 255, ${alpha})`;
          ctx!.lineWidth = Math.max(0.6, 1.2 * avgScale);
          ctx!.beginPath();
          ctx!.moveTo(fromProj.screenX, fromProj.screenY);

          // Circuit orthogonal bends (where hardware meets software)
          const midX = fromProj.screenX + dx * 0.5;
          ctx!.lineTo(midX, fromProj.screenY);
          ctx!.lineTo(midX, toProj.screenY);
          ctx!.lineTo(toProj.screenX, toProj.screenY);
          ctx!.stroke();

          // Circuit trace elbow points
          ctx!.fillStyle = node.color === 'violet' ? `rgba(136, 116, 255, ${alpha * 2})` : `rgba(67, 142, 255, ${alpha * 2})`;
          ctx!.beginPath();
          ctx!.arc(midX, fromProj.screenY, 1.5 * avgScale, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.beginPath();
          ctx!.arc(midX, toProj.screenY, 1.5 * avgScale, 0, Math.PI * 2);
          ctx!.fill();
        });
      });

      // 5. Draw animated signals moving along the circuit traces
      if (!prefersReduced) {
        signals.forEach((sig, idx) => {
          const fromProj = projections[sig.fromNode];
          const toProj = projections[sig.toNode];
          if (!fromProj || !toProj || sig.fromNode === sig.toNode) return;

          sig.progress += sig.speed;
          if (sig.progress >= 1) {
            signals[idx] = createSignal();
            return;
          }

          const dx = toProj.screenX - fromProj.screenX;
          const dy = toProj.screenY - fromProj.screenY;
          const midX = fromProj.screenX + dx * 0.5;

          // Segment path interpolation: seg 1 (horiz) -> seg 2 (vert) -> seg 3 (horiz)
          let sx = fromProj.screenX;
          let sy = fromProj.screenY;
          const t = sig.progress;

          if (t < 0.33) {
            const segT = t / 0.33;
            sx = fromProj.screenX + (midX - fromProj.screenX) * segT;
            sy = fromProj.screenY;
          } else if (t < 0.66) {
            const segT = (t - 0.33) / 0.33;
            sx = midX;
            sy = fromProj.screenY + dy * segT;
          } else {
            const segT = (t - 0.66) / 0.34;
            sx = midX + (toProj.screenX - midX) * segT;
            sy = toProj.screenY;
          }

          const avgScale = (fromProj.scale + toProj.scale) * 0.5;
          const radius = Math.max(2, 4 * avgScale);

          // Glowing pulse aura
          const grad = ctx!.createRadialGradient(sx, sy, 0, sx, sy, radius * 3);
          grad.addColorStop(0, sig.color);
          grad.addColorStop(0.5, sig.color === colors.violet ? 'rgba(136, 116, 255, 0.35)' : 'rgba(67, 142, 255, 0.35)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx!.fillStyle = grad;
          ctx!.beginPath();
          ctx!.arc(sx, sy, radius * 3, 0, Math.PI * 2);
          ctx!.fill();

          // Core bright particle
          ctx!.fillStyle = '#FFFFFF';
          ctx!.beginPath();
          ctx!.arc(sx, sy, Math.max(1, radius * 0.5), 0, Math.PI * 2);
          ctx!.fill();
        });
      }

      // 6. Draw 3D circuit nodes (ICs / micro-pads)
      nodes.forEach((node, i) => {
        const proj = projections[i];
        if (!proj) return;
        if (proj.screenX < -30 || proj.screenX > width + 30 || proj.screenY < -30 || proj.screenY > height + 30) {
          return;
        }

        const pulseScale = 1 + Math.sin(node.pulse) * 0.25;
        const baseRadius = (node.color === 'violet' ? 3.5 : 3) * proj.scale * pulseScale;
        const mainColor = node.color === 'violet' ? colors.violet : colors.electricBlue;

        // Outer glow aura
        const glowRadius = baseRadius * 4.5;
        const glow = ctx!.createRadialGradient(
          proj.screenX,
          proj.screenY,
          baseRadius * 0.5,
          proj.screenX,
          proj.screenY,
          glowRadius
        );
        glow.addColorStop(0, node.color === 'violet' ? 'rgba(136, 116, 255, 0.3)' : 'rgba(67, 142, 255, 0.3)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(proj.screenX, proj.screenY, glowRadius, 0, Math.PI * 2);
        ctx!.fill();

        // Node center
        ctx!.fillStyle = mainColor;
        ctx!.beginPath();
        ctx!.arc(proj.screenX, proj.screenY, Math.max(1.5, baseRadius), 0, Math.PI * 2);
        ctx!.fill();

        // White core highlight for depth
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx!.beginPath();
        ctx!.arc(proj.screenX, proj.screenY, Math.max(0.8, baseRadius * 0.4), 0, Math.PI * 2);
        ctx!.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`circuit-canvas ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
};
