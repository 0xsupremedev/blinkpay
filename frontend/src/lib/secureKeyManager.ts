import { Keypair } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import AuditLogger from './auditLogger';

export interface SecureKeyData {
  keypair: Keypair;
  encryptedPrivateKey: string;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  lastUsed: number;
  isBackedUp: boolean;
}

export interface KeyBackupData {
  encryptedPrivateKey: string;
  sessionId: string;
  createdAt: number;
  backupPhrase: string; // User-friendly backup phrase
}

class SecureKeyManager {
  private static instance: SecureKeyManager;
  private keys: Map<string, SecureKeyData> = new Map();
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_KEYS = 10; // Maximum number of keys to store
  private readonly BACKUP_PHRASE_LENGTH = 12;

  private constructor() {
    this.loadFromStorage();
    this.startCleanupInterval();
  }

  public static getInstance(): SecureKeyManager {
    if (!SecureKeyManager.instance) {
      SecureKeyManager.instance = new SecureKeyManager();
    }
    return SecureKeyManager.instance;
  }

  /**
   * Generate a new secure keypair with encrypted storage
   */
  public generateSecureKeypair(userId?: string): SecureKeyData {
    const keypair = Keypair.generate();
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    // Encrypt the private key
    const privateKeyArray = Array.from(keypair.secretKey);
    const privateKeyString = privateKeyArray.join(',');
    const encryptedPrivateKey = this.encrypt(privateKeyString);
    
    const keyData: SecureKeyData = {
      keypair,
      encryptedPrivateKey,
      sessionId,
      createdAt: now,
      expiresAt: now + this.SESSION_DURATION,
      lastUsed: now,
      isBackedUp: false
    };

    // Store in memory
    this.keys.set(sessionId, keyData);
    
    // Persist to secure storage
    this.saveToStorage();
    
    // Cleanup old keys
    this.cleanupOldKeys();

    // Log security event
    AuditLogger.getInstance().logEvent(
      'SESSION_CREATED',
      sessionId,
      keypair.publicKey.toBase58(),
      { userId, keyType: 'walletless' },
      'MEDIUM'
    );

    return keyData;
  }

  /**
   * Retrieve a keypair by session ID
   */
  public getKeypair(sessionId: string): Keypair | null {
    const keyData = this.keys.get(sessionId);
    
    if (!keyData) {
      return null;
    }

    // Check if session is expired
    if (Date.now() > keyData.expiresAt) {
      this.revokeKey(sessionId);
      return null;
    }

    // Update last used timestamp
    keyData.lastUsed = Date.now();
    this.saveToStorage();

    return keyData.keypair;
  }

  /**
   * Extend session expiration
   */
  public extendSession(sessionId: string, additionalTime: number = this.SESSION_DURATION): boolean {
    const keyData = this.keys.get(sessionId);
    
    if (!keyData) {
      return false;
    }

    keyData.expiresAt = Date.now() + additionalTime;
    keyData.lastUsed = Date.now();
    this.saveToStorage();
    
    // Log security event
    AuditLogger.getInstance().logEvent(
      'SESSION_EXTENDED',
      sessionId,
      keyData.keypair.publicKey.toBase58(),
      { additionalTime, newExpiration: keyData.expiresAt },
      'LOW'
    );
    
    return true;
  }

  /**
   * Revoke a key and clear all data
   */
  public revokeKey(sessionId: string): boolean {
    const keyData = this.keys.get(sessionId);
    
    if (!keyData) {
      return false;
    }

    // Log security event before revoking
    AuditLogger.getInstance().logEvent(
      'SESSION_REVOKED',
      sessionId,
      keyData.keypair.publicKey.toBase58(),
      { wasBackedUp: keyData.isBackedUp },
      'HIGH'
    );

    // Clear from memory
    this.keys.delete(sessionId);
    
    // Clear from storage
    this.saveToStorage();
    
    return true;
  }

  /**
   * Generate backup data for a key
   */
  public generateBackup(sessionId: string): KeyBackupData | null {
    const keyData = this.keys.get(sessionId);
    
    if (!keyData) {
      return null;
    }

    const backupPhrase = this.generateBackupPhrase();
    
    const backupData: KeyBackupData = {
      encryptedPrivateKey: keyData.encryptedPrivateKey,
      sessionId,
      createdAt: keyData.createdAt,
      backupPhrase
    };

    // Mark as backed up
    keyData.isBackedUp = true;
    this.saveToStorage();

    // Log security event
    AuditLogger.getInstance().logEvent(
      'BACKUP_GENERATED',
      sessionId,
      keyData.keypair.publicKey.toBase58(),
      { backupPhraseLength: backupPhrase.length },
      'HIGH'
    );

    return backupData;
  }

  /**
   * Restore key from backup
   */
  public restoreFromBackup(backupData: KeyBackupData, backupPhrase: string): boolean {
    if (backupData.backupPhrase !== backupPhrase) {
      return false;
    }

    try {
      // Decrypt the private key
      const decryptedPrivateKey = this.decrypt(backupData.encryptedPrivateKey);
      const privateKeyArray = decryptedPrivateKey.split(',').map(Number);
      const keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));

      // Create new session data
      const now = Date.now();
      const newSessionId = this.generateSessionId();
      
      const keyData: SecureKeyData = {
        keypair,
        encryptedPrivateKey: backupData.encryptedPrivateKey,
        sessionId: newSessionId,
        createdAt: backupData.createdAt,
        expiresAt: now + this.SESSION_DURATION,
        lastUsed: now,
        isBackedUp: true
      };

      this.keys.set(newSessionId, keyData);
      this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): SecureKeyData[] {
    const now = Date.now();
    return Array.from(this.keys.values()).filter(key => key.expiresAt > now);
  }

  /**
   * Get session info
   */
  public getSessionInfo(sessionId: string): Omit<SecureKeyData, 'keypair'> | null {
    const keyData = this.keys.get(sessionId);
    
    if (!keyData) {
      return null;
    }

    return {
      encryptedPrivateKey: keyData.encryptedPrivateKey,
      sessionId: keyData.sessionId,
      createdAt: keyData.createdAt,
      expiresAt: keyData.expiresAt,
      lastUsed: keyData.lastUsed,
      isBackedUp: keyData.isBackedUp
    };
  }

  /**
   * Encrypt data using AES
   */
  private encrypt(data: string): string {
    const key = this.getEncryptionKey();
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  /**
   * Decrypt data using AES
   */
  private decrypt(encryptedData: string): string {
    const key = this.getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Get or generate encryption key
   */
  private getEncryptionKey(): string {
    let key = localStorage.getItem('blinkpay_encryption_key');
    
    if (!key) {
      // Generate a new encryption key
      key = CryptoJS.lib.WordArray.random(256/8).toString();
      localStorage.setItem('blinkpay_encryption_key', key);
    }
    
    return key;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate a user-friendly backup phrase
   */
  private generateBackupPhrase(): string {
    const words = [
      'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
      'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho',
      'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
    ];
    
    const phrase = [];
    for (let i = 0; i < this.BACKUP_PHRASE_LENGTH; i++) {
      phrase.push(words[Math.floor(Math.random() * words.length)]);
    }
    
    return phrase.join('-');
  }

  /**
   * Load keys from secure storage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('blinkpay_secure_keys');
      if (stored) {
        const data = JSON.parse(stored);
        this.keys = new Map(data);
      }
    } catch (error) {
      console.error('Failed to load keys from storage:', error);
    }
  }

  /**
   * Save keys to secure storage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.keys.entries());
      localStorage.setItem('blinkpay_secure_keys', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save keys to storage:', error);
    }
  }

  /**
   * Cleanup expired and old keys
   */
  private cleanupOldKeys(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    // Find expired keys
    for (const [sessionId, keyData] of this.keys.entries()) {
      if (keyData.expiresAt <= now) {
        expiredKeys.push(sessionId);
      }
    }
    
    // Remove expired keys
    expiredKeys.forEach(sessionId => this.keys.delete(sessionId));
    
    // If we still have too many keys, remove the oldest ones
    if (this.keys.size > this.MAX_KEYS) {
      const sortedKeys = Array.from(this.keys.entries())
        .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      
      const keysToRemove = sortedKeys.slice(0, this.keys.size - this.MAX_KEYS);
      keysToRemove.forEach(([sessionId]) => this.keys.delete(sessionId));
    }
    
    this.saveToStorage();
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    // Cleanup every hour
    setInterval(() => {
      this.cleanupOldKeys();
    }, 60 * 60 * 1000);
  }
}

export default SecureKeyManager;
