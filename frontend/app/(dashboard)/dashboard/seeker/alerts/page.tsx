'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Bell, Mail, MessageSquare, Save, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProfileResponse {
  email_notifications: boolean;
  whatsapp_notifications: boolean;
}

export default function SeekerAlerts() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    whatsapp_notifications: true,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await apiFetch<ProfileResponse>('/profile/me');
        if (res) {
          setPreferences({
            email_notifications: res.email_notifications ?? true,
            whatsapp_notifications: res.whatsapp_notifications ?? true,
          });
        }
      } catch (err) {
        console.error('Error fetching preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch('/profile/me', {
        method: 'PATCH',
        body: JSON.stringify(preferences),
      });
      setMessage({ type: 'success', text: 'Alert preferences saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save preferences.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Job Alerts</h1>
        <p className="mt-2 text-lg text-gray-500">Manage how and when you want to be notified about new jobs.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Notification Channels</h2>
        </div>
        
        <div className="p-8 space-y-8">
          {/* Email Notifications */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="mt-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${preferences.email_notifications ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Mail className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Email Alerts</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">Receive personalized job recommendations and application updates straight to your inbox.</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle('email_notifications')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${preferences.email_notifications ? 'bg-indigo-600' : 'bg-gray-200'}`}
              role="switch"
              aria-checked={preferences.email_notifications}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.email_notifications ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="h-px bg-gray-100"></div>

          {/* WhatsApp Notifications */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="mt-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${preferences.whatsapp_notifications ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">WhatsApp Alerts</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">Get instant notifications for interview shortlists, employer messages, and urgent job matches.</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle('whatsapp_notifications')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 ${preferences.whatsapp_notifications ? 'bg-green-500' : 'bg-gray-200'}`}
              role="switch"
              aria-checked={preferences.whatsapp_notifications}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.whatsapp_notifications ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
        <div className="flex gap-3 text-blue-800 text-sm max-w-xl">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            Your alert preferences are tied to your profile. Currently, alerts are generated based on the skills and district saved in your <a href="/profile" className="font-semibold underline hover:text-blue-900">Profile Dashboard</a>.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm px-6"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
