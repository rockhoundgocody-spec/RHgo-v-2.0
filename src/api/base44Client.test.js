import { describe, it, expect, vi } from 'vitest';

const mockClientInstance = { mockClient: true };

vi.mock('@base44/sdk', () => ({
  createClient: vi.fn(() => mockClientInstance),
}));

vi.mock('../lib/app-params.js', () => ({
  appParams: {
    appId: 'test-app-id',
    token: 'test-token-123',
    functionsVersion: 'v2',
    appBaseUrl: 'https://test.base44.app',
  },
}));

describe('base44Client', () => {
  it('initializes base44 client with correct configuration options from appParams', async () => {
    const { createClient } = await import('@base44/sdk');
    const { base44 } = await import('./base44Client.js');

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith({
      appId: 'test-app-id',
      token: 'test-token-123',
      functionsVersion: 'v2',
      requiresAuth: true,
      appBaseUrl: 'https://test.base44.app',
    });

    expect(base44).toBe(mockClientInstance);
  });
});
