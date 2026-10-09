import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function PrivateLogPhoto({ logId, privatePhoto, legacyUrl, alt = 'Private find photo', className = '' }) {
  const { user } = useAuth();
  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: ['private-log-photo', user?.id, logId],
    enabled: !!privatePhoto && !!logId && !!user?.id,
    queryFn: async () => {
      const response = await base44.functions.invoke('getPrivateLogPhoto', { log_id: logId });
      if (!response.data?.signed_url) throw new Error('Photo unavailable.');
      return response.data.signed_url;
    },
    staleTime: 240000, gcTime: 0, refetchInterval: 240000, retry: false
  });
  const src = privatePhoto ? data : legacyUrl;
  if (src && !isError) return <img src={src} alt={alt} className={className} loading="lazy" />;
  return <div className={`${className} bg-muted flex items-center justify-center`}>
    {isError ? <button type="button" onClick={() => refetch()} className="text-xs text-foreground p-1" aria-label="Retry private photo">Retry photo</button> : <Image size={22} className="text-muted-foreground" aria-label={isFetching ? 'Loading private photo' : 'No photo'} />}
  </div>;
}