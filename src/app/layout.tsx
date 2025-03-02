import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";

import githubIcon from "./github.svg";
import "./globals.css";
import styles from "./layout.module.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Корені",
  description: "Пошук у народних генеалогічних індексах",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className={styles.page}>
          <main className={styles.main}>
            <Link href="/" className={styles.title}>
              Корені
            </Link>
            {children}
          </main>
          <footer className={styles.footer}>
            <a
              href="https://github.com/undead404/koreni"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={githubIcon}
                alt="undead404/koreni на GitHub"
                width={24}
                height={24}
                title="undead404/koreni на GitHub"
              />
            </a>
          </footer>
        </div>
      </body>
    </html>
  );
}
