"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

interface Snowflake {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export function SnowAnimation() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  // 초기 눈송이 생성 메모이제이션
  const initialSnowflakes = useMemo(() => {
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 100; i++) {
      flakes.push({
        id: i,
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
        size: Math.random() * 6 + 4, // 4-10px (더 큰 눈송이)
        speed: Math.random() * 50 + 20, // 20-70 pixels per second
        opacity: Math.random() * 0.6 + 0.4, // 0.4-1.0
      });
    }
    return flakes;
  }, []);

  useEffect(() => {
    setSnowflakes(initialSnowflakes);

    // 델타타임 기반 애니메이션 루프
    let lastTime = performance.now();
    let animationId: number;

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // 초 단위
      lastTime = currentTime;

      setSnowflakes(prev => 
        prev.map(flake => {
          const newY = flake.y + (flake.speed * deltaTime);
          
          // 화면 밖으로 나가면 즉시 다시 위로 (상시 내리기)
          if (newY > window.innerHeight + 20) {
            return {
              ...flake,
              y: -20, // 더 위에서 시작
              x: Math.random() * window.innerWidth
            };
          }
          
          return {
            ...flake,
            y: newY,
            x: flake.x // X 좌표는 변경하지 않음 (직선 하강)
          };
        })
      );

      // 항상 애니메이션 계속 실행
      animationId = requestAnimationFrame(animate);
    };

    // 애니메이션 시작
    animationId = requestAnimationFrame(animate);

    // 윈도우 리사이즈 처리
    const handleResize = () => {
      setSnowflakes(prev => 
        prev.map(flake => ({
          ...flake,
          x: flake.x > window.innerWidth ? Math.random() * window.innerWidth : flake.x
        }))
      );
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [initialSnowflakes]);

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${flake.x}px`,
            top: `${flake.y}px`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}
