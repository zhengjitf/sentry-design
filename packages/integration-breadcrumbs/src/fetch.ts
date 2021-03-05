import { Breadcrumb, BreadcrumbHint, ClientLike, IntegrationV7, Severity } from '@sentry/types';
import { addInstrumentationHandler } from '@sentry/utils';

export class FetchBreadcrumbs implements IntegrationV7 {
  public static id: string = 'FetchBreadcrumbs';
  public name: string = FetchBreadcrumbs.id;

  public install(client: ClientLike): void {
    addInstrumentationHandler({
      type: 'fetch',
      callback: (handlerData: {
        endTimestamp: number;
        error: unknown;
        args: unknown[];
        response: Response;
        fetchData: {
          url: string;
          method: string;
        };
      }) => {
        // We only capture complete, non-sentry requests
        if (
          !handlerData.endTimestamp ||
          (handlerData.fetchData.url.match(/sentry_key/) && handlerData.fetchData.method === 'POST')
        ) {
          return;
        }

        const breadcrumb: Breadcrumb = {
          category: 'fetch',
          type: 'http',
        };
        const hint: BreadcrumbHint = {
          input: handlerData.args,
        };

        if (handlerData.error) {
          breadcrumb.data = handlerData.fetchData;
          breadcrumb.level = Severity.Error;
          hint.data = handlerData.error;
        } else {
          breadcrumb.data = {
            ...handlerData.fetchData,
            status_code: handlerData.response.status,
          };
          hint.response = handlerData.response;
        }

        client.getScope()?.addBreadcrumb(breadcrumb, hint);
      },
    });
  }
}
