import "~/styles/globals.css";

import type React from "react";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "sonner";
import logo from "~/public/logo.jpg";

export const metadata: Metadata = {
  title: "Care Copilot",
  description: "Sistema de design para aplicações de suporte clínico",
  icons: {
    icon: logo.src,
    apple: logo.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className="font-sans antialiased"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
