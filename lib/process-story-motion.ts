import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** One reversible, scroll-scrubbed sequence; CSS sticky keeps the native document flow. */
export function initProcessStory(root: HTMLElement) {
  if (typeof window === "undefined" || !window.matchMedia) return;
  let disposed = false;
  let media: ReturnType<typeof gsap.matchMedia> | undefined;

  const setup = () => {
    if (disposed || !root.isConnected) return;
    gsap.registerPlugin(ScrollTrigger);
    media = gsap.matchMedia();
    media.add({
      always: "(min-width: 0px)",
      reduced: "(prefers-reduced-motion: reduce)",
      short: "(max-height: 649px)",
      narrow: "(max-width: 760px)",
    }, context => {
      if (context.conditions?.reduced || context.conditions?.short) return;
      const pages = [...root.querySelectorAll<HTMLElement>("[data-process-page]")];
      const indices = [...root.querySelectorAll<HTMLElement>("[data-process-index]")];
      const fill = root.querySelector<HTMLElement>("[data-process-fill]");
      const dot = root.querySelector<HTMLElement>("[data-process-dot]");
      if (!pages.length || pages.length !== indices.length || !fill || !dot) return;
      if (pages.some(page => !page.querySelector("[data-process-line]"))) return;

      root.classList.add("is-process-story");
      const interval = 1;
      const duration = pages.length * interval;
      gsap.set(pages, { autoAlpha: 0 });
      const sequence = gsap.timeline({ scrollTrigger: {
        trigger: root, start: "top top", end: "bottom bottom", scrub: .45,
        invalidateOnRefresh: true,
      }});

      pages.forEach((page, index) => {
        const start = index * interval;
        const lines = page.querySelectorAll<HTMLElement>("[data-process-line]");
        const copy = page.querySelectorAll<HTMLElement>("[data-process-copy]");
        sequence.set(page, { autoAlpha: 1 }, start);
        sequence.fromTo(lines, { yPercent: 112 }, {
          yPercent: 0, duration: .23, stagger: .035, ease: "power2.out",
        }, start);
        sequence.fromTo(copy, { y: 22, opacity: 0 }, {
          y: 0, opacity: 1, duration: .22, stagger: .03, ease: "power1.out",
        }, start + .06);
        sequence.to(indices[index], { color: "#ceced7", duration: .18, ease: "none" }, start);

        if (index < pages.length - 1) {
          sequence.to(lines, { yPercent: -112, duration: .20, stagger: .025, ease: "power1.in" }, start + .74);
          sequence.to(copy, { y: -18, opacity: 0, duration: .17, ease: "power1.in" }, start + .74);
          sequence.set(page, { autoAlpha: 0 }, start + .995);
          sequence.to(indices[index], { color: "#887b96", duration: .18, ease: "none" }, start + .8);
        }
      });
      // Both start empty; the dot travels only as far as the currently revealed step.
      sequence.fromTo(fill, { scaleY: 0 }, { scaleY: 1, duration: duration - .72, ease: "none" }, .04);
      sequence.fromTo(dot, { top: "0%" }, { top: "100%", duration: duration - .72, ease: "none" }, .04);
      sequence.fromTo(dot, { opacity: 0 }, { opacity: 1, duration: .15, ease: "none" }, .04);
      // Keep the final step readable before the sticky stage releases into the FAQ.
      sequence.to({}, { duration: .72 }, duration - .72);
      ScrollTrigger.refresh();
      return () => { root.classList.remove("is-process-story"); };
    }, root);
  };

  void (document.fonts?.ready || Promise.resolve()).then(setup);
  return () => { disposed = true; media?.revert(); };
}
