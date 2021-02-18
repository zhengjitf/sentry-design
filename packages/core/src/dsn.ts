const DSN_REGEX = /^(?:(\w+):)\/\/(?:(\w+)(?::\w+)?@)([\w.-]+)(?::(\d+))?\/(.+)/;
const INVALID_DSN = `Invalid DSN`;

export type ReportDialogOptions = {
  eventId?: string;
  dsn?: string;
  user?: {
    email?: string;
    name?: string;
  };
  lang?: string;
  title?: string;
  subtitle?: string;
  subtitle2?: string;
  labelName?: string;
  labelEmail?: string;
  labelComments?: string;
  labelClose?: string;
  labelSubmit?: string;
  errorGeneric?: string;
  errorFormEntry?: string;
  successMessage?: string;
};

function encodeUrlParams(values: Record<string, string>): string {
  return Object.keys(values)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(values[key])}`)
    .join('&');
}

export function getReportDialogEndpoint(dsn: Dsn, dialogOptions: ReportDialogOptions = {}): string {
  const dsnUrl = dialogOptions.dsn || dsn.toString();
  const dialogParams: Record<string, string> = {};

  Object.keys(dialogOptions).forEach(key => {
    if (key === 'dsn') {
      return;
    }

    if (key === 'user') {
      if (dialogOptions.user?.name) {
        dialogParams.name = dialogOptions.user?.name;
      }
      if (dialogOptions.user?.email) {
        dialogParams.email = dialogOptions.user?.email;
      }
      return;
    }

    const value = dialogOptions[key as keyof Omit<ReportDialogOptions, 'user'>];
    if (value) {
      dialogParams[key] = value;
    }
  });

  const encodedParams = encodeUrlParams(dialogParams);
  const optionsQueryString = encodedParams ? `&${encodedParams}` : '';

  return `${dsn.getApiEndpoint()}/embed/error-page/?dsn=${dsnUrl}${optionsQueryString}`;
}

export class Dsn {
  public protocol: 'http' | 'https';
  public publicKey: string;
  public host: string;
  public port?: string;
  public path?: string;
  public projectId: string;

  public constructor(url: string) {
    const dsnMatch = DSN_REGEX.exec(url);

    if (!dsnMatch) {
      // TODO: Use SentryError
      throw new Error(INVALID_DSN);
    }

    const [protocol, publicKey, host, port, projetIdWithOptionalPath] = dsnMatch.slice(1);

    let path;
    let projectId;

    // Extract path from the projectId, eg. `/foo/bar/123` => `foo/bar` + `123`
    const pathParts = projetIdWithOptionalPath.split('/');
    if (pathParts.length > 1) {
      projectId = pathParts.pop() as string;
      path = pathParts.join('/');
    } else {
      projectId = projetIdWithOptionalPath;
    }

    // Trim query string and fragment from projectId, eg. `123?foo=bar#baz` => `123`
    const projectMatch = projectId.match(/^\d+/);
    if (projectMatch) {
      projectId = projectMatch[0];
    }

    if (protocol !== 'http' && protocol !== 'https') {
      // TODO: Use SentryError
      throw new Error(`${INVALID_DSN} protocol: ${protocol}`);
    }

    if (!projectId.match(/^\d+$/)) {
      // TODO: Use SentryError
      throw new Error(`${INVALID_DSN} projectId: ${projectId}`);
    }

    this.protocol = protocol;
    this.publicKey = publicKey;
    this.host = host;
    this.port = port;
    this.path = path;
    this.projectId = projectId;
  }

  public toString(): string {
    const { host, projectId, protocol, publicKey } = this;
    const port = this.port ? `:${this.port}` : '';
    const path = this.path ? `/${this.path}` : '';
    return `${protocol}://${publicKey}@${host}${port}${path}/${projectId}`;
  }

  public getApiEndpoint(): string {
    const { host, protocol } = this;
    const port = this.port ? `:${this.port}` : '';
    const path = this.path ? `/${this.path}` : '';
    return `${protocol}://${host}${port}${path}/api`;
  }

  public getEnvelopeEndpoint(): string {
    // We send only the minimum set of required information.
    // See https://github.com/getsentry/sentry-javascript/issues/2572
    const auth = {
      sentry_key: this.publicKey,
      sentry_version: '7',
    };
    return `${this.getApiEndpoint()}/${this.projectId}/envelope/?${encodeUrlParams(auth)}`;
  }
}
