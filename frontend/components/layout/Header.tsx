'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getDashboardRoute } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { logout } from '@/lib/api-auth';

type HeaderUser = {
  id: string;
  full_name: string;
  role: string;
};

interface AuthSessionResponse {
  user: { id: string };
  profile: { full_name: string | null; role: string };
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<HeaderUser | null>(null);
  const dashboardHref = getDashboardRoute(user?.role);

  useEffect(() => {
    const hasSession =
      localStorage.getItem('access_token') || localStorage.getItem('refresh_token');
    if (!hasSession) {
      return;
    }

    apiFetch<AuthSessionResponse>('/auth/me')
      .then((session) => {
        setUser({
          id: session.user.id,
          full_name: session.profile.full_name || 'User',
          role: session.profile.role,
        });
      })
      .catch(() => setUser(null));
  }, []);

  const handleSignOut = () => {
    logout();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-bihar-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">बी</span>
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">बिहरोज़गार</span>
              <span className="text-xs text-bihar-green block -mt-1">Bihar Jobs</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/jobs" className="text-gray-600 hover:text-bihar-green font-medium">
              Jobs
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-bihar-green font-medium">
              Pricing
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-bihar-green font-medium">
              About
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={dashboardHref}
                  className="text-gray-600 hover:text-bihar-green font-medium"
                >
                  Dashboard
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Post a Job</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          <Link href="/jobs" className="block py-2 text-gray-600 font-medium">
            Jobs
          </Link>
          <Link href="/pricing" className="block py-2 text-gray-600 font-medium">
            Pricing
          </Link>
          <Link href="/about" className="block py-2 text-gray-600 font-medium">
            About
          </Link>
          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="block py-2 text-gray-600 font-medium"
              >
                Dashboard
              </Link>
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full">Login</Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button className="w-full">Post a Job</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
