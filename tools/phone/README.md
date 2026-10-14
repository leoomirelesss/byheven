# Phone scene

Original unbranded graphite phone, exported as `assets/phone/heven-phone.glb`.
The scene uses this GLB, not the older CSS silhouette. `Display` is a rounded
screen mesh with glTF UVs; the three PLIEGUE WebP textures are loaded separately.

From this folder, `npm ci` then `npm run build` regenerates the GLB and the bundled
browser runtime. Static deployment requires no Node build step or external CDN.
Keep the Three.js license beside the generated files.

`shopify-hero.js` owns the scroll timeline and emits `flow:pose`; the renderer
subscribes to those poses and renders on demand. It stops rendering outside the
hero or while the tab is hidden. Missing WebGL, a failed model request, or context
loss leave the image/CSS fallback visible. Reduced motion stacks the story and
keeps the phone still. `phone-model.html` provides front/back, screen selection,
and pointer rotation for visual review.

The GLB is geometry and materials; the three screen textures are separate assets.
PLIEGUE is an illustrative fictional store, not a connected Shopify storefront.
