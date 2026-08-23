/**
 * Regression tests: ThemeApplicator used to JSON.parse the stored theme and
 * hand it to setTheme with no shape validation, so garbage-but-valid JSON
 * (e.g. from another app or an old version) could set CSS variables to
 * "undefined". ThemeSelector validated; ThemeApplicator didn't. Both now
 * share parseStoredTheme.
 */

import { parseStoredTheme } from '../theme';

describe('parseStoredTheme', () => {
  it('returns a valid theme unchanged', () => {
    const theme = { name: 'Custom', primary: '#111111', secondary: '#222222', accent: '#333333' };
    expect(parseStoredTheme(JSON.stringify(theme))).toEqual(theme);
  });

  it('returns null for malformed JSON', () => {
    expect(parseStoredTheme('{not json')).toBeNull();
  });

  it('returns null for valid JSON with the wrong shape', () => {
    expect(parseStoredTheme('"just a string"')).toBeNull();
    expect(parseStoredTheme('{"foo": 1}')).toBeNull();
    expect(parseStoredTheme('[1,2,3]')).toBeNull();
  });

  it('returns null for missing values', () => {
    expect(parseStoredTheme(null)).toBeNull();
  });
});
