export interface Mechanism {
  [key: string]: unknown;
  type?: string;
  handled?: boolean;
  synthetic?: boolean;
  data?: Record<string, unknown>;
}
