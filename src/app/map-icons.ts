import { Icon, type IconOptions } from 'leaflet';

import filledIconImage from './assets/icons8-marker-40.png';
import blackIconImage from './assets/icons8-marker-50.png';
import whiteIconImage from './assets/icons8-marker-50-white.png';

const defaultIconParameters: Partial<IconOptions> = {
  iconSize: [41, 41],
  iconAnchor: [25, 41],
  popupAnchor: [-4, -37],
  // shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  // shadowSize: [41, 41],
};
export const blackIcon: Icon = new Icon({
  ...defaultIconParameters,
  iconUrl: blackIconImage.src,
});
export const whiteIcon: Icon = new Icon({
  ...defaultIconParameters,
  iconUrl: whiteIconImage.src,
});

export const filledIcon = new Icon({
  ...defaultIconParameters,
  iconUrl: filledIconImage.src,
});
