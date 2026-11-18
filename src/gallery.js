// Turns the pictures of a rendered post into figures. A paragraph that holds only pictures, and every
// such paragraph right after it, become one <figure class="nf-figure">: one picture stays one picture,
// two or more become a grid (`nf-gallery`, `data-count`). A paragraph that is only emphasis right
// after the pictures (`*So sieht es aus.*`) becomes their <figcaption>. Every picture links to its
// file, so it opens full size without JavaScript; ./lightbox.js shows it in place.

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
    const run = picturesFrom(html, start);
    if (!run) {
      out += html.slice(at, start + 3);
      at = start + 3;
      continue;
    }
    out += html.slice(at, start) + figure(run.images, run.caption);
    at = run.end;
  }
  return out + html.slice(at);
}

function picturesFrom(html, start) {
  const images = [];
  let end = start;
  let caption;
  for (;;) {
    const gap = html.slice(end).match(/^\s*/)[0].length;
    PARAGRAPH.lastIndex = end + gap;
    const p = PARAGRAPH.exec(html);
    if (!p) break;
    const inner = p[1].trim();
    if (inner.includes("<img") && PICTURES_ONLY.test(inner)) {
      images.push(...inner.match(IMG));
      end = PARAGRAPH.lastIndex;
      continue;
    }
    const em = images.length && inner.match(CAPTION);
    if (em && !em[1].includes("</em>")) {
      caption = em[1];
      end = PARAGRAPH.lastIndex;
    }
    break;
  }
  return images.length ? { images, caption, end } : null;
}

function figure(images, caption) {
  const kind = images.length > 1 ? "nf-figure nf-gallery" : "nf-figure";
  const items = images.map((img) => {
    const src = img.match(/\bsrc="([^"]*)"/i)?.[1] ?? "";
    const lazy = /\bloading=/i.test(img) ? img : img.replace(/<img\b/i, '<img loading="lazy" decoding="async"');
    return `<a class="nf-item" href="${src}">${lazy}</a>`;
  });
  return (
    `<figure class="${kind}" data-count="${images.length}">` +
    `<div class="nf-items">${items.join("")}</div>` +
    (caption ? `<figcaption>${caption}</figcaption>` : "") +
    `</figure>`
  );
}
