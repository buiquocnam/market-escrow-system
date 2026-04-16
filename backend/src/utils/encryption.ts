import crypto from 'crypto';

/**
 * Encryption Utility - Bảo mật các mã token nhạy cảm (Shopify Access Token, Webhook Secret)
 * Sử dụng thuật toán AES-256-GCM để đảm bảo tính toàn vẹn và bảo mật dữ liệu.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 10000;

// Master Secret từ biến môi trường (Cần cấu hình trong .env)
const MASTER_SECRET = process.env.ENCRYPTION_KEY || 'escrow_market_default_secret_32chars_long';

export function encrypt(text: string): string {
  if (!text) return '';
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  const key = crypto.pbkdf2Sync(MASTER_SECRET, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decrypt(cipherText: string): string {
  if (!cipherText) return '';
  
  const data = Buffer.from(cipherText, 'base64');
  
  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = crypto.pbkdf2Sync(MASTER_SECRET, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return decipher.update(encrypted) + decipher.final('utf8');
}
