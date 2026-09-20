'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import requestApi from '@/app/services/api';

import { type Project, projectResponseSchema } from '../../schemata';

import styles from './projects-list.module.css';

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await requestApi('/api/transcribe/projects');
        const data: unknown = await response.json();
        const projectsData = projectResponseSchema.parse(data);
        setProjects(projectsData.projects);
      } catch {
        toast.error('Error loading projects');
      }
    };
    void loadProjects();
  }, []);
  return (
    <section className={styles.section}>
      <h2>Projects</h2>
      {projects.length > 0 ? (
        <ul className={styles.list}>
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                className={styles.projectLink}
                href={`/account/transcribe/transcribe?projectId=${project.id}`}
              >
                {project.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No projects</p>
      )}
    </section>
  );
}
