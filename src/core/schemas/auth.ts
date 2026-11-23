import { z } from 'zod';

export const registerSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.'),
  correo: z
    .string({ required_error: 'El correo es obligatorio.' })
    .trim()
    .toLowerCase()
    .email('Ingresa un correo electrónico válido.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(72, 'La contraseña no puede exceder 72 caracteres.'),
});

export const loginSchema = z.object({
  correo: z
    .string({ required_error: 'El correo es obligatorio.' })
    .trim()
    .toLowerCase()
    .email('Ingresa un correo electrónico válido.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(1, 'Ingresa tu contraseña.'),
});

export type RegisterSchemaInput = z.infer<typeof registerSchema>;
export type LoginSchemaInput = z.infer<typeof loginSchema>;
