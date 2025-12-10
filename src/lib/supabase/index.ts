/**
 * Supabase Client Exports
 */

export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient } from './server';
export {
  updateSession,
  protectedRoutes,
  authRoutes,
  isProtectedRoute,
  isAuthRoute,
} from './middleware';
