import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import AuditLogger, { AuditEvent } from '../lib/auditLogger';

export default function SecurityDashboard() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  useEffect(() => {
    const auditLogger = AuditLogger.getInstance();
    setEvents(auditLogger.getEvents());
    setSummary(auditLogger.getSecuritySummary());
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityEmoji = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '🔥';
      case 'HIGH': return '🚨';
      case 'MEDIUM': return '⚠️';
      case 'LOW': return 'ℹ️';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportAuditLogs = () => {
    const auditLogger = AuditLogger.getInstance();
    const logs = auditLogger.exportEvents();
    
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blinkpay-audit-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAuditLogs = () => {
    if (window.confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
      const auditLogger = AuditLogger.getInstance();
      auditLogger.clearEvents();
      setEvents([]);
      setSummary(auditLogger.getSecuritySummary());
    }
  };

  const displayedEvents = showAllEvents ? events : events.slice(0, 10);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <ShieldCheckIcon className="w-5 h-5" />
          <span>Security Dashboard</span>
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={exportAuditLogs}
            className="bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={clearAuditLogs}
            className="bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Security Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{summary.totalEvents}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{summary.criticalEvents}</div>
            <div className="text-sm text-red-600">Critical Events</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{summary.highSeverityEvents}</div>
            <div className="text-sm text-orange-600">High Severity</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{summary.recentSessions}</div>
            <div className="text-sm text-green-600">Recent Sessions</div>
          </div>
        </div>
      )}

      {/* Security Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <h4 className="font-medium text-gray-900">Security Status</h4>
          {summary?.criticalEvents > 0 ? (
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          ) : (
            <ShieldCheckIcon className="w-5 h-5 text-green-500" />
          )}
        </div>
        <div className={`p-3 rounded-lg ${
          summary?.criticalEvents > 0 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-green-50 border border-green-200'
        }`}>
          <p className={`text-sm ${
            summary?.criticalEvents > 0 ? 'text-red-800' : 'text-green-800'
          }`}>
            {summary?.criticalEvents > 0 
              ? `⚠️ ${summary.criticalEvents} critical security events detected. Review immediately.`
              : '✅ Security status normal. No critical events detected.'
            }
          </p>
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Recent Security Events</h4>
          {events.length > 10 && (
            <button
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <EyeIcon className="w-4 h-4" />
              <span>{showAllEvents ? 'Show Less' : 'Show All'}</span>
            </button>
          )}
        </div>

        {displayedEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No security events recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedEvents.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getSeverityEmoji(event.severity)}</span>
                      <span className="font-medium text-gray-900">{event.eventType}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                        {event.severity}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {event.sessionId && (
                        <div>Session: {event.sessionId.slice(0, 8)}...</div>
                      )}
                      {event.publicKey && (
                        <div>Public Key: {event.publicKey.slice(0, 8)}...{event.publicKey.slice(-8)}</div>
                      )}
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatTimestamp(event.timestamp)}</span>
                      </div>
                    </div>
                    {Object.keys(event.details).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <details>
                          <summary className="cursor-pointer hover:text-gray-700">View Details</summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
