// Turns the pictures of a rendered post into figures. A paragraph that holds only pictures, and every
// such paragraph right after it, are a group; a paragraph that is only emphasis right after a group
// (`*So sieht es aus.*`) is its caption. Groups with nothing else between them become one
// <figure class="nf-figure">: one picture stays one picture, two or more become a grid (`nf-gallery`,
// `data-count`). With one group the caption is the figure's; with several (`nf-captioned`) each group's
// caption sits under its last picture. Every picture links to its file, so it opens full size
// without JavaScript; ./lightbox.js shows it in place.

const IMG = /<img\b[^>]*>/gi;
const PICTURES_ONLY = /^(?:\s|<br\s*\/?>|<img\b[^>]*>)*$/i;
const PARAGRAPH = /<p>([\s\S]*?)<\/p>/y;
const CAPTION = /^<em>([\s\S]*)<\/em>$/;

/** @param {string} html */
export function galleries(html) {
  let out = "";
  let at = 0;
  while (at < html.length) {
    const start = html.indexOf("<p>", at);
    if (start === -1) break;
    const run = groupsFrom(html, start);
    if (!run) {
      out += html.slice(at, start + 3);
      at = start + 3;
      continue;
    }
    out += html.slice(at, start) + figure(run.groups);
    at = run.end;
  }
  return out + html.slice(at);
}

function groupsFrom(html, start) {
  const groups = [];
  let group = null;
  let end = start;
  for (;;) {
    const gap = html.slice(end).match(/^\s*/)[0].length;
    PARAGRAPH.lastIndex = end + gap;
    const p = PARAGRAPH.exec(html);
    if (!p) break;
    const inner = p[1].trim();
    if (inner.includes("<img") && PICTURES_ONLY.test(inner)) {
      if (!group) groups.push((group = { images: [] }));
      group.images.push(...inner.match(IMG));
      end = PARAGRAPH.lastIndex;
      continue;
    }
    const em = group && inner.match(CAPTION);
    if (!em || em[1].includes("</em>")) break;
    group.caption = em[1];
    group = null;
    end = PARAGRAPH.lastIndex;
  }
  return groups.length ? { groups, end } : null;
}

function item(img) {
  const src = img.match(/\bsrc="([^"]*)"/i)?.[1] ?? "";
  const lazy = /\bloading=/i.test(img) ? img : img.replace(/<img\b/i, '<img loading="lazy" decoding="async"');
  return `<a class="nf-item" href="${src}">${lazy}</a>`;
}

function figure(groups) {
  const count = groups.reduce((n, g) => n + g.images.length, 0);
  const captioned = groups.length > 1 && groups.some((g) => g.caption);
  const kind = ["nf-figure", count > 1 && "nf-gallery", captioned && "nf-captioned"].filter(Boolean).join(" ");
  let items;
  let caption = "";
  if (captioned) {
    items = groups.flatMap((g) =>
      g.images.map((img, i) => {
        const text = i === g.images.length - 1 && g.caption ? `<figcaption>${g.caption}</figcaption>` : "";
        return `<figure class="nf-cell">${item(img)}${text}</figure>`;
      }),
    );
  } else {
    items = groups.flatMap((g) => g.images.map(item));
    const text = groups.map((g) => g.caption).filter(Boolean)[0];
    if (text) caption = `<figcaption>${text}</figcaption>`;
  }
  return `<figure class="${kind}" data-count="${count}"><div class="nf-items">${items.join("")}</div>${caption}</figure>`;
}
