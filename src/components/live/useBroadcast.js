import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

const FRAME_INTERVAL_MS = 4000;

function grabFrame(video, quality = 0.7, maxWidth = 960) {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;
  const scale = Math.min(1, maxWidth / w);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/**
 * Drives a live broadcast: opens the chosen camera (or AI glasses), publishes
 * periodic frames so viewers see the feed, and runs AI identification on the
 * current glasses view on demand.
 */
export default function useBroadcast({ videoRef, me }) {
  const [stream, setStream] = useState(null);       // LiveStream record
  const [starting, setStarting] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [lastId, setLastId] = useState(null);
  const mediaRef = useRef(null);
  const timerRef = useRef(null);
  const seqRef = useRef(0);
  const busyRef = useRef(false);

  const stopMedia = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    mediaRef.current?.getTracks().forEach((t) => t.stop());
    mediaRef.current = null;
  }, []);

  const openDevice = useCallback(async (deviceId) => {
    stopMedia();
    const media = await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false,
    });
    mediaRef.current = media;
    if (videoRef.current) {
      videoRef.current.srcObject = media;
      await videoRef.current.play().catch(() => {});
    }
    return media;
  }, [stopMedia, videoRef]);

  /**
   * Mirror the glasses' companion-app preview via screen capture. The glasses
   * only render video inside their own app, so we read those pixels off the
   * screen instead of touching their proprietary stream.
   */
  const openScreen = useCallback(async () => {
    stopMedia();
    const media = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 15 },
      audio: false,
    });
    mediaRef.current = media;
    if (videoRef.current) {
      videoRef.current.srcObject = media;
      await videoRef.current.play().catch(() => {});
    }
    return media;
  }, [stopMedia, videoRef]);

  const publishFrame = useCallback(async (streamId) => {
    if (busyRef.current || !videoRef.current) return;
    busyRef.current = true;
    try {
      const blob = await grabFrame(videoRef.current);
      if (blob) {
        const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        seqRef.current += 1;
        await base44.entities.LiveStream.update(streamId, {
          current_frame_url: file_url,
          frame_seq: seqRef.current,
        });
      }
    } finally {
      busyRef.current = false;
    }
  }, [videoRef]);

  const goLive = useCallback(async ({ deviceId, deviceLabel, title, coords, keepMedia }) => {
    if (!me) { window.location.href = '/login'; return; }
    setStarting(true);
    try {
      // keepMedia: the glasses screen-capture stream is already open — reuse it.
      if (!keepMedia) await openDevice(deviceId);
      const record = await base44.entities.LiveStream.create({
        owner_email: me.email,
        host_name: me.full_name || me.email.split('@')[0],
        title: title || 'Field stream',
        device_label: deviceLabel || 'Camera',
        status: 'live',
        started_at: new Date().toISOString(),
        viewer_count: 0,
        id_count: 0,
        frame_seq: 0,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      });
      setStream(record);
      seqRef.current = 0;
      await publishFrame(record.id);
      timerRef.current = setInterval(() => publishFrame(record.id), FRAME_INTERVAL_MS);
    } finally {
      setStarting(false);
    }
  }, [me, openDevice, publishFrame]);

  const endStream = useCallback(async () => {
    stopMedia();
    if (stream) {
      await base44.entities.LiveStream.update(stream.id, {
        status: 'ended',
        ended_at: new Date().toISOString(),
      });
    }
    setStream(null);
    setLastId(null);
  }, [stream, stopMedia]);

  /** Identify whatever the glasses are looking at right now. */
  const identifyNow = useCallback(async () => {
    if (!stream || identifying || !videoRef.current) return;
    setIdentifying(true);
    try {
      const blob = await grabFrame(videoRef.current, 0.85, 1280);
      if (!blob) return;
      const file = new File([blob], 'live-id.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke('identifySpecimen', {
        image_url: file_url,
        lat: stream.lat,
        lng: stream.lng,
        save: false,
      });
      const ident = res?.data?.identification;
      if (!ident) return;
      const created = await base44.entities.StreamIdentification.create({
        stream_id: stream.id,
        owner_email: me.email,
        mineral_name: ident.top_match || 'Unknown',
        confidence: ident.confidence ?? 0,
        rarity: ident.rarity || 'common',
        image_url: file_url,
        description: (ident.description || '').slice(0, 1000),
      });
      setLastId(created);
      const next = (stream.id_count || 0) + 1;
      await base44.entities.LiveStream.update(stream.id, { id_count: next });
      setStream((s) => (s ? { ...s, id_count: next } : s));
    } finally {
      setIdentifying(false);
    }
  }, [stream, identifying, videoRef, me]);

  useEffect(() => () => stopMedia(), [stopMedia]);

  return { stream, starting, goLive, endStream, identifyNow, identifying, lastId, openDevice, openScreen };
}