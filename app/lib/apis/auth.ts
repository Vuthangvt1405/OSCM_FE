import { postJson } from "./http";

export type RequestForgotPasswordOtpRequest = {
  email: string,
}

export type RegisterIdentityRequest = {
  email: string;
  password: string;
};

export type RegisterIdentityResponse = {
  identityId: string;
  email: string;
  status: string;
};

export type LoginIdentityRequest = {
  email: string;
  password: string;
};

export async function registerIdentity(
  input: RegisterIdentityRequest,
): Promise<RegisterIdentityResponse> {
  return postJson<RegisterIdentityResponse, RegisterIdentityRequest>(
    "/api/auth/register",
    input,
  );
}

export async function loginIdentity(
  input: LoginIdentityRequest,
): Promise<void> {
  await postJson<{ ok: true }, LoginIdentityRequest>("/api/auth/login", input);
}

export async function requestForgotPasswordOtp(input: RequestForgotPasswordOtpRequest): Promise<void> {
  await postJson<{ok: true}, RequestForgotPasswordOtpRequest>("/api/auth/forgot-password/otp", input);
}

export type ResetPasswordWithOtpRequest = {
  email: string;
  otp: string;
  newPassword: string;
}

export async function resetPasswordWithOtp(input: ResetPasswordWithOtpRequest): Promise<void> {
  await postJson<{ok: true}, ResetPasswordWithOtpRequest>("/api/auth/forgot-password/reset", input);
}
