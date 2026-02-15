'use client';

import Giscus, { type Repo } from '@giscus/react';

import environment from '../environment';

export default function Comments() {
  return (
    <div className="mt-10 pt-10 border-t border-gray-200">
      <h2 className="text-2xl font-bold mb-6">Обговорення та запитання</h2>
      <Giscus
        id="comments"
        repo={environment.NEXT_PUBLIC_GITHUB_REPO as Repo}
        repoId={environment.NEXT_PUBLIC_GISCUS_REPO_ID}
        category="Announcements"
        categoryId={environment.NEXT_PUBLIC_GISCUS_CATEGORY_ID}
        mapping="pathname" // Найважливіше: прив'язка до URL
        term="Welcome to @giscus/react component!"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="preferred_color_scheme" // Автоматично підтягне темну/світлу тему ОС
        lang="uk" // Український інтерфейс
        loading="lazy"
      />
    </div>
  );
}
