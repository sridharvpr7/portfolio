import React, { useEffect, useRef, useState } from 'react';
import './IntroSequence.css';

interface IntroSequenceProps {
  onComplete: () => void;
  duration?: number;
  name?: string;
  tagline?: string;
}

export const IntroSequence: React.FC<IntroSequenceProps> = ({
  onComplete,
  duration = 3500,
  name = 'Sridhar',
  tagline = 'ECE Student & Full-Stack Developer',
}) => {
  const [phase, setPhase] = useState<'boot' | 'circuit' | 'reveal' | 'exit'>('boot');
  const [skipped, setSkipped] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || skipped) {
      onComplete();
      return;
    }

    const t1 = setTimeout(() => setPhase('circuit'), 400);
    const t2 = setTimeout(() => setPhase('reveal'), 1400);
    const t3 = setTimeout(() => setPhase('exit'), duration - 600);
    const t4 = setTimeout(() => onComplete(), duration);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [duration, onComplete, skipped]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let progress = 0;

    function drawFrame() {
      if (!ctx || !canvas) return;
      progress = Math.min(progress + 0.012, 1);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Horizontal line sweep
      const lineLen = progress * cx * 1.4;
      const alpha = Math.sin(progress * Math.PI) * 0.8 + 0.2;

      ctx.strokeStyle = `rgba(83,167,255,${alpha})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = '#53A7FF';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(cx - lineLen, cy);
      ctx.lineTo(cx + lineLen, cy);
      ctx.stroke();

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(cx, cy - lineLen * 0.6);
      ctx.lineTo(cx, cy + lineLen * 0.6);
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Corner decorators
      const size = 60 * progress;
      const corners = [
        [cx - lineLen, cy - lineLen * 0.6],
        [cx + lineLen, cy - lineLen * 0.6],
        [cx - lineLen, cy + lineLen * 0.6],
        [cx + lineLen, cy + lineLen * 0.6],
      ];

      corners.forEach(([x, y]) => {
        ctx.strokeStyle = `rgba(146,117,255,${alpha * 0.6})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.3);
        ctx.lineTo(x, y);
        ctx.lineTo(x + (x < cx ? size * 0.3 : -size * 0.3), y);
        ctx.stroke();
      });

      // Signal pulse dot
      const dotX = cx - lineLen + lineLen * 2 * progress;
      ctx.fillStyle = `rgba(83,167,255,${alpha})`;
      ctx.shadowColor = '#53A7FF';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(dotX, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (progress < 1) {
        animRef.current = requestAnimationFrame(drawFrame);
      }
    }

    drawFrame();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleSkip = () => {
    setSkipped(true);
    setPhase('exit');
    setTimeout(() => onComplete(), 400);
  };

  return (
    <div className={`intro-sequence phase-${phase}`} aria-hidden="true">
      <canvas ref={canvasRef} className="intro-canvas" />

      <div className="intro-content">
        <div className={`intro-label ${phase === 'reveal' || phase === 'exit' ? 'visible' : ''}`}>
          <span className="font-mono" style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
            &gt; System Initializing
          </span>
        </div>

        <h1 className={`intro-name ${phase === 'reveal' || phase === 'exit' ? 'visible' : ''}`}>
          <span className="intro-name-line">
            {name.split('').map((ch, i) => (
              <span
                key={i}
                className="intro-char"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </span>
        </h1>

        <p className={`intro-tagline ${phase === 'reveal' || phase === 'exit' ? 'visible' : ''}`}>
          {tagline}
        </p>

        <div className={`intro-signal-line ${phase === 'circuit' || phase === 'reveal' ? 'visible' : ''}`}>
          <div className="intro-signal-track">
            <div className="intro-signal-dot" />
          </div>
        </div>
      </div>

      <button
        className="intro-skip"
        onClick={handleSkip}
        aria-label="Skip intro"
      >
        Skip Intro
      </button>
    </div>
  );
};
