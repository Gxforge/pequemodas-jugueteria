const BASE_STORE_VOCABULARY = [
  'juguete',
  'juguetes',
  'muñeca',
  'vestido',
  'pantalón',
  'camisa',
  'camiseta',
  'blusa',
  'short',
  'conjunto',
  'pijama',
  'zapato',
  'zapatos',
  'sandalia',
  'tenis',
  'bebé',
  'niño',
  'niña',
  'infantil',
  'carro',
  'carrito',
  'pelota',
  'peluche',
  'mochila',
  'biberón',
  'sonajero',
  'bicicleta',
  'patineta',
  'bloques',
  'rompecabezas',
  'accesorios',
  'lazo',
  'diadema',
  'gorra',
  'medias',
  'disfraz',
  'cuna',
  'ropa'
];

export function normalizeSpanishText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function spanishPhoneticCode(word: string): string {
  const clean = normalizeSpanishText(word);
  if (!clean) return '';
  return clean
    .replace(/^h+/, '')
    .replace(/qu/g, 'k')
    .replace(/c([ei])/g, 's$1')
    .replace(/c/g, 'k')
    .replace(/g([ei])/g, 'j$1')
    .replace(/ll/g, 'y')
    .replace(/v/g, 'b')
    .replace(/z/g, 's')
    .replace(/sh|ch/g, 'x')
    .replace(/h/g, '')
    .replace(/(.)\1+/g, '$1')
    .replace(/(es|s)$/, '');
}

export function damerauLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, dp[i - 2]![j - 2]! + 1);
      }
      dp[i]![j] = best;
    }
  }
  return dp[m]![n]!;
}

export function areSpanishWordsFuzzyEqual(queryWord: string, targetWord: string): boolean {
  const q = normalizeSpanishText(queryWord);
  const t = normalizeSpanishText(targetWord);
  if (!q || !t) return false;
  if (t.includes(q) || q.includes(t)) return true;

  const qp = spanishPhoneticCode(q);
  const tp = spanishPhoneticCode(t);
  if (qp && tp && (qp === tp || tp.startsWith(qp))) return true;

  const maxDist = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
  if (maxDist > 0) {
    if (damerauLevenshtein(q, t) <= maxDist) return true;
    if (qp.length >= 3 && tp.length >= 3 && damerauLevenshtein(qp, tp) <= 1) {
      return true;
    }
  }
  return false;
}

export function scoreSmartTextMatch(query: string, searchableFields: string[]): number {
  const normQuery = normalizeSpanishText(query);
  if (!normQuery) return 1;
  const qTokens = normQuery.split(' ').filter((w) => w.length >= 2);
  if (qTokens.length === 0) return 0;

  const joined = normalizeSpanishText(searchableFields.join(' '));
  if (!joined) return 0;
  if (joined.includes(normQuery)) return 100;

  const targetWords = Array.from(new Set(joined.split(' ').filter(Boolean)));
  let matched = 0;
  let score = 0;

  for (const qt of qTokens) {
    if (joined.includes(qt)) {
      matched += 1;
      score += 35;
      continue;
    }
    const fuzzyHit = targetWords.some((tw) => areSpanishWordsFuzzyEqual(qt, tw));
    if (fuzzyHit) {
      matched += 1;
      score += 22;
    }
  }

  return matched === qTokens.length ? score : matched > 0 && qTokens.length > 1 ? score * 0.5 : 0;
}

export function suggestDidYouMean(
  rawQuery: string,
  extraVocabulary: string[] = []
): string | null {
  const norm = normalizeSpanishText(rawQuery);
  if (norm.length < 3) return null;

  const pool = Array.from(
    new Set([
      ...extraVocabulary.flatMap((v) => v.split(/\s+/)),
      ...BASE_STORE_VOCABULARY
    ])
  ).filter((w) => w.length >= 3);

  const tokens = rawQuery.trim().split(/\s+/);
  let changed = false;

  const corrected = tokens.map((tok) => {
    const cleanTok = normalizeSpanishText(tok);
    if (cleanTok.length < 3) return tok;
    const exact = pool.find((p) => normalizeSpanishText(p) === cleanTok);
    if (exact) {
      if (exact.toLowerCase() !== tok.toLowerCase()) changed = true;
      return exact.toLowerCase();
    }

    let bestCandidate: string | null = null;
    let bestScore = 99;
    const qp = spanishPhoneticCode(cleanTok);

    for (const cand of pool) {
      const nc = normalizeSpanishText(cand);
      const cp = spanishPhoneticCode(cand);
      const dist =
        qp && cp === qp ? 0.5 : Math.min(damerauLevenshtein(cleanTok, nc), damerauLevenshtein(qp, cp) + 0.5);
      const threshold = cleanTok.length >= 6 ? 2 : 1.5;
      if (dist <= threshold && dist < bestScore) {
        bestScore = dist;
        bestCandidate = cand.toLowerCase();
      }
    }

    if (bestCandidate && bestCandidate !== tok.toLowerCase()) {
      changed = true;
      return bestCandidate;
    }
    return tok;
  });

  return changed ? corrected.join(' ') : null;
}

export type StoreSearchIntentKind = 'cart' | 'order_guide' | 'chat';

export interface StoreSearchIntent {
  kind: StoreSearchIntentKind;
  title: string;
  subtitle: string;
  actionLabel: string;
  href?: string;
}

export function detectStoreSearchIntent(rawQuery: string): StoreSearchIntent | null {
  const q = normalizeSpanishText(rawQuery);
  if (q.length < 3) return null;
  const words = q.split(' ');

  const cartTerms = [
    'carrito', 'carito', 'bolsa', 'bolsita', 'pagar', 'comprar',
    'pedido', 'pedidos', 'cuenta', 'subtotal', 'total', 'llevo', 'cesta'
  ];
  // Avoid triggering "carrito" intent if they explicitly say "carrito de juguete"
  const isToyCar = words.includes('juguete') || words.includes('control') || words.includes('bebe');
  if (!isToyCar && words.some((w) => cartTerms.some((ct) => areSpanishWordsFuzzyEqual(w, ct)))) {
    return {
      kind: 'cart',
      title: 'Tu Carrito y Pedido Actual',
      subtitle: 'Revisa tus artículos guardados, cantidades en CUP o envía tu compra.',
      actionLabel: 'Abrir mi carrito',
      href: '/carrito'
    };
  }

  const guideTerms = ['como pedir', 'envio', 'domicilio', 'entrega', 'recogida', 'mensajeria'];
  if (guideTerms.some((gt) => q.includes(gt) || words.some((w) => areSpanishWordsFuzzyEqual(w, gt)))) {
    return {
      kind: 'order_guide',
      title: 'Guía Visual: ¿Cómo realizar tu pedido?',
      subtitle: 'Mira en imágenes paso a paso cómo elegir, revisar y confirmar con Katia.',
      actionLabel: 'Ver guía visual',
      href: '/informacion-pedidos'
    };
  }

  const chatTerms = ['chat', 'whatsapp', 'wasap', 'hablar', 'katia', 'ayuda', 'atencion', 'asesora'];
  if (words.some((w) => chatTerms.some((ct) => areSpanishWordsFuzzyEqual(w, ct)))) {
    return {
      kind: 'chat',
      title: 'Hablar en Vivo con la Tienda',
      subtitle: 'Abre el chat directo con Katia y el asistente en línea.',
      actionLabel: 'Abrir chat ahora'
    };
  }

  return null;
}
