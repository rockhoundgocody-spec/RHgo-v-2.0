import { describe, expect, it, vi } from 'vitest';
import { requestCurrentPosition, requestNotificationPermission } from './permissionActions';

describe('permission actions', () => {
  it('settles immediately when browser APIs are unavailable', async () => {
    await expect(requestNotificationPermission(undefined)).resolves.toBe('unsupported');
    await expect(requestCurrentPosition(undefined)).resolves.toBe(false);
  });

  it('returns notification permission and converts API errors to a stable result', async () => {
    await expect(requestNotificationPermission({ requestPermission: () => Promise.resolve('granted') }))
      .resolves.toBe('granted');
    await expect(requestNotificationPermission({ requestPermission: () => Promise.reject(new Error('denied')) }))
      .resolves.toBe('error');
  });

  it('passes a bounded timeout to geolocation and reports success or failure', async () => {
    const success = vi.fn((onSuccess, _onError, options) => {
      expect(options).toEqual({ timeout: 4000 });
      onSuccess({ coords: {} });
    });
    const failure = vi.fn((_onSuccess, onError) => onError(new Error('blocked')));

    await expect(requestCurrentPosition({ getCurrentPosition: success }, 4000)).resolves.toBe(true);
    await expect(requestCurrentPosition({ getCurrentPosition: failure })).resolves.toBe(false);
  });
});
