import {
  getPlanDefinition,
  type DocumentType,
  type PlanName,
} from '@/core/constants/plans';
import type { UserRecord } from '@/core/types';
import { projectRepository } from '@/infrastructure/repositories/projectRepository';
import { ServiceError } from './errors';

export interface MonthlyQuotaResult {
  used: number;
  max: number;
  remaining: number;
}

export const planGuardService = {
  async checkMonthlyQuota(user: UserRecord): Promise<MonthlyQuotaResult> {
    const used = await projectRepository.countMonthlyByUser(user.correo);
    const max = user.plan.max_proyectos_mes;

    if (used >= max) {
      throw new ServiceError(
        403,
        `Has alcanzado el límite mensual de ${max} proyectos para tu plan ${user.plan.nombre}. Actualiza tu plan para continuar.`,
        {
          code: 'QUOTA_EXCEEDED',
          plan: user.plan.nombre,
          used,
          max,
        },
      );
    }

    return {
      used,
      max,
      remaining: Math.max(0, max - used),
    };
  },

  checkZipSize(planName: PlanName, sizeBytes: number): void {
    if (sizeBytes <= 0) {
      throw new ServiceError(400, 'El archivo .zip está vacío.');
    }

    const plan = getPlanDefinition(planName);
    const maxBytes = plan.max_zip_mb * 1024 * 1024;

    if (sizeBytes > maxBytes) {
      throw new ServiceError(
        403,
        `El archivo excede el límite de ${plan.max_zip_mb} MB permitido por el plan ${plan.nombre}.`,
        {
          code: 'ZIP_SIZE_EXCEEDED',
          plan: plan.nombre,
          max_zip_mb: plan.max_zip_mb,
          actual_mb: Number((sizeBytes / (1024 * 1024)).toFixed(2)),
        },
      );
    }
  },

  checkBladeViewCount(planName: PlanName, count: number): void {
    if (count === 0) {
      throw new ServiceError(
        400,
        'No se encontraron vistas .blade.php válidas dentro del archivo .zip.',
        { code: 'NO_BLADE_VIEWS' },
      );
    }

    const plan = getPlanDefinition(planName);
    if (count > plan.max_vistas_blade) {
      throw new ServiceError(
        403,
        `El proyecto contiene ${count} vistas .blade.php y supera el límite de ${plan.max_vistas_blade} vistas del plan ${plan.nombre}.`,
        {
          code: 'BLADE_LIMIT_EXCEEDED',
          plan: plan.nombre,
          max_vistas_blade: plan.max_vistas_blade,
          detected_views: count,
        },
      );
    }
  },

  getUnlockedDeliverables(planName: PlanName): readonly DocumentType[] {
    return getPlanDefinition(planName).entregables;
  },

  canExportPdf(planName: PlanName): boolean {
    return getPlanDefinition(planName).pdf_habilitado;
  },

  canUseWebhooks(planName: PlanName): boolean {
    return getPlanDefinition(planName).features.webhooks;
  },
};
