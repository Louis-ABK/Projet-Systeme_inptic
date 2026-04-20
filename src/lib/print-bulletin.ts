/**
 * Impression robuste d'un élément (bulletin) via iframe isolée.
 * Évite les problèmes de pages blanches dus aux portails Radix Dialog,
 * au scroll-lock et aux styles globaux.
 */
export const printElement = (element: HTMLElement, title = "Bulletin INPTIC") => {
  const html = element.outerHTML;

  // Récupère toutes les feuilles de style et <style> du document principal
  const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML)
    .join("\n");

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${title}</title>
${styleTags}
<style>
  @page { size: A4 portrait; margin: 12mm 14mm; }
  html, body {
    background: #fff !important;
    margin: 0 !important;
    padding: 0 !important;
    color: #000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body { font-family: 'Times New Roman', Times, serif; }
  .print-area { width: 100%; }
  .print-area * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  table { page-break-inside: avoid; border-collapse: collapse; }
  tr { page-break-inside: avoid; }
  .no-print { display: none !important; }
</style>
</head>
<body>${html}</body>
</html>`);
  doc.close();

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 500);
  };

  // Attendre que les images (logo) chargent avant d'imprimer
  const triggerPrint = () => {
    const win = iframe.contentWindow;
    if (!win) return cleanup();
    try {
      win.focus();
      win.print();
    } catch {
      // ignore
    }
    cleanup();
  };

  const imgs = Array.from(doc.images);
  if (imgs.length === 0) {
    setTimeout(triggerPrint, 200);
    return;
  }
  let remaining = imgs.length;
  const done = () => {
    remaining -= 1;
    if (remaining <= 0) setTimeout(triggerPrint, 150);
  };
  imgs.forEach((img) => {
    if (img.complete) done();
    else {
      img.addEventListener("load", done);
      img.addEventListener("error", done);
    }
  });
  // Sécurité : impression forcée après 3s
  setTimeout(() => {
    if (remaining > 0) {
      remaining = 0;
      triggerPrint();
    }
  }, 3000);
};
