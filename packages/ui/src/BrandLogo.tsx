import React, { useState } from 'react';
import { BRAND_IDENTITY } from '@pequemodas/config';

export interface BrandLogoProps {
  logoUrl?: string | null;
  commercialName?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { box: 'h-9 w-9', img: 'h-9 w-auto max-w-[82px]', title: 'text-base', sub: 'text-[10px]' },
  md: { box: 'h-11 w-11', img: 'h-11 w-auto max-w-[100px]', title: 'text-lg sm:text-xl', sub: 'text-[11px]' },
  lg: { box: 'h-14 w-14', img: 'h-14 w-auto max-w-[128px]', title: 'text-2xl', sub: 'text-xs' }
} as const;

export function BrandLogo({
  logoUrl,
  commercialName,
  size = 'md',
  showSubtitle = true,
  className = ''
}: BrandLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const name = commercialName?.trim() || BRAND_IDENTITY.commercialName;
  const resolvedLogo = logoUrl || '/brand/logo-foreground.webp';
  const [mainWord, subWord] = name.includes('-')
    ? (name.split('-', 2) as [string, string])
    : [name, 'Juguetería'];
  const dims = SIZE_MAP[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {resolvedLogo && !imgFailed ? (
        <img
          src={resolvedLogo}
          alt={name}
          onError={() => setImgFailed(true)}
          className={`${dims.img} object-contain shrink-0 drop-shadow-sm`}
        />
      ) : (
        <div
          className={`${dims.box} rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-sky-500 flex items-center justify-center shadow-sm shrink-0`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 48 48"
            className="w-7 h-7 text-white"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="8"
              y="18"
              width="15"
              height="15"
              rx="4"
              fill="#FEF3C7"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <rect
              x="25"
              y="14"
              width="15"
              height="15"
              rx="4"
              fill="#E0F2FE"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <circle cx="15.5" cy="25.5" r="2.5" fill="#D4385B" />
            <path
              d="M32.5 18.5L34 21.5L37.2 22L34.8 24.2L35.4 27.4L32.5 25.8L29.6 27.4L30.2 24.2L27.8 22L31 21.5L32.5 18.5Z"
              fill="#0284C7"
            />
            <path
              d="M15 13C15 10.8 16.8 9 19 9C21.2 9 23 10.8 23 13"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      <div className="flex flex-col leading-tight">
        <span className={`font-heading font-extrabold tracking-tight text-slate-900 ${dims.title}`}>
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
