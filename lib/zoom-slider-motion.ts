import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/** Owns only this slider's animations. Text remains server-rendered and readable. */
export function initZoomSlider(root: HTMLElement) {
  if (typeof window === "undefined" || !window.matchMedia || !("ResizeObserver" in window)) return;
  let disposed = false;
  let media: ReturnType<typeof gsap.matchMedia> | undefined;

  const setup = () => {
    if (disposed || !root.isConnected) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    media = gsap.matchMedia();
    media.add({
      always: "(min-width: 0px)",
      reduced: "(prefers-reduced-motion: reduce)",
      short: "(max-height: 499px)",
      narrow: "(max-width: 760px)",
    }, context => {
      if (context.conditions?.reduced || context.conditions?.short) return;
      const narrow = !!context.conditions?.narrow;
      const splits: SplitText[] = [];
      root.querySelectorAll<HTMLElement>("[data-zoom-row]").forEach(row => {
        const frame = row.querySelector<HTMLElement>("[data-zoom-frame]");
        const poster = row.querySelector<HTMLElement>("[data-zoom-poster]");
        const title = row.querySelector<HTMLElement>("[data-zoom-title]");
        const description = row.querySelector<HTMLElement>("[data-zoom-description]");
        const details = row.querySelector<HTMLElement>("[data-zoom-details]");
        if (!frame || !poster || !title || !description) return;

        const movement = gsap.timeline({scrollTrigger: {
          trigger: row, start: "top 92%", end: "center 50%", scrub: .65, invalidateOnRefresh: true,
        }});
        movement.fromTo(frame,
          {clipPath: narrow ? "inset(8% 8% 0% 0%)" : "inset(16% 14% 0% 0%)", scale: narrow ? .97 : .94, transformOrigin: "left bottom"},
          {clipPath: "inset(0% 0% 0% 0%)", scale: 1, ease: "none", duration: 1}, 0);
        movement.fromTo(poster, {yPercent: narrow ? 5 : 10, scale: 1.06}, {yPercent: 0, scale: 1, ease: "none", duration: 1}, 0);
        movement.fromTo(details ? [description, details] : [description], {y: 14, opacity: .65}, {y: 0, opacity: 1, ease: "none", duration: .7}, .15);

        splits.push(SplitText.create(title, {
          type: "lines", mask: "lines", autoSplit: true, aria: "auto", linesClass: "zoom-title-line",
          onSplit(self) {
            return gsap.fromTo(self.lines, {yPercent: 105}, {
              yPercent: 0, duration: 1, stagger: .08, ease: "power2.out",
              scrollTrigger: {trigger: row, start: "top 88%", end: "top 56%", scrub: .45, invalidateOnRefresh: true},
            });
          },
        }));
      });
      return () => splits.forEach(split => split.revert());
    }, root);
  };

  void (document.fonts?.ready || Promise.resolve()).then(setup);
  return () => { disposed = true; media?.revert(); };
}
