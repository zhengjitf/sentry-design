import { ClientLike } from './client';
import { ScopeLike } from './scope';

export interface CarrierV7 {
  client?: ClientLike;
  scope?: ScopeLike;
}
