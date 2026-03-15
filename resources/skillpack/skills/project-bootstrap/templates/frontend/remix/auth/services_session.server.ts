/**
 * Remix session management using cookie-based sessions.
 */
import { createCookieSessionStorage, redirect } from '@remix-run/node';

const sessionSecret = process.env.SESSION_SECRET || 'super-secret-key-change-in-production';

const storage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === 'production',
  },
});

export async function getSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'));
}

export async function commitSession(session: Awaited<ReturnType<typeof getSession>>) {
  return storage.commitSession(session);
}

export async function destroySession(session: Awaited<ReturnType<typeof getSession>>) {
  return storage.destroySession(session);
}

export async function getToken(request: Request): Promise<string | null> {
  const session = await getSession(request);
  return session.get('token') || null;
}

export async function createUserSession(token: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set('token', token);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(session),
    },
  });
}

export async function requireAuth(request: Request) {
  const token = await getToken(request);
  if (!token) {
    throw redirect('/login');
  }
  return token;
}
