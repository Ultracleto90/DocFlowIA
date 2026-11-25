import { z } from 'zod';
import { USER_ROLES } from '@/core/constants/plans';

export const googleCallbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
});

export const scheduleDemoSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingresa tu nombre completo.').max(120),
  correo: z
    .string()
    .trim()
    .email('Ingresa un correo electrónico válido.')
    .max(160),
  organizacion: z
    .string()
    .trim()
    .min(2, 'Ingresa el nombre de tu organización o equipo.')
    .max(140),
  plan_recomendado: z.enum(['Team IA', 'Enterprise']),
  tamano_equipo: z
    .string()
    .trim()
    .min(1, 'Indica el tamaño estimado del equipo.')
    .max(60),
  fecha_preferida: z
    .string()
    .trim()
    .min(4, 'Selecciona una fecha preferida para la demo.')
    .max(60),
  notas: z.string().trim().max(600).optional(),
});

export const createPlanRequestSchema = z.object({
  plan_solicitado: z.enum(['Team IA', 'Enterprise']),
  organizacion: z
    .string()
    .trim()
    .min(2, 'Ingresa el nombre de tu organización o workspace.')
    .max(140),
  industria: z.string().trim().max(100).optional().default(''),
  correo_corporativo: z
    .string()
    .trim()
    .email('Ingresa un correo corporativo válido.')
    .max(160),
  num_usuarios: z.coerce
    .number()
    .int()
    .min(1, 'Debe incluir al menos 1 usuario.')
    .max(10000),
  personalizaciones: z
    .array(z.string().trim().min(1).max(120))
    .max(12)
    .optional()
    .default([]),
  integracion_git: z.string().trim().max(100).optional().default(''),
  miembros_iniciales: z
    .array(
      z.object({
        correo: z.string().trim().email('Correo de miembro inválido.'),
        rol: z.enum(USER_ROLES),
      }),
    )
    .max(5, 'Team IA permite hasta 5 invitados iniciales.')
    .optional(),
});

export const mongoObjectIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, 'Identificador inválido.'),
});

export const reviewPlanRequestSchema = z.object({
  estado: z.enum(['aprobada', 'rechazada']),
  notas_admin: z.string().trim().max(600).optional().default(''),
});

export const updateDemoStatusSchema = z.object({
  estado: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']),
  notas: z.string().trim().max(600).optional(),
});
