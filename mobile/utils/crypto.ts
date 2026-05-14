import CryptoJS from 'crypto-js';

export function encrypt(text: string, key: string): string {
  return CryptoJS.AES.encrypt(text, key).toString();
}

export function decrypt(ciphertext: string, key: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
}

export function hashCode(code: string): string {
  return CryptoJS.SHA256(code).toString();
}

export function generateRoomId(secretCode: string): string {
  return CryptoJS.SHA256('room:' + secretCode).toString().substring(0, 16);
}

export function generateUserId(): string {
  const random = CryptoJS.lib.WordArray.random(8);
  return random.toString();
}
