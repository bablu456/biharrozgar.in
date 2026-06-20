'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { Menu, X, LogOut, Briefcase, User as UserIcon, LayoutDashboard, ChevronDown, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getDashboardRoute } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { logout } from '@/lib/api-auth';

type HeaderUser = {
  id: string;
  full_name: string;
  role: string;
  email: string;
};

interface AuthSessionResponse {
  user: { id: string; email: string };
  profile: { full_name: string | null; role: string };
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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
          email: session.user.email,
        });
      })
      .catch(() => setUser(null));
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    setUser(null);
    window.location.href = '/';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/75 backdrop-blur-lg border-b border-gray-150/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]' 
          : 'bg-white/95 backdrop-blur-sm border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 transition-all duration-300 group-hover:scale-105 group-hover:shadow-indigo-200">
              <span className="text-white font-bold text-2xl tracking-tighter">बी</span>
            </div>
            <div>
              <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-800 tracking-tight">
                बिहारोज़गार
              </span>
              <span className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase block -mt-0.5 opacity-90">
                Bihar Jobs
              </span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-50/80 p-1.5 rounded-full border border-gray-100">
            <Link 
              href="/jobs" 
              className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-white rounded-full transition-all duration-200"
            >
              Jobs
            </Link>
            <Link 
              href="/pricing" 
              className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-white rounded-full transition-all duration-200"
            >
              Pricing
            </Link>
            <Link 
              href="/about" 
              className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-white rounded-full transition-all duration-200"
            >
              About
            </Link>
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-gray-205 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                    {getInitials(user.full_name)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-semibold text-gray-950 max-w-[100px] truncate">
                      {user.full_name}
                    </div>
                    <div className="text-[10px] text-gray-500 capitalize">
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl border border-gray-150 shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-2 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="px-3 py-2.5 border-b border-gray-100">
                      <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link 
                        href={dashboardHref}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-500" />
                        Dashboard
                      </Link>
                      <Link 
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors font-medium"
                      >
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        My Profile
                      </Link>
                      <Link 
                        href="/profile?tab=payment"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors font-medium"
                      >
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        Manage Payments
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-650 hover:bg-red-50 rounded-xl transition-colors font-medium text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="rounded-full text-gray-600 hover:text-gray-900 font-semibold text-sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 font-semibold px-6 text-sm py-2.5 transition-all hover:-translate-y-0.5">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Post a Job
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2.5 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-200 shadow-xl px-4 py-6 space-y-4 animate-in slide-in-from-top-5 duration-200">
          <div className="flex flex-col space-y-2">
            <Link href="/jobs" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-indigo-50 text-gray-750 font-semibold transition-colors">
              Browse Jobs
            </Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-indigo-50 text-gray-750 font-semibold transition-colors">
              Pricing & Plans
            </Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-indigo-50 text-gray-750 font-semibold transition-colors">
              About Us
            </Link>
          </div>
          
          <div className="h-px bg-gray-100 my-2"></div>
          
          {user ? (
            <div className="flex flex-col space-y-2">
              <div className="px-4 py-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {getInitials(user.full_name)}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{user.full_name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
              <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)} className="flex items-center px-4 py-3 rounded-xl hover:bg-indigo-50 text-indigo-700 font-semibold transition-colors">
                <LayoutDashboard className="w-5 h-5 mr-3 text-indigo-500" /> Dashboard
              </Link>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center px-4 py-3 rounded-xl hover:bg-indigo-50 text-indigo-700 font-semibold transition-colors">
                <UserIcon className="w-5 h-5 mr-3 text-indigo-500" /> My Profile
              </Link>
              <Link href="/profile?tab=payment" onClick={() => setMobileMenuOpen(false)} className="flex items-center px-4 py-3 rounded-xl hover:bg-indigo-50 text-indigo-700 font-semibold transition-colors">
                <CreditCard className="w-5 h-5 mr-3 text-indigo-500" /> Payments & Plans
              </Link>
              <button 
                onClick={handleSignOut}
                className="flex items-center px-4 py-3 rounded-xl hover:bg-red-50 text-red-650 font-semibold transition-colors text-left"
              >
                <LogOut className="w-5 h-5 mr-3 text-red-500" /> Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button variant="outline" className="w-full rounded-xl py-6 border-gray-200 font-semibold">Log In</Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button className="w-full rounded-xl py-6 bg-indigo-600 hover:bg-indigo-700 font-semibold text-white shadow-md">
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
