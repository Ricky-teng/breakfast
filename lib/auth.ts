export const COOKIE_NAME = "board_auth";

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expectedToken() {
  return sha256Hex(`breakfast-board:${process.env.BOARD_PIN ?? ""}`);
}

export function isValidPin(pin: string) {
  return !!process.env.BOARD_PIN && pin === process.env.BOARD_PIN;
}
