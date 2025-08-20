import React, { useState, useRef, useEffect } from 'react';

export default function Game() {
  const width = 400;
  const height = 400;
  const radius = 100;      // Distância fixa do boss
  const speed = 0.03;      // Velocidade de rotação

  const [angle, setAngle] = useState(0);
  const keys = useRef({ ArrowLeft: false, ArrowRight: false });

  // Captura tecla pressionada
  useEffect(() => {
    const down = e => {
      if (e.key in keys.current) keys.current[e.key] = true;
    };
    const up = e => {
      if (e.key in keys.current) keys.current[e.key] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Loop de animação
  useEffect(() => {
    let rafId;
    const loop = () => {
      setAngle(prev => {
        let next = prev;
        if (keys.current.ArrowLeft)  next -= speed;
        if (keys.current.ArrowRight) next += speed;
        return next;
      });
      rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Centro do boss
  const cx = width  / 2 - 25;  // Ajuste de 25px pra alinhar retângulo
  const cy = height / 2 - 25;

  // Posição do player
  const px = cx + radius * Math.cos(angle);
  const py = cy + radius * Math.sin(angle);

  return (
    <div
      style={{
        position: 'relative',
        width: width,
        height: height,
        background: '#222',
      }}
    >
      {/* Boss no centro */}
      <div
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          width: 50,
          height: 50,
          background: 'red',
        }}
      />

      {/* Player orbitando */}
      <div
        style={{
          position: 'absolute',
          left: px,
          top: py,
          width: 30,
          height: 30,
          background: 'lime',
        }}
      />
    </div>
  );
}
