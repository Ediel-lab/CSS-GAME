// src/App.tsx

import React, { useState, useRef, useEffect } from 'react';
import './app.css';

export default function App() {
  // --- 1. CONFIGURAÇÕES DO MUNDO E PLAYER ---

  const width = 400;
  const height = 400;
  const radius = 100;

  const baseSpeed = 0.05;
  const dashMultiplier = 3;
  const dashDuration = 0.1;    // em segundos
  const dashKey = 'Space';

  const [radialDash, setRadialDash] = useState(false);
  const dodgeKey = 'Control';
  const dodgeDistance = 50;
  const dodgeDuration = 0.2;

  const [angle, setAngle] = useState(0);
  const [dashActive, setDash] = useState(false);
  const keys = useRef<{ ArrowLeft: boolean; ArrowRight: boolean }>({
    ArrowLeft: false,
    ArrowRight: false,
  });

  // Captura de teclas
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        keys.current[e.key as 'ArrowLeft' | 'ArrowRight'] = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [dashActive, radialDash]);

  // Loop principal de rotação do player
  useEffect(() => {
    let rafId: number;
    const animate = () => {
      setAngle(prev => {
        const speed = dashActive ? baseSpeed * dashMultiplier : baseSpeed;
        let next = prev;
        if (keys.current.ArrowLeft)  next -= speed;
        if (keys.current.ArrowRight) next += speed;
        return next;
      });
      rafId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(rafId);
  }, [dashActive]);

  // Calcula posição do player
  const cx = width / 2 - 25;
  const cy = height / 2 - 25;
  const effectiveRadius = radius + (radialDash ? dodgeDistance : 0);
  const px = cx + effectiveRadius * Math.cos(angle);
  const py = cy + effectiveRadius * Math.sin(angle);

  // --- 2. CONFIGURAÇÃO DO ATAQUE DO CHEFÃO ---

  const [blinkActive, setBlinkActive] = useState(false);
  const [attackStage, setAttackStage] = useState<'idle' | 'blinking' | 'attacking'>('idle');
  const [attackStartTime, setAttackStartTime] = useState<number | null>(null);
  const [attackProgress, setAttackProgress] = useState(0);

  const totalBlinks = 2;
  const preAttackDelay = 1000;     // 1s antes de piscar
  const blinkInterval = 600;       // 600ms por piscar
  const attackDuration = 300;      // 300ms de extensão total
  const attackIntervalTime = 3000; // 3s entre ataques

  const armSegments = 5;
  const segmentSize = 20;
  const attackOffset = 40;

  // Loop de piscadas e ciclo de ataque
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const startAttackCycle = () => {
      timer = setTimeout(() => {
        setAttackStage('blinking');
        let count = 0;

        const doBlink = () => {
          setBlinkActive(prev => !prev);
          count++;
          if (count < totalBlinks * 2) {
            timer = setTimeout(doBlink, blinkInterval);
          } else {
            setBlinkActive(false);
            setAttackStartTime(performance.now());
            setAttackStage('attacking');

            // volta a idle depois de atacar
            timer = setTimeout(() => {
              setAttackStage('idle');
              setAttackStartTime(null);
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

  // Animação do progresso de ataque (0 → 1)
  useEffect(() => {
    let rafId: number;
    if (attackStage === 'attacking' && attackStartTime !== null) {
      const animateAttack = (time: number) => {
        const elapsed = time - attackStartTime;
        const prog = Math.min(elapsed / attackDuration, 1);
        setAttackProgress(prog);
        if (elapsed < attackDuration) {
          rafId = requestAnimationFrame(animateAttack);
        }
      };
      rafId = requestAnimationFrame(animateAttack);
    } else {
      setAttackProgress(0);
    }
    return () => cancelAnimationFrame(rafId);
  }, [attackStage, attackStartTime]);

  // Cálculo do ângulo atual de mira
  const angleToPlayer = Math.atan2(py - cy, px - cx);

  // --- 3. RENDERIZAÇÃO ---

  return (
    <div className="game-container" style={{ width, height }}>

      {/* Chefão */}
      <div
        className={`boss${blinkActive ? ' blink' : ''}`}
        style={{ left: cx, top: cy }}
      />

      {/* Preview durante piscar */}
      {attackStage === 'blinking' &&
        Array.from({ length: armSegments }).map((_, i) => {
          const dist = radius + attackOffset + (i + 1) * segmentSize;
          const x = cx + dist * Math.cos(angleToPlayer);
          const y = cy + dist * Math.sin(angleToPlayer);
          return (
            <div
              key={`preview-${i}`}
              className="arm-segment preview"
              style={{
                left: x,
                top: y,
                width: segmentSize,
                height: segmentSize
              }}
            />
          );
        })}

      {/* Segmentos reais de ataque */}
      {attackStage === 'attacking' &&
        Array.from({ length: armSegments }).map((_, i) => {
          const baseDist = radius + attackOffset;
          const growing  = attackProgress * (i + 1) * segmentSize;
          const dist     = baseDist + growing;
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

      {/* Jogador */}
      <div
        className={`player${dashActive ? ' dash' : ''}`}
        style={{ left: px, top: py }}
      />
    </div>
  );
}
