import { describe, expect, it } from 'vitest';
import { usernameSchema, signInSchema, signUpSchema } from './schemas';

describe('username schema', () => {
  it.each([['abc'], ['my-handle'], ['user1'], ['a-1-b']])('accepts %s', (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    ['ab'],
    ['-leading-hyphen'],
    ['UPPER'],
    ['white space'],
    ['too' + 'x'.repeat(40)],
    ['emoji😀'],
  ])('rejects %s', (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('rejects passwords shorter than 8 characters', () => {
    const r = signUpSchema.safeParse({
      email: 'a@b.co',
      password: 'short',
      username: 'goodhandle',
    });
    expect(r.success).toBe(false);
  });

  it('rejects invalid emails', () => {
    const r = signUpSchema.safeParse({
      email: 'nope',
      password: 'longenough',
      username: 'goodhandle',
    });
    expect(r.success).toBe(false);
  });

  it('accepts a valid signup payload', () => {
    const r = signUpSchema.safeParse({
      email: 'a@b.co',
      password: 'longenough',
      username: 'goodhandle',
    });
    expect(r.success).toBe(true);
  });
});

describe('signInSchema', () => {
  it('requires a password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });
  it('accepts any non-empty password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });
});
