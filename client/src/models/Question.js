export class Question {
  constructor({ id, text = '', options = ['', '', '', ''], correctAnswer = 0 } = {}) {
    this.id = id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.text = text;
    this.options = options;
    this.correctAnswer = correctAnswer;
  }

  isValid() {
    return (
      this.text.trim().length > 0 &&
      Array.isArray(this.options) &&
      this.options.length >= 2 &&
      this.options.every(o => typeof o === 'string' && o.trim().length > 0) &&
      Number.isInteger(this.correctAnswer) &&
      this.correctAnswer >= 0 &&
      this.correctAnswer < this.options.length
    );
  }

  toJSON() {
    return { id: this.id, text: this.text, options: [...this.options], correctAnswer: this.correctAnswer };
  }

  static from(raw) {
    return new Question(raw || {});
  }
}
