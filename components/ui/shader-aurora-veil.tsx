"use client";
import {useEffect, useRef, type ReactNode} from 'react';
import {createStaticAuroraVeil} from '@/lib/aurora-veil';
import {cn} from '@/lib/utils';

/** Shared native renderer: no theme provider, pointer tracking or perpetual animation. */
export function WebsiteShaderCanvas({className, children}: {className?: string; children?: ReactNode}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (canvas.current) return createStaticAuroraVeil(canvas.current) || undefined; }, []);
  return <div className={cn('relative isolate overflow-hidden bg-[#08070a]', className)}>
    <div className="case-detail-atmosphere" style={{position:'absolute'}} aria-hidden="true"><canvas ref={canvas} className="case-haze-canvas" /></div>
    <div className="relative">{children}</div>
  </div>;
}
export default WebsiteShaderCanvas;
