/**
 * Fallback disposable email domains for local development and edge cases.
 * 
 * PRODUCTION: The authoritative list is synced from GitHub daily:
 * - Source: https://github.com/tompec/disposable-email-domains
 * - Sync endpoint: POST /api/admin/sync-disposable-domains (manual)
 * - Auto-sync cron: GET /api/cron/sync-disposable-domains (daily at 2 AM UTC)
 * - Storage: disposable_email_domains table in Supabase
 * - Coverage: 60,000+ domains updated regularly
 * 
 * This fallback list (~90 domains) is used only if:
 * - Database queries fail (soft-fail in validation logic)
 * - Local development without database connection
 * - Emergency fallback if sync fails
 */
export const DISPOSABLE_DOMAINS = [
  // 10 Minute Mail variants
  '10minutemail.com',
  '10minemail.com',
  
  // Guerrilla Mail variants
  'guerrillamail.com',
  'guerrillamail.co.uk',
  'guerrillamail.us',
  
  // Temp Mail variants (all domains)
  'temp-mail.org',
  'tempmailo.com',
  'tempmail.com',
  'tempmail.dev',
  'tempmail.lol',
  'tempmail.ninja',
  'tempmail.plus',
  'tempmail.it',
  'tempmail.id',
  'tempmail365.com',
  'tempmailgen.com',
  'tempmails.com',
  'tempmailpro.com',
  'tempmailnow.com',
  'tempmailx.com',
  'tempmailworld.com',
  'tempmailbest.com',
  'tempmaildemo.com',
  'tempmail100.com',
  'tempmailsite.com',
  'tempmailopen.com',
  'tempmail.adguard.com',
  'temp-mail.io',
  
  // TempEmail variants
  'tempemail.co',
  'tempemail.net',
  'tempemailaddress.com',
  'tempemailgenerator.org',
  'tempemailplus.com',
  'tempemailworld.com',
  
  // TempInbox / TempBox variants
  'tempinbox.com',
  'tempinbox.net',
  'tempail.com',
  'tempboxmail.com',
  'tempmailhub.org',
  'emailtemp.org',
  
  // Classic services
  'mailinator.com',
  'maildrop.cc',
  'yopmail.com',
  'fakemail.net',
  'throwawaymail.com',
  'emailondeck.com',
  'mohmal.com',
  'minuteinbox.com',
  
  // Disposable mail services
  'disposablemail.com',
  'emailfake.com',
  
  // Nada / GetNada variants
  'getnada.com',
  'nada.email',
  'inboxes.com',
  
  // Mail catch services
  'mail.tm',
  'mail7.io',
  'mail.cx',
  'mailcatch.com',
  'mailnesia.com',
  'mytemp.email',
  'mailsac.com',
  'mailpoof.com',
  
  // Trash mail services
  'trashmail.com',
  'trashmail.net',
  
  // Catch-all / forwarding
  '33mail.com',
  'spamgourmet.com',
  'bulc.club',
  'erine.email',
  'dropmail.me',
  'tmailor.com',
  'smailpro.com',
  
  // Privacy-focused email masking
  'addy.io',
  'relay.firefox.com',
  'simplelogin.io',
  'duckduckgo.com',
  'burnermail.io',
  'internxt.com',
  
  // Other disposable services
  'sharklasers.com',
  'spam4.me',
  'mailtrap.io',
  'catch-all.com',
  'bukemoldova.com',
  'clownmail.com',
  'flumpus.com',
  
  // Development / testing
  'example.com',
  'test.com',
  'localhost',
  '0.0.0.0',
]
