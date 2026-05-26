'use client';

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
        <p key={project.id}>{project.title}</p>
      ))}
      {projects.length === 0 && <p>No projects</p>}
    </section>
  );
}
