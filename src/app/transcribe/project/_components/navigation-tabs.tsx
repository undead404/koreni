import { clsx } from 'clsx';

import { NavigationTabsProperties, TabType } from '../types';

import styles from '../page.module.css';

export default function NavigationTabs({
  activeTab,
  setActiveTab,
}: NavigationTabsProperties) {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'metadata', label: 'Metadata' },
    { id: 'assets', label: 'Asset Manager' },
    { id: 'operations', label: 'Operations' },
  ];

  return (
    <nav className={styles.tabsContainer}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={clsx(styles.tabButton, {
            [styles.activeTabButton]: activeTab === tab.id,
          })}
          onClick={() => {
            setActiveTab(tab.id);
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
