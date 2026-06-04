import { EncryptedPayload } from './types';

// Helper: Convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper: Convert String to UTF-8 Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  const arr: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) {
      arr.push(charcode);
    } else if (charcode < 0x800) {
      arr.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      arr.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      arr.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return new Uint8Array(arr);
}

// Helper: Convert Uint8Array/ArrayBuffer to String
function uint8ArrayToString(array: ArrayBuffer | Uint8Array): string {
  const bytes = array instanceof Uint8Array ? array : new Uint8Array(array);
  let out = '';
  let i = 0;
  const len = bytes.length;
  while (i < len) {
    const c = bytes[i++];
    if (c < 128) {
      out += String.fromCharCode(c);
    } else if (c > 191 && c < 224) {
      const c2 = bytes[i++];
      out += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
    } else if (c > 223 && c < 240) {
      const c2 = bytes[i++];
      const c3 = bytes[i++];
      out += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
    } else {
      const c2 = bytes[i++];
      const c3 = bytes[i++];
      const c4 = bytes[i++];
      const u = (((c & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) - 0x10000;
      out += String.fromCharCode(0xd800 + (u >> 10), 0xdc00 + (u & 1023));
    }
  }
  return out;
}

/**
 * Derives a CryptoKey from a master password using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordBuffer = stringToUint8Array(password);

  // Import the raw password as a key-generating key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive a 256-bit AES-GCM key
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using a master password.
 */
export async function encryptData(plaintext: string, password: string): Promise<EncryptedPayload> {
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // AES-GCM standard IV size is 12 bytes

    const key = await deriveKey(password, salt);
    const encodedPlaintext = stringToUint8Array(plaintext);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedPlaintext
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertextBuffer),
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv)
    };
  } catch (e) {
    console.error('Encryption failed:', e);
    throw new Error('Encryption failed. Please check your data.');
  }
}

/**
 * Decrypts a base64 payload using a master password.
 */
export async function decryptData(encryptedPayload: EncryptedPayload, password: string): Promise<string> {
  try {
    const ciphertext = base64ToArrayBuffer(encryptedPayload.ciphertext);
    const salt = new Uint8Array(base64ToArrayBuffer(encryptedPayload.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(encryptedPayload.iv));

    const key = await deriveKey(password, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );

    return uint8ArrayToString(decryptedBuffer);
  } catch (e) {
    console.error('Decryption failed:', e);
    throw new Error('Decryption failed. Invalid master password or corrupted data.');
  }
}
export { arrayBufferToBase64, base64ToArrayBuffer };
