import { useCallback, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface TiltOptions {
  max?: number; // 最大倾角（度）
  scale?: number; // hover 缩放
}

/**
 * 3D tilt 鼠标视差交互（docs/design-v0.1.md §6）。使用 CSS transform 的 perspective/rotateX/rotateY。
 * 在 prefers-reduced-motion 下完全关闭（返回空 handler，不附加任何 transform）。
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>(options: TiltOptions = {}) {
  const { max = 10, scale = 1.02 } = options;
  const ref = useRef<T | null>(null);
  const reduced = useReducedMotion();

  const onMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      if (reduced || !ref.current) return;
      const el = ref.current;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1
      const rotateY = (px - 0.5) * 2 * max;
      const rotateX = -(py - 0.5) * 2 * max;
      el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
    },
    [reduced, max, scale],
  );

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
  }, []);

  const bind = reduced
    ? {}
    : { ref, onMouseMove, onMouseLeave };

  return { ref, bind };
}
