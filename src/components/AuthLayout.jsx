import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Atmospheric background layers */}
      <div className="fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at top, hsl(265 55% 38%) 0%, hsl(250 30% 28%) 45%, hsl(245 25% 22%) 100%)',
        }}
      />
      <div className="fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, hsla(280,100%,60%,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsla(195,100%,60%,0.1) 0%, transparent 50%)',
        }}
      />

      {/* Floating gem particles */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {['💎','🔷','💜','✨','🪨'].map((gem, i) => (
          <div key={i} className="absolute text-2xl opacity-10 animate-pulse"
            style={{
              left: `${[10,25,55,70,88][i]}%`,
              top: `${[15,75,25,60,40][i]}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${3 + i}s`,
              fontSize: `${[20,16,24,18,14][i]}px`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="text-4xl">🪨</span>
            <div className="text-left">
              <div className="text-white font-black text-2xl tracking-tight leading-none">RockHound</div>
              <div className="text-amethyst-glow font-black text-2xl tracking-tight leading-none">GO</div>
            </div>
          </div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
            style={{ background: 'linear-gradient(135deg, hsla(265,80%,50%,0.8), hsla(280,90%,65%,0.6))', border: '1px solid hsla(280,80%,70%,0.4)' }}>
            <Icon className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-white/50 text-sm mt-1">{subtitle}</p>}
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(160deg, hsla(255,35%,18%,0.95) 0%, hsla(245,30%,13%,0.98) 100%)',
            border: '1px solid hsla(270,60%,55%,0.25)',
            boxShadow: '0 20px 60px -10px hsla(265,80%,20%,0.6), inset 0 1px 0 hsla(280,100%,80%,0.1)',
          }}
        >
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-white/40 mt-5">{footer}</p>
        )}

        {/* Tagline */}
        <p className="text-center text-[10px] uppercase tracking-[0.3em] text-white/20 mt-6">
          Discover · Collect · Conquer
        </p>
      </div>
    </div>
  );
}