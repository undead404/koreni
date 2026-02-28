export interface ContributeFormProperties {
  knownLocations: {
    coordinates: [number, number];
    title: string;
  }[];
}
export interface ContributeFormValues {
  archiveItems: string;
  authorEmail: string;
  authorGithubUsername: string;
  authorName: string;
  id: string;
  location: string;
  periodType: string;
  sources: string;
  table: FileList | null;
  tableLocale?: 'pl' | 'ru' | 'uk';
  title: string;
  year: number;
  yearEnd: number;
  yearStart: number;
}
