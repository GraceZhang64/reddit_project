/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '')          // Trim - from end of text
    .substring(0, 100);          // Limit length
}

/**
 * Generate a unique slug by appending a timestamp if needed
 */
export function generateUniqueSlug(title: string, existingSlug?: string): string {
  const baseSlug = slugify(title);
  
  if (existingSlug) {
    return baseSlug;
  }
  
  // Append timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}

