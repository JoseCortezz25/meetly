import type { Metadata } from 'next';
// eslint-disable-next-line camelcase
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import { TopNav } from '@/components/layout/top-nav';
import './globals.css';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: ['400', '500', '600']
});

const hankenGrotesk = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500', '700']
});

export const metadata: Metadata = {
  title: 'Meetly',
  description:
    'Capture meetings locally and turn them into transcripts and AI notes — all on your device.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <div className="sticky top-0 z-50">
          <div className="mx-auto flex max-w-[1180px] justify-center px-[34px] py-4">
            <TopNav />
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
