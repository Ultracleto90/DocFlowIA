import type {
  ScheduleDemoRequestDTO,
  ScheduleDemoResponseDTO,
} from '@/core/types';
import { auditLogRepository } from '@/infrastructure/repositories/auditLogRepository';
import { demoAppointmentRepository } from '@/infrastructure/repositories/demoAppointmentRepository';

const DB_ROLE_WRITE = 'worker_ia_service';

export async function scheduleDemoAppointment(
  input: ScheduleDemoRequestDTO,
  clientIp: string,
): Promise<ScheduleDemoResponseDTO> {
  const appointment = await demoAppointmentRepository.create(input);

  await auditLogRepository.create({
    usuario: appointment.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: `AGENDAMIENTO_DEMO:${appointment.plan_recomendado}`,
    entidad_afectada: 'citas_demo',
    direccion_ip: clientIp,
    resultado: 'EXITOSO',
  });

  return {
    appointment,
    message:
      'Demo agendada correctamente. Nuestro equipo te confirmará el enlace por correo.',
  };
}
