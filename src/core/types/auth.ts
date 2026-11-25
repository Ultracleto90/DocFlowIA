import type { AuthUserProfile } from './user';

export interface LoginRequestDTO {
  correo: string;
  password: string;
}

export interface RegisterRequestDTO {
  nombre: string;
  correo: string;
  password: string;
}

export interface AuthResponseDTO {
  user: AuthUserProfile;
}

export interface MeResponseDTO {
  user: AuthUserProfile;
}

export interface LogoutResponseDTO {
  message: string;
}

export interface UnlinkGoogleResponseDTO {
  user: AuthUserProfile;
  message: string;
}
