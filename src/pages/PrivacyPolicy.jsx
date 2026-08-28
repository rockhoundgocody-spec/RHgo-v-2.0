import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, MapPin, Camera, Users, Baby, Trash2, Mail } from 'lucide-react';

const SECTIONS = [
  {
    icon: Users,
    title: 'Information We Collect',
    body: [
      'Account information: your name, email address, and a profile avatar when you create a RockHound-GO account.',
      'Specimen data: photos you capture or upload, mineral identification results, GPS coordinates (when you choose to share them), field notes, rarity, and collection metadata.',
      'Usage data: which features you use, quest and badge progress, streaks, and analytics events that help us improve the app.',
    ],
  },
  {
    icon: MapPin,
    title: 'Location Data & Stealth Mode',
    body: [
      'Location is permission-based. We only access your device location when you grant permission and actively use map, scan, or expedition features.',
      'Stealth Mode is a first-class privacy feature: when enabled, exact GPS coordinates of your finds are never stored or shared — only approximate or private labels are kept.',
      'You can revoke location permission at any time from your device settings; the app will continue to work without location features.',
    ],
  },
  {
    icon: Camera,
    title: 'AI Mineral Identification',
    body: [
      'When you scan or photograph a specimen, the image is sent to our AI identification service (powered by Google Gemini) to produce a mineral match and confidence score.',
      'Images are processed to generate identification results and are stored in your private collection unless you choose to share them to the community feed or market.',
      'We strip EXIF and metadata from uploaded images before processing to protect your privacy.',
    ],
  },
  {
    icon: Baby,
    title: 'Child Accounts & COPPA',
    body: [
      'RockHound-GO offers child-safe accounts managed through a Parental Dashboard. A parent or guardian must create and manage accounts for users under 13.',
      'We do not knowingly collect personal information from children under 13 without verified parental consent.',
      'Child accounts have restricted sharing and community features by default. Parents can review and delete their child\u2019s data at any time.',
    ],
  },
  {
    icon: Shield,
    title: 'How We Use Your Information',
    body: [
      'To provide AI mineral identification, hotspot maps, your Geo-DEX collection, quests, badges, and community features.',
      'To improve identification accuracy and feature quality through aggregated, anonymized analytics.',
      'To send optional service communications such as streak reminders and weekly summaries (you can control these in Settings).',
      'We never sell your personal data to third parties.',
    ],
  },
  {
    icon: Users,
    title: 'Third-Party Services',
    body: [
      'Google Cloud: AI identification (Gemini) and maps. Subject to Google\u2019s privacy policy.',
      'Stripe: payment processing for Field Pro and Family subscriptions. We do not store your full card details.',
      'Instagram (optional): if you connect your account, we can publish hotspot finds on your behalf with your consent.',
      'Each third-party service operates under its own privacy policy; we share only the minimum data required to provide the feature.',
    ],
  },
  {
    icon: Trash2,
    title: 'Data Retention & Deletion',
    body: [
      'Your specimens, collection, and account data are retained for as long as your account is active.',
      'You can delete individual specimens, your entire collection, or your full account at any time from the app\u2019s Settings or by contacting us. Deletion is permanent and irreversible.',
      'Some anonymized, aggregated data may be retained for analytics and model improvement after account deletion.',
    ],
  },
  {
    icon: Mail,
    title: 'Your Privacy Rights & Contact',
    body: [
      'You have the right to access, correct, export, or delete your personal data.',
      'To exercise any privacy right, or to ask questions about this policy, contact us at the support channel listed in your app Settings.',
      'We will respond to verified requests within a reasonable timeframe.',
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen w-full text-foreground" style={{ background: 'radial-gradient(ellipse at top, hsl(265 45% 14%) 0%, hsl(250 30% 8%) 50%, hsl(245 25% 5%) 100%)' }}>
      <div className="max-w-2xl mx-auto px-5 py-10 pb-24">
        <Link to="/" className="text-amethyst-glow text-sm hover:text-white transition mb-6 inline-block">
          \u2190 Back to RockHound-GO
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'hsla(280,60%,20%,0.5)', border: '1px solid hsla(280,70%,65%,0.3)' }}>
              <Shield size={22} className="text-amethyst-glow" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Privacy Policy</h1>
              <p className="text-white/50 text-xs">Last updated: May 2026</p>
            </div>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            RockHound-GO is built by collectors, for collectors. Your privacy is a first-class feature \u2014 this policy explains what we collect, why, and how you stay in control.
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
                    <span className="text-amethyst-glow/60 mt-1">\u2022</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="mt-8 pt-6 border-t border-white/10">
          <p className="text-white/40 text-xs leading-relaxed">
            By using RockHound-GO, you consent to this Privacy Policy. We may update this policy from time to time; material changes will be announced in the app. See our <Link to="/terms" className="text-amethyst-glow underline">Terms of Service</Link>.
          </p>
        </footer>
      </div>
    </div>
  );
}