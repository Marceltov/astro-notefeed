import { test } from "node:test";
import assert from "node:assert/strict";
import { galleries } from "../src/gallery.js";
import { withoutTitle, absolutize, slugify, summarize, firstImage } from "../src/index.js";

const img = (n) => `<img src="https://x/${n}.jpg" alt="Bild ${n}">`;

test("pictures that follow each other become one gallery, with the emphasis after them as caption", () => {
  const html = `<p>Text</p>\n<p>${img(1)}</p>\n<p>${img(2)}</p>\n<p><em>Zwei Bilder.</em></p>\n<p>Mehr</p>`;
  const out = galleries(html);
  assert.match(out, /<figure class="nf-figure nf-gallery" data-count="2">/);
  assert.match(out, /<figcaption>Zwei Bilder\.<\/figcaption><\/figure>\n<p>Mehr<\/p>$/);
  assert.match(out, /<a class="nf-item" href="https:\/\/x\/1.jpg"><img loading="lazy" decoding="async" src/);
  assert.ok(out.startsWith("<p>Text</p>\n<figure"));
});

test("one picture stays one picture, a caption is optional", () => {
  const out = galleries(`<p>${img(1)}</p>\n<p>Weiter.</p>`);
  assert.equal(
    out,
    `<figure class="nf-figure" data-count="1"><div class="nf-items"><a class="nf-item" href="https://x/1.jpg"><img loading="lazy" decoding="async" src="https://x/1.jpg" alt="Bild 1"></a></div></figure>\n<p>Weiter.</p>`,
  );
});

test("pictures in one paragraph count one by one", () => {
  assert.match(galleries(`<p>${img(1)}\n${img(2)}<br>${img(3)}</p>`), /data-count="3"/);
});

test("a picture inside text, or emphasis that is only part of a paragraph, is left alone", () => {
  const inline = `<p>Siehe ${img(1)} hier</p>`;
  assert.equal(galleries(inline), inline);
  const out = galleries(`<p>${img(1)}</p><p><em>a</em> und mehr</p>`);
  assert.ok(!out.includes("figcaption"));
  assert.ok(out.endsWith("<p><em>a</em> und mehr</p>"));
});

test("text without pictures is unchanged", () => {
  const html = "<h2>A</h2>\n<p>b <em>c</em></p>\n<p><em>d</em></p>";
  assert.equal(galleries(html), html);
});

test("relative pictures point at the feed's read page", () => {
  assert.equal(absolutize("![a](x.jpg) [l](/abs) ![b](<y z.png>)", "https://n/r/f/"), "![a](https://n/r/f/x.jpg) [l](/abs) ![b](https://n/r/f/y%20z.png)");
});

test("slug, summary and first picture", () => {
  assert.equal(slugify("Mein Drucker hat jetzt ein Auge drauf"), "mein-drucker-hat-jetzt-ein-auge-drauf");
  assert.equal(slugify("Über Größe: und mehr"), "ueber-groesse");
  assert.equal(summarize("# T\n\n![a](b.jpg)\n\nErster **Absatz** mit [Link](x).\n\nZweiter."), "Erster Absatz mit Link.");
  assert.deepEqual(firstImage("Text ![Alt](https://x/a.jpg) mehr"), { src: "https://x/a.jpg", alt: "Alt" });
  assert.equal(firstImage("kein Bild"), undefined);
});

test("the heading notefeed took the title from leaves the body; another heading stays", () => {
  assert.equal(withoutTitle("# Neu hier\n\nText", "Neu hier"), "Text");
  assert.equal(withoutTitle("# Anderes\n\nText", "Neu hier"), "# Anderes\n\nText");
  assert.equal(withoutTitle("Text\n# Neu hier", "Neu hier"), "Text\n# Neu hier");
});

test("picture groups with their own captions and nothing between them become one gallery, each caption under its picture", () => {
  const out = galleries(`<p>${img(1)}</p>\n<p><em>Eins.</em></p>\n<p>${img(2)}</p>\n<p><em>Zwei.</em></p>\n<p>${img(3)}</p>\n<p>Text</p>`);
  assert.match(out, /^<figure class="nf-figure nf-gallery nf-captioned" data-count="3">/);
  assert.equal((out.match(/<figure class="nf-cell">/g) ?? []).length, 3);
  assert.match(
    out,
    /1\.jpg" alt="Bild 1"><\/a><figcaption>Eins\.<\/figcaption><\/figure><figure class="nf-cell"><a class="nf-item" href="https:\/\/x\/2\.jpg"/,
  );
  assert.match(out, /3\.jpg" alt="Bild 3"><\/a><\/figure><\/div><\/figure>\n<p>Text<\/p>$/);
});

test("text between pictures keeps them apart", () => {
  const out = galleries(`<p>${img(1)}</p>\n<p><em>Eins.</em></p>\n<p>Text</p>\n<p>${img(2)}</p>`);
  assert.equal((out.match(/<figure class="nf-figure"/g) ?? []).length, 2);
  assert.ok(!out.includes("nf-captioned"));
});
