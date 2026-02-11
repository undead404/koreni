import Image from 'next/image';
import Link from 'next/link';

import CookieSettingsTrigger from './cookie-settings-trigger';

import styles from './footer.module.css';

import githubIcon from '../assets/github.svg';
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Ліва частина: Копірайт */}
        <span>
          Дані поширюються за <Link href="/license">ліцензією ODbL</Link>. Код
          доступний на{' '}
          <a
            className={styles.githubLink}
            href="https://github.com/undead404/koreni"
            target="_blank"
            rel="noopener noreferrer"
            title="undead404/koreni на GitHub"
          >
            GitHub&nbsp;
            <Image
              src={githubIcon}
              alt="GitHub logo"
              className="filter-inverted"
              height={20}
              width={20}
            />
          </a>
          .
        </span>

        {/* Права частина: Посилання */}
        <nav className={styles.links}>
          <a
            href="https://t.me/koreni_org_ua"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.link} ${styles.statusLink}`}
            title="Канал у Telegram"
          >
            Telegram
          </a>
          <a
            href="https://status.koreni.org.ua/uk"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.link} ${styles.statusLink}`}
            title="Перевірити працездатність системи"
          >
            <span className={styles.statusDot} aria-hidden="true" />
            Статус системи
          </a>

          {/* 2. Політика конфіденційності */}
          <Link href="/privacy" className={styles.link}>
            Політика конфіденційності
          </Link>

          {/* 3. Тригер налаштувань Cookie */}
          <CookieSettingsTrigger />
        </nav>
      </div>
    </footer>
  );
}
