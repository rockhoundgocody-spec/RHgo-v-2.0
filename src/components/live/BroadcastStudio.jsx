import React, { useRef, useState } from 'react';
import { Radio, Square, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DevicePicker from './DevicePicker.jsx';
import useCameraDevices from './useCameraDevices';
import useBroadcast from './useBroadcast';
import StreamChat from './StreamChat.jsx';
import LiveIdFeed from './LiveIdFeed.jsx';

export default function BroadcastStudio({ me, coords, onClose }) {
  const videoRef = useRef(null);
  const { devices, permission, requestAccess, refresh } = useCameraDevices();
  const [deviceId, setDeviceId] = useState(null);
  const [title, setTitle] = useState('');
  const { stream, starting, goLive, endStream, identifyNow, identifying } =
    useBroadcast({ videoRef, me });

  const selected = devices.find((d) => d.deviceId === deviceId);

  const handleSelect = async (id) => {
    setDeviceId(id);
    if (!stream) await startPreview(videoRef, id);
  };

  return (
    <div className="space-y-3">
      {/* Viewport */}
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-black"
        style={{ border: '1px solid hsla(280,100%,70%,0.3)' }}>
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        {stream && (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-white"
            style={{ background: 'hsla(0,80%,45%,0.9)' }}>
            <Radio size={8} /> On air
          </span>
        )}
      </div>

      {!stream ? (
        <>
          <DevicePicker
            devices={devices}
            selectedId={deviceId}
            onSelect={handleSelect}
            onRefresh={refresh}
            permission={permission}
            onRequestAccess={requestAccess}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Stream title (e.g. Agate hunting at Grand Marais)"
            maxLength={80}
            className="w-full text-xs text-white px-3 py-2.5 rounded-xl outline-none"
            style={{ background: 'hsla(220,30%,10%,0.7)', border: '1px solid hsla(0,0%,100%,0.08)' }}
          />
          <Button
            onClick={() => goLive({ deviceId, deviceLabel: selected?.label, title, coords })}
            disabled={starting || devices.length === 0}
            className="w-full h-12 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, hsla(0,75%,45%,0.9), hsla(340,90%,55%,0.75))' }}
          >
            {starting ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Radio size={15} className="mr-2" />}
            Go Live
          </Button>
          <button onClick={onClose} className="w-full text-[11px] uppercase tracking-[0.2em] text-white/35 py-2">
            Cancel
          </button>
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <Button
              onClick={identifyNow}
              disabled={identifying}
              className="flex-1 h-12 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, hsla(270,80%,40%,0.9), hsla(280,100%,55%,0.7))' }}
            >
              {identifying ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Sparkles size={15} className="mr-2" />}
              {identifying ? 'Identifying…' : 'Identify This'}
            </Button>
            <Button
              onClick={endStream}
              variant="outline"
              className="h-12 px-4 rounded-xl border-white/15 text-white/70 hover:bg-white/5"
            >
              <Square size={15} />
            </Button>
          </div>
          <LiveIdFeed streamId={stream.id} />
          <StreamChat streamId={stream.id} me={me} />
        </>
      )}
    </div>
  );
}

/** Show a preview from the picked device before going live. */
async function startPreview(videoRef, deviceId) {
  try {
    const media = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    });
    if (videoRef.current) {
      videoRef.current.srcObject?.getTracks?.().forEach((t) => t.stop());
      videoRef.current.srcObject = media;
      await videoRef.current.play().catch(() => {});
    }
  } catch { /* device busy or unavailable — user can retry */ }
}