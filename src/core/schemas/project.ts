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

export const projectCodeParamSchema = z.object({
  codigo: z
    .string()
    .trim()
    .regex(/^PRJ-\d{3,}$/i, 'Código de proyecto inválido.')
    .transform((value) => value.toUpperCase()),
});

export const bundleQuerySchema = z.object({
  artifact: z
    .enum([
      'kit',
      'source_zip',
      'topology_md',
      'project_map_json',
      'llms_txt',
      'security_md',
    ])
    .optional()
    .default('kit'),
});

export type CreateProjectMetaInput = z.infer<typeof createProjectMetaSchema>;
export type WebhookConfigInput = z.infer<typeof webhookConfigSchema>;
