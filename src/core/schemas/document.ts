import { z } from 'zod';
import { AUDIT_STATES } from '@/core/constants/plans';

export const updateDocumentSchema = z
  .object({
    contenido_markdown: z
      .string()
      .min(1, 'El contenido Markdown no puede estar vacío.')
      .optional(),
    estado_auditoria: z.enum(AUDIT_STATES).optional(),
  })
  .refine(
    (data) =>
      data.contenido_markdown !== undefined || data.estado_auditoria !== undefined,
    { message: 'Debes enviar contenido_markdown o estado_auditoria para actualizar.' },
  );

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
