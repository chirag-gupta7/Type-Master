import { cn } from '../utils';

describe('cn()', () => {
  it('joins plain class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('returns empty string with no inputs', () => {
    expect(cn()).toBe('');
  });

  it('ignores falsy / nullish inputs', () => {
    expect(cn('a', false && 'b', null, undefined, 0 as unknown as string)).toBe('a');
  });

  it('supports object syntax', () => {
    expect(cn({ a: true, b: false, c: 1 as unknown as boolean })).toBe('a c');
  });

  it('supports array syntax including nesting', () => {
    expect(cn(['a', ['b', { c: true }]])).toBe('a b c');
  });

  it('resolves tailwind conflicts via twMerge (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
  });

  it('keeps non-conflicting classes and handles conditionals', () => {
    const active = true;
    expect(cn('base', active && 'active', !active && 'idle')).toBe('base active');
  });

  it('deduplicates conflicting tailwind classes', () => {
    expect(cn('px-2', 'px-2', 'py-1')).toBe('px-2 py-1');
  });
});
