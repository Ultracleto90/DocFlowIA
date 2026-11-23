import type { DocumentAuditState } from '@/core/constants/plans';
import type {
  AuthResponseDTO,
  CreateProjectResponseDTO,
  DeleteProjectResponseDTO,
  LoginRequestDTO,
  LogoutResponseDTO,
  MeResponseDTO,
  ProjectDetailResponseDTO,
  ProjectListResponseDTO,
  RegisterRequestDTO,
  SaveWebhookRequestDTO,
  SaveWebhookResponseDTO,
  UpdateDocumentRequestDTO,
  UpdateDocumentResponseDTO,
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
