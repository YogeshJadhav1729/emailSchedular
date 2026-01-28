export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEmails(emails: string[]): { valid: boolean; invalidEmails: string[] } {
  const invalidEmails = emails.filter(email => !isValidEmail(email));
  return {
    valid: invalidEmails.length === 0,
    invalidEmails,
  };
}

export function validatePositiveInteger(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function isValidFutureDate(date: Date, allowPastMinutes: number = 5): boolean {
  const now = new Date();
  const minDate = new Date(now.getTime() - allowPastMinutes * 60 * 1000);
  return date >= minDate;
}
