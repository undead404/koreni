'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import getProjects from '../api/get-projects';
import { type Project } from '../schemata';

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => {
        toast.error('Error loading projects');
      });
  }, []);
  return (
    <section>
      <h1>Projects</h1>
      {projects.map((project) => (
        <Link
          href={`/transcribe/workspace?projectId=${project.id}`}
          key={project.id}
        >
          {project.title}
        </Link>
      ))}
      {projects.length === 0 && <p>No projects</p>}
    </section>
  );
}
