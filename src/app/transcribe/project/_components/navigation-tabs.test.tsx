import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import NavigationTabs from './navigation-tabs';

describe('NavigationTabs', () => {
  afterEach(() => {
    cleanup();
  });

  it('calls setActiveTab when a tab is clicked', () => {
    const setActiveTab = vi.fn();
    render(<NavigationTabs activeTab="metadata" setActiveTab={setActiveTab} />);

    fireEvent.click(screen.getByText('Asset Manager'));
    expect(setActiveTab).toHaveBeenCalledWith('assets');
  });

  it('applies active class to the current tab', () => {
    render(<NavigationTabs activeTab="assets" setActiveTab={() => {}} />);
    const assetsTab = screen.getByText('Asset Manager');
    // We check for the class name from styles, but in tests it might be a hashed string
    // or just the class name if identity-obj-proxy is used.
    // Given the project structure, it's likely using CSS modules.
    expect(assetsTab.className).toContain('activeTabButton');
  });
});
