// AES-256-GCM helpers pour chiffrer les secrets stockés en base.
//
// Utilisé pour les credentials Twilio BYO (auth_token) avant insertion dans
// la table `sms_senders`. La clé maîtresse vit côté serveur uniquement
// (env var `SENDER_SECRETS_ENCRYPTION_KEY`, 32 bytes base64).
//
// Format de sortie : `iv:authTag:ciphertext` (les 3 segments en base64).
// → on stocke 1 seul champ TEXT en DB, le déchiffrement reparse les 3 parties.
//
// Génération de la clé :
//   openssl rand -base64 32
//
// AES-256-GCM = AEAD : confidentialité + intégrité (le authTag détecte toute
// altération du ciphertext). On ne fait PAS de rotation automatique ici —
// si la clé change, il faut une migration explicite (re-encrypt all rows).

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { cleanEnv } from './envClean';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard : 96 bits
const KEY_LENGTH = 32; // 256 bits

function getKey(keyB64) {
  const raw = keyB64 ?? cleanEnv(process.env.SENDER_SECRETS_ENCRYPTION_KEY);
  if (!raw) {
    throw new Error(
      'SENDER_SECRETS_ENCRYPTION_KEY env var required (run: openssl rand -base64 32)'
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `SENDER_SECRETS_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes (got ${key.length}). Regenerate with: openssl rand -base64 32`
    );
  }
  return key;
}

/**
 * Chiffre un secret en AES-256-GCM.
 * @param {string} plaintext - le secret en clair (UTF-8)
 * @param {string} [keyB64] - clé base64 32-bytes ; par défaut depuis env
 * @returns {string} `iv:authTag:ciphertext` (chaque partie en base64)
 */
export function encryptSecret(plaintext, keyB64) {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('encryptSecret: plaintext must be a non-empty string');
  }
  const key = getKey(keyB64);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}

/**
 * Déchiffre un secret précédemment chiffré par `encryptSecret`.
 * @param {string} encrypted - `iv:authTag:ciphertext`
 * @param {string} [keyB64]
 * @returns {string} le plaintext
 */
export function decryptSecret(encrypted, keyB64) {
  if (typeof encrypted !== 'string' || !encrypted.includes(':')) {
    throw new Error('decryptSecret: invalid encrypted format');
  }
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('decryptSecret: expected iv:authTag:ciphertext');
  }
  const [ivB64, tagB64, ctB64] = parts;
  const key = getKey(keyB64);
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ctB64, 'base64');
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
