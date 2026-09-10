import {
  ACHIEVEMENTS,
  THRESHOLDS,
  TYPE_TO_CATEGORY,
  TYPE_TO_POINTS,
  TYPE_TO_TITLE,
  TYPE_TO_ICON,
  CATEGORIES,
} from '../achievements.shared';

describe('achievements.shared', () => {
  it('has 20 achievements with unique types', () => {
    expect(ACHIEVEMENTS).toHaveLength(20);
    const types = ACHIEVEMENTS.map((a) => a.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('every achievement has required fields with sane values', () => {
    for (const a of ACHIEVEMENTS) {
      expect(typeof a.type).toBe('string');
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
      expect(a.icon.length).toBeGreaterThan(0);
      expect(a.category.length).toBeGreaterThan(0);
      expect(Number.isInteger(a.threshold)).toBe(true);
      expect(a.threshold).toBeGreaterThan(0);
      expect(Number.isInteger(a.points)).toBe(true);
      expect(a.points).toBeGreaterThan(0);
    }
  });

  it('THRESHOLDS mirrors ACHIEVEMENTS', () => {
    expect(Object.keys(THRESHOLDS)).toHaveLength(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) {
      expect(THRESHOLDS[a.type]).toBe(a.threshold);
    }
  });

  it('TYPE_TO_* maps mirror ACHIEVEMENTS', () => {
    for (const a of ACHIEVEMENTS) {
      expect(TYPE_TO_CATEGORY[a.type]).toBe(a.category);
      expect(TYPE_TO_POINTS[a.type]).toBe(a.points);
      expect(TYPE_TO_TITLE[a.type]).toBe(a.title);
      expect(TYPE_TO_ICON[a.type]).toBe(a.icon);
    }
  });

  it('CATEGORIES is the deduped category list in first-seen order', () => {
    const expected = [...new Set(ACHIEVEMENTS.map((a) => a.category))];
    expect([...CATEGORIES]).toEqual(expected);
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length);
  });

  it('spot-checks known thresholds and categories', () => {
    expect(THRESHOLDS.firstSteps).toBe(1);
    expect(THRESHOLDS.unstoppable).toBe(100);
    expect(THRESHOLDS.velocity120).toBe(120);
    expect(TYPE_TO_CATEGORY.speedDemon).toBe('Speed');
    expect(TYPE_TO_CATEGORY.student).toBe('Learning');
    expect(TYPE_TO_POINTS.graduateTypist).toBe(150);
  });

  it('has no duplicate titles', () => {
    const titles = ACHIEVEMENTS.map((a) => a.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
