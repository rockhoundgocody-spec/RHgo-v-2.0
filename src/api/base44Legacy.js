import { createClient } from '@base44/sdk';
import { appParams } from '../lib/app-params.js';
import { analyticsAllowed } from '@/lib/recordingGate';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  requiresAuth: false,
  appBaseUrl,
  // No analytics session (and so no session recording) without cookie consent, or for child accounts.
  analytics: { enabled: analyticsAllowed() }
});