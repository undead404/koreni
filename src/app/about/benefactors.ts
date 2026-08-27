export interface BenefactorEntry {
  /**
  Full name in Ukrainian nominative case
  */
  name: string;
  /**
  Short descriptor phrase, e.g. "генеалог"
  */
  descriptor: string;
  /**
  Primary link: personally-authored public profile (Facebook)
  */
  primaryUrl: string;
  /**
  Secondary link: SMM-managed public portfolio, optional
  */
  secondaryUrl?: string;
  /**
  Display label for the secondary link, e.g. "Instagram"
  */
  secondaryLabel?: string;
  /**
  Whether this person is the inaugural patron — renders "перший меценат Коренів"
  */
  isFirst: boolean;
}

export const BENEFACTORS: BenefactorEntry[] = [
  {
    name: 'Сергій Фазульянов',
    descriptor: 'генеалог',
    primaryUrl: 'https://www.facebook.com/S.Fazulyanov',
    secondaryUrl: 'https://www.instagram.com/fazu.genealogy/',
    secondaryLabel: 'Instagram',
    isFirst: true,
  },
];
