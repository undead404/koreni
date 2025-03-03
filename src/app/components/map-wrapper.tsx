"use client";
import { lazy, Suspense, useCallback, useState } from "react";

import { type MapProps } from "./map";

const Map = lazy(() => import("./map"));

import styles from "./map-wrapper.module.css";

export default function MapWrapper(props: MapProps & {open?: boolean}) {
  const [show, setShow] = useState(props.open);
  const handleClick = useCallback(() => {
    setShow(true);
  }, []);

  return (
    <details className={styles.location} onClick={handleClick} open={props.open}>
      <summary>
        <h3>Місце</h3>
      </summary>
      <Suspense fallback={<p>Завантаження...</p>}>
        {show && <Map {...props} />}
      </Suspense>
    </details>
  );
}