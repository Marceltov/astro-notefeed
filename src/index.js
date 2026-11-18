// An Astro content loader for public notefeed feeds, read through their read links: no secret is
// needed, and a read link can't change anything. Every markdown note in any of the feeds is an
// entry; the entries of all feeds are merged, newest first, and each keeps the feed it came from.
// Two optional tags steer an entry: `lang:<code>` (default: the `lang` option) and `slug:<slug>`
// (default: from the title). Pictures that follow each other become one gallery (./gallery.js).
//
// Any error fails the build, so a deploy never goes out with the posts missing.

import { galleries } from "./gallery.js";

export { galleries };

/** @param {{ url?: string, readIds: string[], lang?: string }} options */
export function notefeedLoader({ url = "https://notefeed.me", readIds, lang = "en" }) {
  const base = url.replace(/\/+$/, "");
  return {
    name: "notefeed-loader",
    /** @param {import("astro/loaders").LoaderContext} context */
    load: async ({ store, logger, parseData, renderMarkdown, generateDigest }) => {
      const posts = [];
      for (const readId of readIds) {
        const notes = (await fetchAll(base, readId)).filter((n) => n.type === "text/markdown" && n.content);
        logger.info(`${notes.length} posts from ${base}/r/${readId}`);
        posts.push(...notes.map((n) => ({ ...n, readId })));
      }
      posts.sort((a, b) => b.date.localeCompare(a.date));

      store.clear();
      const taken = new Set();
      for (const note of posts) {
        const tags = note.tags ?? [];
        let slug = tags.find((t) => t.startsWith("slug:"))?.slice(5) || slugify(note.title) || note.id.toLowerCase();
        if (taken.has(slug)) slug = `${slug}-${note.id.slice(-6).toLowerCase()}`;
        taken.add(slug);

        const markdown = absolutize(withoutTitle(note.content, note.title), `${base}/r/${note.readId}/`);
        const data = await parseData({
          id: slug,
          data: {
            title: note.title,
            date: note.date,
            lang: tags.find((t) => t.startsWith("lang:"))?.slice(5) || lang,
            tags: tags.filter((t) => !t.startsWith("slug:") && !t.startsWith("lang:")),
            summary: summarize(markdown),
            sourceUrl: note.url,
            feed: note.readId,
            image: firstImage(markdown),
          },
        });
        const rendered = await renderMarkdown(markdown);
        store.set({
          id: slug,
          data,
          body: markdown,
          rendered: { ...rendered, html: galleries(rendered.html) },
          digest: generateDigest(markdown + note.title + tags.join(",")),
        });
      }
    },
  };
}

async function fetchAll(base, readId) {
  const notes = [];
  let before = null;
  do {
    const query = new URLSearchParams({ limit: "100" });
    if (before) query.set("before", before);
    const res = await fetch(`${base}/api/v1/read/${encodeURIComponent(readId)}/notes?${query}`);
    if (!res.ok) throw new Error(`notefeed answered ${res.status} for the feed ${readId}`);
    const page = await res.json();
    notes.push(...page.notes);
    before = page.notes.length ? page.next : null;
  } while (before);
  return notes;
}

/** notefeed takes a note's title from its first heading; the page shows the title already, so the body drops it. */
export function withoutTitle(markdown, title) {
  const first = markdown.match(/^\s*#[ \t]+(.+?)[ \t#]*(?:\r?\n|$)/);
  return first && first[1].trim() === title.trim() ? markdown.slice(first[0].length).replace(/^\s+/, "") : markdown;
}

/** Pictures posted with a note are linked relative to the feed's read page. */
export function absolutize(markdown, readBase) {
  return markdown.replace(/(!?\[[^\]]*\]\()(<[^>]+>|[^)\s]+)/g, (all, open, target) => {
    const bare = target.startsWith("<") ? target.slice(1, -1) : target;
    if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(bare)) return all;
    return open + new URL(bare, readBase).href;
  });
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(":")[0]
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** The first paragraph as plain text, for an index and the meta description. */
export function summarize(markdown) {
  const para = markdown.split(/\n\s*\n/).find((p) => /^[^#!|`>\-*\s]/.test(p.trim())) ?? "";
  const text = para
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 220 ? `${text.slice(0, 217).replace(/\s+\S*$/, "")} …` : text;
}

/** The post's first picture (Markdown or HTML), for a teaser. */
export function firstImage(markdown) {
  const md = markdown.match(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/);
  if (md) return { src: md[2], alt: md[1] };
  const html = markdown.match(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/i);
  if (html) return { src: html[1], alt: html[0].match(/\balt="([^"]*)"/i)?.[1] ?? "" };
  return undefined;
}
