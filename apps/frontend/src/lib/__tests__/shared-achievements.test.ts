import * as shared from '../../../../../packages/shared/src/achievements';
import * as mirror from '../achievements.shared';

describe('packages/shared achievements (via frontend runner)', () => {
  it('has 20 achievements with unique types', () => {
    expect(shared.ACHIEVEMENTS).toHaveLength(20);
    const types = shared.ACHIEVEMENTS.map((a) => a.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('maps stay consistent with the definition list', () => {
    for (const a of shared.ACHIEVEMENTS) {
      expect(shared.THRESHOLDS[a.type]).toBe(a.threshold);
      expect(shared.TYPE_TO_CATEGORY[a.type]).toBe(a.category);
      expect(shared.TYPE_TO_POINTS[a.type]).toBe(a.points);
      expect(shared.TYPE_TO_TITLE[a.type]).toBe(a.title);
      expect(shared.TYPE_TO_ICON[a.type]).toBe(a.icon);
    }
  });

  it('CATEGORIES is the deduped category list', () => {
    expect([...shared.CATEGORIES]).toEqual([
      ...new Set(shared.ACHIEVEMENTS.map((a) => a.category)),
    ]);
  });

  it('stays in sync with the frontend mirror', () => {
    expect([...mirror.ACHIEVEMENTS]).toEqual([...shared.ACHIEVEMENTS]);
    expect({ ...mirror.THRESHOLDS }).toEqual({ ...shared.THRESHOLDS });
    expect({ ...mirror.TYPE_TO_CATEGORY }).toEqual({ ...shared.TYPE_TO_CATEGORY });
    expect({ ...mirror.TYPE_TO_POINTS }).toEqual({ ...shared.TYPE_TO_POINTS });
    expect([...mirror.CATEGORIES]).toEqual([...shared.CATEGORIES]);
  });
});
