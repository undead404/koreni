/* eslint-disable react/jsx-no-target-blank */
import type { Metadata } from 'next';
import Link from 'next/link';

import Comments from '../components/comments/comments';
import environment from '../environment';

import styles from './page.module.css';

export const metadata: Metadata = {
  alternates: {
    canonical: `${environment.NEXT_PUBLIC_SITE}/about/`,
  },
  applicationName: 'Корені',
  authors: [
    {
      name: 'Віталій Перегончук',
      url: 'https://www.linkedin.com/in/vitalii-perehonchuk-10570693/',
    },
    {
      name: 'Аліна Лістунова',
      url: 'https://www.linkedin.com/in/alina-listunova/',
    },
  ],
  creator: 'Віталій Перегончук',
  description: 'Про проєкт "Корені", його автора та мотивацію для його появи.',
  generator: 'Next.js',
  keywords: [
    'Корені',
    'генеалогія',
    'українська генеалогія',
    'родовід',
    'Віталій Перегончук',
    'проєкт',
  ],
  openGraph: {
    description:
      'Про проєкт "Корені", його автора та мотивацію для його появи.',
    locale: 'uk-UA',
    siteName: 'Корені',
    title: 'Корені | Про проєкт',
    type: 'website',
    url: `${environment.NEXT_PUBLIC_SITE}/about/`,
  },
  title: 'Корені | Про проєкт',
  twitter: {
    card: 'summary_large_image',
    creator: '@negativo_ua',
    description:
      'Про проєкт "Корені", його автора та мотивацію для його появи.',
    images: [`${environment.NEXT_PUBLIC_SITE}/icon.png`],
  },
};

export default function AboutPage() {
  return (
    <>
      <article className="col-sm">
        <h1>Про проєкт &quot;Корені&quot;</h1>

        <h2>Ліцензія</h2>
        <p>
          Дивіться на окремій сторінці: <Link href="/license">Ліцензія</Link>
        </p>

        <h2>Хто автор Коренів?</h2>
        <p>
          Привіт. Я – Віталій Перегончук, розробник ПЗ,{' '}
          <a
            href="https://www.linkedin.com/in/vitalii-perehonchuk-10570693/"
            target="_blank"
            rel="noreferrer"
          >
            ось мій профіль на LinkedIn
          </a>
          , наприклад.
        </p>
        <p>
          Крім промислової розробки постійно займаюсь різноманітними
          хобі-проєктами. Серед актуальних:
        </p>
        <ul>
          <li>
            <a href="https://webdoky.org" target="_blank">
              WebDoky
            </a>{' '}
            – український переклад статей MDN
          </li>
          <li>
            <a href="https://ymh8.pages.dev" target="_blank">
              You Must Hear
            </a>{' '}
            – списки найкращої світової музики всіх часів, за абсолютно всіма
            музичними напрямками.
          </li>

          <li>
            <a href="https://pisnia-tumaniv.pages.dev" target="_blank">
              Пісня туманів
            </a>{' '}
            – база знань живограю &quot;Пісня туманів&quot; настільно-рольової
            гри &quot;Кавалерія&quot; від{' '}
            <a href="https://m87games.com/" target="_blank">
              видавництва M87* Games
            </a>
            , у якому я беру участь як гравець.
          </li>
        </ul>

        <h2>Подяки</h2>
        <p>Уклінно дякую наступним особам і спільнотам:</p>
        <ul>
          <li>
            <Link href="/volunteers/">Усім волонтерам Коренів</Link> – за
            результати довгих вечорів індексації; а особлива подяка – Володимиру
            Цибульському.
          </li>
          <li>
            Спільноті &quot;Генеалогічне IT&quot; – за концентрацію контексту та
            обговорення
          </li>
          <li>
            Проєкту &quot;Індекси України&quot; – за результати своєї праці
          </li>
          <li>
            Спільноті{' '}
            <a
              href="https://www.facebook.com/groups/425347154227812"
              target="_blank"
              rel="noreferrer"
            >
              UAGenealogy на Facebook
            </a>{' '}
            і{' '}
            <a
              href="https://ukrgenealogy.com.ua/"
              target="_blank"
              rel="noreferrer"
            >
              УГФ – Українському Генеалогічному Форуму
            </a>{' '}
            – за формування українського генеалогічного дискурсу.
          </li>
          <li>
            Аліні Лістуновій – за PR з цим чудовим UX, за рефакторинг, коментарі
            та побажання.
          </li>
        </ul>

        <h2>Чому з&apos;явилися Корені?</h2>
        <p>
          Вже деякий час я цікавлюся генеалогією; найдавніший відомий мій предок
          народився приблизно 1597 року. В процесі дослідження села Політанок,
          що в Жмеринському районі, взявся до суцільного дослідження генеалогії
          всього населеного пункту, а також – індексації всіх наявних
          генеалогічних матеріалів, яких, на щастя, збереглося чимало.
        </p>
        <p>
          Отже, я дослідив рідне село й маю купу таблиць Google Spreadsheets з
          індексаціями. У політанській Чудо-Михайлівській церкві, як це буває,
          хрестилися та вінчалися не тільки місцеві, а й:
        </p>
        <ul>
          <li>Захарія Іванів Стусь (у 1806 році), явно не місцевий</li>
          <li>
            Австрійські піддані Яків Йосипів Легуневич, Григорій Семенів
            Сенитович і Анна Іванова Дмитрюк
          </li>
          <li>Контролер винокурні Олександр Іванів Богданов</li>
          <li>Пруський підданий лютеранин Роберт Августів Врона</li>
          <li>Місцеве духовенство</li>
          <li>Шляхта</li>
          <li>а також купа селян навколишніх сіл</li>
        </ul>
        <p>
          В сленгу генеалогії таких осіб звуть &quot;загуляками&quot;. Найбільше
          їх у великих містах і великих залізничних вузлах, проте траплялися і в
          глушині.
        </p>
        <p>
          Що робити з &quot;загуляками&quot;? Один варіант – викладати в{' '}
          <a
            href="https://www.facebook.com/groups/1828267990648440"
            target="_blank"
            rel="noreferrer"
          >
            Загуляк на Facebook
          </a>
          . Іще можна викладати таблиці на форуми й у соцмережах, сподіваючись,
          що на таблицю натрапить саме той, хто треба.
        </p>
        <p>
          Я вирішив піти далі й розробити вебзастосунок, який агрегував би
          таблиці від різних дослідників. Додатковою мотивацією є аби таблиці не
          лежали без діла – раптом ще комусь допоможуть?
        </p>

        <h2>Як можна допомогти?</h2>
        <p className={styles.accentWrapper}>
          <Link className={styles.accent} href="/contribute">
            Додати власну таблицю{' '}
          </Link>
        </p>
        <p>
          Якщо маєте таблиці-індексації – надсилайте їх нам через{' '}
          <Link href="/contribute">спеціально розроблену для цього форму</Link>,
          а якщо не виходить її заповнити – присилайте на електронну пошту{' '}
          <a href="mailto:admin@koreni.org.ua">admin@koreni.org.ua</a>.
        </p>
        <p>
          Кожна надіслана таблиця через форму таблиця стає PR на GitHub. Після
          його перевірки таблиця додається на сайт, доступна для перегляду та
          пошуку.
        </p>
        <p>
          Якщо ж бажаєте допомогти з кодом – приходьте на{' '}
          <a
            href="https://github.com/undead404/koreni"
            target="_blank"
            rel="noreferrer"
          >
            Корені в Github
          </a>
          , реєструйте проблеми, присилайте PR!
        </p>
        <p>
          І – якщо Корені допомогли в якихось пошуках – пишіть про це в
          коментарях нижче, або надішліть листа на{' '}
          <a href="mailto:admin@koreni.org.ua">admin@koreni.org.ua</a>: я б дуже
          хотів знати, що моя праця допомогла комусь.
        </p>
      </article>
      <Comments />
    </>
  );
}
