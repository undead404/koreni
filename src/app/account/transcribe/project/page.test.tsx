import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { SWRConfig } from 'swr';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  Mock,
  vi,
} from 'vitest';

import AccountHeader from '../../components/account-header';
import getProjectSchemas from '../api/get-project-schemas';
import saveProjectImage from '../api/save-project-image';

import ProjectDetailsPage from './page';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('../api/get-project-schemas', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../api/save-project-image', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createProject = (id: string, title = 'Mock Project') => ({
  id,
  isHandwritten: true,
  location: [48.9, 24.5],
  sources: [],
  tableLocale: 'uk',
  title,
  type: 'table',
  yearsRange: [1850, 1900],
});

const createImage = (id: string, transcription: string | null = null) => ({
  id,
  projectId: 'project-123',
  storageKey: `${id}.jpg`,
  pageSequence: 1,
  transcription,
});

const server = setupServer(
  http.get('*/api/auth/me', () =>
    HttpResponse.json({ user: { email: 'user@example.com', id: 'user-1' } }),
  ),
  http.get('*/api/transcribe/projects/:projectId', ({ params }) =>
    HttpResponse.json({
      success: true,
      project: createProject(String(params.projectId)),
    }),
  ),
  http.put('*/api/transcribe/projects/:projectId', () =>
    HttpResponse.json({ success: true }),
  ),
  http.get('*/api/transcribe/project/:projectId/images', () =>
    HttpResponse.json({ success: true, images: [] }),
  ),
);

vi.mock('@/app/components/contribute/sources-input', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="sources-input">Sources Input</div>),
}));

vi.mock('@/app/components/contribute/spatial-input', () => ({
  __esModule: true,
  SpatialInput: vi.fn(({ value, onChange }) => (
    <div data-testid="spatial-input">
      <input
        data-testid="spatial-input-field"
        value={value}
        onChange={(event_) => onChange(event_.target.value)}
      />
    </div>
  )),
}));

vi.mock('@/app/components/contribute/years-input', () => ({
  __esModule: true,
  default: vi.fn(({ value, onChange }) => (
    <div data-testid="years-input">
      <input
        data-testid="years-input-field"
        value={value ? value.join(',') : ''}
        onChange={(event_) => {
          const value_ = event_.target.value;
          onChange(value_ ? value_.split(',').map(Number) : []);
        }}
      />
    </div>
  )),
}));

const renderProjectPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <AccountHeader />
      <ProjectDetailsPage />
    </SWRConfig>,
  );

describe('ProjectDetailsPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
    (usePathname as Mock).mockReturnValue('/account/transcribe/project');
    (useRouter as Mock).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
    });
    (getProjectSchemas as Mock).mockResolvedValue([
      {
        enabled: true,
        label: 'Late russian confession list',
        value: 'confession-list',
      },
    ]);
  });

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  afterAll(() => {
    server.close();
  });

  it('redirects to /account/transcribe if projectId parameter is missing', async () => {
    const projectRequest = vi.fn();
    const imagesRequest = vi.fn();
    server.use(
      http.get('*/api/transcribe/projects/:projectId', ({ params }) => {
        projectRequest(params.projectId);
        return HttpResponse.json({
          success: true,
          project: createProject(String(params.projectId)),
        });
      }),
      http.get('*/api/transcribe/project/:projectId/images', ({ params }) => {
        imagesRequest(params.projectId);
        return HttpResponse.json({ success: true, images: [] });
      }),
    );
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });

    renderProjectPage();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/account/transcribe');
    });
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    expect(projectRequest).not.toHaveBeenCalled();
    expect(imagesRequest).not.toHaveBeenCalled();
  });

  it('redirects to /account/transcribe if projectId parameter is invalid', async () => {
    const projectRequest = vi.fn();
    const imagesRequest = vi.fn();
    server.use(
      http.get('*/api/transcribe/projects/:projectId', ({ params }) => {
        projectRequest(params.projectId);
        return HttpResponse.json({
          success: true,
          project: createProject(String(params.projectId)),
        });
      }),
      http.get('*/api/transcribe/project/:projectId/images', ({ params }) => {
        imagesRequest(params.projectId);
        return HttpResponse.json({ success: true, images: [] });
      }),
    );
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('invalid_id_#'),
    });

    renderProjectPage();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/account/transcribe');
    });
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    expect(projectRequest).not.toHaveBeenCalled();
    expect(imagesRequest).not.toHaveBeenCalled();
  });

  it('renders CTA "Enter Workspace" as disabled if the fetched image list has 0 images', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    const projectRequest = vi.fn();
    server.use(
      http.get('*/api/transcribe/projects/:projectId', ({ params }) => {
        projectRequest(params.projectId);
        return HttpResponse.json({
          success: true,
          project: createProject(String(params.projectId)),
        });
      }),
    );

    renderProjectPage();

    // Wait for load to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading project details...'),
      ).not.toBeInTheDocument();
    });

    const enterButton = screen.getByTestId('enter-workspace-btn');
    expect(enterButton).toBeDisabled();
    expect(projectRequest).toHaveBeenCalledTimes(1);
  });

  it('renders CTA "Enter Workspace" as active if the fetched image list is non-empty', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    server.use(
      http.get('*/api/transcribe/project/:projectId/images', () =>
        HttpResponse.json({
          success: true,
          images: [createImage('img-1')],
        }),
      ),
    );

    renderProjectPage();

    await waitFor(() => {
      expect(
        screen.queryByText('Loading project details...'),
      ).not.toBeInTheDocument();
    });

    const enterButton = screen.getByTestId('enter-workspace-btn');
    expect(enterButton).not.toBeDisabled();
    const href = enterButton.getAttribute('href');
    expect(
      href === '/account/transcribe/workspace?projectId=project-123' ||
        href === '/account/transcribe/workspace/?projectId=project-123',
    ).toBe(true);
  });

  it('does not render editable project data when loading the project fails', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    server.use(
      http.get(
        '*/api/transcribe/projects/:projectId',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    renderProjectPage();

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load project details.'),
      ).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
  });

  it('switches tabs cleanly on tab button clicks', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    server.use(
      http.get('*/api/transcribe/project/:projectId/images', () =>
        HttpResponse.json({
          success: true,
          images: [createImage('img-1', 'Прізвище')],
        }),
      ),
    );

    renderProjectPage();

    await waitFor(() => {
      expect(
        screen.queryByText('Loading project details...'),
      ).not.toBeInTheDocument();
    });

    // Should initially show Metadata form
    expect(screen.getByLabelText('Title')).toBeInTheDocument();

    // Click on Asset Manager Tab
    const assetsTabButton = screen.getByText('Asset Manager');
    fireEvent.click(assetsTabButton);

    // Verify Asset Manager subview is active (has Select Images / Select More Images)
    await waitFor(() => {
      expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
      expect(screen.getByText('Upload Images')).toBeInTheDocument();
    });

    // Click on Operations Tab
    const operationsTabButton = screen.getByText('Operations');
    fireEvent.click(operationsTabButton);

    // Verify Operations view
    await waitFor(() => {
      expect(screen.getByText('Data Export Options')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Future features will include data exports to CSV, JSON, and XML format.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('submits metadata form edits successfully and triggers sonner success toast', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    const projectRequest = vi.fn();
    let title = 'Original Title';
    const updateRequest = vi.fn();
    server.use(
      http.get('*/api/transcribe/projects/:projectId', ({ params }) => {
        projectRequest(params.projectId);
        return HttpResponse.json({
          success: true,
          project: createProject(String(params.projectId), title),
        });
      }),
      http.put('*/api/transcribe/projects/:projectId', async ({ request }) => {
        const body: unknown = await request.json();
        updateRequest(body);
        title = 'Updated Project Title';
        return HttpResponse.json({ success: true });
      }),
    );
    renderProjectPage();

    await waitFor(() => {
      expect(
        screen.queryByText('Loading project details...'),
      ).not.toBeInTheDocument();
    });

    // Modify Title field
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, {
      target: { value: 'Updated Project Title' },
    });

    // Submit form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateRequest).toHaveBeenCalledWith({
        title: 'Updated Project Title',
        type: 'table',
        isHandwritten: true,
        location: [48.9, 24.5],
        tableLocale: 'uk',
        yearsRange: [1850, 1900],
        sources: [],
      });
      expect(toast.success).toHaveBeenCalledWith(
        'Project details updated successfully',
      );
      expect(projectRequest).toHaveBeenCalledTimes(2);
      expect(updateRequest).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toHaveValue(
        'Updated Project Title',
      );
    });
  });

  it.each([null, '', ' '.repeat(3)])(
    'keeps Operations gated for transcription value %j',
    async (transcription) => {
      (useSearchParams as Mock).mockReturnValue({
        get: vi.fn().mockReturnValue('project-123'),
      });
      server.use(
        http.get('*/api/transcribe/project/:projectId/images', () =>
          HttpResponse.json({
            success: true,
            images: [createImage('img-1', transcription)],
          }),
        ),
      );

      renderProjectPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Operations'));

      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith(
        'Операції доступні після збереження результату транскрибування',
      );
    },
  );

  it('revalidates image data after a successful upload and updates workspace gating', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    let isUploadCompleted = false;
    const imageRequests = vi.fn();
    vi.mocked(saveProjectImage).mockImplementation(async () => {
      isUploadCompleted = true;
    });
    server.use(
      http.get('*/api/transcribe/project/:projectId/images', () => {
        imageRequests();
        return HttpResponse.json({
          success: true,
          images: isUploadCompleted ? [createImage('new-image')] : [],
        });
      }),
    );
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:preview'),
        revokeObjectURL: vi.fn(),
      }),
    );

    renderProjectPage();

    await screen.findByLabelText('Title');
    expect(screen.getByTestId('enter-workspace-btn')).toBeDisabled();
    fireEvent.click(screen.getByText('Asset Manager'));
    const imageInput = screen.getByTestId('project-image-input');
    fireEvent.change(imageInput, {
      target: {
        files: [new File(['image'], 'scan.jpg', { type: 'image/jpeg' })],
      },
    });
    fireEvent.click(screen.getByText('Start Uploading 1 Images'));

    await waitFor(() => {
      expect(imageRequests).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('enter-workspace-btn')).not.toBeDisabled();
    });
    expect(saveProjectImage).toHaveBeenCalledWith(
      'project-123',
      expect.any(String),
      expect.any(File),
      1,
      expect.any(AbortSignal),
    );
  });

  it('ignores responses and image state from a previous project ID', async () => {
    let projectId = 'first-project';
    const searchParametersFor = (id: string) => ({
      get: vi.fn().mockReturnValue(id),
    });
    (useSearchParams as Mock).mockReturnValue(searchParametersFor(projectId));
    const projectRequests = vi.fn();
    const imageRequests = vi.fn();
    server.use(
      http.get('*/api/transcribe/projects/:projectId', async ({ params }) => {
        projectRequests(params.projectId);
        if (params.projectId === 'first-project') await delay(50);
        return HttpResponse.json({
          success: true,
          project: createProject(
            String(params.projectId),
            String(params.projectId),
          ),
        });
      }),
      http.get(
        '*/api/transcribe/project/:projectId/images',
        async ({ params }) => {
          imageRequests(params.projectId);
          if (params.projectId === 'first-project') await delay(50);
          return HttpResponse.json({
            success: true,
            images:
              params.projectId === 'first-project'
                ? [createImage('first-image')]
                : [],
          });
        },
      ),
    );

    const view = renderProjectPage();
    await waitFor(() => {
      expect(projectRequests).toHaveBeenCalledWith('first-project');
      expect(imageRequests).toHaveBeenCalledWith('first-project');
    });

    projectId = 'second-project';
    (useSearchParams as Mock).mockReturnValue(searchParametersFor(projectId));
    view.rerender(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountHeader />
        <ProjectDetailsPage />
      </SWRConfig>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toHaveValue('second-project');
    });
    expect(screen.getByTestId('enter-workspace-btn')).toBeDisabled();
    await delay(70);
    expect(screen.queryByDisplayValue('first-project')).not.toBeInTheDocument();
    expect(screen.getByTestId('enter-workspace-btn')).toBeDisabled();
    expect(
      screen.queryByText('Транскрибування first-project'),
    ).not.toBeInTheDocument();
  });

  it('treats an invalid image schema response as a load failure, not an empty list', async () => {
    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn().mockReturnValue('project-123'),
    });
    server.use(
      http.get('*/api/transcribe/project/:projectId/images', () =>
        HttpResponse.json({ success: true, images: [{ id: 'incomplete' }] }),
      ),
    );

    renderProjectPage();

    expect(
      await screen.findByText('Failed to load project details.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('enter-workspace-btn')).not.toBeInTheDocument();
  });
});
