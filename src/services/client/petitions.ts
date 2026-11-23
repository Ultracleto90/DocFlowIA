import type {
  AuthResponseDTO,
  LoginRequestDTO,
  LogoutResponseDTO,
  MeResponseDTO,
  RegisterRequestDTO,
} from '@/core/types';
import { basicGet } from '@/lib/http/basicGet';
import { basicPost } from '@/lib/http/httpClient';

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
