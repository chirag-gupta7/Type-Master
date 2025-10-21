import { generateTestText } from '../textGenerator';

describe('Text Generator', () => {
  describe('generateTestText', () => {
    it('should generate unique text on each call', () => {
      const text1 = generateTestText(60);
      const text2 = generateTestText(60);
      
      expect(text1).not.toBe(text2);
      expect(text1.length).toBeGreaterThan(0);
      expect(text2.length).toBeGreaterThan(0);
    });

    it('should generate approximately correct word count for 30s duration', () => {
      const text = generateTestText(30);
      const words = text.split(' ');
      
      // 30s should target ~90 words (allowing ±20% variance)
      expect(words.length).toBeGreaterThanOrEqual(70);
      expect(words.length).toBeLessThanOrEqual(110);
    });

    it('should generate approximately correct word count for 60s duration', () => {
      const text = generateTestText(60);
      const words = text.split(' ');
      
      // 60s should target ~225 words (allowing ±20% variance)
      expect(words.length).toBeGreaterThanOrEqual(180);
      expect(words.length).toBeLessThanOrEqual(270);
    });

    it('should generate approximately correct word count for 180s duration', () => {
      const text = generateTestText(180);
      const words = text.split(' ');
      
      // 180s should target ~550 words (allowing ±20% variance)
      expect(words.length).toBeGreaterThanOrEqual(440);
      expect(words.length).toBeLessThanOrEqual(660);
    });

    it('should filter by category when specified', () => {
      const techText = generateTestText(60, 'tech');
      const literatureText = generateTestText(60, 'literature');
      
      expect(techText).not.toBe(literatureText);
      expect(techText.length).toBeGreaterThan(0);
      expect(literatureText.length).toBeGreaterThan(0);
    });

    it('should filter by difficulty when specified', () => {
      const easyText = generateTestText(60, undefined, 'easy');
      const hardText = generateTestText(60, undefined, 'hard');
      
      expect(easyText).not.toBe(hardText);
      expect(easyText.length).toBeGreaterThan(0);
      expect(hardText.length).toBeGreaterThan(0);
    });

    it('should not include line breaks', () => {
      const text = generateTestText(60);
      
      expect(text).not.toContain('\n');
      expect(text).not.toContain('\r');
    });

    it('should trim whitespace', () => {
      const text = generateTestText(60);
      
      expect(text).toBe(text.trim());
      expect(text.startsWith(' ')).toBe(false);
      expect(text.endsWith(' ')).toBe(false);
    });

    it('should not have double spaces', () => {
      const text = generateTestText(60);
      
      expect(text).not.toContain('  ');
    });
  });
});
