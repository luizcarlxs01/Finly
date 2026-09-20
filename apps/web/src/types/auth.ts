export type AuthResponse = {
  requiresVerification: false;
  token: string;
  expiresAt: string;
  userId: string;
  name: string;
  email: string;
};

export type AuthChallengeResponse = {
  requiresVerification: true;
  name: string;
  email: string;
};

export type AuthOutcome = AuthResponse | AuthChallengeResponse;

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type VerifyEmailCodeRequest = {
  email: string;
  code: string;
};

export type ResendVerificationCodeRequest = {
  email: string;
};
