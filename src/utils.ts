import { CredentialType } from './types';

/**
 * Calculates a standard password quality score (0 to 100)
 */
export function getPasswordScore(password: string, allCredentials: CredentialType[] = []): number {
  if (!password) return 0;
  
  let score = 0;
  
  // Length contribution: max 40
  if (password.length >= 12) score += 40;
  else if (password.length >= 10) score += 30;
  else if (password.length >= 8) score += 20;
  else score += 10;
  
  // Character types: 15% each (max 60)
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) score += 15;
  
  // Reuse check: if duplicated anywhere in current vault, penalize
  if (allCredentials.length > 0) {
    const isReused = allCredentials.filter(c => c.password === password).length > 1;
    if (isReused) {
      score -= 20;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

export interface StrengthInfo {
  label: 'Strong' | 'Fair' | 'Weak';
  colorClass: string;
  scoreVal: number;
}

/**
 * Returns strength levels based on the score
 */
export function getPasswordStrengthInfo(score: number): StrengthInfo {
  if (score >= 80) return { label: 'Strong', colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', scoreVal: 3 };
  if (score >= 50) return { label: 'Fair', colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20', scoreVal: 2 };
  return { label: 'Weak', colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20', scoreVal: 1 };
}

/**
 * Generates a cryptographically strong random password
 */
export function generateRandomPassword(
  length: number,
  upper: boolean,
  lower: boolean,
  numbers: boolean,
  symbols: boolean
): string {
  let charPool = '';
  if (upper) charPool += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lower) charPool += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) charPool += '0123456789';
  if (symbols) charPool += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (charPool === '') return '';
  
  let password = '';
  const bytes = new Uint32Array(length);
  window.crypto.getRandomValues(bytes);
  
  for (let i = 0; i < length; i++) {
    password += charPool.charAt(bytes[i] % charPool.length);
  }
  return password;
}

/**
 * Generates a standard, robust, secure UUID (v4) with fallback for older browsers or non-secure contexts.
 */
export function generateUUID(): string {
  // Try using the standard secure randomUUID if supported and secure
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  
  // High-entropy standard-compliant fallback UUID (v4 format)
  const bytes = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
    window.crypto.getRandomValues(bytes);
  } else {
    // Math.random fallback for extreme cases (not cryptographically secure, but guarantees uniqueness)
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Set version to 4 (0100)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // Set variant to RFC 4122 (10xx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex: string[] = [];
  for (let i = 0; i < 16; i++) {
    hex.push(bytes[i].toString(16).padStart(2, '0'));
  }

  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

