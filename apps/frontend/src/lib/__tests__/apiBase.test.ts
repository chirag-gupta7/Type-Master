describe('getApiBaseUrl', () => {
  const DEFAULT_URL = 'https://typemaster-backend-pfns.onrender.com';
  const ORIGINAL = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = ORIGINAL;
    jest.resetModules();
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const load = () => require('../apiBase') as typeof import('../apiBase');

  it('returns the env URL when set', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    expect(load().getApiBaseUrl()).toBe('https://api.example.com');
  });

  it('trims surrounding whitespace', () => {
    process.env.NEXT_PUBLIC_API_URL = '  https://api.example.com/  ';
    expect(load().getApiBaseUrl()).toBe('https://api.example.com/');
  });

  it('falls back to default when env is unset', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(load().getApiBaseUrl()).toBe(DEFAULT_URL);
  });

  it('falls back to default when env is empty or whitespace-only', () => {
    process.env.NEXT_PUBLIC_API_URL = '';
    expect(load().getApiBaseUrl()).toBe(DEFAULT_URL);
    process.env.NEXT_PUBLIC_API_URL = '   ';
    expect(load().getApiBaseUrl()).toBe(DEFAULT_URL);
  });

  it('exposes API_VERSION v1', () => {
    expect(load().API_VERSION).toBe('v1');
  });
});
