"use client";
import Head from "next/head";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

import styles from "./map.module.css";

export interface MapProps {
  coordinates: [number, number];
  title: string;
}

export default function Map({ coordinates, title }: MapProps) {
  return (
    <>
      <Head>
        <script
          defer
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""
        ></script>
      </Head>
      <MapContainer
        center={coordinates}
        className={styles.mapContainer}
        zoom={8}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coordinates}>
          <Popup>{title}</Popup>
        </Marker>
      </MapContainer>
    </>
  );
}