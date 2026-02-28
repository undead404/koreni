export {};

declare global {
  // This covers 'window.remark_config'
  interface Window {
    remark_config: RemarkConfig;
    REMARK42: Remark42Instance;
  }

  // This covers 'globalThis.remark_config'
  var remark_config: RemarkConfig;
  var REMARK42: Remark42Instance;
}

interface RemarkConfig {
  host: string;
  locale: string;
  site_id: string;
  theme: 'light' | 'dark';
  url: string;
  components: string[];
}

interface Remark42Instance {
  createInstance: (
    parameters: RemarkConfig & {
      node: HTMLElement | null;
    },
  ) => Remark42Instance;
  destroy: () => void;
  changeTheme: (theme: 'light' | 'dark') => void;
}
