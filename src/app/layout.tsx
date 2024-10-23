import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import TopNav from "./_components/top-nav";

export const metadata: Metadata = {
  title: "Rally",
  description: "Wake-Up Call Project",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${GeistSans.variable} flex flex-col gap-4 bg-slate-900 text-white`}>
        <body>
          <TopNav />
          {children}
        </body>
    </html>
    </ClerkProvider>
  );
}
