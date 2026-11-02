import React, { useEffect, useRef } from 'react';

interface CircuitBgProps {
  className?: string;
}

export const CircuitBackground: React.FC<CircuitBgProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    interface Node {
      x: number; y: number;
      vx: number; vy: number;
      connections: number[];
      pulse: number;
      pulseSpeed: number;
    }

    interface Signal {
      fromNode: number;
      toNode: number;
      progress: number;
      speed: number;
      opacity: number;
    }

    let nodes: Node[] = [];
    let signals: Signal[] = [];

    function getThemeColor() {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      return {
        node: isDark ? 'rgba(83,167,255,0.6)' : 'rgba(37,99,235,0.5)',
        line: isDark ? 'rgba(83,167,255,0.08)' : 'rgba(37,99,235,0.06)',
        signal: isDark ? '#53A7FF' : '#2563EB',
        grid: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.025)',
        pulse: isDark ? 'rgba(146,117,255,0.4)' : 'rgba(124,58,237,0.3)',
      };
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;
      init();
    }

    function init() {
      const count = Math.floor((width * height) / 28000);
      nodes = Array.from({ length: Math.min(count, 28) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        connections: [],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.015,
      }));

      // Build connections
      nodes.forEach((node, i) => {
        node.connections = [];
        nodes.forEach((other, j) => {
          if (i !== j) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 220 && node.connections.length < 3) {
              node.connections.push(j);
            }
          }
        });
      });

      // Signals
      signals = Array.from({ length: 5 }, () => createSignal());
    }

    function createSignal(): Signal {
      const fromNode = Math.floor(Math.random() * nodes.length);
      const conn = nodes[fromNode]?.connections;
      const toNode = conn && conn.length > 0 ? conn[Math.floor(Math.random() * conn.length)] : fromNode;
      return {
        fromNode,
        toNode,
        progress: 0,
        speed: 0.004 + Math.random() * 0.006,
        opacity: 0.6 + Math.random() * 0.4,
      };
    }

    function drawGrid(colors: ReturnType<typeof getThemeColor>) {
      const size = 60;
      ctx!.strokeStyle = colors.grid;
      ctx!.lineWidth = 0.5;
      for (let x = 0; x < width; x += size) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, height);
        ctx!.stroke();
      }
      for (let y = 0; y < height; y += size) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(width, y);
        ctx!.stroke();
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const colors = getThemeColor();

      drawGrid(colors);

      // Update nodes
      if (!prefersReduced) {
        nodes.forEach(node => {
          node.x += node.vx;
          node.y += node.vy;
          node.pulse += node.pulseSpeed;
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
        });
      }

      // Draw connections
      nodes.forEach((node, _i) => {
        node.connections.forEach(j => {
          const other = nodes[j];
          if (!other) return;
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 250) return;

          const alpha = (1 - dist / 250) * 0.12;
          ctx!.strokeStyle = `rgba(83,167,255,${alpha})`;
          ctx!.lineWidth = 0.7;
          ctx!.beginPath();
          ctx!.moveTo(node.x, node.y);

          // Route at right angles for circuit feel
          const midX = node.x + dx * 0.5;
          ctx!.lineTo(midX, node.y);
          ctx!.lineTo(midX, other.y);
          ctx!.lineTo(other.x, other.y);
          ctx!.stroke();

          // Corner dots
          ctx!.fillStyle = `rgba(83,167,255,${alpha * 3})`;
          ctx!.beginPath();
          ctx!.arc(midX, node.y, 1.5, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.beginPath();
          ctx!.arc(midX, other.y, 1.5, 0, Math.PI * 2);
          ctx!.fill();
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        const pulseRadius = 3 + Math.sin(node.pulse) * 1.5;
        const pulseAlpha = 0.4 + Math.sin(node.pulse) * 0.3;

        // Outer glow
        const gradient = ctx!.createRadialGradient(node.x, node.y, 0, node.x, node.y, 12);
        gradient.addColorStop(0, `rgba(83,167,255,${pulseAlpha * 0.4})`);
        gradient.addColorStop(1, 'rgba(83,167,255,0)');
        ctx!.fillStyle = gradient;
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, 12, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.fillStyle = `rgba(83,167,255,${pulseAlpha})`;
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
        ctx!.fill();
      });

      // Draw signals
      if (!prefersReduced) {
        signals.forEach((sig, idx) => {
          const from = nodes[sig.fromNode];
          const to = nodes[sig.toNode];
          if (!from || !to) return;

          sig.progress += sig.speed;
          if (sig.progress > 1) {
            signals[idx] = createSignal();
            return;
          }

          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const midX = from.x + dx * 0.5;

          // Position along right-angle path
          let x: number, y: number;
          const segA = Math.abs(dx) / (Math.abs(dx) + Math.abs(dy) + 0.001);
          if (sig.progress < segA) {
            const t = sig.progress / segA;
            x = from.x + dx * 0.5 * t;
            y = from.y;
          } else if (sig.progress < segA + (1 - segA) * 0.5) {
            const t = (sig.progress - segA) / ((1 - segA) * 0.5);
            x = midX;
            y = from.y + dy * t;
          } else {
            const t = (sig.progress - segA - (1 - segA) * 0.5) / ((1 - segA) * 0.5);
            x = midX + dx * 0.5 * t;
            y = to.y;
          }

          const gradient = ctx!.createRadialGradient(x, y, 0, x, y, 6);
          gradient.addColorStop(0, `rgba(83,167,255,${sig.opacity})`);
          gradient.addColorStop(1, 'rgba(83,167,255,0)');
          ctx!.fillStyle = gradient;
          ctx!.beginPath();
          ctx!.arc(x, y, 4, 0, Math.PI * 2);
          ctx!.fill();

          ctx!.fillStyle = '#53A7FF';
          ctx!.beginPath();
          ctx!.arc(x, y, 2, 0, Math.PI * 2);
          ctx!.fill();
        });
      }

      animRef.current = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
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
