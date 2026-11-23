import { z } from 'zod';
import { PLAN_NAMES, USER_ROLES } from '@/core/constants/plans';

export const subscribePlanSchema = z.object({
  plan: z.enum(PLAN_NAMES),
});

export const enterpriseConfigSchema = z.object({
  white_label: z
    .object({
      enabled: z.boolean(),
      brand_name: z.string().trim().min(2).max(80),
      logo_url: z.string().trim().url().optional().or(z.literal('')),
    })
    .optional(),
  rotate_api_key: z.boolean().optional(),
});

export const teamInviteSchema = z.object({
  correo: z.string().trim().toLowerCase().email('Correo electrónico inválido.'),
  rol: z.enum(USER_ROLES),
});

export type SubscribePlanInput = z.infer<typeof subscribePlanSchema>;
export type EnterpriseConfigInput = z.infer<typeof enterpriseConfigSchema>;
export type TeamInviteInput = z.infer<typeof teamInviteSchema>;
