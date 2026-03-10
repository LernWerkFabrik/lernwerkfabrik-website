import "server-only";

function toBase64Url(bytes: Uint8Array) {
  const encoded = Buffer.from(bytes).toString("base64");
  return encoded.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function generateWaitlistConfirmationToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export function normalizeWaitlistConfirmationToken(value: string | null) {
  const token = value?.trim() ?? "";
  if (!token || token.length > 255) return "";
  if (!/^[A-Za-z0-9_-]+$/.test(token)) return "";
  return token;
}

export async function getNextConfirmedWaitlistPosition(supabaseServer: any) {
  const positionResult = await supabaseServer
    .from("waitlist")
    .select("confirmed_position")
    .eq("status", "confirmed")
    .order("confirmed_position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (positionResult.error) {
    console.error("waitlist: confirmed position select failed", {
      code: positionResult.error.code,
      message: positionResult.error.message,
    });
    return null;
  }

  return (positionResult.data?.confirmed_position ?? 0) + 1;
}
