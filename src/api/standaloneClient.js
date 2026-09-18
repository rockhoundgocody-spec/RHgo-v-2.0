import { createClient } from '@supabase/supabase-js';
import { base44 as base44Legacy } from './base44Legacy';

const useSupabase = import.meta.env.VITE_BACKEND === 'supabase';
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://ooswefjhwanailebjrkq.supabase.co';
const supabaseAnon =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_--znZ5PXuzO3fcxOh-sDhA_xcueq3uH';

export const supabase =
  useSupabase && supabaseUrl && supabaseAnon
    ? createClient(supabaseUrl, supabaseAnon)
    : null;

function mapUser(sessionUser) {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    full_name: sessionUser.user_metadata?.full_name || sessionUser.email,
  };
}

const supabaseAuth = {
  async register({ email, password }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },
  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return mapUser(data.user);
  },
  async loginWithProvider(provider, redirectTo = '/') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${redirectTo}` },
    });
    if (error) throw new Error(error.message);
  },
  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup',
    });
    if (error) throw new Error(error.message);
    return { access_token: data.session?.access_token };
  },
  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw new Error(error.message);
  },
  setToken() {},
  async me() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error('Not authenticated');
    return mapUser(data.user);
  },
  async logout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  },
};

function tableApi(name) {
  return {
    async list(order, limit = 100) {
      let q = supabase.from(name).select('*').limit(limit);
      if (order) {
        const desc = String(order).startsWith('-');
        q = q.order(desc ? String(order).slice(1) : order, { ascending: !desc });
      }
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data || [];
    },
    async filter(match = {}, order, limit = 100) {
      let q = supabase.from(name).select('*').match(match).limit(limit);
      if (order) {
        const desc = String(order).startsWith('-');
        q = q.order(desc ? String(order).slice(1) : order, { ascending: !desc });
      }
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data || [];
    },
    async create(row) {
      const { data: userData } = await supabase.auth.getUser();
      const owner_id = userData?.user?.id;
      const { data, error } = await supabase.from(name).insert({ ...row, owner_id }).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    async update(id, row) {
      const { data, error } = await supabase.from(name).update(row).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    subscribe() {
      return () => {};
    },
  };
}

const TABLE_MAP = {
  Specimen: 'specimens',
  Hotspot: 'hotspots',
  PlayerProfile: 'player_profiles',
  Quest: 'quests',
  Badge: 'badges',
};

const supabaseEntities = new Proxy({}, {
  get(_t, entity) {
    const table = TABLE_MAP[entity];
    if (!table || !supabase) {
      return base44Legacy.entities[entity];
    }
    return tableApi(table);
  },
});

export const base44 = useSupabase && supabase
  ? {
      auth: supabaseAuth,
      entities: supabaseEntities,
      functions: {
        async invoke(name, payload) {
          const { data, error } = await supabase.functions.invoke(name, { body: payload });
          if (error) throw new Error(error.message);
          return { data };
        },
      },
      analytics: { track() {} },
    }
  : base44Legacy;
