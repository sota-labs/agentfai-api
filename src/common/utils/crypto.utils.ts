import * as crypto from 'crypto';
import appConfig from 'config/app.config';

const algorithm = 'aes-256-ecb'; // Encryption algorithm
const key = appConfig().crypto.secretKey;

export class CryptoUtils {
  static encrypt(text: string): string {
    const cipher = crypto.createCipheriv(algorithm, key, null);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  static decrypt(encryptedData: string): string {
    const decipher = crypto.createDecipheriv(algorithm, key, null);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
