import { ClientLike } from './client';

/** Integration interface */
export interface IntegrationV7 {
  name: string;
  install(client: ClientLike): void;
}
