import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import ProjectHeader from './project-header';

describe('ProjectHeader', () => {
  const mockProject = {
    id: 'project-123',
    title: 'Test Project',
    type: 'confession-list' as const,
    isHandwritten: true,
    location: [48.9, 24.5] as [number, number],
    tableLocale: 'uk' as const,
    yearsRange: [1850, 1900] as [number, number],
    sources: [],
  };

  afterEach(() => {
    cleanup();
  });

  it('renders disabled CTA when existingImagesCount is 0', () => {
    render(
      <ProjectHeader
        projectData={mockProject}
        projectId="project-123"
        existingImagesCount={0}
      />,
    );
    const enterButton = screen.getByTestId('enter-workspace-btn');
    expect(enterButton).toBeDisabled();
  });

  it('renders enabled CTA when existingImagesCount > 0', () => {
    render(
      <ProjectHeader
        projectData={mockProject}
        projectId="project-123"
        existingImagesCount={5}
      />,
    );
    const enterButton = screen.getByTestId('enter-workspace-btn');
    expect(enterButton).not.toBeDisabled();
    expect(enterButton.getAttribute('href')).toContain('projectId=project-123');
  });

  it('displays project title and metadata', () => {
    render(
      <ProjectHeader
        projectData={mockProject}
        projectId="project-123"
        existingImagesCount={5}
      />,
    );
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('confession-list')).toBeInTheDocument();
    expect(screen.getByText('Locale: uk')).toBeInTheDocument();
    expect(screen.getByText('Years: 1850 - 1900')).toBeInTheDocument();
  });
});
