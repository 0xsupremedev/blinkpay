import { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { useSecureSession, SessionInfo } from '../hooks/useSecureSession';
import SecureBackup from './SecureBackup';

export default function SessionManager() {
  const {
    isConnected,
    sessionInfo,
    extendSession,
    revokeSession,
    generateBackup,
    getActiveSessions
  } = useSecureSession();

  const [showBackup, setShowBackup] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (sessionInfo) {
      setTimeRemaining(sessionInfo.timeRemaining);
      
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sessionInfo]);

  useEffect(() => {
    setActiveSessions(getActiveSessions());
  }, [getActiveSessions]);

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleExtendSession = () => {
    const success = extendSession();
    if (success) {
      setTimeRemaining(24 * 60 * 60 * 1000); // 24 hours
    }
  };

  const handleGenerateBackup = () => {
    const backup = generateBackup();
    if (backup) {
      setBackupData(backup);
      setShowBackup(true);
    }
  };

  const handleRevokeSession = () => {
    if (window.confirm('Are you sure you want to revoke this session? This action cannot be undone.')) {
      revokeSession();
    }
  };

  if (!isConnected || !sessionInfo) {
    return null;
  }

  const isExpiringSoon = timeRemaining < 60 * 60 * 1000; // Less than 1 hour
  const isExpired = timeRemaining <= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Session Management</h3>
        <div className="flex items-center space-x-2">
          {isExpired ? (
            <XCircleIcon className="w-5 h-5 text-red-500" />
          ) : isExpiringSoon ? (
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
          ) : (
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Session Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Session Status</span>
          <span className={`text-sm font-medium ${
            isExpired ? 'text-red-600' : 
            isExpiringSoon ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
          </span>
        </div>

        {/* Time Remaining */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Time Remaining</span>
          <span className={`text-sm font-mono ${
            isExpired ? 'text-red-600' : 
            isExpiringSoon ? 'text-yellow-600' : 
            'text-gray-900'
          }`}>
            {isExpired ? 'Expired' : formatTime(timeRemaining)}
          </span>
        </div>

        {/* Public Key */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Public Key</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono text-gray-900">
              {sessionInfo.publicKey.slice(0, 8)}...{sessionInfo.publicKey.slice(-8)}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(sessionInfo.publicKey)}
              className="text-gray-400 hover:text-gray-600"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Backup Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Backup Status</span>
          <span className={`text-sm font-medium ${
            sessionInfo.isBackedUp ? 'text-green-600' : 'text-red-600'
          }`}>
            {sessionInfo.isBackedUp ? 'Backed Up' : 'Not Backed Up'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          {!isExpired && (
            <button
              onClick={handleExtendSession}
              className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Extend Session</span>
            </button>
          )}
          
          {!sessionInfo.isBackedUp && (
            <button
              onClick={handleGenerateBackup}
              className="flex-1 bg-green-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Generate Backup
            </button>
          )}
          
          <button
            onClick={handleRevokeSession}
            className="flex-1 bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Revoke</span>
          </button>
        </div>

        {/* Security Warning */}
        {!sessionInfo.isBackedUp && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Security Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This is a demo-grade session. Generate a backup to secure your wallet for production use.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backup Modal */}
      {showBackup && (
        <SecureBackup
          backupData={backupData}
          onClose={() => setShowBackup(false)}
          onBackupGenerated={() => setShowBackup(false)}
        />
      )}
    </div>
  );
}
