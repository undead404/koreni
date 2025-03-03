import { Suspense } from "react";

import getTablesMetadata from "@/shared/get-tables-metadata";
import Search from "./components/search";

import styles from "./page.module.css";

export default async function Home() {
  const tablesMetadata = await getTablesMetadata();
  return (
    <>
      <h1 className={styles.title}>Домашня сторінка</h1>
      <p className={styles.description}>
        Корені – аморфні генеалогічні індекси, зібрані з різних джерел в
        пошуковому рушії.
      </p>
      <Suspense fallback={<p>Завантаження...</p>}>
        <Search />
      </Suspense>
      <section className={styles.section}>
        <h2>Наявні таблиці</h2>
        <ul>
          {tablesMetadata.map((tableMetadata) => (
            <li key={tableMetadata.id}>
              <a href={`/${tableMetadata.id}`}>
                {tableMetadata.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
