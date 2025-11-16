import {
  validateEmail,
  validatePassword,
  validateUsername,
  sanitizeHtml,
  validateBio
} from '../utils/validators';

describe('Input Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user..name@example.com',
        ''
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'SecurePass123!',
        'MyCustom@P0rd',
        'Str0ng!PassW',
        'C0mplex&Secure'
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject passwords that are too short', () => {
      const result = validatePassword('Abc1!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 8 characters');
    });

    it('should reject passwords without uppercase', () => {
      const result = validatePassword('password123!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('uppercase');
    });

    it('should reject passwords without lowercase', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('lowercase');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('Password!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('number');
    });

    it('should reject passwords without special characters', () => {
      const result = validatePassword('Password123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('special character');
    });

    it('should reject common weak passwords', () => {
      const weakPasswords = [
        'password123',
        'Password1!',
        '12345678'
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
      });
    });

    it('should reject passwords that are too long', () => {
      const longPassword = 'A1!' + 'a'.repeat(130);
      const result = validatePassword(longPassword);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      const validUsernames = [
        'john_doe',
        'user123',
        'TestUser',
        'alice_wonder'
      ];

      validUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject usernames that are too short', () => {
      const result = validateUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3 characters');
    });

    it('should reject usernames that are too long', () => {
      const result = validateUsername('a'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no more than 20 characters');
    });

    it('should reject usernames with invalid characters', () => {
      const invalidUsernames = [
        'user-name',
        'user name',
        'user@name',
        'user.name',
        '<script>'
      ];

      invalidUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('letters, numbers, and underscores');
      });
    });

    it('should reject usernames that do not start with a letter', () => {
      const invalidUsernames = ['123user', '_user', '1username'];

      invalidUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('start with a letter');
      });
    });

    it('should reject reserved usernames', () => {
      const reservedUsernames = [
        'admin',
        'root',
        'Admin',
        'SYSTEM',
        'moderator'
      ];

      reservedUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('reserved');
      });
    });
  });

  describe('sanitizeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeHtml(input);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('should handle XSS attempts', () => {
      const xssAttempts = [
        '<img src=x onerror="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>'
      ];

      xssAttempts.forEach(xss => {
        const sanitized = sanitizeHtml(xss);
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
        expect(sanitized).not.toContain('"');
      });
    });

    it('should handle empty or null input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });

    it('should preserve normal text', () => {
      const normalText = 'This is normal text with numbers 123';
      const sanitized = sanitizeHtml(normalText);
      expect(sanitized).toBe(normalText);
    });
  });

  describe('validateBio', () => {
    it('should allow valid bios', () => {
      const validBios = [
        'I love coding!',
        'Software engineer interested in web development.',
        'Hello world! 👋',
        ''
      ];

      validBios.forEach(bio => {
        const result = validateBio(bio);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject bios that are too long', () => {
      const longBio = 'a'.repeat(501);
      const result = validateBio(longBio);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no more than 500 characters');
    });

    it('should allow empty bio', () => {
      const result = validateBio('');
      expect(result.valid).toBe(true);
    });
  });
});

