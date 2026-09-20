'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import requestApi from '@/app/services/api';

import { type Project, projectResponseSchema } from '../../schemata';

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
    <section>
      <h2>Projects</h2>
      {projects.map((project) => (
        <Link
          href={`/account/transcribe/transcribe?projectId=${project.id}`}
          key={project.id}
        >
          {project.title}
        </Link>
      ))}
      {projects.length === 0 && <p>No projects</p>}
    </section>
  );
}
