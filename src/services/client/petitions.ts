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
} from '@/core/types';
import { basicGet } from '@/lib/http/basicGet';
import {
  basicDelete,
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
