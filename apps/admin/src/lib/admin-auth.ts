const COOKIE_NAME = "admin_session";

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getUsername(): string {
  return process.env.ADMIN_USERNAME?.trim() || "admin";
}

export function getPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || "medalino";
}

function getSecret(): string {
  return process.env.ADMIN_AUTH_SECRET?.trim() || "dev-admin-auth-secret-change-me";
}

function bufferToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToUint8(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/iu.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function utf8ToBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlToUtf8(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionValue(): Promise<string> {
  const maxAgeSec = 60 * 60 * 24 * 7;
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const payload = JSON.stringify({ exp });
  const payloadB64 = utf8ToBase64Url(payload);
  const key = await importKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${bufferToHex(sig)}`;
}

export async function verifySessionValue(token: string): Promise<boolean> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payloadB64 = token.slice(0, dot);
  const sigHex = token.slice(dot + 1);
  const sigBytes = hexToUint8(sigHex);
  if (!sigBytes) return false;
  try {
    const key = await importKey(getSecret());
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      new Uint8Array(sigBytes),
      new TextEncoder().encode(payloadB64),
    );
    if (!ok) return false;
    const payload = JSON.parse(base64UrlToUtf8(payloadB64)) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    if (payload.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
