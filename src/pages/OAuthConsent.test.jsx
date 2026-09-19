import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Module state hoisted for react mock
const reactState = vi.hoisted(() => ({
  stateValues: [],
  stateSetters: [],
  stateIndex: 0,
  capturedEffect: null,
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useEffect: (effect) => {
      reactState.capturedEffect = effect;
    },
    useState: (initial) => {
      const idx = reactState.stateIndex++;
      if (reactState.stateValues[idx] === undefined) {
        reactState.stateValues[idx] = typeof initial === 'function' ? initial() : initial;
      }
      if (!reactState.stateSetters[idx]) {
        reactState.stateSetters[idx] = vi.fn((val) => {
          reactState.stateValues[idx] = typeof val === 'function' ? val(reactState.stateValues[idx]) : val;
        });
      }
      return [reactState.stateValues[idx], reactState.stateSetters[idx]];
    },
  };
});

// Mock appParams
const mockAppParams = vi.hoisted(() => ({
  appId: 'test-app-id',
  token: null,
}));

vi.mock('@/lib/app-params', () => ({
  appParams: mockAppParams,
}));

const Button = ({ children, disabled, onClick, variant, className }) => (
  <button
    data-testid="ui-button"
    data-variant={variant}
    disabled={disabled}
    onClick={onClick}
    className={className}
  >
    {children}
  </button>
);

vi.mock('@/components/AuthLayout', () => ({
  default: ({ title, subtitle, children, icon: Icon }) => (
    <div data-testid="auth-layout" data-title={title} data-subtitle={subtitle}>
      {Icon && <Icon data-testid="auth-icon" />}
      <h1>{title}</h1>
      {subtitle && <h2>{subtitle}</h2>}
      <div>{children}</div>
    </div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button,
}));

vi.mock('lucide-react', () => ({
  ShieldCheck: () => <svg data-testid="icon-shield" />,
  Loader2: ({ className }) => <svg data-testid="icon-loader" className={className} />,
}));

let OAuthConsent;
let mockLocation;

function resetState(overrides = {}) {
  reactState.stateValues = [
    overrides.info !== undefined ? overrides.info : null,
    overrides.checking !== undefined ? overrides.checking : true,
    overrides.submitting !== undefined ? overrides.submitting : false,
    overrides.decided !== undefined ? overrides.decided : '',
    overrides.error !== undefined ? overrides.error : '',
    overrides.reconnect !== undefined ? overrides.reconnect : '',
  ];
  reactState.stateSetters = reactState.stateValues.map((val, i) =>
    vi.fn((newVal) => {
      reactState.stateValues[i] = typeof newVal === 'function' ? newVal(reactState.stateValues[i]) : newVal;
    })
  );
  reactState.stateIndex = 0;
  reactState.capturedEffect = null;
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

function findNodes(node, predicate, matches = []) {
  if (!node || typeof node !== 'object') return matches;
  if (predicate(node)) matches.push(node);
  const children = node.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) findNodes(child, predicate, matches);
  } else if (children) {
    findNodes(children, predicate, matches);
  }
  return matches;
}

beforeAll(async () => {
  mockLocation = {
    search: '?ctx=test-ctx-123',
    pathname: '/oauth/consent',
    _href: 'http://localhost/oauth/consent?ctx=test-ctx-123',
    get href() {
      return this._href;
    },
    set href(val) {
      this._href = val;
    },
  };

  globalThis.window = {
    self: {},
    top: {},
    location: mockLocation,
  };
  globalThis.window.self = globalThis.window;
  globalThis.window.top = globalThis.window;

  OAuthConsent = (await import('./OAuthConsent.jsx')).default;
});

beforeEach(() => {
  vi.clearAllMocks();
  mockAppParams.appId = 'test-app-id';
  mockAppParams.token = null;
  mockLocation.search = '?ctx=test-ctx-123';
  mockLocation.pathname = '/oauth/consent';
  mockLocation._href = 'http://localhost/oauth/consent?ctx=test-ctx-123';
  global.fetch = vi.fn();
  resetState();
});

describe('OAuthConsent Page', () => {
  describe('UI Rendering States', () => {
    it('renders loading state when checking is true', () => {
      resetState({ checking: true });
      const tree = OAuthConsent();
      const markup = renderToStaticMarkup(tree);

      expect(markup).toContain('Authorize access');
      expect(markup).toContain('Loading…');
      expect(markup).toContain('data-testid="icon-loader"');
    });

    it('renders "Access granted" state when decided is "approve"', () => {
      resetState({
        checking: false,
        decided: 'approve',
        info: { client_name: 'Claude AI' },
      });
      const tree = OAuthConsent();
      const markup = renderToStaticMarkup(tree);

      expect(markup).toContain('Access granted');
      expect(markup).toContain('You can return to Claude AI and close this window.');
    });

    it('renders "Access denied" state when decided is "deny"', () => {
      resetState({
        checking: false,
        decided: 'deny',
        info: { client_name: 'Cursor IDE' },
      });
      const tree = OAuthConsent();
      const markup = renderToStaticMarkup(tree);

      expect(markup).toContain('Access denied');
      expect(markup).toContain('You can return to Cursor IDE and close this window.');
    });

    it('renders fallback client name "An AI client" when client_name is missing on decided', () => {
      resetState({
        checking: false,
        decided: 'approve',
        info: null,
      });
      const tree = OAuthConsent();
      const markup = renderToStaticMarkup(tree);

      expect(markup).toContain('You can return to An AI client and close this window.');
    });

    it('renders "Reconnect required" terminal state when reconnect is present', () => {
      resetState({
        checking: false,
        reconnect: 'Your authorization expired. Please reconnect from your client.',
      });
      const tree = OAuthConsent();
      const markup = renderToStaticMarkup(tree);

      expect(markup).toContain('Reconnect required');
      expect(markup).toContain('Your authorization expired. Please reconnect from your client.');
    });

    it('renders error state when error is present and info is null', () => {
      resetState({
        checking: false,
        error: 'This authorization link is invalid or has expired.',
        info: null,
      });
      const tree = OAuthConsent();
      const markup = renderToStaticMarkup(tree);

      expect(markup).toContain('Authorize access');
      expect(markup).toContain('This authorization link is invalid or has expired.');
    });

    it('renders consent form with tool list and client/app titles when info is available', () => {
      resetState({
        checking: false,
        info: {
          client_name: 'Super AI',
          app_name: 'Rock Collector',
          tools: [
            { name: 'list_rocks', title: 'List Rocks', description: 'Lists all rocks' },
            { name: 'delete_rock' },
          ],
        },
      });
      const tree = OAuthConsent();
      const markup = renderToStaticMarkup(tree);

      expect(markup).toContain('Super AI wants to access Rock Collector on your behalf');
      expect(markup).toContain('It will be able to use these tools in Rock Collector:');
      expect(markup).toContain('List Rocks');
      expect(markup).toContain('Lists all rocks');
      expect(markup).toContain('delete_rock');
      expect(markup).toContain('Deny');
      expect(markup).toContain('Approve');
    });

    it('renders "No tools requested" when tools list is empty', () => {
      resetState({
        checking: false,
        info: {
          client_name: 'Super AI',
          app_name: 'Rock Collector',
          tools: [],
        },
      });
      const tree = OAuthConsent();
      const markup = renderToStaticMarkup(tree);

      expect(markup).toContain('No tools requested');
    });

    it('renders error banner along with controls when info exists and error is set', () => {
      resetState({
        checking: false,
        error: 'Transient error during submission',
        info: {
          client_name: 'Super AI',
          app_name: 'Rock Collector',
          tools: [],
        },
      });
      const tree = OAuthConsent();
      const markup = renderToStaticMarkup(tree);

      expect(markup).toContain('Transient error during submission');
      expect(markup).toContain('Deny');
      expect(markup).toContain('Approve');
    });

    it('disables Deny and Approve buttons when submitting is true', () => {
      resetState({
        checking: false,
        submitting: true,
        info: {
          client_name: 'Super AI',
          app_name: 'Rock Collector',
          tools: [],
        },
      });
      reactState.stateIndex = 0;
      const tree = OAuthConsent();

      const buttons = findNodes(tree, (n) => n.type === Button);
      expect(buttons).toHaveLength(2);
      expect(buttons[0].props.disabled).toBe(true);
      expect(buttons[1].props.disabled).toBe(true);
    });
  });

  describe('Initial Load (useEffect) Async Logic', () => {
    it('sets error when ctx is missing in search query', async () => {
      mockLocation.search = '';
      reactState.stateIndex = 0;
      OAuthConsent();

      expect(reactState.capturedEffect).toBeTypeOf('function');
      reactState.capturedEffect();
      await flushPromises();

      expect(reactState.stateSetters[4]).toHaveBeenCalledWith('This authorization link is invalid or has expired.');
      expect(reactState.stateSetters[1]).toHaveBeenCalledWith(false);
    });

    it('fetches consent-info with Authorization header when appParams.token exists', async () => {
      mockAppParams.token = 'bearer-token-xyz';
      mockAppParams.appId = 'app-123';
      mockLocation.search = '?ctx=handle-abc';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          client_name: 'Client X',
          app_name: 'App Y',
          tools: [],
        }),
      });

      reactState.stateIndex = 0;
      OAuthConsent();
      reactState.capturedEffect();
      await flushPromises();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/apps/app-123/mcp/consent-info?handle=handle-abc',
        {
          credentials: 'include',
          headers: { Authorization: 'Bearer bearer-token-xyz' },
        }
      );
      expect(reactState.stateSetters[0]).toHaveBeenCalledWith({
        authenticated: true,
        client_name: 'Client X',
        app_name: 'App Y',
        tools: [],
      });
      expect(reactState.stateSetters[1]).toHaveBeenCalledWith(false);
    });

    it('fetches consent-info without Authorization header when appParams.token is null', async () => {
      mockAppParams.token = null;
      mockLocation.search = '?ctx=handle-abc';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true }),
      });

      reactState.stateIndex = 0;
      OAuthConsent();
      reactState.capturedEffect();
      await flushPromises();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/apps/test-app-id/mcp/consent-info?handle=handle-abc',
        {
          credentials: 'include',
          headers: {},
        }
      );
    });

    it('handles non-ok HTTP response from consent-info endpoint', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });

      reactState.stateIndex = 0;
      OAuthConsent();
      reactState.capturedEffect();
      await flushPromises();

      expect(reactState.stateSetters[4]).toHaveBeenCalledWith('This authorization link is invalid or has expired.');
      expect(reactState.stateSetters[1]).toHaveBeenCalledWith(false);
    });

    it('handles thrown error during consent-info fetch', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network failure'));

      reactState.stateIndex = 0;
      OAuthConsent();
      reactState.capturedEffect();
      await flushPromises();

      expect(reactState.stateSetters[4]).toHaveBeenCalledWith('Could not load this authorization request. Please try again.');
      expect(reactState.stateSetters[1]).toHaveBeenCalledWith(false);
    });

    it('redirects signed-out user (authenticated: false) to login_path with returnTo and from_url', async () => {
      mockLocation.pathname = '/mcp/consent';
      mockLocation.search = '?ctx=ctx-login-test';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: false,
          login_path: '/custom-sso',
        }),
      });

      reactState.stateIndex = 0;
      OAuthConsent();
      reactState.capturedEffect();
      await flushPromises();

      const expectedReturnTo = encodeURIComponent('/mcp/consent?ctx=ctx-login-test');
      expect(mockLocation.href).toBe(`/custom-sso?returnTo=${expectedReturnTo}&from_url=${expectedReturnTo}`);
      // When redirecting, setChecking(false) should NOT be called
      expect(reactState.stateSetters[1]).not.toHaveBeenCalledWith(false);
    });

    it('redirects signed-out user to default /login when login_path is omitted', async () => {
      mockLocation.pathname = '/oauth/consent';
      mockLocation.search = '?ctx=ctx-login-default';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      });

      reactState.stateIndex = 0;
      OAuthConsent();
      reactState.capturedEffect();
      await flushPromises();

      const expectedReturnTo = encodeURIComponent('/oauth/consent?ctx=ctx-login-default');
      expect(mockLocation.href).toBe(`/login?returnTo=${expectedReturnTo}&from_url=${expectedReturnTo}`);
    });
  });

  describe('User Actions (respond)', () => {
    it('handles successful approve response with custom scheme redirect URL', async () => {
      resetState({
        checking: false,
        info: { client_name: 'Cursor', app_name: 'GeoApp', tools: [] },
      });
      mockAppParams.token = 'active-token-999';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ redirect_url: 'cursor://mcp/callback?code=123' }),
      });

      reactState.stateIndex = 0;
      const tree = OAuthConsent();
      const buttons = findNodes(tree, (n) => n.type === Button);
      const approveBtn = buttons[1];

      approveBtn.props.onClick();
      await flushPromises();

      expect(reactState.stateSetters[2]).toHaveBeenCalledWith(true); // setSubmitting(true)
      expect(reactState.stateSetters[4]).toHaveBeenCalledWith(''); // setError("")
      expect(global.fetch).toHaveBeenCalledWith('/api/apps/test-app-id/mcp/authorize-grant', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer active-token-999',
        },
        body: JSON.stringify({ ctx: 'test-ctx-123', action: 'approve' }),
      });
      expect(mockLocation.href).toBe('cursor://mcp/callback?code=123');
      expect(reactState.stateSetters[3]).toHaveBeenCalledWith('approve'); // setDecided("approve")
      expect(reactState.stateSetters[2]).toHaveBeenCalledWith(false); // setSubmitting(false)
    });

    it('handles successful deny response with standard HTTPS redirect URL', async () => {
      resetState({
        checking: false,
        info: { client_name: 'WebClient', app_name: 'GeoApp', tools: [] },
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ redirect_url: 'https://example.com/oauth/callback' }),
      });

      reactState.stateIndex = 0;
      const tree = OAuthConsent();
      const buttons = findNodes(tree, (n) => n.type === Button);
      const denyBtn = buttons[0];

      denyBtn.props.onClick();
      await flushPromises();

      expect(global.fetch).toHaveBeenCalledWith('/api/apps/test-app-id/mcp/authorize-grant', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ctx: 'test-ctx-123', action: 'deny' }),
      });
      expect(mockLocation.href).toBe('https://example.com/oauth/callback');
      // For HTTP/HTTPS redirect, setDecided is NOT called
      expect(reactState.stateSetters[3]).not.toHaveBeenCalled();
    });

    it('handles 401 status on respond by redirecting to login', async () => {
      resetState({
        checking: false,
        info: { login_path: '/custom-login', client_name: 'WebClient', app_name: 'GeoApp', tools: [] },
      });
      mockLocation.pathname = '/oauth/consent';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      reactState.stateIndex = 0;
      const tree = OAuthConsent();
      const buttons = findNodes(tree, (n) => n.type === Button);

      buttons[1].props.onClick();
      await flushPromises();

      const expectedReturnTo = encodeURIComponent('/oauth/consent?ctx=test-ctx-123');
      expect(mockLocation.href).toBe(`/custom-login?returnTo=${expectedReturnTo}&from_url=${expectedReturnTo}`);
    });

    it('handles 401 status on respond with default /login when login_path is absent', async () => {
      resetState({
        checking: false,
        info: { client_name: 'WebClient', app_name: 'GeoApp', tools: [] },
      });

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      reactState.stateIndex = 0;
      const tree = OAuthConsent();
      const buttons = findNodes(tree, (n) => n.type === Button);

      buttons[1].props.onClick();
      await flushPromises();

      const expectedReturnTo = encodeURIComponent('/oauth/consent?ctx=test-ctx-123');
      expect(mockLocation.href).toBe(`/login?returnTo=${expectedReturnTo}&from_url=${expectedReturnTo}`);
    });

    it('handles terminal error status (400, 403, 404, 409) with detail message', async () => {
      resetState({
        checking: false,
        info: { client_name: 'WebClient', app_name: 'GeoApp', tools: [] },
      });

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ detail: 'Tool configuration has changed.' }),
      });

      reactState.stateIndex = 0;
      const tree = OAuthConsent();
      const buttons = findNodes(tree, (n) => n.type === Button);

      buttons[1].props.onClick();
      await flushPromises();

      expect(reactState.stateSetters[5]).toHaveBeenCalledWith('Tool configuration has changed.');
      expect(reactState.stateSetters[2]).toHaveBeenCalledWith(false); // setSubmitting(false)
    });

    it('handles terminal error status (400, 403, 404, 409) with default message when JSON detail is missing', async () => {
      resetState({
        checking: false,
        info: { client_name: 'WebClient', app_name: 'GeoApp', tools: [] },
      });

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      reactState.stateIndex = 0;
      const tree = OAuthConsent();
      const buttons = findNodes(tree, (n) => n.type === Button);

      buttons[1].props.onClick();
      await flushPromises();

      expect(reactState.stateSetters[5]).toHaveBeenCalledWith(
        'This authorization can no longer be completed. Reconnect from your AI client to try again.'
      );
      expect(reactState.stateSetters[2]).toHaveBeenCalledWith(false);
    });

    it('handles general non-ok status (e.g. 500) during respond', async () => {
      resetState({
        checking: false,
        info: { client_name: 'WebClient', app_name: 'GeoApp', tools: [] },
      });

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      reactState.stateIndex = 0;
      const tree = OAuthConsent();
      const buttons = findNodes(tree, (n) => n.type === Button);

      buttons[1].props.onClick();
      await flushPromises();

      expect(reactState.stateSetters[4]).toHaveBeenCalledWith('Could not complete authorization. Please try again.');
      expect(reactState.stateSetters[2]).toHaveBeenCalledWith(false);
    });

    it('handles thrown error during respond fetch execution', async () => {
      resetState({
        checking: false,
        info: { client_name: 'WebClient', app_name: 'GeoApp', tools: [] },
      });

      global.fetch.mockRejectedValueOnce(new Error('Connection dropped'));

      reactState.stateIndex = 0;
      const tree = OAuthConsent();
      const buttons = findNodes(tree, (n) => n.type === Button);

      buttons[1].props.onClick();
      await flushPromises();

      expect(reactState.stateSetters[4]).toHaveBeenCalledWith('Connection dropped');
      expect(reactState.stateSetters[2]).toHaveBeenCalledWith(false);
    });
  });
});
