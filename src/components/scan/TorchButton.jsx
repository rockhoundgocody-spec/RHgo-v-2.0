import React from 'react';
import { Flashlight, FlashlightOff } from 'lucide-react';

/**
 * TorchButton — camera flashlight toggle. Renders nothing when the device
 * or browser doesn't expose a controllable torch.
 */
export default function TorchButton({ supported, on, onToggle, className = '' }) {
  if (!supported) return null;
  const Icon = on ? Flashlight : FlashlightOff;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={on ? 'Turn flashlight off' : 'Turn flashlight on'}
      aria-pressed={on}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/50 ${className}`}
      style={{
        background: on ? 'hsla(45,100%,60%,0.22)' : 'hsla(265,40%,10%,0.7)',
        border: `1px solid ${on ? 'hsla(45,100%,70%,0.7)' : 'hsla(280,40%,50%,0.35)'}`,
        boxShadow: on ? '0 0 22px hsla(45,100%,60%,0.5)' : 'none',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Icon size={17} style={{ color: on ? 'hsl(45,100%,75%)' : 'hsla(0,0%,100%,0.5)' }} />
    </button>
  );
}