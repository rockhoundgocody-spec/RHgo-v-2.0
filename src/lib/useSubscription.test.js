import { vi, describe, it, expect } from 'vitest';

// Define a minimal window object in global scope for Node test runner
globalThis.window = {
  location: {
    search: '',
    href: '',
    pathname: '',
  }
};

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Subscription: {
        filter: vi.fn()
      }
    }
  }
}));

import { hashEmail } from './useSubscription.js';

describe('hashEmail', () => {
  it('should return empty string for null, undefined, or empty email', () => {
    expect(hashEmail(null)).toBe('');
    expect(hashEmail(undefined)).toBe('');
    expect(hashEmail('')).toBe('');
  });

  it('should return a hexadecimal string representing the DJB2 hash of the email', () => {
    const email1 = 'user@example.com';
    const email2 = 'user2@example.com';

    const hash1 = hashEmail(email1);
    const hash2 = hashEmail(email2);

    expect(hash1).toBeDefined();
    expect(typeof hash1).toBe('string');
    expect(hash1).not.toBe('');
    expect(hash1).not.toContain(email1); // Should not leak plaintext email

    expect(hash2).toBeDefined();
    expect(hash1).not.toBe(hash2); // Different emails should have different hashes
  });

  it('should be deterministic and return the exact same hash for the same email', () => {
    const email = 'rockhoundgo@gmail.com';
    const hashA = hashEmail(email);
    const hashB = hashEmail(email);
    expect(hashA).toBe(hashB);
  });
});
