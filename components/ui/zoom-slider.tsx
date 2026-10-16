"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { initZoomSlider } from "@/lib/zoom-slider-motion";

export interface ZoomSliderItem {
  number: string;
  src: string;
  title: string;
  desc: string;
  eyebrow?: string;
  details?: readonly string[];
  imageAlt?: string;
}

export interface ZoomSliderCompProps {
  sliderData: readonly ZoomSliderItem[];
  title?: string;
  subheading?: string;
  className?: string;
}

// The supplied zoom reference is adapted to finite, native-scroll editorial rows.
export function ZoomSliderComp({ sliderData, title, subheading, className }: ZoomSliderCompProps) {
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (root.current) return initZoomSlider(root.current);
  }, [sliderData]);

  return (
    <div ref={root} className={cn("zoom-slider", className)} data-zoom-slider>
      {title ? <header className="zoom-slider-heading"><h2>{title}</h2>{subheading ? <p>{subheading}</p> : null}</header> : null}
      {sliderData.map((item, index) => (
        <article className="zoom-slider-row" data-zoom-row key={`${item.number}-${item.title}`} aria-labelledby={`${id}-step-${index}`}>
          <figure className="zoom-slider-media" aria-hidden={item.imageAlt ? undefined : true}>
            <div className="zoom-slider-frame" data-zoom-frame>
              <div className="zoom-slider-poster" data-zoom-poster>
                <span className="zoom-slider-poster-index">({item.number})</span>
                <img src={item.src} alt={item.imageAlt || ""} width={640} height={640} loading="lazy" decoding="async" draggable={false} />
                <span className="zoom-slider-poster-label">{item.eyebrow || item.title}</span>
              </div>
            </div>
          </figure>
          <div className="zoom-slider-copy">
            <p className="zoom-slider-kicker"><span>({item.number})</span><span aria-hidden="true">·</span>{item.eyebrow || "Etapa"}</p>
            <h3 id={`${id}-step-${index}`} data-zoom-title>{item.title}</h3>
            <p className="zoom-slider-description" data-zoom-description>{item.desc}</p>
          </div>
          {item.details?.length ? <div className="zoom-slider-details" data-zoom-details><p>En esta etapa</p><ul>{item.details.map(detail => <li key={detail}>{detail}</li>)}</ul></div> : null}
        </article>
      ))}
    </div>
  );
}

export default ZoomSliderComp;
