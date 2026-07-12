// User entity — supports two roles: teacher and student.
// publicProfile() returns only the fields safe to expose in the UI (without the
// password), which is especially useful when persisting the logged-in user.

export const USER_ROLE = Object.freeze({
  TEACHER: 'teacher',
  STUDENT: 'student',
});

export class User {
  constructor({ id, name = '', email = '', password = '', role = USER_ROLE.STUDENT } = {}) {
    this.id = id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.name = name;
    this.email = email.toLowerCase().trim();
    this.password = password;
    this.role = role;
  }

  isTeacher() { return this.role === USER_ROLE.TEACHER; }
  isStudent() { return this.role === USER_ROLE.STUDENT; }

  publicProfile() {
    return { id: this.id, name: this.name, email: this.email, role: this.role };
  }

  toJSON() {
    return { id: this.id, name: this.name, email: this.email, password: this.password, role: this.role };
  }

  static from(raw) {
    return new User(raw || {});
  }
}
