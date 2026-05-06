import React from 'react';
import { Mail, Globe, MessageCircle } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';

export default function Contact() {
  return (
    <div className="px-4 lg:px-8 pt-6 pb-24 max-w-2xl mx-auto">
      <GlassPanel variant="amethyst">
        <HudFrame label="Contact">
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-wide glow-amethyst">
            Get in Touch
          </h1>
          <p className="text-amethyst/70 text-xs uppercase tracking-[0.3em] mt-1 mb-6">
            We'd love to hear from you
          </p>

          <p className="text-white/80 leading-relaxed mb-6">
            Questions, feature requests, bug reports, or just want to share a
            cool find? Reach out — a real human reads every message.
          </p>

          <div className="space-y-3">
            <a
              href="mailto:hello@rockhound-go.app"
              className="flex items-center gap-3 p-4 rounded-lg border border-amethyst/30 bg-amethyst/10 hover:bg-amethyst/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-amethyst/30 flex items-center justify-center">
                <Mail className="text-amethyst-glow" size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-amethyst/70">
                  Email
                </div>
                <div className="text-white font-semibold">
                  hello@rockhound-go.app
                </div>
              </div>
            </a>

            <a
              href="mailto:support@rockhound-go.app"
              className="flex items-center gap-3 p-4 rounded-lg border border-hud-cyan/30 bg-hud-cyan/10 hover:bg-hud-cyan/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-hud-cyan/30 flex items-center justify-center">
                <MessageCircle className="text-hud-cyan" size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-hud-cyan/80">
                  Support
                </div>
                <div className="text-white font-semibold">
                  support@rockhound-go.app
                </div>
              </div>
            </a>

            <a
              href="https://rockhound-go.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Globe className="text-white/80" size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                  Website
                </div>
                <div className="text-white font-semibold">
                  rockhound-go.app
                </div>
              </div>
            </a>
          </div>
        </HudFrame>
      </GlassPanel>
    </div>
  );
}