import { useCallback, useEffect, useRef, useState } from 'react';

export function useImageTransform(isLoading: boolean) {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const viewerReference = useRef<HTMLDivElement>(null);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const viewer = viewerReference.current;
    if (!viewer) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      setTransform((previous) => ({
        ...previous,
        scale: Math.min(Math.max(previous.scale * delta, 0.1), 5),
      }));
    };

    viewer.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      viewer.removeEventListener('wheel', handleWheel);
    };
  }, [isLoading]);

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    lastMousePosition.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = event.clientX - lastMousePosition.current.x;
    const deltaY = event.clientY - lastMousePosition.current.y;

    lastMousePosition.current = { x: event.clientX, y: event.clientY };

    setTransform((previous) => ({
      ...previous,
      x: previous.x + deltaX,
      y: previous.y + deltaY,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = useCallback(() => {
    setTransform((previous) => ({
      ...previous,
      scale: Math.min(previous.scale * 1.2, 5),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform((previous) => ({
      ...previous,
      scale: Math.max(previous.scale / 1.2, 0.1),
    }));
  }, []);

  const handleResetTransform = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  return {
    transform,
    isDragging,
    viewerReference,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleZoomIn,
    handleZoomOut,
    handleResetTransform,
  };
}
