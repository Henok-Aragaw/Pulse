import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import QueryProvider from "@/hooks/query-provider";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
   variable: "--font-heading",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Luma",
   description: "AI-powered mood journal and emotional tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`dark ${inter.variable} ${playfair.variable} font-body antialiased`}
      >
        <QueryProvider>
        {children}
        <Toaster />
         </QueryProvider>
      </body>
    </html>
  );
}
