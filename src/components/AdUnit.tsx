import React, { useEffect, useRef } from 'react';

interface AdsByGoogleQueue extends Array<Record<string, unknown>> {
  requestNonPersonalizedAds?: number;
}

declare global {
  interface Window {
    adsbygoogle?: AdsByGoogleQueue;
  }
}

export type AdVariant = 'leaderboard' | 'sidebar' | 'banner';

interface AdUnitProps {
  variant: AdVariant;
  nonPersonalizedAds?: boolean;
}

const CLIENT_ID = (import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined)?.trim() ?? '';

const SLOT_MAP: Record<AdVariant, string> = {
  leaderboard:
    (import.meta.env.VITE_ADSENSE_SLOT_LEADERBOARD as string | undefined)?.trim() ?? '',
  sidebar:
    (import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR as string | undefined)?.trim() ?? '',
  banner:
    (import.meta.env.VITE_ADSENSE_SLOT_BANNER as string | undefined)?.trim() ?? '',
};

function isConfiguredClient(id: string): boolean {
  return /^ca-pub-\d{10,20}$/.test(id);
}

function isConfiguredSlot(slot: string): boolean {
  return /^\d{6,20}$/.test(slot) && slot !== '1234567890' && slot !== '2345678901' && slot !== '3456789012';
}

let scriptRequested = false;

function ensureAdSenseScript(clientId: string) {
  if (typeof document === 'undefined' || scriptRequested) return;
  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-adsense-loader="true"]'
  );
  if (existing) {
    scriptRequested = true;
    return;
  }
  scriptRequested = true;
  if (!document.querySelector('meta[name="google-adsense-account"]')) {
    const meta = document.createElement('meta');
    meta.name = 'google-adsense-account';
    meta.content = clientId;
    document.head.appendChild(meta);
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  script.crossOrigin = 'anonymous';
  script.dataset.adsenseLoader = 'true';
  document.head.appendChild(script);
}

const VARIANT_META: Record<
  AdVariant,
  {
    wrapperClass: string;
    sizeHint: string;
    format: 'horizontal' | 'rectangle' | 'auto';
  }
> = {
  leaderboard: {
    wrapperClass: 'w-full max-w-[728px] min-h-[90px] mx-auto',
    sizeHint: '728 × 90 Display',
    format: 'horizontal',
  },
  sidebar: {
    wrapperClass: 'w-full min-h-[250px]',
    sizeHint: '300 × 250 Display',
    format: 'rectangle',
  },
  banner: {
    wrapperClass: 'w-full min-h-[100px]',
    sizeHint: 'Responsive Display',
    format: 'auto',
  },
};

export const AdUnit: React.FC<AdUnitProps> = ({ variant, nonPersonalizedAds = false }) => {
  const insRef = useRef<HTMLModElement | null>(null);
  const slotId = SLOT_MAP[variant];
  const clientReady = isConfiguredClient(CLIENT_ID);
  const liveReady = clientReady && isConfiguredSlot(slotId);
  const meta = VARIANT_META[variant];

  useEffect(() => {
    if (clientReady) {
      ensureAdSenseScript(CLIENT_ID);
    }
    if (!liveReady) return;

    const el = insRef.current;
    if (!el) return;
    if (el.getAttribute('data-adsbygoogle-status')) return;

    try {
      const ads: AdsByGoogleQueue = window.adsbygoogle ?? [];
      window.adsbygoogle = ads;
      ads.requestNonPersonalizedAds = nonPersonalizedAds ? 1 : 0;
      ads.push({});
    } catch {
      // AdSense script blocked or still initializing
    }
  }, [liveReady, nonPersonalizedAds, variant]);

  return (
    <aside
      aria-label="Advertisement"
      className={`rounded-xl bg-[#0F131D] border border-slate-800/80 px-3 py-2 flex flex-col items-center justify-center overflow-hidden ${meta.wrapperClass}`}
    >
      <div className="w-full flex items-center justify-between text-[11px] text-slate-500 mb-1.5 px-1">
        <span>Advertisement</span>
        {!liveReady && <span className="font-mono tabular-nums">{meta.sizeHint}</span>}
      </div>

      {liveReady ? (
        <ins
          ref={insRef}
          className="adsbygoogle w-full"
          style={{ display: 'block' }}
          data-ad-client={CLIENT_ID}
          data-ad-slot={slotId}
          data-ad-format={meta.format}
          data-full-width-responsive="true"
        />
      ) : (
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center py-3 px-4 rounded-lg border border-dashed border-slate-800 bg-[#0B0E16]">
          <p className="text-xs font-medium text-slate-400">
            Google AdSense Display Slot
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Set <code className="font-mono text-slate-400">VITE_ADSENSE_CLIENT_ID</code> &amp; slot IDs to serve live ads here
          </p>
        </div>
      )}
    </aside>
  );
};
