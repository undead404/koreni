import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";

import githubIcon from "./github.svg";
import "./globals.css";
import styles from "./layout.module.css";
import Link from "next/link";
import Header from "./components/header";

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
          <Header />
          <main className={styles.main}>
            {children}
          </main>
          <footer className={styles.footer}>
            <a
              href="https://github.com/undead404/koreni"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                alt="undead404/koreni на GitHub"
                className={styles.githubIcon}
                height={24}
                src={githubIcon}
                title="undead404/koreni на GitHub"
                width={24}
              />
            </a>
          </footer>
        </div>
      </body>
    </html>
  );
}
