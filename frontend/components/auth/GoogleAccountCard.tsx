'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Link2, Mail, ShieldAlert, Unlink2 } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { UserIdentity } from '@supabase/auth-js';

import { Button } from '@/components/ui/Button';
import { appendQueryParamToPath, buildAuthCallbackUrl } from '@/lib/auth';
import { createClient } from '@/lib/supabase';

function getFriendlyErrorMessage(message: string): string {
  if (message.toLowerCase().includes('manual linking')) {
    return 'Enable Manual Linking in Supabase Auth settings before using account linking.';
  }

  if (message.toLowerCase().includes('identity is already linked')) {
    return 'This Google account is already linked to another user.';
  }

  return message;
}

export function GoogleAccountCard() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const googleIdentity = useMemo(
    () => identities.find((identity) => identity.provider === 'google') ?? null,
    [identities]
  );

  useEffect(() => {
    if (searchParams.get('google') === 'linked') {
      setStatusMessage('Google account connected successfully.');
    } else if (searchParams.get('google') === 'error') {
      setError('Google account linking could not be completed. Please try again.');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadIdentities = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        return;
      }

      setEmail(session.user.email ?? null);

      const { data, error: identityError } = await supabase.auth.getUserIdentities();

      if (identityError) {
        setError(getFriendlyErrorMessage(identityError.message));
        setLoading(false);
        return;
      }

      setIdentities(data.identities);
      setLoading(false);
    };

    loadIdentities();
  }, []);

  const handleLinkGoogle = async () => {
    setBusy(true);
    setError('');
    setStatusMessage('');

    const supabase = createClient();
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: buildAuthCallbackUrl(
          appendQueryParamToPath(pathname, 'google', 'linked')
        ),
      },
    });

    if (linkError) {
      setError(getFriendlyErrorMessage(linkError.message));
      setBusy(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!googleIdentity) {
      return;
    }

    if (identities.length < 2) {
      setError('Add another sign-in method before disconnecting Google.');
      return;
    }

    setBusy(true);
    setError('');
    setStatusMessage('');

    const supabase = createClient();
    const { error: unlinkError } = await supabase.auth.unlinkIdentity(googleIdentity);

    if (unlinkError) {
      setError(getFriendlyErrorMessage(unlinkError.message));
      setBusy(false);
      return;
    }

    const { data } = await supabase.auth.getUserIdentities();
    setIdentities(data?.identities ?? []);
    setStatusMessage('Google account disconnected.');
    setBusy(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-spin w-6 h-6 border-4 border-bihar-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Google account</h2>
          <p className="text-sm text-gray-500 mt-1">
            Link Google to this BiharRozgar account for faster login later.
          </p>
        </div>
        {googleIdentity ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            <ShieldAlert className="w-4 h-4" />
            Not linked
          </span>
        )}
      </div>

      {email && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          {googleIdentity?.identity_data?.email || email}
        </div>
      )}

      {statusMessage && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {statusMessage}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {googleIdentity ? (
          <Button type="button" variant="outline" onClick={handleUnlinkGoogle} loading={busy}>
            <Unlink2 className="w-4 h-4 mr-2" />
            Disconnect Google
          </Button>
        ) : (
          <Button type="button" onClick={handleLinkGoogle} loading={busy}>
            <Link2 className="w-4 h-4 mr-2" />
            Connect Google
          </Button>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Supabase Auth must have Google enabled and Manual Linking turned on for this to work.
      </p>
    </div>
  );
}
