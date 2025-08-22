// Ghostbot disposable email checker utility

// Basic list for demo purposes (replace or enhance with full list or NPM-based lookup)
const blockedDomains = [
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "trashmail.com",
  "yopmail.com"
];

export function isDisposableEmail(email) {
  if (!email) return false;
  const domain = email.split("@")[1].toLowerCase();
  return blockedDomains.includes(domain);
}
