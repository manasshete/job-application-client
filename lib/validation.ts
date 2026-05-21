// Simple HTML escape function - works in all environments without jsdom
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char)
}

// Sanitize user input to prevent XSS - strips all HTML tags
export function sanitizeInput(input: string): string {
  // Remove all HTML tags and escape special characters
  const stripped = input.replace(/<[^>]*>/g, '')
  return escapeHtml(stripped)
}

// Validate URL is safe (no javascript:, data:, file: protocols)
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const allowedProtocols = ['http:', 'https:']
    return allowedProtocols.includes(parsed.protocol)
  } catch {
    return false
  }
}

// Validate URL is not pointing to internal/private networks
export function isPublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    
    // Block localhost and private IPs
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fe80:/,
      /^fc00:/,
    ]
    
    return !blockedPatterns.some(pattern => pattern.test(hostname))
  } catch {
    return false
  }
}

// Validate input length
export function validateLength(input: string, maxLength: number): boolean {
  return input.length <= maxLength
}

// Input length constants
export const MAX_LENGTHS = {
  COMPANY: 200,
  POSITION: 200,
  LOCATION: 200,
  SALARY: 100,
  NOTES: 5000,
  URL: 2000,
} as const
