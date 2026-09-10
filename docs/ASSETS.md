# Media and design provenance

Reference: https://spaceonetechnology.com/ (reviewed September 9, 2026).

The public design carries forward the source site’s people-first photography, paired technology/talent paths, clear service grouping, and collaboration video. It uses its own sage, charcoal, warm white, and rust palette, quieter navigation, an editorial heading scale, and consistent Tailwind tokens. No stock portraits are presented as named Space One employees.

Active original URLs are centralized in `src/lib/public/assets.ts`:

- Collaboration photo: https://spaceonetechnology.com/wp-content/uploads/2025/09/71-home-1-1-1024x645.webp
- Responsive photo: https://spaceonetechnology.com/wp-content/uploads/2025/09/71-home-1-1-600x378.webp
- Collaboration video: https://spaceonetechnology.com/wp-content/uploads/2025/09/71-home-1-video.mp4

The video is user-controlled, muted initially, inline, and `preload="none"`; it is not an autoplay background. The hero image has explicit dimensions, responsive sources, and priority loading. Other photos are lazy-loaded. CSP permits media only from the specified Space One host, alongside the application’s own assets.

The public pages use the original remote URLs as requested; there are no duplicated photography files in the deployment. Font files are served locally through Fontsource. Icons are Lucide SVG components.

## Homepage refresh — September 10, 2026

The homepage now pairs DM Sans with a system serif for selected headings, keeping the existing forest, sage, warm-white, and rust colors. The hero uses the original collaboration photo, a framed crop, an editorial caption, and illustrative overlapping avatars. The scrolling services ribbon has a pause/resume control, pauses on hover or focus, and becomes a static wrapped list under reduced-motion preferences. Duplicate ribbon content is hidden from assistive technology.

Added original media URLs from the supplied HTML:

- Avatars: `https://spaceonetechnology.com/wp-content/uploads/2025/09/71-home-1-client-{1…5}.webp`
- Service artwork: `https://spaceonetechnology.com/wp-content/uploads/2025/08/71-project-1-1024x673.webp`
- Editorial artwork: `https://spaceonetechnology.com/wp-content/uploads/2025/08/71-project-{2…4}-1024x673.webp`

Portraits are decorative and do not imply named employees, endorsements, ratings, or verified customer counts. The client workspace illustration describes existing functionality without displaying real candidate data. Service details use keyboard-operable buttons with expanded state and associated panels. Header and footer logo paths are root-relative so nested routes load the same asset.

## Public-page design extension

The homepage visual language extends to the service directory and nine service pages, company pages, careers and preparation guide, contact form, engagement models, nine product concepts, nine insight articles, and policy pages. Account access screens share an illustrated side panel. Styling is scoped to public layouts and account components so portal layouts can be developed separately.

Headlines use the existing DM Sans with restrained Georgia italic emphasis. Original hosted image URLs are retained. Contact links carry the relevant inquiry topic into the form. Article contents use native expandable navigation, and avatar groups wrap on narrow screens.

Validation: Svelte diagnostics and the Cloudflare production build; existing public-route integration checks covering sitemap pages, legacy redirects, and protected routes; browser review at desktop and phone widths. This design change needs no database migration or new environment variables.
