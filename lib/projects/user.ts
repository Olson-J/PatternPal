function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getSupabaseAuthUrl(): string {
  return process.env.SUPABASE_URL?.trim() ?? "";
}

function getSupabaseAnonKey(): string {
  return process.env.SUPABASE_ANON_KEY?.trim() ?? "";
}

function getHeaderUserFallbackId(): string {
  return process.env.PATTERNPAL_DEFAULT_USER_ID?.trim() || "00000000-0000-0000-0000-000000000001";
}

function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization")?.trim() ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token || null;
}

function extractCookieToken(request: Request): string | null {
  const rawCookie = request.headers.get("cookie") ?? "";

  if (!rawCookie) {
    return null;
  }

  const parts = rawCookie.split(";").map((part) => part.trim()).filter(Boolean);

  for (const part of parts) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();

    if ((key === "sb-access-token" || key === "access_token") && value) {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
}

async function resolveSupabaseAuthUserId(request: Request): Promise<string | null> {
  const supabaseUrl = getSupabaseAuthUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  const token = extractBearerToken(request) ?? extractCookieToken(request);

  if (!supabaseUrl || !supabaseAnonKey || !token) {
    return null;
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { id?: string };
    return typeof json.id === "string" && isUuid(json.id) ? json.id : null;
  } catch {
    return null;
  }
}

export function isSupabaseAuthEnabled(): boolean {
  return Boolean(getSupabaseAuthUrl() && getSupabaseAnonKey());
}

export function getDefaultProjectUserId(): string {
  const fallback = getHeaderUserFallbackId();
  return isUuid(fallback) ? fallback : "00000000-0000-0000-0000-000000000001";
}

export async function resolveProjectUserIdFromRequest(request: Request): Promise<string | null> {
  if (isSupabaseAuthEnabled()) {
    return resolveSupabaseAuthUserId(request);
  }

  const candidate = request.headers.get("x-user-id")?.trim();

  if (candidate && isUuid(candidate)) {
    return candidate;
  }

  return getDefaultProjectUserId();
}
