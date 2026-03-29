import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'REOS — Real Estate Operating System',
  description: 'Find, buy, sell, and manage real estate with AI-powered insights. Trusted listings, faster deals.',
  keywords: 'real estate, property, buy, sell, rent, apartments, villas, broker, REOS',
  openGraph: {
    title: 'REOS — Real Estate Operating System',
    description: 'AI-powered real estate platform for buyers, brokers, and builders.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
