import { describe, it, expect, vi } from 'vitest';
import { ExamService, SubmissionService } from '../src/api/examService.js';
import { AuthService } from '../src/services/AuthService.js';

// Minimal in-memory Storage stand-in (the real one wraps localStorage).
function makeStorage() {
  const m = new Map();
  return {
    get: (k) => (m.has(k) ? m.get(k) : null),
    set: (k, v) => m.set(k, v),
    remove: (k) => m.delete(k),
  };
}

describe('ExamService / SubmissionService delegate to the gateway', () => {
  it('forwards calls to ApiGateway methods', async () => {
    const gateway = {
      createExam: vi.fn().mockResolvedValue({ id: 'e1' }),
      setExamStatus: vi.fn().mockResolvedValue({}),
      submitExam: vi.fn().mockResolvedValue({ score: 1, total: 1 }),
    };
    const exams = new ExamService({ gateway });
    const submissions = new SubmissionService({ gateway });

    await exams.create({ title: 'T' });
    expect(gateway.createExam).toHaveBeenCalledWith({ title: 'T' });

    await exams.setStatus('e1', 'published');
    expect(gateway.setExamStatus).toHaveBeenCalledWith('e1', 'published');

    await submissions.submit({ examId: 'e1', answers: [0] });
    expect(gateway.submitExam).toHaveBeenCalledWith({ examId: 'e1', answers: [0] });
  });
});

describe('AuthService session handling', () => {
  it('login stores the user + token and arms the gateway', async () => {
    const storage = makeStorage();
    const gateway = {
      setToken: vi.fn(),
      login: vi.fn().mockResolvedValue({
        user: { name: 'T', email: 't', role: 'teacher' },
        token: 'jwt123',
      }),
    };
    const auth = new AuthService({ gateway, storage, notify: { success() {} } });

    const user = await auth.login('t', 'p');
    expect(user.role).toBe('teacher');
    expect(storage.get('auth_token')).toBe('jwt123');
    expect(gateway.setToken).toHaveBeenCalledWith('jwt123');
  });

  it('logout clears the stored token and the gateway token', () => {
    const storage = makeStorage();
    storage.set('current_user', { name: 'T' });
    storage.set('auth_token', 'jwt123');
    const gateway = { setToken: vi.fn() };
    const auth = new AuthService({ gateway, storage, notify: {} });

    auth.logout();
    expect(storage.get('auth_token')).toBeNull();
    expect(gateway.setToken).toHaveBeenLastCalledWith(null);
  });
});
