import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Scale, AlertTriangle, Ban, RefreshCw, Mail } from 'lucide-react';
import { useSeoRobots } from '@/lib/useSeoRobots';
import { useSeoMeta } from '@/lib/useSeoMeta';

const SECTIONS = [
  {
    icon: FileText,
    title: 'Acceptance of Terms',
    body: [
      'By creating an account or using RockHound-GO, you agree to these Terms of Service. If you do not agree, do not use the app.',
      'If you are under 13, a parent or guardian must create and manage your account through the Parental Dashboard.',
    ],
  },
  {
    icon: Scale,
    title: 'Use of the Service',
    body: [
      'RockHound-GO is a field companion for mineral collectors. You are responsible for complying with all local, state, and federal laws regarding rockhounding, land access, and collecting.',
      'Always obtain permission before collecting on private land, and respect closures and regulations on public lands (BLM, USFS, NPS, state parks).',
      'The app provides hotspot maps and AI identifications for guidance only; they do not grant you any right to access land or collect. You assume all risk and responsibility for your field activities.',
    ],
  },
  {
    icon: FileText,
    title: 'User Content & License',
    body: [
      'You retain ownership of the specimens, photos, notes, and other content you submit (\u201cUser Content\u201d).',
      'You grant RockHound-GO a worldwide, non-exclusive, royalty-free license to host, display, and process your User Content solely to provide and improve the app\u2019s features.',
      'When you share content to the community feed or market, other users may view and interact with it according to the sharing settings you choose.',
    ],
  },
  {
    icon: Ban,
    title: 'Prohibited Conduct',
    body: [
      'Do not use the app to encourage or facilitate illegal collecting, trespassing, or damage to protected sites.',
      'Do not share exact coordinates of another user\u2019s private finds without their consent. Stealth Mode exists to protect this.',
      'Do not post abusive, hateful, or harassing content, or any content that exploits or harms minors.',
      'Do not attempt to reverse-engineer, overload, or disrupt the service or its AI identification systems.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'AI Identifications & Disclaimers',
    body: [
      'Mineral identifications are produced by AI and are estimates, not professional appraisals or certifications. Always verify important identifications with a qualified expert.',
      'Rarity ratings, valuations, and market insights are informational only and do not constitute financial or collecting advice.',
      'The app is provided \u201cas is\u201d without warranties of accuracy, fitness for a particular purpose, or availability.',
    ],
  },
  {
    icon: RefreshCw,
    title: 'Subscriptions, Changes & Termination',
    body: [
      'Season ($12.99/30 days), Hound ($79/yr), Steward ($149/yr), and Club ($199/yr) are digital access subscriptions billed via Stripe on the web at rhgo.me. They are not sold as in-app purchases inside the iOS or Android app.',
      'Physical specimens and goods (rocks, Mystery Mineral Minis, show tickets, paid digs) may be purchased inside the app via Stripe.',
      'You can cancel a digital subscription at any time from Settings; access continues until the end of the current billing period.',
      'We may update or discontinue features with reasonable notice. Material changes to these Terms will be announced in the app.',
      'We may suspend or terminate accounts that violate these Terms. You may delete your account at any time.',
    ],
  },
  {
    icon: Mail,
    title: 'Limitation of Liability & Contact',
    body: [
      'To the maximum extent permitted by law, RockHound-GO is not liable for indirect, incidental, or consequential damages arising from your use of the app.',
      'Our total liability is limited to the amount you paid us in the 12 months preceding the claim.',
      'For questions about these Terms, contact us through the support channel in your app Settings.',
    ],
  },
];

export default function Terms() {
  useSeoRobots(true);
  useSeoMeta(
    'RockHound-GO Terms of Service — Rockhounding, Land Access & User Content',
    'RockHound-GO Terms of Service: acceptable use, land-access responsibilities, user content licensing, child accounts, and account termination for the rockhounding field companion app.'
  );
  return (
    <div className="min-h-screen w-full text-foreground" style={{ background: 'radial-gradient(ellipse at top, hsl(265 45% 14%) 0%, hsl(250 30% 8%) 50%, hsl(245 25% 5%) 100%)' }}>
      <div className="max-w-2xl mx-auto px-5 py-10 pb-24">
        <Link to="/" className="text-amethyst-glow text-sm hover:text-white transition mb-6 inline-block">
          ← Back to RockHound-GO
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'hsla(280,60%,20%,0.5)', border: '1px solid hsla(280,70%,65%,0.3)' }}>
              <FileText size={22} className="text-amethyst-glow" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Terms of Service</h1>
              <p className="text-white/50 text-xs">Last updated: May 2026</p>
            </div>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            These terms govern your use of RockHound-GO. Please read them carefully — they reflect our commitment to responsible, legal, and respectful rockhounding.
          </p>
        </header>

        <div className="space-y-4">
          {SECTIONS.map(({ icon: Icon, title, body }) => (
            <section key={title} className="rounded-2xl p-5" style={{ background: 'hsla(265,35%,14%,0.6)', border: '1px solid hsla(280,40%,50%,0.15)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={16} className="text-amethyst-glow" />
                <h2 className="font-bold text-white text-sm">{title}</h2>
              </div>
              <ul className="space-y-2">
                {body.map((line, i) => (
                  <li key={i} className="text-white/55 text-[13px] leading-relaxed flex gap-2">
                    <span className="text-amethyst-glow/60 mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="mt-8 pt-6 border-t border-white/10">
          <p className="text-white/40 text-xs leading-relaxed">
            By using RockHound-GO, you agree to these Terms. See our <Link to="/privacy-policy" className="text-amethyst-glow underline">Privacy Policy</Link> for how we handle your data.
          </p>
        </footer>
      </div>
    </div>
  );
}