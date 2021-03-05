import { Severity } from './severity';

export interface Breadcrumb {
  type?: string;
  level?: Severity;
  event_id?: string;
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  timestamp?: number;
}

export type BreadcrumbHint = Record<string, unknown>;
