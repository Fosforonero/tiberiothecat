# public/blog/ — Blog hero images

Hero images used by individual blog articles. Served as static assets via Next.js.

## When to add an image here

Pilot articles in `lib/blog.ts` reference a `BlogImage` object in their `image:` field.
The current 6 pilots (3 EN + 3 IT) point at `/og-default.png` as the working asset.
To upgrade to externally-licensed visuals, drop a file in this folder and update the
matching `image:` block in `lib/blog.ts`.

## Naming

Use descriptive kebab-case filenames tied to the article subject — not `image1.jpg`.
Examples:

- `trolley-problem-railway-illustration.jpg`
- `bioethics-lab-organoid-research.jpg`
- `ai-ethics-self-driving-crossroad.jpg`

## Required metadata in `lib/blog.ts`

Every external image must declare its `attribution` block AND set `showInArticle: true`
so the hero `<figure>` renders inside the article:

```ts
image: {
  src:    '/blog/bioethics-lab-organoid-research.jpg',
  alt:    'Researcher pipetting in a lab — illustrative of bioethics research',
  width:  1600,
  height: 900,
  showInArticle: true,                              // REQUIRED for editorial images
  attribution: {
    creator:    'Photographer Name',
    creatorUrl: 'https://www.pexels.com/@photographer/',  // optional but recommended
    source:     'Pexels',
    sourceUrl:  'https://www.pexels.com/photo/<id>/',
    license:    'Pexels License',
    licenseUrl: 'https://www.pexels.com/license/',
    creditText: 'Photo by Photographer Name on Pexels',
  },
},
```

The article page then:
- Renders the image as a hero `<img>` at the top of the article body.
- Renders a visible credit caption beneath it (creator · source · license).
- Adds `ImageObject` JSON-LD with `creator`, `creditText`, `license`, `acquireLicensePage`.
- Sets `openGraph.images` and `twitter.images`.

### Why `showInArticle` exists

Some pilot posts in `lib/blog.ts` declare `image: { src: '/og-default.png', ... }`
without `showInArticle`. That is intentional: the generic SplitVote social card is
used **only** for JSON-LD / `openGraph.images` / `twitter.images` (so social shares
render a branded preview) but **must not** appear as an editorial illustration inside
the article body. Setting (or omitting) `showInArticle: false` keeps the hero hidden;
flipping to `true` is the explicit opt-in for real licensed visuals.

## License allowlist

- CC0 / public domain
- CC BY 4.0
- Pexels License (https://www.pexels.com/license/)
- Unsplash License (https://unsplash.com/license)

## Disallowed

- CC BY-NC, CC BY-ND, CC BY-SA-NC (any "non-commercial" restriction)
- Images with unclear / missing licensing
- Editorial press photos (Wired, Getty, Reuters, AP, etc.)
- Images with visible trademarks or logos
- Images of recognizable private individuals without model release

## Tooling

Re-run `npm run build` after dropping a new image to ensure Next.js picks it up
and the `<img>` reference resolves.

No optimization pipeline is currently configured in this folder — when traffic
justifies it, consider migrating to `next/image` + remote loader. For now, plain
`<img>` is intentional so Google Images can discover assets from HTML.
