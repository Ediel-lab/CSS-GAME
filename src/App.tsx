// src/App.tsx

import React, { useState, useRef, useEffect } from 'react';
import './app.css';

export default function App() {
  // Tamanho do “mundo”
  const width = 400;
  const height = 400;
  const radius = 100;

  // Movimento e dash
  const baseSpeed = 0.05;       // velocidade do player
  const dashMultiplier = 3;
  const dashDuration = 0.1;     // 0,1s de dash
  const dashKey = 'Space';

  // Dodge radial (escape)
  const [radialDash, setRadialDash] = useState(false);
  const dodgeKey = 'Control';
  const dodgeDistance = 50;      // pixels extras no dodge
  const dodgeDuration = 0.2;     // 0,2s de dodge

  // Estado de ângulo e dash
  const [angle, setAngle] = useState(0);
  const [dashActive, setDash] = useState(false);
  const keys = useRef<{ ArrowLeft: boolean; ArrowRight: boolean }>({
    ArrowLeft: false,
    ArrowRight: false,
  });

  // Captura de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        keys.current[e.key as 'ArrowLeft' | 'ArrowRight'] = true;
      }
      if (e.code === dashKey && !dashActive) {
        setDash(true);
        setTimeout(() => setDash(false), dashDuration * 1000);
      }
      if (e.key === dodgeKey && !radialDash) {
        setRadialDash(true);
        setTimeout(() => setRadialDash(false), dodgeDuration * 1000);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        keys.current[e.key as 'ArrowLeft' | 'ArrowRight'] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dashActive, radialDash]);

  // Loop de animação para atualizar o ângulo
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      setAngle(prev => {
        const speed = dashActive
          ? baseSpeed * dashMultiplier
          : baseSpeed;
        let next = prev;
        if (keys.current.ArrowLeft) next -= speed;
        if (keys.current.ArrowRight) next += speed;
        return next;
      });
      rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafId);
  }, [dashActive]);

  // Centro do chefão e posição do player
  const cx = width / 2 - 25;
  const cy = height / 2 - 25;
  const effectiveRadius = radius + (radialDash ? dodgeDistance : 0);
  const px = cx + effectiveRadius * Math.cos(angle);
  const py = cy + effectiveRadius * Math.sin(angle);

  // Parâmetros de ataque do chefão
  const [attackStage, setAttackStage] = useState<'idle' | 'blinking' | 'attacking'>('idle');
  const [blinkActive, setBlinkActive] = useState(false);

  const totalBlinks = 2;
  const preAttackDelay = 1000;      // 1s antes de piscar
  const blinkInterval = 600;        // 600ms por piscar
  const attackDuration = 300;       // 0,3s de braço estendido
  const attackIntervalTime = 3000;  // 3s entre ciclos de ataque

  const armSegments = 5;
  const segmentSize = 20;
  const attackOffset = 40;          // distância extra ao nascer o braço

  // Ciclo de piscadas e ataque
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const startAttackCycle = () => {
      timer = setTimeout(() => {
        setAttackStage('blinking');
        let count = 0;

        const doBlink = () => {
          setBlinkActive(b => !b);
          count++;
          if (count < totalBlinks * 2) {
            timer = setTimeout(doBlink, blinkInterval);
          } else {
            setBlinkActive(false);
            setAttackStage('attacking');
            timer = setTimeout(() => {
              setAttackStage('idle');
              timer = setTimeout(startAttackCycle, attackIntervalTime);
            }, attackDuration);
          }
        };

        doBlink();
      }, preAttackDelay);
    };

    timer = setTimeout(startAttackCycle, attackIntervalTime);
    return () => clearTimeout(timer);
  }, []);

  // Ângulo de mira para o ataque
  const angleToPlayer = Math.atan2(py - cy, px - cx);

  return (
    <div className="game-container" style={{ width, height }}>

      {/* Chefão com piscada de aviso */}
      <div
        className={`boss${blinkActive ? ' blink' : ''}`}
        style={{ left: cx, top: cy }}
      />

      {/* Preview dos segmentos durante aviso */}
      {attackStage === 'blinking' &&
        Array.from({ length: armSegments }).map((_, i) => {
          const dist = radius + attackOffset + (i + 1) * segmentSize;
          const ax = cx + dist * Math.cos(angleToPlayer);
          const ay = cy + dist * Math.sin(angleToPlayer);
          return (
            <div
              key={`preview-${i}`}
              className="arm-segment preview"
              style={{
                left: ax,
                top: ay,
                width: segmentSize,
                height: segmentSize
              }}
            />
          );
        })}

      {/* Segmentos do ataque real */}
      {attackStage === 'attacking' &&
        Array.from({ length: armSegments }).map((_, i) => {
          const dist = radius + attackOffset + (i + 1) * segmentSize;
          const ax = cx + dist * Math.cos(angleToPlayer);
          const ay = cy + dist * Math.sin(angleToPlayer);
          return (
            <div
              key={`attack-${i}`}
              className="arm-segment"
              style={{
                left: ax,
                top: ay,
                width: segmentSize,
                height: segmentSize
              }}
            />
          );
        })}

      {/* Personagem */}
      <div
        className={`player${dashActive ? ' dash' : ''}`}
        style={{ left: px, top: py }}
      />
    </div>
  );
}