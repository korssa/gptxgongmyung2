"use client";

export default function SoftGlowStar() {
  return (
    <>
      {/* 🌟 Soft Glow Star CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .soft-star {
          position: absolute;
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, #fff 0%, #ffffff66 40%, transparent 80%);
          border-radius: 50%;
          filter: blur(6px) drop-shadow(0 0 10px #fff5);
          animation: pulse 4s ease-in-out infinite;
          opacity: 0.7;
        }
        
        .soft-rays {
          position: absolute;
          width: 160px;
          height: 160px;
          background: conic-gradient(from 0deg, #ffffff44 0deg 45deg, transparent 90deg);
          border-radius: 50%;
          filter: blur(10px);
          animation: slow-rotate 30s linear infinite;
          opacity: 0.4;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        
        @keyframes slow-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        `
      }} />

      {/* 🌟 Soft Glow Star - 진짜 별빛 정화 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="soft-rays" />
        <div className="soft-rays" style={{ animationDelay: '5s', transform: 'rotate(45deg)' }} />
        <div className="soft-star" />
      </div>
    </>
  );
}
