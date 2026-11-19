'use client';

import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const cursor = cursorRef.current;
    const trail = trailRef.current;
    if (!cursor || !trail) return;

    let objetivoX = 0;
    let objetivoY = 0;
    let actualX = 0;
    let actualY = 0;
    let visible = false;

    const mover = (evento: MouseEvent) => {
      objetivoX = evento.clientX;
      objetivoY = evento.clientY;
      cursor.style.transform = `translate3d(${objetivoX - 6}px, ${objetivoY - 6}px, 0)`;
      if (!visible) {
        cursor.dataset.visible = 'true';
        trail.dataset.visible = 'true';
        visible = true;
      }
    };

    const salir = () => {
      cursor.dataset.visible = 'false';
      trail.dataset.visible = 'false';
      visible = false;
    };

    let animacion = 0;
    const animarEstela = () => {
      actualX += (objetivoX - actualX) * 0.16;
      actualY += (objetivoY - actualY) * 0.16;
      trail.style.transform = `translate3d(${actualX - 18}px, ${actualY - 18}px, 0)`;
      animacion = window.requestAnimationFrame(animarEstela);
    };

    window.addEventListener('mousemove', mover, { passive: true });
    document.documentElement.addEventListener('mouseleave', salir);
    animacion = window.requestAnimationFrame(animarEstela);

    return () => {
      window.removeEventListener('mousemove', mover);
      document.documentElement.removeEventListener('mouseleave', salir);
      window.cancelAnimationFrame(animacion);
    };
  }, []);

  return (
    <>
      <div ref={trailRef} className="cursor-estela" aria-hidden="true" />
      <div ref={cursorRef} className="cursor-rojo" aria-hidden="true" />
    </>
  );
}
