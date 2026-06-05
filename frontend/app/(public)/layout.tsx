import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Bihar Rozgar Portal - Jobs in Patna & Bihar",
  description: "Find jobs in Patna, Gaya, Bhagalpur and all Bihar districts. Browse thousands of jobs in coaching, retail, services, daily wage and more.",
};

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
