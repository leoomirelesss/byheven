"use client";
import {useEffect, useRef, type HTMLAttributes} from 'react';
import {createVapourRenderer} from '@/lib/vapour-text';
import {cn} from '@/lib/utils';

export interface VapourTextProps extends HTMLAttributes<HTMLHeadingElement> {
  text: string;
  /** Reversible scroll position, 0 = intact and 1 = dispersed. */
  progress: number;
  tag?: 'h1' | 'h2' | 'h3';
}
/** Adapted from the supplied cycle component to a scroll-controlled, accessible title. */
export default function VapourText({text, progress, tag: Tag = 'h1', className, ...props}: VapourTextProps) {
  const title = useRef<HTMLHeadingElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createVapourRenderer>>(null);
  const current = useRef(progress); current.current = progress;
  useEffect(() => {
    if (!title.current || !canvas.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const instance = createVapourRenderer(title.current, canvas.current);
    if (!instance) return;
    renderer.current = instance;
    let active = true;
    const refresh = () => { instance.measure(true); instance.render(reduced.matches ? 0 : current.current); };
    const observer = new ResizeObserver(refresh); observer.observe(title.current);
    document.fonts.ready.then(() => { if (active) refresh(); });
    reduced.addEventListener('change', refresh);
    refresh();
    return () => { active = false; observer.disconnect(); reduced.removeEventListener('change', refresh); instance.destroy(); renderer.current = null; };
  }, [text]);
  useEffect(() => { renderer.current?.render(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : progress); }, [progress]);
  return <Tag ref={title} className={cn('case-vapour-title', className)} {...props}>
    {text.split(' ').map((word, index) => <span key={index}>{index > 0 && ' '}<span data-vapour-word>{word}</span></span>)}
    <canvas ref={canvas} className="case-vapour-canvas" aria-hidden="true" />
  </Tag>;
}
