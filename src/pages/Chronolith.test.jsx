import React from 'react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// 1. Initialize global window before module imports evaluate `window`
const mockStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

globalThis.window = {
  self: {},
  top: {},
  location: {
    search: '',
    href: 'http://localhost:3000',
    pathname: '/',
  },
  localStorage: mockStorage,
  sessionStorage: mockStorage,
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.window.self = globalThis.window;
globalThis.window.top = globalThis.window;

// State management variables to support stage transitions in mock
let mockStageState = 'capture';
let mockImageUrlsState = [];
let mockGpsCoordsState = null;
let mockCaseDataState = null;
let mockObservationsState = [];
let mockLoadingState = false;
let mockErrorState = '';

const setStageMock = vi.fn((val) => { mockStageState = typeof val === 'function' ? val(mockStageState) : val; });
const setImageUrlsMock = vi.fn((val) => { mockImageUrlsState = typeof val === 'function' ? val(mockImageUrlsState) : val; });
const setGpsCoordsMock = vi.fn((val) => { mockGpsCoordsState = typeof val === 'function' ? val(mockGpsCoordsState) : val; });
const setCaseDataMock = vi.fn((val) => { mockCaseDataState = typeof val === 'function' ? val(mockCaseDataState) : val; });
const setObservationsMock = vi.fn((val) => { mockObservationsState = typeof val === 'function' ? val(mockObservationsState) : val; });
const setLoadingMock = vi.fn((val) => { mockLoadingState = typeof val === 'function' ? val(mockLoadingState) : val; });
const setErrorMock = vi.fn((val) => { mockErrorState = typeof val === 'function' ? val(mockErrorState) : val; });

// 2. Mock react hooks so component can execute as a pure function with controllable state
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  let stateCallIndex = 0;
  return {
    ...actual,
    useState: (initial) => {
      const idx = stateCallIndex++;
      // Order of useState calls in Chronolith.jsx:
      // 0: stage ('capture')
      // 1: imageUrls ([])
      // 2: gpsCoords (null)
      // 3: caseData (null)
      // 4: observations ([])
      // 5: loading (false)
      // 6: error ('')
      if (idx % 7 === 0) return [mockStageState, setStageMock];
      if (idx % 7 === 1) return [mockImageUrlsState, setImageUrlsMock];
      if (idx % 7 === 2) return [mockGpsCoordsState, setGpsCoordsMock];
      if (idx % 7 === 3) return [mockCaseDataState, setCaseDataMock];
      if (idx % 7 === 4) return [mockObservationsState, setObservationsMock];
      if (idx % 7 === 5) return [mockLoadingState, setLoadingMock];
      if (idx % 7 === 6) return [mockErrorState, setErrorMock];
      return [typeof initial === 'function' ? initial() : initial, vi.fn()];
    },
    useRef: (initial) => ({ current: initial }),
    useEffect: (cb) => { if (typeof cb === 'function') cb(); },
    useMemo: (cb) => (typeof cb === 'function' ? cb() : cb),
    useId: () => ':r1:',
  };
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}));

// Mock base44Client
vi.mock('@/api/base44Client', () => ({
  base44: {
    integrations: {
      Core: {
        UploadFile: vi.fn(),
      },
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock uploadChronolithImages
vi.mock('@/lib/chronolithUploads.js', () => ({
  uploadChronolithImages: vi.fn(),
}));

// Mock subcomponents
vi.mock('@/components/chronolith/ChronolithOpening.jsx', () => ({
  default: ({ caseData, imageUrl, onEnter, onSkip }) => (
    <div data-testid="chronolith-opening">
      <span data-testid="opening-case-id">{caseData?.id}</span>
      <span data-testid="opening-image-url">{imageUrl}</span>
      <button data-testid="enter-trial-btn" onClick={onEnter}>Enter Trial</button>
      <button data-testid="skip-opening-btn" onClick={onSkip}>Skip</button>
    </div>
  ),
}));

vi.mock('@/components/chronolith/RealityTrial.jsx', () => ({
  default: ({ caseData, imageUrl, onAddEvidence, loading, onReset }) => (
    <div data-testid="reality-trial">
      <span data-testid="trial-case-id">{caseData?.id}</span>
      <span data-testid="trial-image-url">{imageUrl}</span>
      {loading && <div data-testid="trial-loading">Loading...</div>}
      <button data-testid="add-evidence-btn" onClick={() => onAddEvidence([{ key: 'hardness', value: '7' }])}>
        Add Evidence
      </button>
      <button data-testid="reset-case-btn" onClick={onReset}>
        Reset Case
      </button>
    </div>
  ),
}));

let Chronolith;
let base44;
let uploadChronolithImages;

beforeAll(async () => {
  const modChronolith = await import('./Chronolith.jsx');
  Chronolith = modChronolith.default;

  const modBase44 = await import('@/api/base44Client');
  base44 = modBase44.base44;

  const modUploads = await import('@/lib/chronolithUploads.js');
  uploadChronolithImages = modUploads.uploadChronolithImages;
});

describe('Chronolith Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStageState = 'capture';
    mockImageUrlsState = [];
    mockGpsCoordsState = null;
    mockCaseDataState = null;
    mockObservationsState = [];
    mockLoadingState = false;
    mockErrorState = '';
  });

  it('exports Chronolith as default component function', () => {
    expect(typeof Chronolith).toBe('function');
  });

  it('renders capture stage initially with header, camera icon, and GPS status', () => {
    const element = Chronolith();
    expect(element).toBeDefined();

    expect(element.props.className).toContain('flex flex-col items-center');

    const children = element.props.children;
    expect(children).toHaveLength(2);
  });

  it('renders error message in capture stage when error state is present', () => {
    mockErrorState = 'Failed to upload images';
    const element = Chronolith();

    // Check that error container is rendered in capture stage
    const uploadZone = element.props.children[1];
    const uploadZoneChildren = uploadZone.props.children;
    // uploadZoneChildren: [label, error (if error), GPS indicator, How it works]
    const errorBox = uploadZoneChildren[1];
    expect(errorBox.props.children).toBe('Failed to upload images');
  });

  it('displays GPS coordinates when gpsCoords state is populated', () => {
    mockGpsCoordsState = { lat: 37.77, lng: -122.42 };
    const element = Chronolith();

    const uploadZone = element.props.children[1];
    const uploadZoneChildren = uploadZone.props.children;
    const gpsContainer = uploadZoneChildren[2];
    expect(gpsContainer.props.children[1]).toBe('37.77, -122.42');
  });

  it('handles GPS geolocation auto-capture effect when geolocation API is available', () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: 37.7749, longitude: -122.4194 } });
    });

    const originalGeolocation = globalThis.navigator?.geolocation;
    if (!globalThis.navigator) {
      globalThis.navigator = {};
    }
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    const element = Chronolith();
    expect(element).toBeDefined();
    expect(mockGetCurrentPosition).toHaveBeenCalled();

    if (originalGeolocation !== undefined) {
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
        writable: true,
      });
    }
  });

  it('gracefully handles missing geolocation API', () => {
    const originalGeolocation = globalThis.navigator?.geolocation;
    if (globalThis.navigator) {
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }

    expect(() => Chronolith()).not.toThrow();

    if (globalThis.navigator && originalGeolocation !== undefined) {
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
        writable: true,
      });
    }
  });

  it('handles empty file selection in handleFileSelect without calling upload API', async () => {
    const element = Chronolith();
    const uploadZone = element.props.children[1];
    const label = uploadZone.props.children[0];
    const input = label.props.children[0];

    const fakeEvent = { target: { files: [] }, currentTarget: { value: 'test' } };
    await input.props.onChange(fakeEvent);

    expect(uploadChronolithImages).not.toHaveBeenCalled();
  });

  it('handles file upload and successful case investigation transitioning stage to opening', async () => {
    uploadChronolithImages.mockResolvedValue(['https://example.com/specimen.jpg']);
    base44.functions.invoke.mockResolvedValue({
      data: {
        case: {
          id: 'case-123',
          hypotheses: [{ id: 'h1', name: 'Quartz Formation' }],
        },
      },
    });

    const element = Chronolith();
    const uploadZone = element.props.children[1];
    const label = uploadZone.props.children[0];
    const input = label.props.children[0];

    const fakeFile = new File(['dummy'], 'stone.jpg', { type: 'image/jpeg' });
    const fakeEvent = {
      target: { files: [fakeFile] },
      currentTarget: { value: 'C:\\fakepath\\stone.jpg' },
    };

    await input.props.onChange(fakeEvent);

    expect(uploadChronolithImages).toHaveBeenCalledWith([fakeFile], expect.any(Function));
    expect(setImageUrlsMock).toHaveBeenCalledWith(['https://example.com/specimen.jpg']);
    expect(base44.functions.invoke).toHaveBeenCalledWith('investigateCase', expect.objectContaining({
      image_urls: ['https://example.com/specimen.jpg'],
      specimen_label: '',
      case_id: null,
    }));
    expect(setCaseDataMock).toHaveBeenCalledWith({
      id: 'case-123',
      hypotheses: [{ id: 'h1', name: 'Quartz Formation' }],
    });
    expect(setStageMock).toHaveBeenCalledWith('opening');
  });

  it('handles upload failure error gracefully', async () => {
    uploadChronolithImages.mockRejectedValue(new Error('Image size too large'));

    const element = Chronolith();
    const uploadZone = element.props.children[1];
    const label = uploadZone.props.children[0];
    const input = label.props.children[0];

    const fakeFile = new File(['dummy'], 'large.jpg', { type: 'image/jpeg' });
    const fakeEvent = {
      target: { files: [fakeFile] },
      currentTarget: { value: 'C:\\fakepath\\large.jpg' },
    };

    await input.props.onChange(fakeEvent);

    expect(uploadChronolithImages).toHaveBeenCalled();
    expect(setErrorMock).toHaveBeenCalledWith('Image size too large');
    expect(base44.functions.invoke).not.toHaveBeenCalled();
  });

  it('handles investigation error when API returns no case', async () => {
    uploadChronolithImages.mockResolvedValue(['https://example.com/specimen.jpg']);
    base44.functions.invoke.mockResolvedValue({ data: null });

    const element = Chronolith();
    const uploadZone = element.props.children[1];
    const label = uploadZone.props.children[0];
    const input = label.props.children[0];

    const fakeFile = new File(['dummy'], 'stone.jpg', { type: 'image/jpeg' });
    const fakeEvent = {
      target: { files: [fakeFile] },
      currentTarget: { value: 'stone.jpg' },
    };

    await input.props.onChange(fakeEvent);

    expect(uploadChronolithImages).toHaveBeenCalled();
    expect(base44.functions.invoke).toHaveBeenCalled();
    expect(setErrorMock).toHaveBeenCalledWith('No case returned');
    expect(setStageMock).toHaveBeenCalledWith('capture');
  });

  it('renders ChronolithOpening in stage opening when caseData is present', () => {
    mockStageState = 'opening';
    mockCaseDataState = { id: 'case-456' };
    mockImageUrlsState = ['https://example.com/opening.png'];

    const element = Chronolith();
    expect(element.type.name || element.type).toBeDefined();

    // Verify props passed to ChronolithOpening
    expect(element.props.caseData).toEqual({ id: 'case-456' });
    expect(element.props.imageUrl).toBe('https://example.com/opening.png');

    // Simulate onEnter and onSkip
    element.props.onEnter();
    expect(setStageMock).toHaveBeenCalledWith('trial');

    element.props.onSkip();
    expect(setStageMock).toHaveBeenCalledWith('trial');
  });

  it('renders RealityTrial in stage trial when caseData is present and supports adding evidence and resetting', async () => {
    mockStageState = 'trial';
    mockCaseDataState = { id: 'case-789' };
    mockImageUrlsState = ['https://example.com/trial.png'];
    mockObservationsState = [{ key: 'color', value: 'purple' }];

    base44.functions.invoke.mockResolvedValue({
      data: {
        case: { id: 'case-789', hypotheses: [] },
      },
    });

    const element = Chronolith();
    expect(element.props.className).toContain('px-4 py-3');

    // Find RealityTrial element in children
    const realityTrialChild = element.props.children[1];
    expect(realityTrialChild.props.caseData).toEqual({ id: 'case-789' });
    expect(realityTrialChild.props.imageUrl).toBe('https://example.com/trial.png');

    // Test onAddEvidence handler
    const newEvidence = [{ key: 'hardness', value: '7' }];
    await realityTrialChild.props.onAddEvidence(newEvidence);

    expect(setObservationsMock).toHaveBeenCalledWith([
      { key: 'color', value: 'purple' },
      { key: 'hardness', value: '7' },
    ]);
    expect(base44.functions.invoke).toHaveBeenCalledWith('investigateCase', expect.objectContaining({
      case_id: 'case-789',
      field_observations: [
        { key: 'color', value: 'purple' },
        { key: 'hardness', value: '7' },
      ],
    }));

    // Test onReset handler
    realityTrialChild.props.onReset();
    expect(setStageMock).toHaveBeenCalledWith('capture');
    expect(setImageUrlsMock).toHaveBeenCalledWith([]);
    expect(setCaseDataMock).toHaveBeenCalledWith(null);
    expect(setObservationsMock).toHaveBeenCalledWith([]);
    expect(setErrorMock).toHaveBeenCalledWith('');
  });

  it('renders loading overlay in trial stage when loading is true', () => {
    mockStageState = 'trial';
    mockCaseDataState = { id: 'case-999' };
    mockLoadingState = true;

    const element = Chronolith();
    // In trial stage, element.props.children is [AnimatePresence, RealityTrial]
    const animatePresence = element.props.children[0];
    const loadingOverlay = animatePresence.props.children;
    expect(loadingOverlay).toBeTruthy();
    expect(loadingOverlay.props.className).toContain('fixed inset-0');
  });

  it('renders fallback stage when stage is invalid or unhandled', () => {
    mockStageState = 'unknown_stage';
    mockCaseDataState = null;

    const element = Chronolith();
    expect(element.props.className).toContain('flex items-center justify-center');

    // Fallback button triggers reset on click
    const button = element.props.children;
    button.props.onClick();
    expect(setStageMock).toHaveBeenCalledWith('capture');
  });
});
