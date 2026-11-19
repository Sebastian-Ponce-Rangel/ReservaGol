'use client';

import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const cursor = cursorRef.current;
    const canvas = canvasRef.current;
    if (!cursor || !canvas) return;

    const contexto = canvas.getContext('2d');
    if (!contexto) return;

    let ancho = window.innerWidth;
    let alto = window.innerHeight;
    let x = -20;
    let y = -20;
    let visible = false;
    const puntos: Array<{ x: number; y: number; vida: number; radio: number }> = [];
    let animacion = 0;

    const ajustarCanvas = () => {
      ancho = window.innerWidth;
      alto = window.innerHeight;
      const escala = window.devicePixelRatio || 1;
      canvas.width = ancho * escala;
      canvas.height = alto * escala;
      canvas.style.width = `${ancho}px`;
      canvas.style.height = `${alto}px`;
      contexto.setTransform(escala, 0, 0, escala, 0, 0);
    };

    ajustarCanvas();

    const mover = (evento: MouseEvent) => {
      x = evento.clientX;
      y = evento.clientY;
      cursor.style.transform = `translate3d(${x - 6}px, ${y - 6}px, 0)`;
      puntos.push({ x, y, vida: 1, radio: 3.2 });
      if (!visible) {
        cursor.dataset.visible = 'true';
        visible = true;
      }
    };

    const salir = () => {
      cursor.dataset.visible = 'false';
      visible = false;
    };

    const animarEstela = () => {
      contexto.clearRect(0, 0, ancho, alto);
      contexto.save();
      contexto.globalCompositeOperation = 'lighter';

      for (let indice = puntos.length - 1; indice >= 0; indice -= 1) {
        const punto = puntos[indice];
        if (!punto) continue;
        punto.vida *= 0.91;
        punto.radio *= 0.985;
        if (punto.vida < 0.025) {
          puntos.splice(indice, 1);
          continue;
        }
        contexto.beginPath();
        contexto.arc(punto.x, punto.y, punto.radio, 0, Math.PI * 2);
        contexto.fillStyle = `rgba(239, 68, 68, ${0.5 * punto.vida})`;
        contexto.shadowColor = 'rgba(239, 68, 68, 0.5)';
        contexto.shadowBlur = 8;
        contexto.fill();
      }

      contexto.restore();
      animacion = window.requestAnimationFrame(animarEstela);
    };

    window.addEventListener('mousemove', mover, { passive: true });
    window.addEventListener('resize', ajustarCanvas);
    document.documentElement.addEventListener('mouseleave', salir);
    animacion = window.requestAnimationFrame(animarEstela);

    return () => {
      window.removeEventListener('mousemove', mover);
      window.removeEventListener('resize', ajustarCanvas);
      document.documentElement.removeEventListener('mouseleave', salir);
      window.cancelAnimationFrame(animacion);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="cursor-estela" aria-hidden="true" />
      <div ref={cursorRef} className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_15px_#ef4444,0_0_30px_#ef4444] cursor-rojo" aria-hidden="true" />
    </>
  );
}
