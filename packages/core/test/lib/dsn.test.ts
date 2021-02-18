import { Dsn, getReportDialogEndpoint } from '../../src/dsn';

describe('Dsn', () => {
  describe('parsing', () => {
    test('should parse public dsn', () => {
      const dsn = new Dsn('https://abc@sentry.io/123');
      expect(dsn.protocol).toEqual('https');
      expect(dsn.publicKey).toEqual('abc');
      expect(dsn.host).toEqual('sentry.io');
      expect(dsn.port).toEqual(undefined);
      expect(dsn.path).toEqual(undefined);
      expect(dsn.projectId).toEqual('123');
    });

    test('should parse ingest dsn', () => {
      const dsn = new Dsn('https://abc@xxx.ingest.sentry.io/123');
      expect(dsn.protocol).toEqual('https');
      expect(dsn.publicKey).toEqual('abc');
      expect(dsn.host).toEqual('xxx.ingest.sentry.io');
      expect(dsn.port).toEqual(undefined);
      expect(dsn.path).toEqual(undefined);
      expect(dsn.projectId).toEqual('123');
    });

    test('should parse legacy dsn', () => {
      const dsn = new Dsn('https://abc:xyz@sentry.io/123');
      expect(dsn.protocol).toEqual('https');
      expect(dsn.publicKey).toEqual('abc');
      expect(dsn.host).toEqual('sentry.io');
      expect(dsn.port).toEqual(undefined);
      expect(dsn.path).toEqual(undefined);
      expect(dsn.projectId).toEqual('123');
    });

    test('should parse a dsn with port and path', () => {
      const dsn = new Dsn('https://abc@sentry.io:1234/custom/subpath/123');
      expect(dsn.protocol).toEqual('https');
      expect(dsn.publicKey).toEqual('abc');
      expect(dsn.host).toEqual('sentry.io');
      expect(dsn.port).toEqual('1234');
      expect(dsn.path).toEqual('custom/subpath');
      expect(dsn.projectId).toEqual('123');
    });

    test('should parse a dsn with query string and fragment and ignore them', () => {
      const dsn = new Dsn('https://abc@sentry.io/123?sample.rate=0.1&other=value#wat');
      expect(dsn.protocol).toEqual('https');
      expect(dsn.publicKey).toEqual('abc');
      expect(dsn.host).toEqual('sentry.io');
      expect(dsn.port).toEqual(undefined);
      expect(dsn.path).toEqual(undefined);
      expect(dsn.projectId).toEqual('123');
    });

    test('should throw with invalid dsn', () => {
      // missing protocol
      expect(() => new Dsn('://abc@sentry.io/123')).toThrow('Invalid DSN');
      // missing host
      expect(() => new Dsn('https://abc@123')).toThrow('Invalid DSN');
      // missing publicKey
      expect(() => new Dsn('https://@sentry.io/123')).toThrow('Invalid DSN');
      // missing projectId
      expect(() => new Dsn('https://abc@sentry.io/')).toThrow('Invalid DSN');
      // incorrect port
      expect(() => new Dsn('http://abc@sentry.io:xxx/123')).toThrow('Invalid DSN');
      // incorrect protocol
      expect(() => new Dsn('httpx://abc@sentry.io/123')).toThrow('Invalid DSN protocol: httpx');
      // incorrect projectId
      expect(() => new Dsn('http://abc@sentry.io/abc')).toThrow('Invalid DSN projectId: abc');
    });
  });

  describe('toString()', () => {
    test('should render public dsn', () => {
      const dsn = new Dsn('https://abc@sentry.io/123');
      expect(dsn.toString()).toEqual('https://abc@sentry.io/123');
    });

    test('should render ingest dsn', () => {
      const dsn = new Dsn('https://abc@xxx.ingest.sentry.io/123');
      expect(dsn.toString()).toEqual('https://abc@xxx.ingest.sentry.io/123');
    });

    test('should render port and path, and ignore password', () => {
      const dsn = new Dsn('https://abc:xyz@sentry.io:1234/custom/subpath/321');
      expect(dsn.toString()).toEqual('https://abc@sentry.io:1234/custom/subpath/321');
    });

    test('should be able to recreate the same dsn from returned string', () => {
      const dsn = new Dsn('https://abc:xyz@sentry.io:1234/custom/subpath/321');
      const recreatedDsn = new Dsn(dsn.toString());
      expect(dsn.toString()).toEqual(recreatedDsn.toString());
    });
  });

  describe('getApiEndpoint()', () => {
    test('should render protocol, host, port and path, followed by `/api` suffix', () => {
      const dsn = new Dsn('https://abc@xxx.ingest.sentry.io:1234/custom/subpath/123');
      expect(dsn.getApiEndpoint()).toEqual('https://xxx.ingest.sentry.io:1234/custom/subpath/api');
    });
  });

  describe('toEnvelopeEndpoint()', () => {
    test('should render getApiEndpoint() followed by projectId, literal `/envelope/` and encoded url params', () => {
      const dsn = new Dsn('https://abc@xxx.ingest.sentry.io:1234/custom/subpath/123');
      expect(dsn.getEnvelopeEndpoint()).toEqual(
        'https://xxx.ingest.sentry.io:1234/custom/subpath/api/123/envelope/?sentry_key=abc&sentry_version=7',
      );
    });
  });
});

describe('getReportDialogEndpoint', () => {
  test('should render `/embed/error-page` url with provided dsn', () => {
    expect(getReportDialogEndpoint(new Dsn('https://abc@xxx.ingest.sentry.io:1234/custom/subpath/123'), {})).toEqual(
      'https://xxx.ingest.sentry.io:1234/custom/subpath/api/embed/error-page/?dsn=https://abc@xxx.ingest.sentry.io:1234/custom/subpath/123',
    );
  });

  test('should render `/embed/error-page` url with overridden dsn', () => {
    expect(
      getReportDialogEndpoint(new Dsn('https://abc@xxx.ingest.sentry.io:1234/custom/subpath/123'), {
        dsn: 'https://cba@xxx.ingest.sentry.io/321',
      }),
    ).toEqual(
      'https://xxx.ingest.sentry.io:1234/custom/subpath/api/embed/error-page/?dsn=https://cba@xxx.ingest.sentry.io/321',
    );
  });

  test('should render passed options as query string', () => {
    expect(
      getReportDialogEndpoint(new Dsn('https://abc@xxx.ingest.sentry.io:1234/custom/subpath/123'), {
        user: {
          email: 'pickle.rick@example.com',
          name: 'Rick',
        },
        title: "I'm a pickle Morty!",
      }),
    ).toEqual(
      "https://xxx.ingest.sentry.io:1234/custom/subpath/api/embed/error-page/?dsn=https://abc@xxx.ingest.sentry.io:1234/custom/subpath/123&name=Rick&email=pickle.rick%40example.com&title=I'm%20a%20pickle%20Morty!",
    );
  });
});
