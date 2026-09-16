import { createClient } from '@base44/sdk';
import { appParams } from '../lib/app-params.js';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Create a client without the built-in Base44 login wall
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  requiresAuth: false,
  appBaseUrl
});
