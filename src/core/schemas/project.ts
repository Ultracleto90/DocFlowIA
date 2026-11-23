import { z } from 'zod';

export const createProjectMetaSchema = z.object({
  nombre_proyecto: z
    .string({ required_error: 'El nombre del proyecto es obligatorio.' })
    .trim()
    .min(3, 'El nombre del proyecto debe tener al menos 3 caracteres.')
    .max(120, 'El nombre del proyecto no puede exceder 120 caracteres.'),
  framework: z
    .string({ required_error: 'El framework es obligatorio.' })
    .trim()
    .min(2, 'Especifica la versión de Laravel.')
    .max(40, 'El framework no puede exceder 40 caracteres.'),
});

export const webhookConfigSchema = z.object({
  webhook_url: z
    .string()
    .trim()
    .url('La URL del webhook debe ser válida (https://...).'),
});

export type CreateProjectMetaInput = z.infer<typeof createProjectMetaSchema>;
export type WebhookConfigInput = z.infer<typeof webhookConfigSchema>;
