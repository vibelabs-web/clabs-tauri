/**
 * SvelteKit server hooks for authentication.
 * Handles protected routes on the server side.
 */
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const publicRoutes = ['/login', '/register'];

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('token');
  const isPublicRoute = publicRoutes.some(route => event.url.pathname.startsWith(route));

  // Redirect to login if accessing protected route without token
  if (!token && !isPublicRoute && event.url.pathname !== '/') {
    throw redirect(303, '/login');
  }

  // Redirect to home if accessing auth pages while logged in
  if (token && isPublicRoute) {
    throw redirect(303, '/');
  }

  return resolve(event);
};
