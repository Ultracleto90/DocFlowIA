import type { AuditResult, DocumentAuditState, PlanName } from '@/core/constants/plans';
import type {
  AdminAuditResponseDTO,
  AuthResponseDTO,
  CreateProjectResponseDTO,
  DeleteProjectResponseDTO,
  EnterpriseConfigRequestDTO,
  EnterpriseConfigResponseDTO,
  LoginRequestDTO,
  LogoutResponseDTO,
  MeResponseDTO,
  PlansCatalogResponseDTO,
  ProjectDetailResponseDTO,
  ProjectListResponseDTO,
  RegisterRequestDTO,
  SaveWebhookRequestDTO,
  SaveWebhookResponseDTO,
  SubscribePlanRequestDTO,
  SubscribePlanResponseDTO,
  TeamInviteRequestDTO,
  TeamManageResponseDTO,
  UpdateDocumentRequestDTO,
  UpdateDocumentResponseDTO,
  WhiteLabelConfig,
} from '@/core/types';
import { basicGet } from '@/lib/http/basicGet';
import {
  basicDelete,
  basicDownload,
  basicPatch,
  basicPost,
  basicUpload,
} from '@/lib/http/httpClient';

export const authPetitions = {
  login(payload: LoginRequestDTO): Promise<AuthResponseDTO> {
    return basicPost<AuthResponseDTO, LoginRequestDTO>('/api/auth/login', payload);
  },

  register(payload: RegisterRequestDTO): Promise<AuthResponseDTO> {
    return basicPost<AuthResponseDTO, RegisterRequestDTO>(
      '/api/auth/register',
      payload,
    );
  },

  logout(): Promise<LogoutResponseDTO> {
    return basicPost<LogoutResponseDTO>('/api/auth/logout');
  },

  me(): Promise<MeResponseDTO> {
    return basicGet<MeResponseDTO>('/api/auth/me');
  },
};

export const projectPetitions = {
  list(): Promise<ProjectListResponseDTO> {
    return basicGet<ProjectListResponseDTO>('/api/projects');
  },

  getByCode(codigo: string): Promise<ProjectDetailResponseDTO> {
    return basicGet<ProjectDetailResponseDTO>(
      `/api/projects/${encodeURIComponent(codigo)}`,
    );
  },

  uploadZip(formData: FormData): Promise<CreateProjectResponseDTO> {
    return basicUpload<CreateProjectResponseDTO>('/api/projects', formData);
  },

  delete(codigo: string): Promise<DeleteProjectResponseDTO> {
    return basicDelete<DeleteProjectResponseDTO>(
      `/api/projects/${encodeURIComponent(codigo)}`,
    );
  },

  saveWebhook(
    codigo: string,
    payload: SaveWebhookRequestDTO,
  ): Promise<SaveWebhookResponseDTO> {
    return basicPatch<SaveWebhookResponseDTO, SaveWebhookRequestDTO>(
      `/api/projects/${encodeURIComponent(codigo)}`,
      payload,
    );
  },
};

export const documentPetitions = {
  updateContent(
    id: string,
    contenido_markdown: string,
  ): Promise<UpdateDocumentResponseDTO> {
    return basicPatch<UpdateDocumentResponseDTO, UpdateDocumentRequestDTO>(
      `/api/documents/${encodeURIComponent(id)}`,
      { contenido_markdown },
    );
  },

  validateDocument(
    id: string,
    estado_auditoria: DocumentAuditState = 'validado_humano',
  ): Promise<UpdateDocumentResponseDTO> {
    return basicPatch<UpdateDocumentResponseDTO, UpdateDocumentRequestDTO>(
      `/api/documents/${encodeURIComponent(id)}`,
      { estado_auditoria },
    );
  },

  exportMarkdown(id: string, filename: string): Promise<void> {
    return basicDownload(
      `/api/documents/${encodeURIComponent(id)}/export`,
      filename,
      { params: { format: 'md' } },
    );
  },

  exportPdf(id: string, filename: string): Promise<void> {
    return basicDownload(
      `/api/documents/${encodeURIComponent(id)}/export`,
      filename,
      { params: { format: 'pdf' } },
    );
  },
};

export const billingPetitions = {
  getPlans(): Promise<PlansCatalogResponseDTO> {
    return basicGet<PlansCatalogResponseDTO>('/api/billing/plans');
  },

  upgradePlan(plan: PlanName): Promise<SubscribePlanResponseDTO> {
    return basicPost<SubscribePlanResponseDTO, SubscribePlanRequestDTO>(
      '/api/billing/subscribe',
      { plan },
    );
  },

  updateWhiteLabel(
    white_label: WhiteLabelConfig,
  ): Promise<EnterpriseConfigResponseDTO> {
    return basicPatch<EnterpriseConfigResponseDTO, EnterpriseConfigRequestDTO>(
      '/api/billing/enterprise',
      { white_label },
    );
  },

  generateApiKey(): Promise<EnterpriseConfigResponseDTO> {
    return basicPatch<EnterpriseConfigResponseDTO, EnterpriseConfigRequestDTO>(
      '/api/billing/enterprise',
      { rotate_api_key: true },
    );
  },

  manageTeam: {
    invite(payload: TeamInviteRequestDTO): Promise<TeamManageResponseDTO> {
      return basicPost<TeamManageResponseDTO, TeamInviteRequestDTO>(
        '/api/team/invite',
        payload,
      );
    },

    remove(correo: string): Promise<TeamManageResponseDTO> {
      return basicDelete<TeamManageResponseDTO>('/api/team/invite', {
        params: { correo },
      });
    },
  },
};

export const auditPetitions = {
  listLogs(resultado?: AuditResult): Promise<AdminAuditResponseDTO> {
    return basicGet<AdminAuditResponseDTO>(
      '/api/admin/audit',
      resultado ? { params: { resultado } } : undefined,
    );
  },

  getMetrics(): Promise<AdminAuditResponseDTO> {
    return basicGet<AdminAuditResponseDTO>('/api/admin/audit');
  },
};
