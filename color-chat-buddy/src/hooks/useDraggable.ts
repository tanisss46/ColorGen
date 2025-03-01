import { useState, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

export const useDraggable = (ref: React.RefObject<HTMLElement>) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (ref.current && e.target === ref.current) {
      setIsDragging(true);
      setPosition({
        x: e.clientX - ref.current.offsetLeft,
        y: e.clientY - ref.current.offsetTop
      });
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && ref.current) {
      const newX = e.clientX - position.x;
      const newY = e.clientY - position.y;
      
      ref.current.style.left = `${newX}px`;
      ref.current.style.top = `${newY}px`;
    }
  }, [isDragging, position]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      element.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        element.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [ref, handleMouseDown, handleMouseMove, handleMouseUp]);

  return { isDragging };
};
