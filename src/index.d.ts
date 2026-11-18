import type { Loader } from "astro/loaders";

export type NotefeedLoaderOptions = {
  /** The notefeed instance (default https://notefeed.me). */
  url?: string;
  /** The read ids of the feeds, the part after /r/ in a read link. */
  readIds: string[];
  /** The language of a post without a `lang:<code>` tag (default "en"). */
  lang?: string;
};

/** Every entry's data: title, date (ISO), lang, tags (without slug:/lang:), summary, sourceUrl, feed (read id), image (the first picture). */
export function notefeedLoader(options: NotefeedLoaderOptions): Loader;
export function galleries(html: string): string;
export function withoutTitle(markdown: string, title: string): string;
export function absolutize(markdown: string, readBase: string): string;
export function slugify(title: string): string;
export function summarize(markdown: string): string;
export function firstImage(markdown: string): { src: string; alt: string } | undefined;
