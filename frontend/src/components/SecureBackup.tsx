import { useState } from 'react';
import { 
  DocumentDuplicateIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { KeyBackupData } from '../lib/secureKeyManager';

interface SecureBackupProps {
  backupData: KeyBackupData | null;
  onClose: () => void;
  onBackupGenerated: () => void;
}

export default function SecureBackup({ backupData, onClose, onBackupGenerated }: SecureBackupProps) {
  const [showBackupPhrase, setShowBackupPhrase] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'warning' | 'backup' | 'success'>('warning');

  const handleCopy = async () => {
    if (backupData) {
      await navigator.clipboard.writeText(backupData.backupPhrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (backupData) {
      const backupFile = {
        sessionId: backupData.sessionId,
        encryptedPrivateKey: backupData.encryptedPrivateKey,
        createdAt: backupData.createdAt,
        backupPhrase: backupData.backupPhrase,
        version: '1.0',
        platform: 'BlinkPay'
      };

      const blob = new Blob([JSON.stringify(backupFile, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blinkpay-backup-${backupData.sessionId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleConfirmBackup = () => {
    setStep('backup');
    onBackupGenerated();
  };

  if (step === 'warning') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-6">
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Security Warning
          </h3>
          
          <div className="space-y-4 text-gray-600">
            <p className="text-center">
              This is a <strong>demo-grade</strong> walletless session. For production use, you need to implement:
            </p>
            
            <ul className="space-y-2 text-sm">
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Secure key custody and encryption</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Proper session management with expiration</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Secure backup and recovery system</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Audit logging for security events</span>
              </li>
            </ul>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800">
                ⚠️ Always backup your secret key if you plan to use this wallet for real transactions.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
            >
              I Understand
            </button>
            <button
              onClick={handleConfirmBackup}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Generate Backup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'backup' && backupData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-6">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Backup Generated
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Backup Phrase
              </label>
              <div className="relative">
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 font-mono text-sm">
                  {showBackupPhrase ? backupData.backupPhrase : '•'.repeat(backupData.backupPhrase.length)}
                </div>
                <button
                  onClick={() => setShowBackupPhrase(!showBackupPhrase)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showBackupPhrase ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Important:</strong> Store this backup phrase securely. Anyone with access to this phrase can restore your wallet and access your funds.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCopy}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
                <span>{copied ? 'Copied!' : 'Copy Phrase'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Download Backup
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={() => setStep('success')}
              className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-green-700 transition-colors"
            >
              I've Saved My Backup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-6">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Backup Complete
          </h3>
          
          <p className="text-gray-600 mb-8">
            Your wallet has been securely backed up. You can now use your wallet with confidence.
          </p>
          
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-green-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return null;
}
