import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * @param password Plain text password
 * @param hash Hashed password from database
 * @returns True if passwords match
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * Requirements: min 8 chars, uppercase, lowercase, number, symbol
 * @param password Password to validate
 * @returns Validation result with error message if invalid
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password minimal 8 karakter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password harus mengandung huruf kecil' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password harus mengandung huruf besar' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password harus mengandung angka' };
  }

  if (!/[@$!%*?&#]/.test(password)) {
    return { valid: false, error: 'Password harus mengandung simbol (@$!%*?&#)' };
  }

  return { valid: true };
}

/**
 * Generate a random strong password
 * @returns Random password meeting all requirements
 */
export function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '@$!%*?&#';

  const password = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  // Shuffle array
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}
