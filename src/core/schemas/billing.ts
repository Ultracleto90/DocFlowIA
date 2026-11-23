import { z } from 'zod';
import {
  AUDIT_RESULTS,
  PLAN_NAMES,
  USER_ROLES,
} from '@/core/constants/plans';

export const subscribePlanSchema = z.object({
  plan: z.enum(PLAN_NAMES),
});

export const enterpriseConfigSchema = z.object({
  white_label: z
    .object({
      enabled: z.boolean(),
      brand_name: z.string().trim().max(80),
      logo_url: z.string().trim().url('URL de logotipo inválida.').optional().or(z.literal('')),
    })
    .refine(
      (wl) => !wl.enabled || wl.brand_name.trim().length >= 2,
      {
        message: 'Ingresa un nombre de marca (mínimo 2 caracteres) para activar White-Label.',
        path: ['brand_name'],
      },
    )
    .optional(),
  rotate_api_key: z.boolean().optional(),
});

export const teamInviteSchema = z.object({
  correo: z.string().trim().toLowerCase().email('Correo electrónico inválido.'),
  rol: z.enum(USER_ROLES),
});

export const teamRemoveSchema = z.object({
  correo: z.string().trim().toLowerCase().email('Correo electrónico inválido.'),
});

export const auditQuerySchema = z.object({
  resultado: z.enum(AUDIT_RESULTS).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export type SubscribePlanInput = z.infer<typeof subscribePlanSchema>;
export type EnterpriseConfigInput = z.infer<typeof enterpriseConfigSchema>;
export type TeamInviteInput = z.infer<typeof teamInviteSchema>;
export type TeamRemoveInput = z.infer<typeof teamRemoveSchema>;
export type AuditQueryInput = z.infer<typeof auditQuerySchema>;
