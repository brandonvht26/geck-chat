import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Por favor, ingresa un correo válido'),
  password: z.string()
    .min(1, 'La contraseña es obligatoria')
    .min(6, 'Mínimo 6 caracteres'),
});

export const registerSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Por favor, ingresa un correo válido'),
  password: z.string()
    .min(1, 'La contraseña es obligatoria')
    .min(6, 'Mínimo 6 caracteres'),
});
