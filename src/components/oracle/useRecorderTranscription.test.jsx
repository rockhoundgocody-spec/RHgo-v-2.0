// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useRecorderTranscription from '@/components/oracle/useRecorderTranscription';
const mocks = vi.hoisted(() => ({ upload: vi.fn(), sign: vi.fn(), transcribe: vi.fn() }));
vi.mock('@/api/base44Client', () => ({ base44: { integrations: { Core: { UploadPrivateFile: mocks.upload, CreateFileSignedUrl: mocks.sign, TranscribeAudio: mocks.transcribe } } } }));
let getMedia, track, recorders, frame, loud;
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); recorders = []; loud = true;
  track = { stop: vi.fn() }; getMedia = vi.fn(async () => ({ getTracks: () => [track] }));
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: getMedia } });
  vi.stubGlobal('requestAnimationFrame', vi.fn(cb => { frame = cb; return 1; })); vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('AudioContext', class { state = 'running'; createAnalyser() { return { fftSize: 512, getByteTimeDomainData: b => b.fill(loud ? 180 : 128) }; } createMediaStreamSource() { return { connect: vi.fn() }; } close() { this.state = 'closed'; return Promise.resolve(); } });
  vi.stubGlobal('MediaRecorder', class {
    static isTypeSupported() { return true; }
    state = 'inactive'; mimeType = 'audio/webm';
    constructor() { recorders.push(this); }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) }); this.onstop?.(); }
  });
  mocks.upload.mockResolvedValue({ file_uri: 'private-fixture' }); mocks.sign.mockResolvedValue({ signed_url: '/signed-fixture' }); mocks.transcribe.mockResolvedValue('Is this quartz?');
});
afterEach(() => { cleanup(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });
async function begin(hook) { await act(async () => { await hook.result.current.start(); }); }
async function finishSpeech() { await act(async () => { frame(); loud = false; vi.advanceTimersByTime(1900); frame(); }); }
describe('Recorder-based Clover input', () => {
  it('transcribes private audio through a signed link and releases the microphone', async () => {
    const onResult = vi.fn(); const hook = renderHook(() => useRecorderTranscription({ onResult })); await begin(hook); await finishSpeech();
    expect(onResult).toHaveBeenCalledWith('Is this quartz?'); expect(mocks.upload).toHaveBeenCalledTimes(1);
    expect(mocks.sign).toHaveBeenCalledWith({ file_uri: 'private-fixture', expires_in: 300 });
    expect(mocks.transcribe).toHaveBeenCalledWith({ audio_url: '/signed-fixture' }); expect(track.stop).toHaveBeenCalled(); expect(hook.result.current.listening).toBe(false);
  });
  it('discards a transcript arriving after the session is stopped', async () => {
    const job = deferred(); mocks.transcribe.mockReturnValue(job.promise); const onResult = vi.fn(); const hook = renderHook(() => useRecorderTranscription({ onResult }));
    await begin(hook); await finishSpeech(); act(() => hook.result.current.stop());
    await act(async () => job.resolve('late speech')); expect(onResult).not.toHaveBeenCalled();
  });
  it('stops a microphone granted after the panel closed', async () => {
    const job = deferred(); getMedia.mockReturnValue(job.promise); const hook = renderHook(() => useRecorderTranscription());
    let pending; act(() => { pending = hook.result.current.start(); }); act(() => hook.result.current.stop());
    await act(async () => { job.resolve({ getTracks: () => [track] }); await pending; });
    expect(track.stop).toHaveBeenCalled(); expect(recorders).toHaveLength(0);
  });
  it('does not upload background silence', async () => {
    loud = false; const hook = renderHook(() => useRecorderTranscription()); await begin(hook);
    await act(async () => vi.advanceTimersByTimeAsync(16000)); expect(mocks.upload).not.toHaveBeenCalled(); expect(hook.result.current.listening).toBe(false);
  });
  it('shows denied-permission feedback and retries only when asked', async () => {
    getMedia.mockRejectedValueOnce({ name: 'NotAllowedError' }); const hook = renderHook(() => useRecorderTranscription()); await begin(hook);
    expect(hook.result.current.error).toContain('denied'); expect(hook.result.current.listening).toBe(false);
    await begin(hook); expect(getMedia).toHaveBeenCalledTimes(2); expect(hook.result.current.error).toBe('');
  });
  it('reports failed transcription and releases its busy state', async () => {
    mocks.transcribe.mockRejectedValue(new Error('offline')); const hook = renderHook(() => useRecorderTranscription()); await begin(hook); await finishSpeech();
    expect(hook.result.current.error).toContain('connection'); expect(hook.result.current.listening).toBe(false);
    await begin(hook); expect(recorders).toHaveLength(2);
  });
});