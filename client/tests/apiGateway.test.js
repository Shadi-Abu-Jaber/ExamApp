import { describe, it, expect, vi, afterEach } from 'vitest';
import { ApiGateway } from '../src/api/ApiGateway.js';

// Fake Config exposing just what ApiGateway reads.
const config = (dataMode) => ({
  get: (k) => ({ dataMode, serverBaseUrl: 'http://api.test', mockLatencyMs: 0 }[k]),
});

afterEach(() => vi.unstubAllGlobals());

describe('ApiGateway — mock mode', () => {
  it('login returns { user, token: null } and strips the password', async () => {
    const mockDb = {
      findOne: () => ({ id: 'u1', email: 't@x.com', password: 'p', role: 'teacher', name: 'T' }),
    };
    const gateway = new ApiGateway({ config: config('mock'), mockDb });

    const { user, token } = await gateway.login('t@x.com', 'p');
    expect(token).toBeNull();
    expect(user).not.toHaveProperty('password');
    expect(user.role).toBe('teacher');
  });
});

describe('ApiGateway — http mode', () => {
  it('attaches the Bearer token to requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);

    const gateway = new ApiGateway({ config: config('http') });
    gateway.setToken('jwt123');
    await gateway.listAllExams();

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/exams');
    expect(opts.headers.Authorization).toBe('Bearer jwt123');
  });
});
