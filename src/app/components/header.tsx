'use client';

import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import styles from './header.module.css';

import logo from '../assets/logo.png';

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonReference = useRef<HTMLButtonElement>(null);
  const menuPanelReference = useRef<HTMLElement>(null);

  const normalizedPathname = pathname.replace(/\/$/, '') || '/';

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      setIsMenuOpen(false);
      menuButtonReference.current?.focus();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;

      const isInsideMenu =
        menuButtonReference.current?.contains(event.target) ||
        menuPanelReference.current?.contains(event.target);

      if (!isInsideMenu) setIsMenuOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isMenuOpen]);

  if (
    normalizedPathname === '/account' ||
    normalizedPathname.startsWith('/account/')
  ) {
    return null;
  }

  const isHomePage = normalizedPathname === '/';

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <Link href="/">
          <Image
            src={logo}
            alt="Логотип Коренів"
            className="filter-inverted"
            width={44}
            height={44}
          />
        </Link>
        <div className={styles.primaryLinks}>
          {!isHomePage && (
            <Link href="/" className={styles.link}>
              Пошук
            </Link>
          )}
          <Link
            href="/contribute"
            className={clsx(
              styles.ctaButton,
              normalizedPathname === '/contribute' && styles.active,
            )}
            aria-current={
              normalizedPathname === '/contribute' ? 'page' : undefined
            }
          >
            Поділитися даними
          </Link>
          <Link
            href="/account"
            className={styles.accountLink}
            aria-current={
              normalizedPathname === '/account' ? 'page' : undefined
            }
          >
            Кабінет
          </Link>
          <button
            ref={menuButtonReference}
            type="button"
            className={styles.menuButton}
            aria-expanded={isMenuOpen}
            aria-controls="main-menu"
            onClick={() => {
              setIsMenuOpen((isOpen) => !isOpen);
            }}
          >
            Меню
            <span
              className={clsx(
                styles.menuIndicator,
                isMenuOpen && styles.menuIndicatorOpen,
              )}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <nav
          id="main-menu"
          className={styles.menuPanel}
          ref={menuPanelReference}
          aria-label="Додаткова навігація"
        >
          <ul className={clsx(styles.menuList, 'no-disc')}>
            <li>
              <span className={styles.menuLabel}>Дані</span>
              <ul className={clsx(styles.submenuList, 'no-disc')}>
                <li>
                  <Link
                    href="/map"
                    className={clsx(
                      styles.menuLink,
                      normalizedPathname === '/map' && styles.activeMenuLink,
                    )}
                    aria-current={
                      normalizedPathname === '/map' ? 'page' : undefined
                    }
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                  >
                    Мапа
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tables"
                    className={clsx(
                      styles.menuLink,
                      normalizedPathname === '/tables' && styles.activeMenuLink,
                    )}
                    aria-current={
                      normalizedPathname === '/tables' ? 'page' : undefined
                    }
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                  >
                    Таблиці
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <span className={styles.menuLabel}>Як допомогти?</span>
              <ul className={clsx(styles.submenuList, 'no-disc')}>
                <li>
                  <Link
                    href="/contribute"
                    className={clsx(
                      styles.menuLink,
                      normalizedPathname === '/contribute' &&
                        styles.activeMenuLink,
                    )}
                    aria-current={
                      normalizedPathname === '/contribute' ? 'page' : undefined
                    }
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                  >
                    Поділитися даними
                  </Link>
                </li>
                <li>
                  <Link
                    href="/volunteers"
                    className={clsx(
                      styles.menuLink,
                      normalizedPathname === '/volunteers' &&
                        styles.activeMenuLink,
                    )}
                    aria-current={
                      normalizedPathname === '/volunteers' ? 'page' : undefined
                    }
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                  >
                    Волонтери
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <span className={styles.menuLabel}>Що таке Корені?</span>
              <ul className={clsx(styles.submenuList, 'no-disc')}>
                <li>
                  <Link
                    href="/blog"
                    className={clsx(
                      styles.menuLink,
                      (normalizedPathname === '/blog' ||
                        normalizedPathname.startsWith('/blog/')) &&
                        styles.activeMenuLink,
                    )}
                    aria-current={
                      normalizedPathname === '/blog' ||
                      normalizedPathname.startsWith('/blog/')
                        ? 'page'
                        : undefined
                    }
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                  >
                    Блог
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className={clsx(
                      styles.menuLink,
                      normalizedPathname === '/about' && styles.activeMenuLink,
                    )}
                    aria-current={
                      normalizedPathname === '/about' ? 'page' : undefined
                    }
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                  >
                    Про проєкт
                  </Link>
                </li>
                <li>
                  <Link
                    href="/license"
                    className={clsx(
                      styles.menuLink,
                      normalizedPathname === '/license' &&
                        styles.activeMenuLink,
                    )}
                    aria-current={
                      normalizedPathname === '/license' ? 'page' : undefined
                    }
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                  >
                    Ліцензія
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
