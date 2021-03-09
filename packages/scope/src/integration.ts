import { ClientLike, IntegrationV7 } from '@sentry/types';
import { getCurrentScope } from '@sentry/minimal';

export class ScopeIntegration implements IntegrationV7 {
  public name = this.constructor.name;

  /**
   * @inheritDoc
   */
  public install(client: ClientLike): void {
    client.addEventProcessor(event => {
      return getCurrentScope()?.applyToEvent(event) || event;
    });
  }
}
