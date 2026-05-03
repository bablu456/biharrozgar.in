import { NextResponse } from 'next/server';

import {
  appendQueryParamToPath,
  getDashboardRoute,
  isProfileComplete,
  sanitizeNextPath,
} from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get('next'));
  const failedRedirect =
    nextPath.startsWith('/dashboard')
      ? appendQueryParamToPath(nextPath, 'google', 'error')
      : nextPath.startsWith('/complete-profile')
        ? '/register?error=google-login-failed'
        : '/login?error=google-login-failed';

  if (!code) {
    return NextResponse.redirect(new URL(failedRedirect, requestUrl.origin));
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session?.user) {
    return NextResponse.redirect(new URL(failedRedirect, requestUrl.origin));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, district')
    .eq('id', data.session.user.id)
    .single();

  const destination =
    nextPath === '/complete-profile' ||
    nextPath.startsWith('/complete-profile?') ||
    !isProfileComplete(profile)
      ? nextPath.startsWith('/complete-profile')
        ? nextPath
        : '/complete-profile'
      : nextPath === '/'
        ? getDashboardRoute(profile?.role)
        : nextPath;

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
