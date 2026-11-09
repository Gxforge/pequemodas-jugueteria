import { z } from 'zod';

export const currencyCodeSchema = z.enum(['CUP', 'USD']);

export type CurrencyCodeInput = z.infer<typeof currencyCodeSchema>;
