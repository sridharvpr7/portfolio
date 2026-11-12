import React, { useEffect, useRef } from 'react';
import './CustomCursor.css';

export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only initialize on desktop with fine pointer
    if (typeof window === 'undefined') return;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const isTouchOnly = 'ontouchstart' in window && !isFinePointer;
    if (!isFinePointer || isTouchOnly) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('has-custom-cursor');

    const mouse = { x: -100, y: -100, targetX: -100, targetY: -100 };
    const ring = { x: -100, y: -100, currentScale: 1, targetScale: 1 };
    let isVisible = false;
    let magneticTarget: DOMRect | null = null;
    let hoverState: 'default' | 'button' | 'link' | 'card' | 'input' = 'default';
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        if (dotRef.current) dotRef.current.style.opacity = '1';
        if (ringRef.current) ringRef.current.style.opacity = '1';
      }

      // Fast sync for center white dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check hover targets via elementFromPoint or event target
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Inputs and textareas preserve native cursor
      if (target.closest('input, textarea, select, [contenteditable="true"]')) {
        hoverState = 'input';
        magneticTarget = null;
        ring.targetScale = 0.5;
        return;
      }

      const btn = target.closest('button, .btn, .navbar-icon-btn, .projects-filter-btn, .modal-close, .share-btn-root, .share-trigger-btn, .cert-filter-btn, .cert-filter-pill, .ai-fab-btn, .ai-chip');
      const lnk = target.closest('a, [role="button"], .navbar-link, .modal-gallery-thumb, .modal-gallery-dot');
      const crd = target.closest('.card, .project-card, .featured-card, .cert-card, .cert-card-clickable, .github-repo-card, .github-profile-card');

      if (btn) {
        hoverState = 'button';
        ring.targetScale = 1.45;
        // Subtle magnetic pull for buttons
        const rect = btn.getBoundingClientRect();
        if (rect.width < 240 && rect.height < 120) {
          magneticTarget = rect;
        } else {
          magneticTarget = null;
        }
      } else if (lnk) {
        hoverState = 'link';
        ring.targetScale = 1.25;
        magneticTarget = null;
      } else if (crd) {
        hoverState = 'card';
        ring.targetScale = 1.8;
        magneticTarget = null;
      } else {
        hoverState = 'default';
        ring.targetScale = 1;
        magneticTarget = null;
      }
    };

    const handleMouseDown = () => {
      if (dotRef.current) dotRef.current.classList.add('clicking');
      if (ringRef.current) ringRef.current.classList.add('clicking');
    };

    const handleMouseUp = () => {
      if (dotRef.current) dotRef.current.classList.remove('clicking');
      if (ringRef.current) ringRef.current.classList.remove('clicking');
    };

    const handleMouseLeave = () => {
      isVisible = false;
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    const handleMouseEnter = () => {
      isVisible = true;
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (ringRef.current) ringRef.current.style.opacity = '1';
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    // RAF smooth interpolation loop
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;
    const speed = prefersReducedMotion ? 1 : 0.22;

    const render = () => {
      let targetX = mouse.targetX;
      let targetY = mouse.targetY;

      // Magnetic pull to center of small elements
      if (magneticTarget) {
        const centerX = magneticTarget.left + magneticTarget.width / 2;
        const centerY = magneticTarget.top + magneticTarget.height / 2;
        targetX = lerp(mouse.targetX, centerX, 0.35);
        targetY = lerp(mouse.targetY, centerY, 0.35);
      }

      ring.x = lerp(ring.x, targetX, speed);
      ring.y = lerp(ring.y, targetY, speed);
      ring.currentScale = lerp(ring.currentScale, ring.targetScale, 0.18);

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) scale(${ring.currentScale})`;
        ringRef.current.setAttribute('data-hover', hoverState);
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="custom-cursor-container" aria-hidden="true">
      {/* Central precise white pointer */}
      <div ref={dotRef} className="cursor-dot" />

      {/* Electric blue / violet glowing outer ring */}
      <div ref={ringRef} className="cursor-ring">
        <div className="cursor-ring-inner" />
      </div>
    </div>
  );
};
