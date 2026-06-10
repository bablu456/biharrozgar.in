'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, LogOut, Briefcase, User, LayoutDashboard } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);
  
  const dashboardHref = getDashboardRoute(user?.role);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]' 
          : 'bg-white border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-2xl tracking-tighter">बी</span>
            </div>
            <div>
              <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                बिहरोज़गार
              </span>
              <span className="text-[11px] font-medium text-indigo-600 tracking-wider uppercase block -mt-1 opacity-80">
                Bihar Jobs
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-50/50 p-1 rounded-full border border-gray-100/50">
            <Link 
              href="/jobs" 
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-white rounded-full transition-all"
            >
              Jobs
            </Link>
            <Link 
              href="/pricing" 
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-white rounded-full transition-all"
            >
              Pricing
            </Link>
            <Link 
              href="/about" 
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-white rounded-full transition-all"
            >
              About
            </Link>
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                <Link href={dashboardHref}>
                  <Button variant="ghost" className="rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" className="rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-full border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="rounded-full text-gray-600 hover:text-gray-900 font-medium">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 font-medium px-6">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Post a Job
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-200 shadow-xl shadow-gray-900/5 px-4 py-6 space-y-4">
          <div className="flex flex-col space-y-2">
            <Link href="/jobs" className="px-4 py-3 rounded-xl hover:bg-indigo-50 text-gray-700 font-medium transition-colors">
              Browse Jobs
            </Link>
            <Link href="/pricing" className="px-4 py-3 rounded-xl hover:bg-indigo-50 text-gray-700 font-medium transition-colors">
              Pricing & Plans
            </Link>
            <Link href="/about" className="px-4 py-3 rounded-xl hover:bg-indigo-50 text-gray-700 font-medium transition-colors">
              About Us
            </Link>
          </div>
          
          <div className="h-px bg-gray-100 my-2"></div>
          
          {user ? (
            <div className="flex flex-col space-y-2">
              <Link href={dashboardHref} className="flex items-center px-4 py-3 rounded-xl hover:bg-indigo-50 text-indigo-700 font-medium transition-colors">
                <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
              </Link>
              <Link href="/profile" className="flex items-center px-4 py-3 rounded-xl hover:bg-indigo-50 text-indigo-700 font-medium transition-colors">
                <User className="w-5 h-5 mr-3" /> My Profile
              </Link>
              <button 
                onClick={handleSignOut}
                className="flex items-center px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 font-medium transition-colors text-left"
              >
                <LogOut className="w-5 h-5 mr-3" /> Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full rounded-xl py-6 border-gray-200 font-medium">Log In</Button>
              </Link>
              <Link href="/register" className="w-full">
                <Button className="w-full rounded-xl py-6 bg-indigo-600 hover:bg-indigo-700 font-medium text-white shadow-md">
                  <Briefcase className="w-5 h-5 mr-2" /> Post a Job
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
