import { useState, useEffect, useCallback } from 'react';
import { Keypair } from '@solana/web3.js';
import SecureKeyManager, { SecureKeyData, KeyBackupData } from '../lib/secureKeyManager';

export interface SessionInfo {
  sessionId: string;
  publicKey: string;
  createdAt: number;
  expiresAt: number;
  lastUsed: number;
  isBackedUp: boolean;
  timeRemaining: number;
}

export interface UseSecureSessionReturn {
  // Session state
  isConnected: boolean;
  sessionInfo: SessionInfo | null;
  keypair: Keypair | null;
  
  // Session management
  createSession: () => Promise<SessionInfo>;
  extendSession: (additionalTime?: number) => boolean;
  revokeSession: () => boolean;
  
  // Backup management
  generateBackup: () => KeyBackupData | null;
  restoreFromBackup: (backupData: KeyBackupData, backupPhrase: string) => boolean;
  
  // Session info
  getActiveSessions: () => SessionInfo[];
  refreshSessionInfo: () => void;
}

export function useSecureSession(): UseSecureSessionReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  
  const keyManager = SecureKeyManager.getInstance();

  // Load session on mount
  useEffect(() => {
    loadCurrentSession();
  }, []);

  // Update session info every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionInfo) {
        updateSessionInfo();
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [sessionInfo]);

  const loadCurrentSession = useCallback(() => {
    // Try to get the most recent active session
    const activeSessions = keyManager.getActiveSessions();
    
    if (activeSessions.length > 0) {
      // Get the most recently used session
      const latestSession = activeSessions.reduce((latest, current) => 
        current.lastUsed > latest.lastUsed ? current : latest
      );
      
      const keypair = keyManager.getKeypair(latestSession.sessionId);
      
      if (keypair) {
        setKeypair(keypair);
        setIsConnected(true);
        setSessionInfo(createSessionInfo(latestSession));
      }
    }
  }, [keyManager]);

  const createSessionInfo = useCallback((keyData: SecureKeyData): SessionInfo => {
    const now = Date.now();
    return {
      sessionId: keyData.sessionId,
      publicKey: keyData.keypair.publicKey.toBase58(),
      createdAt: keyData.createdAt,
      expiresAt: keyData.expiresAt,
      lastUsed: keyData.lastUsed,
      isBackedUp: keyData.isBackedUp,
      timeRemaining: Math.max(0, keyData.expiresAt - now)
    };
  }, []);

  const updateSessionInfo = useCallback(() => {
    if (sessionInfo) {
      const keyData = keyManager.getSessionInfo(sessionInfo.sessionId);
      
      if (keyData) {
        setSessionInfo(createSessionInfo({
          ...keyData,
          keypair: keypair!
        }));
      } else {
        // Session expired or revoked
        setIsConnected(false);
        setSessionInfo(null);
        setKeypair(null);
      }
    }
  }, [sessionInfo, keypair, keyManager, createSessionInfo]);

  const createSession = useCallback(async (): Promise<SessionInfo> => {
    const keyData = keyManager.generateSecureKeypair();
    const newSessionInfo = createSessionInfo(keyData);
    
    setKeypair(keyData.keypair);
    setIsConnected(true);
    setSessionInfo(newSessionInfo);
    
    return newSessionInfo;
  }, [keyManager, createSessionInfo]);

  const extendSession = useCallback((additionalTime?: number): boolean => {
    if (!sessionInfo) return false;
    
    const success = keyManager.extendSession(sessionInfo.sessionId, additionalTime);
    
    if (success) {
      updateSessionInfo();
    }
    
    return success;
  }, [sessionInfo, keyManager, updateSessionInfo]);

  const revokeSession = useCallback((): boolean => {
    if (!sessionInfo) return false;
    
    const success = keyManager.revokeKey(sessionInfo.sessionId);
    
    if (success) {
      setIsConnected(false);
      setSessionInfo(null);
      setKeypair(null);
    }
    
    return success;
  }, [sessionInfo, keyManager]);

  const generateBackup = useCallback((): KeyBackupData | null => {
    if (!sessionInfo) return null;
    
    const backup = keyManager.generateBackup(sessionInfo.sessionId);
    
    if (backup) {
      updateSessionInfo();
    }
    
    return backup;
  }, [sessionInfo, keyManager, updateSessionInfo]);

  const restoreFromBackup = useCallback((backupData: KeyBackupData, backupPhrase: string): boolean => {
    const success = keyManager.restoreFromBackup(backupData, backupPhrase);
    
    if (success) {
      loadCurrentSession();
    }
    
    return success;
  }, [keyManager, loadCurrentSession]);

  const getActiveSessions = useCallback((): SessionInfo[] => {
    const activeSessions = keyManager.getActiveSessions();
    return activeSessions.map(createSessionInfo);
  }, [keyManager, createSessionInfo]);

  const refreshSessionInfo = useCallback(() => {
    updateSessionInfo();
  }, [updateSessionInfo]);

  return {
    isConnected,
    sessionInfo,
    keypair,
    createSession,
    extendSession,
    revokeSession,
    generateBackup,
    restoreFromBackup,
    getActiveSessions,
    refreshSessionInfo
  };
}
