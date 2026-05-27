import type { Metadata } from "next";
import AiChatbot from "@/components/chat/AiChatbot";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bihar Rozgar Portal - Jobs in Patna & Bihar",
  description: "Find jobs in Patna, Gaya, Bhagalpur and all Bihar districts. Browse thousands of jobs in coaching, retail, services, daily wage and more.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <AiChatbot />
      </body>
    </html>
  );
}
