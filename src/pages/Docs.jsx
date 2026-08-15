import React, { useState } from 'react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import { FileCode2, Database, Network, Cpu, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const sections = [
  {
    id: 'stack',
    icon: Cpu,
    title: 'Native Stack',
    body: `PLATFORM .................. React Native + Expo (managed)
ROUTING ................... expo-router (file-based)
STATE ..................... Zustand + React Query
DB (LOCAL) ................ expo-sqlite (offline-first)
DB (CLOUD) ................ Base44 entities
AI INFERENCE .............. on-device CoreML/TFLite + cloud fallback
MAPS ...................... react-native-maps + MBTiles offline tiles
CAMERA .................... expo-camera
LOCATION .................. expo-location (background-capable)
BUILD ..................... EAS Build (iOS + Android)
DELIVERY .................. EAS Update (OTA) + App Store / Play Store`,
  },
  {
    id: 'schema',
    icon: Database,
    title: 'Database Schema',
    body: `Hotspot
  id, name, state, country, lat, lng,
  land_type [public|blm|forest_service|state_park|private|unknown],
  minerals[], difficulty, description, rules,
  publication_state, access_status, collection_status,
  coordinate_quality, navigation_eligible,
  managing_authority, official_source_url, last_verified_at,
  source, image_url

Specimen
  id, mineral_name, common_name, image_url,
  found_at, lat, lng, found_date, notes,
  ai_confidence, ai_candidates[], rarity, verified,
  geo_privacy [private default|approximate|exact]

LocationSubmission
  specimen_id, mineral_name, owner_email,
  status [pending|reviewing|approved|rejected]
  No copied coordinates; admin moderation only.

Mineral
  id, name, formula, crystal_system, hardness,
  color, luster, streak, description, rarity,
  category, image_url

User (built-in)
  id, full_name, email, role`,
  },
  {
    id: 'api',
    icon: Network,
    title: 'API Contracts',
    body: `GET    /entities/Hotspot               → list
POST   /entities/Hotspot               → create
PATCH  /entities/Hotspot/:id           → update
DELETE /entities/Hotspot/:id           → delete

POST   /integrations/Core/InvokeLLM    → AI mineral ID
       payload: { prompt, file_urls, response_json_schema }

POST   /integrations/Core/UploadFile   → returns { file_url }

GET    /functions/syncOfflineQueue     → pull pending mutations
POST   /functions/syncOfflineQueue     → push field-collected data`,
  },
  {
    id: 'build',
    icon: FileCode2,
    title: 'Build & Release',
    body: `# install
$ npm i -g eas-cli
$ eas login

# configure
$ eas build:configure

# preview build
$ eas build --profile preview --platform ios
$ eas build --profile preview --platform android

# production
$ eas build --profile production --platform all
$ eas submit -p ios
$ eas submit -p android

# OTA update
$ eas update --branch production --message "v1.0.1"`,
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security & Trust',
    body: `LOCATION PUBLICATION GATE
  Legacy and hold records are admin-only.
  Land ownership never implies access or collecting permission.
  Access and collection status are reviewed independently.

LOCATION PRIVACY
  Specimen locations default to owner-only private storage.
  Quick pins write only to the private rock log.
  User finds enter a coordinate-free moderation queue.
  No user find automatically creates or updates a Hotspot.

NAVIGATION
  Directions require a managed publication state,
  open access, verified entrance coordinates,
  an official rules URL, and review within 180 days.
  Research localities never receive directions.

AI CONFIDENCE
  Identifications < 0.6 confidence are flagged "tentative".
  Never display single-result with > 0.95 unless verified.

DATA SOURCES
  Official managing-authority rules are required.
  Users must recheck official rules before travel.`,
  },
];

const Body = ({ body }) => (
  <pre className="whitespace-pre-wrap font-mono text-xs md:text-sm text-hud-cyan/90 leading-relaxed py-2 hud-grid-bg p-4 rounded">
    {body}
  </pre>
);

export default function Docs() {
  const [active, setActive] = useState('stack');
  const current = sections.find((s) => s.id === active);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-hud glow-hud tracking-wider">ARCHITECTURE DOCS</h1>
        <p className="text-hud-cyan/60 text-xs uppercase tracking-[0.3em] mt-2">
          Technical specification / build manual
        </p>
      </div>

      {/* Mobile: accordion. Desktop: sidebar + content. */}
      <div className="md:hidden">
        <GlassPanel variant="hud">
          <HudFrame label="Index">
            <Accordion type="single" collapsible defaultValue="stack" className="w-full">
              {sections.map(({ id, icon: Icon, title, body }) => (
                <AccordionItem key={id} value={id} className="border-hud-cyan/20">
                  <AccordionTrigger className="text-hud hover:text-hud-cyan font-mono uppercase tracking-wider text-xs py-3">
                    <span className="flex items-center gap-2">
                      <Icon size={14} />
                      {title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Body body={body} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </HudFrame>
        </GlassPanel>
      </div>

      <div className="hidden md:grid grid-cols-[220px,1fr] gap-4">
        <GlassPanel variant="hud" className="h-fit">
          <HudFrame label="Index">
            <div className="space-y-1 py-2">
              {sections.map(({ id, icon: Icon, title }) => (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition border',
                    active === id
                      ? 'bg-hud-cyan/15 border-hud-cyan/40 text-hud glow-hud'
                      : 'border-transparent text-hud-cyan/60 hover:text-hud hover:bg-hud-cyan/5'
                  )}
                >
                  <Icon size={14} />
                  <span className="font-mono uppercase tracking-wider text-xs">{title}</span>
                </button>
              ))}
            </div>
          </HudFrame>
        </GlassPanel>

        <GlassPanel variant="hud">
          <HudFrame label={current.title}>
            <Body body={current.body} />
          </HudFrame>
        </GlassPanel>
      </div>
    </div>
  );
}
