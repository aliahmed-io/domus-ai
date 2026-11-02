const encoder = new TextEncoder();
async function signingKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function createGenerationTicket(
  id: string,
  secret: string,
  now = Date.now(),
) {
  const expires = now + 30 * 60 * 1000;
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(secret),
    encoder.encode(`domus-generation:${id}:${expires}`),
  );
  return `${expires}.${Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
export async function verifyGenerationTicket(
  id: string,
  ticket: string,
  secret: string,
  now = Date.now(),
) {
  const [expires, hex] = ticket.split(".");
  if (
    !expires ||
    !hex ||
    !/^\d+$/.test(expires) ||
    !/^[a-f0-9]{64}$/.test(hex) ||
    Number(expires) <= now ||
    Number(expires) > now + 30 * 60 * 1000
  )
    return false;
  const signature = Uint8Array.from(hex.match(/../g)!, (byte) =>
    parseInt(byte, 16),
  );
  return crypto.subtle.verify(
    "HMAC",
    await signingKey(secret),
    signature,
    encoder.encode(`domus-generation:${id}:${expires}`),
  );
}

export function getModelOutput(output: unknown): string | null {
  if (typeof output === "string") {
    try {
      const url = new URL(output);
      return url.protocol === "https:" &&
        (url.hostname === "replicate.delivery" ||
          url.hostname.endsWith(".replicate.delivery")) &&
        /\.(glb|gltf)$/i.test(url.pathname)
        ? url.href
        : null;
    } catch {
      return null;
    }
  }
  if (Array.isArray(output))
    return output.map(getModelOutput).find(Boolean) ?? null;
  if (output && typeof output === "object")
    return Object.values(output).map(getModelOutput).find(Boolean) ?? null;
  return null;
}
