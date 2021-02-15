import { User } from './user';

/**
 * @inheritdoc
 */
export interface Session extends SessionContext {
  update(context?: SessionContext): void;

  close(status?: SessionStatus): void;

  toJSON(): {
    init: boolean;
    sid: string;
    did?: string;
    timestamp: string;
    started: string;
    duration: number;
    status: SessionStatus;
    errors: number;
    attrs?: {
      release?: string;
      environment?: string;
      user_agent?: string;
      ip_address?: string;
    };
  };
}

/**
 * Session Context
 */
export interface SessionContext {
  sid?: string;
  did?: string;
  init?: boolean;
  timestamp?: number;
  started?: number;
  duration?: number;
  status?: SessionStatus;
  release?: string;
  environment?: string;
  userAgent?: string;
  ipAddress?: string;
  errors?: number;
  user?: User | null;
}

/**
 * Session Status
 */
export enum SessionStatus {
  Ok = 'ok',
  Exited = 'exited',
  Crashed = 'crashed',
  Abnormal = 'abnormal',
}
