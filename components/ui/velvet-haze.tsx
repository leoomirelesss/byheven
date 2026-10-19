"use client";
import {useEffect, useRef, type ReactNode} from 'react';
import {createStaticVelvetHaze} from '@/lib/velvet-haze';
import {cn} from '@/lib/utils';

/** Frozen Velvet Haze in the site's palette. No mouse response or animation loop. */
export default function VelvetHaze({height = '100svh', className, children}: {height?: string; className?: string; children?: ReactNode}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (canvas.current) return createStaticVelvetHaze(canvas.current) || undefined; }, []);
  return <div className={cn('relative isolate overflow-hidden', className)} style={{height, background: '#090909'}}>
    <div className="case-index-atmosphere" style={{position:'absolute'}} aria-hidden="true"><canvas ref={canvas} className="case-haze-canvas" /></div>
    <div className="relative">{children}</div>
  </div>;
}
