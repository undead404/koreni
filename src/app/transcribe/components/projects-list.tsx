'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import environment from '@/app/environment';
import { initBugsnag } from '@/app/services/bugsnag';

import { type Project, projectResponseSchema } from '../schemata';

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    fetch(
      new URL('/api/transcribe/projects', environment.NEXT_PUBLIC_API_SITE),
      {
        credentials: 'include',
      },
    )
      .then((response) => response.json())
      .then((data: unknown) => {
        console.log(data);
        const projectsData = projectResponseSchema.parse(data);
        setProjects(projectsData.projects);
        return;
      })
      .catch((error: unknown) => {
        toast.error('Error loading projects');
        console.error(error);
        initBugsnag().notify(error as Error);
      });
  }, []);
  return (
    <section>
      <h1>Projects</h1>
      {projects.map((project) => (
        <p key={project.id}>{project.title}</p>
      ))}
      {projects.length === 0 && <p>No projects</p>}
    </section>
  );
}
