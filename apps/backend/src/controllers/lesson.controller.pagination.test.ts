import {
  getFairPageBounds,
  getPageForIndex,
  getPracticeSectionIds,
} from './lesson.controller';

const PAGE_COUNT = 5;

const getSizesForTotal = (total: number): number[] => {
  const sizes: number[] = [];

  for (let page = 1; page <= PAGE_COUNT; page++) {
    const { startIndex, endIndex } = getFairPageBounds(total, page, PAGE_COUNT);
    sizes.push(endIndex - startIndex);
  }

  return sizes;
};

describe('lesson section pagination helpers', () => {
  it.each([
    [5, [1, 1, 1, 1, 1]],
    [10, [2, 2, 2, 2, 2]],
    [15, [3, 3, 3, 3, 3]],
    [20, [4, 4, 4, 4, 4]],
    [25, [5, 5, 5, 5, 5]],
  ])('fairly slices %i lessons into five pages', (total, expected) => {
    expect(getSizesForTotal(total)).toEqual(expected);
  });

  it('spreads remainder to earlier pages', () => {
    expect(getSizesForTotal(23)).toEqual([5, 5, 5, 4, 4]);
    expect(getSizesForTotal(17)).toEqual([4, 4, 3, 3, 3]);
  });

  it('resolves page number for an item index', () => {
    expect(getPageForIndex(0, 23, PAGE_COUNT)).toBe(1);
    expect(getPageForIndex(4, 23, PAGE_COUNT)).toBe(1);
    expect(getPageForIndex(5, 23, PAGE_COUNT)).toBe(2);
    expect(getPageForIndex(14, 23, PAGE_COUNT)).toBe(3);
    expect(getPageForIndex(22, 23, PAGE_COUNT)).toBe(5);
  });
});

describe('practice type section mapping', () => {
  it('returns normal practice sections', () => {
    expect(getPracticeSectionIds('normal')).toEqual([1, 2, 3, 4, 5, 11, 13]);
  });

  it('returns coding practice sections', () => {
    expect(getPracticeSectionIds('coding')).toEqual([6, 7, 8, 9, 10, 12]);
  });

  it('returns empty section list for assessment practice type', () => {
    expect(getPracticeSectionIds('assessment')).toEqual([]);
  });
});
