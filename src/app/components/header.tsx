'use client';

import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useRef, useState } from 'react';

import styles from './header.module.css';

import logo from '../assets/logo.png';

type NavigationDestination =
  | 'search'
  | 'map'
  | 'tables'
  | 'contribute'
  | 'account'
  | 'volunteers'
  | 'blog'
  | 'about'
  | 'license';

type NavigationPlacement = 'primary' | 'top_bar' | 'menu';
type NavigationViewport = 'mobile' | 'desktop';

interface HeaderNavigationLinkProperties {
  destination: NavigationDestination;
  href: string;
  isActive: boolean;
  label: string;
  onNavigate: (
    destination: NavigationDestination,
    placement: NavigationPlacement,
  ) => void;
  placement: NavigationPlacement;
}

interface MenuNavigationItem {
  destination: NavigationDestination;
  href: string;
  label: string;
  listItemClassName?: string;
}

interface MenuNavigationGroup {
  label: string;
  items: MenuNavigationItem[];
  listItemClassName?: string;
}

const menuNavigationGroups: MenuNavigationGroup[] = [
  {
    label: 'Дані',
    items: [
      { destination: 'search', href: '/', label: 'Пошук' },
      { destination: 'map', href: '/map', label: 'Мапа' },
      { destination: 'tables', href: '/tables', label: 'Таблиці' },
    ],
  },
  {
    label: 'Як допомогти?',
    items: [
      {
        destination: 'contribute',
        href: '/contribute',
        label: 'Поділитися даними',
      },
      { destination: 'volunteers', href: '/volunteers', label: 'Волонтери' },
    ],
  },
  {
    label: 'Що таке Корені?',
    items: [
      { destination: 'blog', href: '/blog', label: 'Блог' },
      { destination: 'about', href: '/about', label: 'Про проєкт' },
      { destination: 'license', href: '/license', label: 'Ліцензія' },
    ],
  },
];

function getNavigationViewport(): NavigationViewport {
  return typeof window !== 'undefined' && window.innerWidth < 768
    ? 'mobile'
    : 'desktop';
}

function HeaderNavigationLink({
  destination,
  href,
  isActive,
  label,
  onNavigate,
  placement,
}: HeaderNavigationLinkProperties) {
  const isMenuLink = placement === 'menu';

  return (
    <Link
      href={href}
      className={clsx(
        isMenuLink ? styles.menuLink : styles.link,
        isActive && (isMenuLink ? styles.activeMenuLink : styles.active),
      )}
      aria-current={isActive ? 'page' : undefined}
      onClick={() => {
        onNavigate(destination, placement);
      }}
    >
      {label}
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const posthog = usePostHog();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonReference = useRef<HTMLButtonElement>(null);
  const menuPanelReference = useRef<HTMLElement>(null);

  const normalizedPathname = pathname.replace(/\/$/, '') || '/';

  const captureEvent = (
    eventName: 'header_menu_opened' | 'header_navigation_clicked',
    properties:
      | { viewport: NavigationViewport }
      | {
          destination: NavigationDestination;
          placement: NavigationPlacement;
          viewport: NavigationViewport;
        },
  ) => {
    try {
      posthog.capture(eventName, properties);
    } catch {
      // Analytics must never interfere with navigation.
    }
  };

  const trackNavigation = (
    destination: NavigationDestination,
    placement: NavigationPlacement,
  ) => {
    captureEvent('header_navigation_clicked', {
      destination,
      placement,
      viewport: getNavigationViewport(),
    });
    if (placement === 'menu') setIsMenuOpen(false);
  };

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

  const isMenuItemActive = (item: MenuNavigationItem) =>
    item.destination === 'blog'
      ? normalizedPathname === '/blog' ||
        normalizedPathname.startsWith('/blog/')
      : normalizedPathname === item.href;

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
          <Link
            href="/contribute"
            className={clsx(
              styles.ctaButton,
              normalizedPathname === '/contribute' && styles.active,
            )}
            aria-current={
              normalizedPathname === '/contribute' ? 'page' : undefined
            }
            onClick={() => {
              trackNavigation('contribute', 'top_bar');
            }}
          >
            Поділитися даними
          </Link>
          <Link
            href="/account"
            className={styles.accountLink}
            aria-current={
              normalizedPathname === '/account' ? 'page' : undefined
            }
            onClick={() => {
              trackNavigation('account', 'top_bar');
            }}
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
              if (!isMenuOpen) {
                captureEvent('header_menu_opened', {
                  viewport: getNavigationViewport(),
                });
              }
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
      <nav
        id="main-menu"
        className={styles.menuPanel}
        ref={menuPanelReference}
        aria-label="Додаткова навігація"
        hidden={!isMenuOpen}
      >
        <ul className={clsx(styles.menuList, 'no-disc')}>
          {menuNavigationGroups.map((group) => (
            <li key={group.label} className={group.listItemClassName}>
              <span className={styles.menuLabel}>{group.label}</span>
              <ul className={clsx(styles.submenuList, 'no-disc')}>
                {group.items.map((item) => (
                  <li key={item.destination} className={item.listItemClassName}>
                    <HeaderNavigationLink
                      {...item}
                      isActive={isMenuItemActive(item)}
                      onNavigate={trackNavigation}
                      placement="menu"
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
