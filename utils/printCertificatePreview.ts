const PRINT_STYLE_ID = "certificate-print-styles";
const PRINT_ROOT_ID = "certificate-print-root";

function ensurePrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @page {
      size: landscape;
      margin: 10mm;
    }

    @media print {
      body * {
        visibility: hidden !important;
      }

      #${PRINT_ROOT_ID},
      #${PRINT_ROOT_ID} * {
        visibility: visible !important;
      }

      #${PRINT_ROOT_ID} {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        background: #ffffff !important;
      }

      #${PRINT_ROOT_ID} #certificate-preview {
        box-shadow: none !important;
        width: 100% !important;
        max-width: 100% !important;
        min-height: auto !important;
        margin: 0 auto !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function waitForCloneImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));

  if (images.length === 0) {
    return Promise.resolve();
  }

  return Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.onload = () => resolve();
          image.onerror = () => resolve();
        }),
    ),
  ).then(() => undefined);
}

export async function printCertificatePreview(element: HTMLElement) {
  ensurePrintStyles();

  document.getElementById(PRINT_ROOT_ID)?.remove();

  const printRoot = document.createElement("div");
  printRoot.id = PRINT_ROOT_ID;
  printRoot.setAttribute("aria-hidden", "true");

  const clone = element.cloneNode(true) as HTMLElement;
  printRoot.appendChild(clone);
  document.body.appendChild(printRoot);

  await waitForCloneImages(clone);

  const cleanup = () => {
    printRoot.remove();
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);

  window.setTimeout(() => {
    window.print();
  }, 50);

  window.setTimeout(() => {
    if (document.getElementById(PRINT_ROOT_ID)) {
      cleanup();
    }
  }, 30000);
}
