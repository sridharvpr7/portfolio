import React, { useEffect, useState, useRef } from 'react';
import './CustomCursor.css';

export const CustomCursor: React.FC = () => {
  const [isEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const isTouchOnly = 'ontouchstart' in window && !isFinePointer;
    return isFinePointer && !isTouchOnly;
  });
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [isHoveringLink, setIsHoveringLink] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Position references for smooth interpolation
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('has-custom-cursor');

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      setIsVisible(true);

      // Fast placement for the center dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check hovered interactive elements via event delegation
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isBtn = Boolean(target.closest('button, .btn, .navbar-icon-btn, .projects-filter-btn, .modal-close'));
      const isLnk = Boolean(target.closest('a, [role="button"], .modal-gallery-thumb, .modal-gallery-dot'));
      const isCrd = Boolean(target.closest('.card, .project-card, .featured-card, .cert-card'));

      setIsHoveringButton(isBtn);
      setIsHoveringLink(!isBtn && isLnk);
      setIsHoveringCard(!isBtn && !isLnk && isCrd);
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    // Smooth follower interpolation loop
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;
    const speed = prefersReducedMotion ? 1 : 0.22;

    const animateRing = () => {
      ringPos.current.x = lerp(ringPos.current.x, mousePos.current.x, speed);
      ringPos.current.y = lerp(ringPos.current.y, mousePos.current.y, speed);

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(animateRing);
    };

    rafId.current = requestAnimationFrame(animateRing);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isEnabled]);

  if (!isEnabled) return null;

  const ringClasses = [
    'cursor-ring',
    isVisible ? 'visible' : '',
    isMouseDown ? 'clicking' : '',
    isHoveringButton ? 'hover-button' : '',
    isHoveringLink ? 'hover-link' : '',
    isHoveringCard ? 'hover-card' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="custom-cursor-container" aria-hidden="true">
      {/* Central Cursor Dot */}
      <div
        ref={dotRef}
        className={`cursor-dot ${isVisible ? 'visible' : ''} ${isMouseDown ? 'clicking' : ''}`}
      />

      {/* Smooth Outer Follower Ring */}
      <div ref={ringRef} className={ringClasses}>
        <div className="cursor-ring-inner" />
      </div>
    </div>
  );
};
