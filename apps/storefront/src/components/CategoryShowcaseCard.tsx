import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { CategoryTreeNode, ProductDetailDto } from '@pequemodas/shared';
import { Badge } from '@pequemodas/ui';
import { resolveImageById } from '../pwa/imageIdCache';

export interface CategoryShowcaseCardProps {
  category: CategoryTreeNode;
  products: ProductDetailDto[];
  compact?: boolean;
}

interface SlideItem {
  key: string;
  url: string;
  caption?: string;
}

function pickVisualPalette(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('niña') || lower.includes('nina') || lower.includes('vestid')) {
    return {
      gradient: 'from-pink-100 via-rose-50 to-amber-50',
      accent: 'text-brand-600',
      badge: 'brand' as const
    };
  }
  if (lower.includes('niño') || lower.includes('nino')) {
    return {
      gradient: 'from-sky-100 via-cyan-50 to-indigo-50',
      accent: 'text-sky-700',
      badge: 'sky' as const
    };
  }
  return {
    gradient: 'from-amber-100 via-pink-50 to-sky-100',
    accent: 'text-amber-700',
    badge: 'warning' as const
  };
}

export function CategoryShowcaseCard({
  category,
  products,
  compact = false
}: CategoryShowcaseCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cachedUrls, setCachedUrls] = useState<Record<string, string>>({});

  const subIds = useMemo(
    () => new Set([category.id, ...category.subcategories.map((s) => s.id)]),
    [category]
  );

  const slides = useMemo<SlideItem[]>(() => {
    const list: SlideItem[] = [];
    if (category.image_url) {
      list.push({
        key: `cat-cover-${category.id}`,
        url: category.image_url,
        caption: category.name
      });
    }

    const matchingProducts = products.filter(
      (p) =>
        (p.category_id && subIds.has(p.category_id)) ||
        (p.subcategory_id && subIds.has(p.subcategory_id))
    );

    const productSlides: SlideItem[] = [];
    for (const prod of matchingProducts) {
      const primary = prod.images.find((i) => i.is_primary) ?? prod.images[0];
      const url = primary?.thumbnail_url || primary?.public_url;
      if (primary && url) {
        productSlides.push({
          key: primary.id,
          url,
          caption: prod.name
        });
      }
    }

    // Mezcla pseudo-aleatoria estable para variedad visual
    for (let i = productSlides.length - 1; i > 0; i -= 1) {
      const j = (i * 7 + category.name.length) % (i + 1);
      const tmp = productSlides[i]!;
      productSlides[i] = productSlides[j]!;
      productSlides[j] = tmp;
    }

    return [...list, ...productSlides.slice(0, 7)];
  }, [category, products, subIds]);

  // Detecta si la tarjeta está visible en pantalla para activar la rotación de 6s
  useEffect(() => {
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        setInView(Boolean(entries[0]?.isIntersecting));
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Rotación suave cada 6 segundos mientras el usuario observa la sección
  useEffect(() => {
    if (!inView || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        if (slides.length <= 2) return (prev + 1) % slides.length;
        let next = Math.floor(Math.random() * slides.length);
        if (next === prev) next = (prev + 1) % slides.length;
        return next;
      });
    }, 6000);
    return () => window.clearInterval(timer);
  }, [inView, slides.length]);

  // Precarga en caché por ID la diapositiva activa
  useEffect(() => {
    const active = slides[activeIndex];
    if (!active || cachedUrls[active.key]) return;
    let alive = true;
    void resolveImageById(active.key, 'thumb', active.url).then((localUrl) => {
      if (alive) {
        setCachedUrls((prev) => ({ ...prev, [active.key]: localUrl }));
      }
    });
    return () => {
      alive = false;
    };
  }, [activeIndex, slides, cachedUrls]);

  const palette = pickVisualPalette(category.name);
  const currentSlide = slides[activeIndex % Math.max(1, slides.length)];

  return (
    <div
      ref={cardRef}
      className="group relative rounded-3xl overflow-hidden bg-white border border-brand-100/90 shadow-card hover:shadow-elevated transition-all duration-300 flex flex-col"
    >
      <Link
        to={`/categorias/${category.slug}`}
        className={`relative block w-full overflow-hidden ${
          compact ? 'h-40 sm:h-48' : 'h-48 sm:h-56'
        } bg-gradient-to-br ${palette.gradient}`}
      >
        {currentSlide ? (
          <>
            {slides.map((slide, idx) => {
              const visible = idx === activeIndex % slides.length;
              const src = cachedUrls[slide.key] || slide.url;
              return (
                <img
                  key={slide.key}
                  src={src}
                  alt={slide.caption || category.name}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
                    visible ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                  }`}
                />
              );
            })}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/15 to-transparent" />
          </>
        ) : (
          /* Panel ilustrado alegre mientras se suben las primeras fotos */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <svg
              viewBox="0 0 120 84"
              className="h-20 w-28 drop-shadow-sm transition-transform duration-500 group-hover:scale-105"
              aria-hidden="true"
            >
              <circle cx="34" cy="44" r="24" fill="#ffffff" fillOpacity="0.85" />
              <circle cx="62" cy="36" r="28" fill="#ffffff" fillOpacity="0.92" />
              <circle cx="88" cy="46" r="21" fill="#ffffff" fillOpacity="0.85" />
              <path
                d="M46 46l8-12 12 8 10-12 6 16H46z"
                fill="#f472b6"
                fillOpacity="0.85"
              />
              <circle cx="52" cy="28" r="5" fill="#38bdf8" />
              <circle cx="76" cy="26" r="4" fill="#fbbf24" />
            </svg>
            <span className={`mt-1 text-[11px] font-bold ${palette.accent} bg-white/80 px-2.5 py-0.5 rounded-full`}>
              Colección {category.name}
            </span>
          </div>
        )}

        {/* Etiqueta flotante superior si hay rotación de productos */}
        {slides.length > 1 && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm">
            <Sparkles className="h-3 w-3 text-brand-500" />
            {slides.length} vistas
          </span>
        )}

        {/* Título superpuesto elegante */}
        <div className="absolute bottom-3 inset-x-3.5 flex items-end justify-between gap-2">
          <div>
            <h3
              className={`font-heading font-extrabold text-lg sm:text-xl leading-tight ${
                currentSlide ? 'text-white drop-shadow' : 'text-slate-900'
              }`}
            >
              {category.name}
            </h3>
            {currentSlide?.caption && currentSlide.caption !== category.name && (
              <p className="text-[11px] font-medium text-white/90 line-clamp-1">
                {currentSlide.caption}
              </p>
            )}
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-brand-600 shadow group-hover:translate-x-0.5 transition-transform shrink-0">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>

      {!compact && (category.description || category.subcategories.length > 0) && (
        <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
          {category.description && (
            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
              {category.description}
            </p>
          )}
          {category.subcategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {category.subcategories.map((sub) => (
                <Link key={sub.id} to={`/categorias/${category.slug}/${sub.slug}`}>
                  <Badge tone={palette.badge} className="hover:opacity-90">
                    {sub.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
