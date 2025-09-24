export interface AuditEvent {
  id: string;
  timestamp: number;
  eventType: 'SESSION_CREATED' | 'SESSION_EXTENDED' | 'SESSION_REVOKED' | 'BACKUP_GENERATED' | 'BACKUP_RESTORED' | 'KEY_ACCESSED' | 'SECURITY_WARNING';
  sessionId?: string;
  publicKey?: string;
  details: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userAgent: string;
  ipAddress?: string;
}

class AuditLogger {
  private static instance: AuditLogger;
  private events: AuditEvent[] = [];
  private readonly MAX_EVENTS = 1000; // Keep last 1000 events
  private readonly STORAGE_KEY = 'blinkpay_audit_logs';

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log a security event
   */
  public logEvent(
    eventType: AuditEvent['eventType'],
    sessionId?: string,
    publicKey?: string,
    details: Record<string, any> = {},
    severity: AuditEvent['severity'] = 'LOW'
  ): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventType,
      sessionId,
      publicKey,
      details,
      severity,
      userAgent: navigator.userAgent,
      ipAddress: this.getClientIP()
    };

    this.events.unshift(event); // Add to beginning of array
    
    // Keep only the most recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS);
    }

    this.saveToStorage();
    this.logToConsole(event);
  }

  /**
   * Get all audit events
   */
  public getEvents(): AuditEvent[] {
    return [...this.events];
  }

  /**
   * Get events by session ID
   */
  public getEventsBySession(sessionId: string): AuditEvent[] {
    return this.events.filter(event => event.sessionId === sessionId);
  }

  /**
   * Get events by severity
   */
  public getEventsBySeverity(severity: AuditEvent['severity']): AuditEvent[] {
    return this.events.filter(event => event.severity === severity);
  }

  /**
   * Get events within time range
   */
  public getEventsInRange(startTime: number, endTime: number): AuditEvent[] {
    return this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Clear all audit events
   */
  public clearEvents(): void {
    this.events = [];
    this.saveToStorage();
  }

  /**
   * Export audit events as JSON
   */
  public exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Get security summary
   */
  public getSecuritySummary(): {
    totalEvents: number;
    criticalEvents: number;
    highSeverityEvents: number;
    recentSessions: number;
    lastActivity: number;
  } {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(event => event.timestamp > last24Hours);
    const criticalEvents = this.events.filter(event => event.severity === 'CRITICAL').length;
    const highSeverityEvents = this.events.filter(event => event.severity === 'HIGH').length;
    
    const uniqueSessions = new Set(
      recentEvents
        .filter(event => event.sessionId)
        .map(event => event.sessionId)
    ).size;

    return {
      totalEvents: this.events.length,
      criticalEvents,
      highSeverityEvents,
      recentSessions: uniqueSessions,
      lastActivity: this.events[0]?.timestamp || 0
    };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get client IP (simplified - in production, get from server)
   */
  private getClientIP(): string {
    // In a real implementation, this would be provided by the server
    return 'client_ip_placeholder';
  }

  /**
   * Log event to console for development
   */
  private logToConsole(event: AuditEvent): void {
    const emoji = this.getSeverityEmoji(event.severity);
    console.log(
      `${emoji} [AUDIT] ${event.eventType} - ${event.severity}`,
      {
        sessionId: event.sessionId,
        publicKey: event.publicKey,
        details: event.details,
        timestamp: new Date(event.timestamp).toISOString()
      }
    );
  }

  /**
   * Get emoji for severity level
   */
  private getSeverityEmoji(severity: AuditEvent['severity']): string {
    switch (severity) {
      case 'LOW': return 'ℹ️';
      case 'MEDIUM': return '⚠️';
      case 'HIGH': return '🚨';
      case 'CRITICAL': return '🔥';
      default: return '📝';
    }
  }

  /**
   * Load events from storage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load audit events from storage:', error);
    }
  }

  /**
   * Save events to storage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save audit events to storage:', error);
    }
  }
}

export default AuditLogger;
