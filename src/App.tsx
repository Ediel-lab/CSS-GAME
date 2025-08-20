import React, { useState, useRef, useEffect } from 'react';
import './app.css';      // ← não esqueça

export default function App() {
  const width  = 400;
  const height = 400;
  const radius = 100;
  const baseSpeed      = 0.03;
  const dashMultiplier = 3;
  const dashDuration   = 0.5;
  const dashKey        = 'Shift';

  const [angle, setAngle]     = useState(0);
  const [dashActive, setDash] = useState(false);
  const keys = useRef({ ArrowLeft: false, ArrowRight: false });

  // captura teclas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in keys.current) keys.current[e.key as 'ArrowLeft' | 'ArrowRight'] = true;
      if (e.key === dashKey && !dashActive) {
        setDash(true);
        setTimeout(() => setDash(false), dashDuration * 1000);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key in keys.current) keys.current[e.key as 'ArrowLeft' | 'ArrowRight'] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dashActive]);

  // loop de animação
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      setAngle(prev => {
        let next = prev;
        const speed = dashActive ? baseSpeed * dashMultiplier : baseSpeed;
        if (keys.current.ArrowLeft)  next -= speed;
        if (keys.current.ArrowRight) next += speed;
        return next;
      });
      rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafId);
  }, [dashActive]);

  const cx = width  / 2 - 25;
  const cy = height / 2 - 25;
  const px = cx + radius * Math.cos(angle);
  const py = cy + radius * Math.sin(angle);

  return (
    <div className="game-container" style={{ width, height }}>
      <div className="boss" style={{ left: cx, top: cy }} />
      <div className={`player${dashActive ? ' dash' : ''}`} style={{ left: px, top: py }} />
    </div>
  );
}
