import React, { useEffect, useState } from 'react';
import { BRAND_IDENTITY } from '@pequemodas/config';

export interface BrandLogoProps {
  logoUrl?: string | null;
  commercialName?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { img: 'h-9 w-auto max-w-[82px]', title: 'text-base', sub: 'text-[10px]' },
  md: {
    img: 'h-11 w-auto max-w-[100px]',
    title: 'text-lg sm:text-xl',
    sub: 'text-[11px]'
  },
  lg: { img: 'h-14 w-auto max-w-[128px]', title: 'text-2xl', sub: 'text-xs' }
} as const;

const LOCAL_OFFICIAL_LOGO = '/brand/logo-foreground.webp';

export function BrandLogo({
  logoUrl,
  commercialName,
  size = 'md',
  showSubtitle = true,
  className = ''
}: BrandLogoProps) {
  const [remoteFailed, setRemoteFailed] = useState(false);

  useEffect(() => {
    setRemoteFailed(false);
  }, [logoUrl]);

  const name = commercialName?.trim() || BRAND_IDENTITY.commercialName;
  const activeSrc =
    logoUrl && !remoteFailed ? logoUrl : LOCAL_OFFICIAL_LOGO;
  const [mainWord, subWord] = name.includes('-')
    ? (name.split('-', 2) as [string, string])
    : [name, 'Juguetería'];
  const dims = SIZE_MAP[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={activeSrc}
        alt={name}
        decoding="async"
        onError={() => {
          if (activeSrc !== LOCAL_OFFICIAL_LOGO) {
            setRemoteFailed(true);
          }
        }}
        className={`${dims.img} object-contain shrink-0 drop-shadow-sm`}
      />

      <div className="flex flex-col leading-tight">
        <span
          className={`font-heading font-extrabold tracking-tight text-slate-900 ${dims.title}`}
        >
          <span className="text-brand-600">{mainWord}</span>
          {name.includes('-') && !showSubtitle ? `-${subWord}` : ''}
        </span>
        {showSubtitle && subWord && (
          <span
            className={`font-semibold uppercase tracking-widest text-sky-600 ${dims.sub}`}
          >
            {subWord}
          </span>
        )}
      </div>
    </div>
  );
}
