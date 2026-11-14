import { describe, expect, it } from 'vitest';
import { validateTaskForm } from './taskForm';

const valid = {
  title: 'Sum', description: '# Sum', difficulty: 'easy', categoryId: 'c1',
  tests: [{ input: '[1]', output: '1' }],
};

describe('validateTaskForm', () => {
  it('accepts a complete task', () => {
    expect(validateTaskForm(valid)).toEqual({ errors: {}, form: '' });
  });

  it('flags missing fields', () => {
    const { errors, form } = validateTaskForm({ ...valid, title: ' ', categoryId: '' });
    expect(errors).toEqual({ title: expect.any(String), category: expect.any(String) });
    expect(form).toMatch(/complete all fields/);
  });

  it('does not require a category when updating', () => {
    expect(validateTaskForm({ ...valid, categoryId: '', requireCategory: false }).form).toBe('');
  });

  it('requires non-empty, unique test cases', () => {
    expect(validateTaskForm({ ...valid, tests: [] }).form).toMatch(/at least one test/);
    expect(validateTaskForm({ ...valid, tests: [{ input: '', output: '1' }] }).form).toMatch(/Fill in all/);
    const duplicate = [{ input: '[1]', output: '1' }, { input: '[1]', output: '2' }];
    expect(validateTaskForm({ ...valid, tests: duplicate }).form).toMatch(/same input/);
  });
});
