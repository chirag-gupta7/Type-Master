/**
 * Regression test: the live WPM readout used to divide by zero during the
 * first second of a round (elapsed 0), rendering "WPM: Infinity" because
 * Infinity is truthy and slipped past the `|| 0` guard.
 */

import { computeLiveWpm } from '../PromptDash';

describe('computeLiveWpm', () => {
  it('returns 0 when no time has elapsed', () => {
    expect(computeLiveWpm(150, 0)).toBe(0);
    expect(computeLiveWpm(0, 0)).toBe(0);
  });

  it('computes standard WPM after time has elapsed', () => {
    // 300 chars = 60 "words" over a full minute.
    expect(computeLiveWpm(300, 60)).toBe(60);
    // 50 chars = 10 words over 30 seconds -> 20 WPM.
    expect(computeLiveWpm(50, 30)).toBe(20);
  });
});
