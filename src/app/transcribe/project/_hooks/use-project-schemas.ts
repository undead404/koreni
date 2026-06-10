import { useEffect, useState } from 'react';

import getProjectSchemas from '../../api/get-project-schemas';

export function useProjectSchemas() {
  const [schemas, setSchemas] = useState<
    { enabled: boolean; label: string; value: string }[]
  >([]);

  useEffect(() => {
    let active = true;
    const loadSchemas = async () => {
      try {
        const data = await getProjectSchemas();
        if (active) {
          setSchemas(data);
        }
      } catch {
        /* ignore */
      }
    };
    void loadSchemas();
    return () => {
      active = false;
    };
  }, []);

  return schemas;
}
