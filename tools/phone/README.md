# Phone scene

The active GLB is adapted from the user-supplied iphone-17-pro.zip.
This is a third-party iPhone model, not an original BY HEVEN design. The archive
contains no license or creator metadata; retain the source download URL to
confirm attribution before production publication.

The model was reduced from 25.66 MB to about 1.75 MB with smaller WebP material
textures, welding, deduplication and quantization. The PLIEGUE home screen is
embedded; the runtime swaps it with three external screen textures.

From this folder: npm ci; node import-iphone.mjs /path/to/original.glb;
npm run build; npm test. Static deployment needs no build or external CDN.
Keep the Three.js license beside the generated files.

shopify-hero.js owns the reversible timeline and emits flow:pose. Rendering
uses the CSS phone width so mobile and WebGL stay aligned. The text moves
vertically by the scroll distance, with no crossfade. Each chapter transition
makes a full turn, swaps screens with the back visible, then holds a front view.
The final chapter has extra scroll space to read before leaving the scene.
Rendering
stops outside the hero and while the tab is hidden. Reduced motion leaves the
phone static. The review page supports front/back and screen selection, with
static renders for browsers without WebGL. Offline renders check the geometry
and screen mapping. Browser GPU verification must use a WebGL-capable browser.

PLIEGUE is a fictional demo, not a connected Shopify storefront.
