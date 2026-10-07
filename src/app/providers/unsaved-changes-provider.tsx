'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const confirmationMessage =
  'У вас є незбережені зміни. Покинути сторінку без збереження?';

interface UnsavedChangesContextValue {
  confirmNavigation: () => boolean;
  register: (registrationId: string, isDirty: boolean) => () => void;
}

interface UnsavedChangesProviderProperties {
  children: ReactNode;
}

// eslint-disable-next-line react-refresh/only-export-components
export const UnsavedChangesContext =
  createContext<UnsavedChangesContextValue | null>(null);

const isEligibleLinkActivation = (
  event: MouseEvent,
  anchor: HTMLAnchorElement,
): boolean => {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (anchor.hasAttribute('download')) return false;
  if (anchor.target !== '' && anchor.target.toLowerCase() !== '_self') {
    return false;
  }

  let destination: URL;
  try {
    destination = new URL(anchor.href, location.href);
  } catch {
    return false;
  }

  if (destination.origin !== location.origin) return false;

  const current = new URL(location.href);
  return (
    current.pathname !== destination.pathname ||
    current.search !== destination.search
  );
};

export default function UnsavedChangesProvider({
  children,
}: UnsavedChangesProviderProperties) {
  const registrationsReference = useRef(new Map<string, boolean>());
  const isDirtyReference = useRef(false);
  const [hasDirtyRegistration, setHasDirtyRegistration] = useState(false);

  const updateAggregateState = useCallback(() => {
    const isDirty = registrationsReference.current.values().some(Boolean);
    isDirtyReference.current = isDirty;
    setHasDirtyRegistration(isDirty);
  }, []);

  const register = useCallback(
    (registrationId: string, isDirty: boolean) => {
      registrationsReference.current.set(registrationId, isDirty);
      updateAggregateState();

      return () => {
        registrationsReference.current.delete(registrationId);
        updateAggregateState();
      };
    },
    [updateAggregateState],
  );

  const confirmNavigation = useCallback((): boolean => {
    if (!isDirtyReference.current) return true;
    try {
      return confirm(confirmationMessage);
    } catch {
      return false;
    }
  }, []);

  const contextValue = useMemo(
    () => ({ confirmNavigation, register }),
    [confirmNavigation, register],
  );

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isDirtyReference.current || !(event.target instanceof Element)) {
        return;
      }

      const anchor = event.target.closest('a');
      if (!anchor || !isEligibleLinkActivation(event, anchor)) return;

      let shouldNavigate: boolean;
      try {
        shouldNavigate = confirm(confirmationMessage);
      } catch {
        shouldNavigate = false;
      }
      if (!shouldNavigate) event.preventDefault();
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!hasDirtyRegistration) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Browser-native beforeunload prompts require this legacy return value.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      event.returnValue = '';
    };

    addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasDirtyRegistration]);

  return (
    <UnsavedChangesContext.Provider value={contextValue}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}
