import React from 'react';

export default function StarField() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 60 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() * 1.5 + 0.5,
            height: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.25 + 0.05,
          }}
        />
      ))}
    </div>
  );
}
