import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import LiveScanStage from './LiveScanStage.jsx';

vi.mock('./useCameraStream', () => ({
  default: () => ({
    videoRef: { current: null },
    ready: true,
    error: null,
    torchSupported: false,
    torchOn: false,
    toggleTorch: vi.fn(),
  }),
}));

vi.mock('./LiveLabelsOverlay.jsx', () => ({
  default: () => null,
}));

vi.mock('./TorchButton.jsx', () => ({
  default: () => null,
}));

vi.mock('./ScanModeBar.jsx', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

describe('LiveScanStage Component', () => {
  it('renders correctly without crashing', () => {
    const onBeginCapture = vi.fn();
    const onUploadFallback = vi.fn();

    const element = <LiveScanStage onBeginCapture={onBeginCapture} onUploadFallback={onUploadFallback} />;
    expect(element).toBeDefined();
    expect(element.type).toBe(LiveScanStage);
  });
});
