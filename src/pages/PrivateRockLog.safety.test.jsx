// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ create: vi.fn(), upload: vi.fn(), clean: vi.fn(), sign: vi.fn() }));
vi.mock('@/api/base44Client', () => ({ base44: {
  auth: { me: vi.fn().mockResolvedValue({ id: 'owner-1', email: 'fixture@example.invalid' }) },
  entities: { PrivateRockLog: { filter: vi.fn().mockResolvedValue([]), create: mocks.create } },
  integrations: { Core: { UploadPrivateFile: mocks.upload, CreateFileSignedUrl: mocks.sign } },
} }));
vi.mock('@/lib/stripExif', () => ({ stripExif: mocks.clean }));
vi.mock('@/components/hub/HelpTip.jsx', () => ({ default: () => null }));
vi.mock('@/components/collection/ExportBar.jsx', () => ({ default: () => null }));
import PrivateRockLog from '@/pages/PrivateRockLog';
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('Private log photo flow', () => {
  it('strips metadata, uploads privately, saves only the file URI, and refreshes the list', async () => {
    mocks.clean.mockResolvedValue(new Blob(['sanitized'], { type: 'image/jpeg' }));
    mocks.upload.mockResolvedValue({ file_uri: 'private://test-fixture/photo.jpg' });
    mocks.sign.mockResolvedValue({ signed_url: 'https://example.invalid/signed-photo' });
    mocks.create.mockImplementation(async data => ({ id: 'test-record', ...data }));
    const { container } = render(<PrivateRockLog />);
    await waitFor(() => expect(screen.getByText('No rocks logged yet.')).toBeTruthy());
    fireEvent.click(screen.getByText('Log Rock'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Petoskey Stone'), { target: { value: 'Quartz fixture' } });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [new File(['raw-metadata'], 'location.jpg', { type: 'image/jpeg' })] } });
    await screen.findByText('Photo added privately');
    expect(mocks.clean.mock.calls[0][1]).toEqual({ requireSuccess: true });
    expect(mocks.upload).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Save Log'));
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    const payload = mocks.create.mock.calls[0][0];
    expect(payload.image_file_uri).toBe('private://test-fixture/photo.jpg');
    expect(payload.image_url).toBeUndefined();
    expect(payload.owner_email).toBe('fixture@example.invalid');
    await screen.findByText('Quartz fixture');
  });
  it('does not upload the original when metadata removal fails, and shows the error', async () => {
    mocks.clean.mockRejectedValue(new Error('Could not remove photo metadata.'));
    const { container } = render(<PrivateRockLog />);
    fireEvent.click(screen.getByText('Log Rock'));
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [new File(['bad'], 'bad.jpg', { type: 'image/jpeg' })] } });
    await screen.findByRole('alert');
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});