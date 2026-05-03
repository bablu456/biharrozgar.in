import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Bihar Rozgar Portal - Jobs in Patna & Bihar",
  description: "Find jobs in Patna, Gaya, Bhagalpur and all Bihar districts. Browse thousands of jobs in coaching, retail, services, daily wage and more.",
};

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  
  let user = null;
  if (authUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', authUser.id)
      .single();
    user = profile;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
