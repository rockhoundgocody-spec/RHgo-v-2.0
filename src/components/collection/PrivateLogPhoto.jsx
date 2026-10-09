import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function PrivateLogPhoto({ fileUri, legacyUrl, alt, className }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setUrl('');
    setFailed(false);
    if (!fileUri) return () => { active = false; };
    const refresh = async () => {
      try {
        const result = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 300 });
        if (!result?.signed_url) throw new Error('Photo unavailable');
        if (active) { setUrl(result.signed_url); setFailed(false); }
      } catch {
        if (active) { setUrl(''); setFailed(true); }
      }
    };
    refresh();
    const timer = setInterval(refresh, 240000);
    return () => { active = false; clearInterval(timer); };
  }, [fileUri]);
  const source = fileUri ? url : legacyUrl;
  return source && !failed
    ? <img src={source} alt={alt} className={className} onError={() => setFailed(true)} />
    : <span className={`${className} flex items-center justify-center bg-muted text-muted-foreground text-xs`} role="status">{failed ? 'Photo unavailable' : 'Loading photo…'}</span>;
}