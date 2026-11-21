import type { Doc } from "./model";
import { MAX_PROJECT_BYTES } from "./storage";
import { validateDoc } from "./validate";

/* Share links carry the whole document in the URL hash, deflated and
 * base64url-encoded after the prefix "#sc=". No server, no database:
 * the design lives in the link. When CompressionStream is unavailable
 * the payload is the raw UTF-8 JSON instead, and decoding falls back to
 * reading it as text when inflation fails — the same bytes either way
 * for conforming encoders.
 */

export const SHARE_PREFIX = "#sc=";
export const MAX_SHARE_LENGTH = 1_000_000;

class ShareSizeError extends Error {}

async function readBounded(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return text + decoder.decode();
      size += value.byteLength;
      if (size > MAX_PROJECT_BYTES) {
        await reader.cancel();
        throw new ShareSizeError("Shared project exceeds the size limit");
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function deflate(text: string): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") return new TextEncoder().encode(text);
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflate(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream !== "undefined") {
    try {
      const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return await readBounded(stream);
    } catch (error) {
      if (error instanceof ShareSizeError) throw error;
      /* not a deflated payload — fall through to the raw reading */
    }
  }
  if (bytes.byteLength > MAX_PROJECT_BYTES) throw new ShareSizeError("Shared project exceeds the size limit");
  return new TextDecoder().decode(bytes);
}

export async function encodeDoc(doc: Doc): Promise<string> {
  const json = JSON.stringify(doc);
  if (json.length > MAX_PROJECT_BYTES || new TextEncoder().encode(json).byteLength > MAX_PROJECT_BYTES) {
    throw new ShareSizeError("Project exceeds the size limit");
  }
  const payload = toBase64Url(await deflate(json));
  if (payload.length > MAX_SHARE_LENGTH) throw new ShareSizeError("Share link exceeds the size limit");
  return payload;
}

export async function decodeDoc(payload: string): Promise<Doc | null> {
  return (await decodeDocDetailed(payload))?.doc ?? null;
}

export async function shareLink(doc: Doc, base: string): Promise<string> {
  return `${base}${SHARE_PREFIX}${await encodeDoc(doc)}`;
}

export async function docFromHash(hash: string): Promise<Doc | null> {
  if (!hash.startsWith(SHARE_PREFIX)) return null;
  return decodeDoc(hash.slice(SHARE_PREFIX.length));
}

export interface DecodedDoc {
  doc: Doc;
  warnings: string[];
}

/** Like decodeDoc, but keeps the tolerant-ingress repair warnings so the
 *  caller can surface them (persistence-sharing spec, task 7.2). */
export async function decodeDocDetailed(payload: string): Promise<DecodedDoc | null> {
  if (payload.length > MAX_SHARE_LENGTH) return null;
  try {
    const json = await inflate(fromBase64Url(payload));
    const { doc, errors, warnings } = validateDoc(JSON.parse(json) as unknown, "share link");
    if (!doc || errors.length > 0) return null;
    return { doc, warnings };
  } catch {
    return null;
  }
}

export async function docFromHashDetailed(hash: string): Promise<DecodedDoc | null> {
  if (!hash.startsWith(SHARE_PREFIX)) return null;
  return decodeDocDetailed(hash.slice(SHARE_PREFIX.length));
}
