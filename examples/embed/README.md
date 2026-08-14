# Embed — framework components

Drop-in components for the four frameworks people most often ask about:

| File | Framework |
| --- | --- |
| `react.jsx` | React |
| `nextjs.tsx` | Next.js (App Router, client component) |
| `vue.vue` | Vue 3 |
| `angular.ts` | Angular |

Each wraps the same `embed.js` loader and handles the one thing a framework
makes awkward: mounting a third-party script once, and cleaning up on unmount so
a route change does not leave an orphaned iframe.

**The full embedding guide — plain HTML, iframe, presetting fields, WordPress,
Squarespace, Wix, Webflow, and the attribution terms — is in
[`docs/embed.md`](../../docs/embed.md).**
