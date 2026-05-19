import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Viaje GPS Monitor",
  description:
    "Panel de monitoreo para ubicacion GPS de viajeros con monitor web en Next.js y cliente movil en React Native.echo por Martin Urzagasti",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex min-h-full flex-1 flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-[rgba(6,39,47,.08)] bg-white/55 px-4 py-5 text-center text-sm text-[var(--muted)] backdrop-blur sm:px-6 lg:px-8">
            Creado por <span className="font-semibold text-[var(--ink)]">Martin Urzagasti</span>.
          </footer>
        </div>
      </body>
    </html>
  );
}
