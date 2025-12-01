import { slugify, generateUniqueSlug } from '../utils/slugify';

describe('Slug Generation', () => {
  describe('slugify', () => {
    it('should convert text to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('This is a test')).toBe('this-is-a-test');
    });

    it('should remove special characters', () => {
      expect(slugify('Hello! World?')).toBe('hello-world');
      expect(slugify('Test@#$%Post')).toBe('testpost');
    });

    it('should handle multiple consecutive spaces', () => {
      expect(slugify('Hello    World')).toBe('hello-world');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(slugify('  Hello World  ')).toBe('hello-world');
    });

    it('should handle Unicode characters', () => {
      expect(slugify('Café Latté')).toBe('caf-latt');
    });

    it('should truncate long titles', () => {
      const longTitle = 'a'.repeat(150);
      const slug = slugify(longTitle);
      expect(slug.length).toBeLessThanOrEqual(100);
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('generateUniqueSlug', () => {
    it('should generate slug from title', () => {
      const slug = generateUniqueSlug('Test Post');
      expect(slug).toContain('test-post');
    });

    it('should add timestamp for uniqueness', async () => {
      const slug1 = generateUniqueSlug('Test Post');
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const slug2 = generateUniqueSlug('Test Post');
      
      // Both should have timestamp suffixes
      expect(slug1).toMatch(/^test-post-[a-z0-9]+$/);
      expect(slug2).toMatch(/^test-post-[a-z0-9]+$/);
    });

    it('should not add timestamp if existingSlug provided', () => {
      const existingSlug = 'existing-slug';
      const slug = generateUniqueSlug('Test Post', existingSlug);
      
      expect(slug).toBe(slugify('Test Post'));
    });
  });
});

