export const CONTENT_SECURITY_POLICY =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.stripe.com; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "img-src 'self' data: blob: https://*.stripe.com https://img.logo.dev https://logo.clearbit.com; " +
  "connect-src 'self' https://*.stripe.com https://*.supabase.co wss://*.supabase.co; " +
  "frame-src https://*.stripe.com;";
