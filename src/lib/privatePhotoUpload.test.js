// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ strip: vi.fn(), upload: vi.fn() }));
vi.mock('@/lib/stripExif', () => ({ stripExif: mocks.strip }));
vi.mock('@/api/base44Client', () => ({ base44: { integrations: { Core: { UploadPrivateFile: mocks.upload } } } }));
import privatePhotoUpload from '@/lib/privatePhotoUpload';
beforeEach(() => { vi.clearAllMocks(); Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:private-preview') }); });
describe('private find photo uploads', () => {
  it('removes metadata before uploading exclusively to private storage', async () => {
    const file = new File(['raw-exif'], 'field.jpg', { type: 'image/jpeg' });
    const clean = new Blob(['clean'], { type: 'image/jpeg' }); mocks.strip.mockResolvedValue(clean); mocks.upload.mockResolvedValue({ file_uri: 'private://owned' });
    const result = await privatePhotoUpload(file);
    expect(mocks.strip).toHaveBeenCalledWith(file, { strict: true });
    expect(mocks.upload.mock.calls[0][0].file.name).toBe('private-find.jpg'); expect(result).toEqual({ file_uri: 'private://owned', previewUrl: 'blob:private-preview' });
  });
  it('refuses to upload a photo if metadata removal fails', async () => {
    mocks.strip.mockRejectedValue(new Error('Cannot sanitize'));
    await expect(privatePhotoUpload(new File(['raw'], 'field.jpg', { type: 'image/jpeg' }))).rejects.toThrow('Cannot sanitize'); expect(mocks.upload).not.toHaveBeenCalled();
  });
  it('refuses unsupported files', async () => { await expect(privatePhotoUpload(new File(['text'], 'notes.txt', { type: 'text/plain' }))).rejects.toThrow('image'); expect(mocks.upload).not.toHaveBeenCalled(); });
});