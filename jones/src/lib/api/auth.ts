import { http, setTokens, clearTokens } from "@Lib/apiClient";
import type { BackendJWTResponse, BackendUser } from "src/types/backend";

export async function login(email: string, password: string): Promise<BackendJWTResponse> {
  const data = await http.post<BackendJWTResponse>("/api/token/", { email, password });
  setTokens(data.access, data.refresh);
  return data;
}

export async function register(userData: {
  username: string;
  email: string;
  password1: string;
  password2: string;
}): Promise<BackendJWTResponse> {
  const data = await http.post<BackendJWTResponse>("/api/auth/registration/", userData);
  if ((data as any).access && (data as any).refresh) {
    setTokens((data as any).access, (data as any).refresh);
  }
  return data as BackendJWTResponse;
}

export async function refreshToken(refresh: string): Promise<BackendJWTResponse> {
  const data = await http.post<BackendJWTResponse>("/api/token/refresh/", { refresh });
  setTokens(data.access, data.refresh);
  return data;
}

export async function getCurrentUser(): Promise<BackendUser | null> {
  try {
    return await http.get<BackendUser>("/auth/user/");
  } catch {
    return null;
  }
}

export async function googleLogin(accessToken: string): Promise<BackendJWTResponse> {
  const data = await http.post<BackendJWTResponse>("/api/auth/google/", {
    access_token: accessToken,
  });
  setTokens(data.access, data.refresh);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await http.post("/auth/logout/");
  } catch {
    // ignore
  }
  clearTokens();
}
