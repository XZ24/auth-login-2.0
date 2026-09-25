// Authentication core: token storage, the auth API client, an authenticated
// fetch wrapper with transparent refresh, and a (currently permissive) role
// permission helper.
//
// Storage strategy: the access token lives in memory only (lost on reload);
// the refresh token is persisted in sessionStorage so a page reload can
// silently mint a new access token via /auth/refresh.

// Base URL of the auth service. Auth routes live under the same backend as the
// data API, so default to VITE_API_URL; override with VITE_AUTH_API_URL only if
// auth is hosted separately.
const AUTH_API_BASE = (import.meta.env.VITE_AUTH_API_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  role: string;
  pic_name: string | null;
  is_active: boolean;
}

// Thrown by the auth API calls; `status` carries the HTTP status so callers can
// distinguish wrong credentials (401) from a disabled account (403).
export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

// --- Token store -----------------------------------------------------------

const REFRESH_KEY = 'auth_refresh_token';
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: AuthTokens): void {
  accessToken = tokens.access_token;
  if (tokens.refresh_token) sessionStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens(): void {
  accessToken = null;
  sessionStorage.removeItem(REFRESH_KEY);
}

// --- Forced-logout notification --------------------------------------------
// Emitted when a refresh fails and the session can no longer be recovered, so
// the app can drop back to the login screen.

type Listener = () => void;
const forcedLogoutListeners = new Set<Listener>();

export function onForcedLogout(listener: Listener): () => void {
  forcedLogoutListeners.add(listener);
  return () => forcedLogoutListeners.delete(listener);
}

function forceLogout(): void {
  clearTokens();
  forcedLogoutListeners.forEach((listener) => listener());
}

// --- Auth API --------------------------------------------------------------

export async function login(username: string, password: string): Promise<AuthTokens> {
  const body = new URLSearchParams();
  body.set('username', username);
  body.set('password', password);
  const res = await fetch(`${AUTH_API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    if (res.status === 401) throw new AuthError('Invalid username or password.', 401);
    if (res.status === 403) throw new AuthError('Your account is disabled. Please contact an administrator.', 403);
    throw new AuthError(`Sign in failed (${res.status}).`, res.status);
  }
  const tokens = (await res.json()) as AuthTokens;
  setTokens(tokens);
  return tokens;
}

// Rotate the refresh token into a fresh pair. Clears the stored tokens on
// failure so a dead session doesn't keep retrying.
export async function refreshTokens(): Promise<string> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) throw new AuthError('No refresh token available.', 401);
  const res = await fetch(`${AUTH_API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) {
    clearTokens();
    throw new AuthError('Your session has expired. Please sign in again.', res.status);
  }
  const tokens = (await res.json()) as AuthTokens;
  setTokens(tokens);
  return tokens.access_token;
}

// Best-effort server-side revoke, then always clear local tokens.
export async function logout(): Promise<void> {
  const refresh_token = getRefreshToken();
  if (refresh_token) {
    try {
      await fetch(`${AUTH_API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      });
    } catch {
      /* network error on logout is non-fatal — we still clear locally */
    }
  }
  clearTokens();
}

export async function getMe(): Promise<AuthUser> {
  const res = await authFetch(`${AUTH_API_BASE}/auth/me`);
  if (!res.ok) throw new AuthError('Failed to load user profile.', res.status);
  return (await res.json()) as AuthUser;
}

// --- Authenticated fetch ---------------------------------------------------

function withAuth(init: RequestInit): RequestInit {
  const headers = new Headers(init.headers ?? {});
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

// A single in-flight refresh shared by all concurrent 401s, so a burst of
// expired requests triggers only one /auth/refresh call.
let refreshPromise: Promise<string> | null = null;

function ensureRefreshed(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Drop-in replacement for fetch that attaches the Bearer token and, on a 401,
// refreshes once and retries the original request. If the refresh fails the
// session is torn down and the (401) response is returned to the caller.
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(input, withAuth(init));
  if (res.status !== 401) return res;
  if (!getRefreshToken()) {
    forceLogout();
    return res;
  }
  try {
    await ensureRefreshed();
  } catch {
    forceLogout();
    return res;
  }
  return fetch(input, withAuth(init));
}

// --- Permissions (role-gating plumbing) ------------------------------------
// Central place to add per-role UI rules later. Today every authenticated role
// shares the same UI, so this is intentionally permissive.

export type Permission = 'sendReminders' | 'exportClaims' | 'editClaims' | 'sendCustomEmail';

export function hasPermission(_user: AuthUser | null, _permission: Permission): boolean {
  return true;
}
