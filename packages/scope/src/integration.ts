import { ClientLike, IntegrationV7 } from '@sentry/types';
import { getCurrentScope } from '@sentry/minimal';

export class ScopeIntegration implements IntegrationV7 {
  /**
   * @inheritDoc
   */
  public static id: string = 'ScopeIntegration';

  /**
   * @inheritDoc
   */
  public name: string = ScopeIntegration.id;

  /**
   * @inheritDoc
   */
  public install(client: ClientLike): void {
    client.addEventProcessor(event => {
      return getCurrentScope()?.applyToEvent(event) || event;
    });
  }
}
