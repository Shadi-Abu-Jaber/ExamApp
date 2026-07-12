import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../src/auth/tokens.js';

describe('JWT tokens', () => {
  const user = { id: 'u1', role: 'teacher', name: 'Teacher', email: 't@example.com' };

  it('signs and verifies a token round-trip', () => {
    const payload = verifyToken(signToken(user));
    expect(payload.sub).toBe('u1');
    expect(payload.role).toBe('teacher');
    expect(payload.email).toBe('t@example.com');
  });

  it('throws on a malformed or tampered token', () => {
    expect(() => verifyToken('not.a.jwt')).toThrow();
    expect(() => verifyToken(signToken(user) + 'tamper')).toThrow();
  });
});
