import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Génère le PDF A4 d'un bulletin à partir de son élément DOM.
 */
export const generateBulletinPDF = async (
  element: HTMLElement
): Promise<jsPDF> => {
  const canvas = await html2canvas(element, {
    scale: 1.5,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();   // 210
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297
  const margin = 6;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  // Ratio basé sur la largeur
  let imgWidth = usableWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Si trop grand en hauteur, on rescale pour tenir sur 1 page
  if (imgHeight > usableHeight) {
    const ratio = usableHeight / imgHeight;
    imgHeight = usableHeight;
    imgWidth = imgWidth * ratio;
  }

  // Centrer horizontalement
  const x = (pageWidth - imgWidth) / 2;
  const y = margin;

  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight, undefined, "FAST");
  return pdf;
};

/**
 * Exporte un bulletin en PDF A4 sur UNE seule page.
 */
export const exportBulletinToPDF = async (
  element: HTMLElement,
  filename: string
) => {
  const pdf = await generateBulletinPDF(element);
  pdf.save(filename);
};
