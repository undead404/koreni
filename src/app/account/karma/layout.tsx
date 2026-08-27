import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Карма',
};

export default function KarmaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
