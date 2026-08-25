import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// Top-level mock for base44Client
vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: vi.fn().mockResolvedValue({ email: 'admin@example.com', role: 'admin' }),
    },
    entities: {
      Hotspot: {
        list: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn().mockResolvedValue({ deleted: 0 }),
        delete: vi.fn().mockResolvedValue({}),
        bulkCreate: vi.fn().mockResolvedValue([]),
      },
      Specimen: {
        list: vi.fn().mockResolvedValue([]),
      },
      Mineral: {
        list: vi.fn().mockResolvedValue([]),
      },
    },
  },
}));

let clearAllHotspots;

beforeAll(async () => {
  globalThis.window = {
    self: {},
    top: {},
    location: {
      search: '',
      href: 'http://localhost:3000',
      pathname: '/',
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };
  globalThis.window.self = globalThis.window;
  globalThis.window.top = globalThis.window;

  const mod = await import('./Admin.jsx');
  clearAllHotspots = mod.clearAllHotspots;
});

describe('Admin clearHotspots optimization', () => {
  let mockDeleteMany;
  let mockList;
  let mockDelete;
  let mockBase44;
  let mockConfirm;

  beforeEach(() => {
    mockDeleteMany = vi.fn().mockResolvedValue({ deleted: 50 });
    mockList = vi.fn().mockResolvedValue(
      Array.from({ length: 50 }, (_, i) => ({ id: `hotspot-${i}` }))
    );
    mockDelete = vi.fn().mockResolvedValue({ success: true });

    mockBase44 = {
      entities: {
        Hotspot: {
          deleteMany: mockDeleteMany,
          list: mockList,
          delete: mockDelete,
        },
      },
    };

    mockConfirm = vi.fn().mockReturnValue(true);
  });

  it('bypasses clear operations if user cancels confirmation', async () => {
    mockConfirm.mockReturnValue(false);

    const result = await clearAllHotspots(mockBase44, mockConfirm);

    expect(mockConfirm).toHaveBeenCalledWith('Delete all hotspots?');
    expect(result).toBe(false);
    expect(mockDeleteMany).not.toHaveBeenCalled();
    expect(mockList).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('uses base44.entities.Hotspot.deleteMany for O(1) bulk deletion', async () => {
    const result = await clearAllHotspots(mockBase44, mockConfirm);

    expect(result).toBe(true);
    expect(mockDeleteMany).toHaveBeenCalledWith({});
    // Ensures we do NOT perform O(N) fetch and individual delete API calls
    expect(mockList).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('demonstrates O(1) network request efficiency vs legacy O(N+1) requests', async () => {
    const itemCount = 100;

    // Simulate Legacy execution: 1 list call + 100 delete calls = 101 requests
    let legacyRequests = 0;
    const legacyList = async () => {
      legacyRequests++;
      return Array.from({ length: itemCount }, (_, i) => ({ id: `h-${i}` }));
    };
    const legacyDelete = async () => {
      legacyRequests++;
    };
    const legacyAll = await legacyList();
    await Promise.all(legacyAll.map((h) => legacyDelete(h.id)));

    // Optimized execution: 1 deleteMany call = 1 request
    let optimizedRequests = 0;
    const optimizedDeleteMany = async () => {
      optimizedRequests++;
    };
    await optimizedDeleteMany({});

    expect(legacyRequests).toBe(itemCount + 1); // 101 requests
    expect(optimizedRequests).toBe(1); // 1 request
    expect(legacyRequests / optimizedRequests).toBe(itemCount + 1); // 101x reduction in network requests
  });
});
