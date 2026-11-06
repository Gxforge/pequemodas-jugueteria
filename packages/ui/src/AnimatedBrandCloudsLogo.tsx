import React, { useEffect, useRef, useState } from 'react';
import { BRAND_IDENTITY } from '@pequemodas/config';

export interface AnimatedBrandCloudsLogoProps {
  logoUrl?: string | null;
  commercialName?: string | null;
  className?: string;
}

export function AnimatedBrandCloudsLogo({
  logoUrl,
  commercialName,
  className = ''
}: AnimatedBrandCloudsLogoProps) {
  const [customFailed, setCustomFailed] = useState(false);
  const frontImgRef = useRef<HTMLImageElement | null>(null);
  const name = commercialName?.trim() || BRAND_IDENTITY.commercialName;
  const frontSrc =
    logoUrl && !customFailed ? logoUrl : '/brand/logo-foreground.webp';

  const [frontReady, setFrontReady] = useState<boolean>(false);

  useEffect(() => {
    const el = frontImgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setFrontReady(true);
      return;
    }
    setFrontReady(false);
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setFrontReady(true);
    };
    probe.onerror = () => {
      if (!cancelled) {
        if (frontSrc !== '/brand/logo-foreground.webp') {
          setCustomFailed(true);
        } else {
          setFrontReady(true);
        }
      }
    };
    probe.src = frontSrc;
    return () => {
      cancelled = true;
    };
  }, [frontSrc]);

  return (
    <div
      className={`relative select-none aspect-[1920/980] w-full transition-opacity duration-200 ${
        frontReady ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      role="img"
      aria-label={name}
    >
      {/* Capa trasera 1: Nube central esponjosa ajustada detrás del arcoíris y las letras */}
      <img
        src="/brand/cloud-wide.webp"
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="sync"
        className="pm-cloud-center pointer-events-none absolute left-[14.1%] top-[28%] w-[71.8%] h-auto z-0 drop-shadow-[0_8px_14px_rgba(56,189,248,0.14)]"
      />

      {/* Capa trasera 2: Nube lateral izquierda detrás del vestido, estrellas y carrito */}
      <img
        src="/brand/cloud-side.webp"
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="sync"
        className="pm-cloud-left pointer-events-none absolute left-[1.4%] top-[36.2%] w-[35.4%] h-auto z-[1] drop-shadow-[0_8px_14px_rgba(56,189,248,0.14)]"
      />

      {/* Capa trasera 3: Nube lateral derecha bajo las patitas del osito y los aros */}
      <div
        aria-hidden="true"
        className="pm-cloud-right pointer-events-none absolute left-[62.7%] top-[34.1%] w-[35.9%] z-[1] drop-shadow-[0_8px_14px_rgba(56,189,248,0.14)]"
      >
        <img
          src="/brand/cloud-side.webp"
          alt=""
          loading="eager"
          decoding="sync"
          className="w-full h-auto block -scale-x-100"
        />
      </div>

      {/* Capa frontal: Logo principal decodificado junto a las nubes */}
      <img
        ref={frontImgRef}
        src={frontSrc}
        alt={name}
        loading="eager"
        decoding="sync"
        onLoad={() => setFrontReady(true)}
        onError={() => setCustomFailed(true)}
        className="pm-logo-front pointer-events-none absolute left-[3.7%] top-[4.8%] w-[92.55%] h-auto z-10 drop-shadow-[0_10px_18px_rgba(212,56,91,0.14)]"
      />
    </div>
  );
}
