// Opens a post's pictures full size in place: a click on a picture of a figure from ./gallery.js shows
// it in a <dialog>, with every picture of the post one step away (buttons, arrow keys, a swipe).
// Escape, the close button or a click beside the picture closes it. Without JavaScript each picture
// is a plain link to its file. The page styles it (gallery.css has a default).

const DEFAULT_LABELS = { close: "Close", previous: "Previous picture", next: "Next picture", of: "of" };

/**
 * @param {ParentNode} [root] where the post's figures are (default: the document)
 * @param {Partial<typeof DEFAULT_LABELS>} [labels] the buttons' names, in the page's language
 */
export function lightbox(root = document, labels = {}) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const links = [...root.querySelectorAll(".nf-figure a.nf-item")];
  if (!links.length) return;

  const dialog = document.createElement("dialog");
  dialog.className = "nf-lightbox";
  dialog.innerHTML = `
    <img alt="">
    <p class="nf-lightbox-text"><span class="nf-lightbox-caption"></span> <span class="nf-lightbox-count"></span></p>
    <button type="button" class="nf-lightbox-close" aria-label="${words.close}">×</button>
    <button type="button" class="nf-lightbox-prev" aria-label="${words.previous}">‹</button>
    <button type="button" class="nf-lightbox-next" aria-label="${words.next}">›</button>`;
  document.body.append(dialog);
  const img = dialog.querySelector("img");
  const caption = dialog.querySelector(".nf-lightbox-caption");
  const count = dialog.querySelector(".nf-lightbox-count");
  const several = links.length > 1;
  dialog.querySelector(".nf-lightbox-prev").hidden = !several;
  dialog.querySelector(".nf-lightbox-next").hidden = !several;

  let current = 0;
  const show = (i) => {
    current = (i + links.length) % links.length;
    const link = links[current];
    const thumb = link.querySelector("img");
    img.src = link.href;
    img.alt = thumb?.alt ?? "";
    caption.textContent = thumb?.alt || link.closest("figure")?.querySelector("figcaption")?.textContent || "";
    count.textContent = several ? `${current + 1} ${words.of} ${links.length}` : "";
  };

  links.forEach((link, i) =>
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      show(i);
      dialog.showModal();
    }),
  );
  dialog.querySelector(".nf-lightbox-close").addEventListener("click", () => dialog.close());
  dialog.querySelector(".nf-lightbox-prev").addEventListener("click", () => show(current - 1));
  dialog.querySelector(".nf-lightbox-next").addEventListener("click", () => show(current + 1));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (!several) return;
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });

  let startX = null;
  dialog.addEventListener("pointerdown", (event) => (startX = event.pointerType === "mouse" ? null : event.clientX));
  dialog.addEventListener("pointerup", (event) => {
    if (startX === null || !several) return;
    const dx = event.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  });
}
