import { jsPDF } from "jspdf";
import { Story } from "./types";

async function loadImageAsJpegDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const targetSize = 1024;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#FBF7F0";
        ctx.fillRect(0, 0, targetSize, targetSize);

        // Center-crop (cover) para que todas las ilustraciones queden cuadradas y limpias
        const scale = Math.max(targetSize / img.width, targetSize / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (targetSize - w) / 2;
        const y = (targetSize - h) / 2;
        ctx.drawImage(img, x, y, w, h);

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCreamBackgroundAndFrame(doc: jsPDF, w: number, h: number) {
  // Papel crema cálido
  doc.setFillColor(251, 247, 240);
  doc.rect(0, 0, w, h, "F");

  // Doble marco dorado
  doc.setDrawColor(212, 163, 89);
  doc.setLineWidth(0.7);
  doc.rect(8, 8, w - 16, h - 16);
  doc.setLineWidth(0.3);
  doc.rect(10.5, 10.5, w - 21, h - 21);
}

export async function downloadStoryBookPdf(
  story: Story,
  coverImageUrl: string
): Promise<void> {
  // Formato álbum apaisado A4 (297mm x 210mm) — como un libro abierto
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const W = 297;
  const H = 210;

  // 1. AZALA (Portada)
  drawCreamBackgroundAndFrame(doc, W, H);

  const coverData = await loadImageAsJpegDataUrl(coverImageUrl);
  if (coverData) {
    const imgSize = 118;
    const imgX = (W - imgSize) / 2;
    const imgY = 20;
    doc.setDrawColor(212, 163, 89);
    doc.setLineWidth(0.8);
    doc.rect(imgX - 1.5, imgY - 1.5, imgSize + 3, imgSize + 3);
    doc.addImage(coverData, "JPEG", imgX, imgY, imgSize, imgSize);
  }

  doc.setFont("times", "bold");
  doc.setTextColor(42, 33, 24);
  doc.setFontSize(24);
  const titleLines = doc.splitTextToSize(story.title, W - 60) as string[];
  doc.text(titleLines, W / 2, 154, { align: "center" });

  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.setTextColor(120, 102, 84);
  const charsLabel = story.characters.map((c) => c.name).join("  ·  ");
  doc.text(charsLabel, W / 2, 184, { align: "center" });

  // 2. ESKAINTZA (Página de dedicatoria)
  doc.addPage();
  drawCreamBackgroundAndFrame(doc, W, H);

  doc.setFont("times", "italic");
  doc.setFontSize(18);
  doc.setTextColor(65, 52, 40);
  const dedLines = doc.splitTextToSize(`“${story.dedication}”`, W - 90) as string[];
  const dedStartY = H / 2 - (dedLines.length * 8) / 2;
  doc.text(dedLines, W / 2, dedStartY, { align: "center" });

  doc.setDrawColor(212, 163, 89);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 25, dedStartY - 12, W / 2 + 25, dedStartY - 12);
  doc.line(W / 2 - 25, dedStartY + dedLines.length * 8 + 6, W / 2 + 25, dedStartY + dedLines.length * 8 + 6);

  // 3. ORRIALDE BAKOITZA (Libro abierto: Ilustración izquierda + Texto derecha)
  for (let i = 0; i < story.pages.length; i++) {
    const page = story.pages[i];
    doc.addPage();

    // Fondo crema completo
    doc.setFillColor(251, 247, 240);
    doc.rect(0, 0, W, H, "F");

    // Pliegue central del libro
    doc.setDrawColor(222, 212, 198);
    doc.setLineWidth(0.6);
    doc.line(W / 2, 10, W / 2, H - 10);

    // Mitad izquierda: Ilustración cuadrada grande con marco
    const pageImgData = await loadImageAsJpegDataUrl(page.imageUrl || coverImageUrl);
    const imgSize = 128;
    const imgX = (W / 2 - imgSize) / 2;
    const imgY = (H - imgSize) / 2;

    if (pageImgData) {
      doc.setDrawColor(212, 163, 89);
      doc.setLineWidth(0.6);
      doc.rect(imgX - 1.2, imgY - 1.2, imgSize + 2.4, imgSize + 2.4);
      doc.addImage(pageImgData, "JPEG", imgX, imgY, imgSize, imgSize);
    }

    // Mitad derecha: Texto del cuento centrado verticalmente
    const rightCenterX = W * 0.75;
    const textMaxWidth = W / 2 - 34;

    doc.setFont("times", "normal");
    doc.setTextColor(38, 30, 22);
    const fontSize = page.text.length > 220 ? 14 : page.text.length > 130 ? 16 : 18;
    doc.setFontSize(fontSize);

    const textLines = doc.splitTextToSize(page.text, textMaxWidth) as string[];
    const lineHeight = fontSize * 0.52;
    const blockHeight = textLines.length * lineHeight;
    const textStartY = H / 2 - blockHeight / 2 + 4;

    doc.text(textLines, rightCenterX, textStartY, {
      align: "center",
      lineHeightFactor: 1.45,
    });

    // Número de página elegante
    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.setTextColor(140, 122, 104);
    doc.text(`— ${page.pageNumber} —`, rightCenterX, H - 16, { align: "center" });
  }

  // 4. KONTRAZALA (Página final)
  doc.addPage();
  drawCreamBackgroundAndFrame(doc, W, H);

  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(42, 33, 24);
  doc.text("Amaiera", W / 2, H / 2 - 6, { align: "center" });

  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.setTextColor(140, 122, 104);
  doc.text("IpuinMagikoak · Zure ipuin ilustratua", W / 2, H / 2 + 8, { align: "center" });

  const safeFileName =
    story.title
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜçÇ\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "ipuina";

  doc.save(`${safeFileName}.pdf`);
}
