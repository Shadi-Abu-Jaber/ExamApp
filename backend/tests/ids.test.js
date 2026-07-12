import { describe, it, expect } from 'vitest';
import { genId } from '../src/ids.js';

describe('genId', () => {
  it('prefixes the generated id', () => {
    expect(genId('exam')).toMatch(/^exam_/);
    expect(genId('sub')).toMatch(/^sub_/);
  });

  it('generates unique ids in bulk', () => {
    const ids = new Set(Array.from({ length: 500 }, () => genId('u')));
    expect(ids.size).toBe(500);
  });
});
