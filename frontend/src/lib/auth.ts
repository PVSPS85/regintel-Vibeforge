/**
 * auth.ts
 * -------
 * Helpers for storing, reading, and clearing the JWT access token
 * in localStorage, plus utilities to decode the payload without
 * a round-trip to the server.
 */

import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'regintel_access_token';

export interface JWTPayload {
  user_id: string;
  role: string;
  branch_id: string | null;
  exp: number;
}

/** Persist the token returned by POST /auth/login */
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Retrieve the stored token (or null if not logged in) */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Remove token on logout */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Decode the JWT payload. Returns null if token is missing or malformed. */
export function decodeToken(): JWTPayload | null {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode<JWTPayload>(token);
  } catch {
    return null;
  }
}

/** Returns true if there is a valid, non-expired token */
export function isAuthenticated(): boolean {
  const payload = decodeToken();
  if (!payload) return false;
  // exp is in seconds (Unix timestamp)
  return payload.exp * 1000 > Date.now();
}
