'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { type Project, projectResponseSchema } from '../schemata';
import requestApi from '../services/api';

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    requestApi('/api/transcribe/projects')
      .then((response) => response.json())
      .then((data: unknown) => {
        const projectsData = projectResponseSchema.parse(data);
        setProjects(projectsData.projects);
        return;
      })
      .catch(() => {
        toast.error('Error loading projects');
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
