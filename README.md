# astro-notefeed

An [Astro](https://astro.build) content loader for public [notefeed](https://notefeed.me) feeds, with picture galleries and a lightbox. It builds the blogs of [marcelbruckner.de](https://marcelbruckner.de) and [3dbruckner.de](https://3dbruckner.de); a change to how they read posts or show pictures is made here, once.

It reads feeds through their read links (`https://notefeed.me/r/<read id>`), so the build needs no secret and can change nothing. If a feed can't be read, the build fails rather than deploying a site without its posts.

## Install

Not on npm; install a tag from GitHub:

```sh
npm install github:Marceltov/astro-notefeed#v0.1.0
```

## Use

```ts
// src/content.config.ts
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { notefeedLoader } from "astro-notefeed";

const blog = defineCollection({
  loader: notefeedLoader({ url: "https://notefeed.me", readIds: ["3dbruckner"], lang: "de" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    lang: z.string(),
    tags: z.array(z.string()),
    summary: z.string(),
    sourceUrl: z.string().url(),
    feed: z.string(),
    image: z.object({ src: z.string(), alt: z.string() }).optional(),
  }),
});

export const collections = { blog };
```

On the post page, the stylesheet and the lightbox (labels in the page's language):

```astro
---
import "astro-notefeed/gallery.css";
---
<div class="post"><Content /></div>
<script>
  import { lightbox } from "astro-notefeed/lightbox";
  lightbox(document.querySelector(".post")!, { close: "Schließen", previous: "Voriges Bild", next: "Nächstes Bild", of: "von" });
</script>
```

## What a post becomes

- **Every markdown note** of the feeds is an entry; pictures posted alone are not. The feeds are merged, newest first, and each entry keeps its feed's read id (`feed`).
- **Title**: the note's. The heading notefeed took it from is dropped from the body, since the page shows the title.
- **Tags**: `lang:<code>` sets the entry's language (default: the `lang` option, `en` if left out); `slug:<slug>` fixes its id (default: from the title, umlauts spelled out, up to the first colon). Neither is in `tags`. A clash of ids gets the note id's end appended.
- **summary**: the first paragraph as plain text, at most about 220 characters. **image**: the first picture, for a teaser.
- **Pictures**: relative links point at the feed's read page. A paragraph that holds only pictures, and every such paragraph right after it, become one `<figure class="nf-figure">`: one picture stays whole, two or more become a grid of evenly cropped tiles (`nf-gallery`, `data-count`). An emphasised paragraph right after them (`*So sieht es aus.*`) becomes the caption. Each picture links to its file, so it opens without JavaScript too.

## Styling

`gallery.css` lays out the figures and the lightbox. A site sets its look through custom properties, on `:root` or the post's element:

| Property                 | Default                | What                           |
| ------------------------ | ---------------------- | ------------------------------ |
| `--nf-gap`               | `8px`                  | between the pictures           |
| `--nf-radius`            | `0`                    | each picture's corners         |
| `--nf-border`            | `none`                 | around each picture            |
| `--nf-caption`           | `inherit`              | the caption's colour           |
| `--nf-caption-size`      | `0.85em`               | the caption's size             |
| `--nf-lightbox-backdrop` | `rgb(10 10 10 / 0.92)` | behind the picture, full size  |
| `--nf-lightbox-ink`      | `#f4f4f4`              | caption and buttons, full size |

## Develop

`npm test` (Node's test runner), `npm run format` (Prettier, 160 columns). A release is a `vX.Y.Z` tag with the same version in `package.json`; the sites then move their dependency to that tag.

## License

Apache-2.0
