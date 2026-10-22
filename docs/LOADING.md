# Initial readiness

Eight public documents share a small loading gate using the supplied handwritten logo. The optimized WebP preserves its composition; Only the supplied signature pulses over the existing page. A separate black layer at 60% opacity dims the page; keeping it outside the signature’s screen-blended layer preserves both the dimming and the logo’s transparent ink. There is no blur, texture, visible text, button or progress indicator. After readiness, the pulse pauses, the signature fades over 260 ms and the black layer clears over 680 ms with a 60 ms offset; cleanup completes at 760 ms. Reduced motion skips both fades. No generated percentage or mandatory display duration is used.

Home desktop waits for the real GLB first draw and font readiness. The retired CSS hardware is removed from HTML and styles; its empty position anchor retains the approved sizing and scroll geometry. The canvas remains transparent until the real model is ready. WebGL/import failure continues without drawing a substitute device.

The renderer compiles shaders before revealing the model. Only the first screen texture gates the opening; later textures load afterwards. Context restoration draws before revealing the canvas again.

Mobile keeps the approved static render and waits for decode. Case pages wait only for their own hero image and fonts. Below-the-fold assets never block entry. Same-document anchors and later lazy media never reopen the gate.

Escape exits the loader immediately. A 10-second deadline, image/error handling, reduced motion, original inert-state restoration, focus transfer, BFCache cleanup prevent loading traps. JavaScript-disabled navigation remains available.

Validation: npm run test:loading, existing motion/mobile checks, TypeScript, SEO and the full preview build. Phone source changes must be bundled with node tools/phone/build.mjs; dependencies for this development tool are installed separately in tools/phone.
