const SITES_MAPPING: Record<string, string> = {
  'docs.google.com': 'Google Docs',
};

export default function SourceLink({ href }: { href: string }) {
  try {
    const url = new URL(href);
    const host = url.host;
    return (
      <a href={url.toString()} target="_blank">
        {SITES_MAPPING[host] || host}
      </a>
    );
  } catch (error) {
    console.error(error);
    return href;
  }
}
