import { jsPDF } from "jspdf";
import { Story } from "./types";

interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

async function loadImagePreserveRatio(src: string): Promise<LoadedImage | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const maxDim = 1600;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#FBF6EC";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", 0.92),
          width: w,
          height: h,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawFittedImage(
  doc: jsPDF,
  img: LoadedImage,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  withFrame = true
) {
  const scale = Math.min(boxW / img.width, boxH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const drawX = boxX + (boxW - drawW) / 2;
  const drawY = boxY + (boxH - drawH) / 2;

  if (withFrame) {
    doc.setFillColor(232, 222, 206);
    doc.roundedRect(drawX + 1.5, drawY + 1.5, drawW, drawH, 2.5, 2.5, "F");
  }

  doc.addImage(img.dataUrl, "JPEG", drawX, drawY, drawW, drawH);

  if (withFrame) {
    doc.setDrawColor(208, 158, 84);
    doc.setLineWidth(0.6);
    doc.rect(drawX, drawY, drawW, drawH);
  }
}

function drawPageFrame(doc: jsPDF, w: number, h: number) {
  doc.setFillColor(251, 246, 236);
  doc.rect(0, 0, w, h, "F");

  doc.setDrawColor(212, 163, 89);
  doc.setLineWidth(0.75);
  doc.roundedRect(7, 7, w - 14, h - 14, 3, 3);
  doc.setLineWidth(0.28);
  doc.roundedRect(9.8, 9.8, w - 19.6, h - 19.6, 2, 2);
}

function drawPageNumber(doc: jsPDF, pageNumber: number, x: number, y: number) {
  doc.setFont("times", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(145, 124, 102);
  doc.text(`— ${pageNumber} —`, x, y, { align: "center" });
}

export async function downloadStoryBookPdf(
  story: Story,
  coverImageUrl: string
): Promise<void> {
  const isPortrait = story.aspectRatio === "3:4";
  const doc = new jsPDF({
    orientation: isPortrait ? "portrait" : "landscape",
    unit: "mm",
    format: "a4",
  });

  const W = isPortrait ? 210 : 297;
  const H = isPortrait ? 297 : 210;

  // 1. AZALA (Portada)
  drawPageFrame(doc, W, H);

  const coverImg = await loadImagePreserveRatio(coverImageUrl);
  if (coverImg) {
    if (isPortrait) {
      drawFittedImage(doc, coverImg, 22, 22, W - 44, 178, true);
    } else {
      drawFittedImage(doc, coverImg, 36, 17, W - 72, 124, true);
    }
  }

  doc.setFont("times", "bold");
  doc.setTextColor(42, 33, 24);
  doc.setFontSize(isPortrait ? 25 : 24);
  const titleLines = doc.splitTextToSize(story.title, W - 46) as string[];
  doc.text(titleLines, W / 2, isPortrait ? 222 : 156, {
    align: "center",
    lineHeightFactor: 1.2,
  });

  doc.setDrawColor(212, 163, 89);
  doc.setLineWidth(0.5);
  const dividerY = isPortrait ? 246 : 176;
  doc.line(W / 2 - 28, dividerY, W / 2 + 28, dividerY);

  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.setTextColor(120, 102, 84);
  const charsLabel = story.characters.map((c) => c.name).join("  ·  ");
  doc.text(charsLabel, W / 2, isPortrait ? 256 : 185, { align: "center" });

  // 2. ESKAINTZA (Dedicatoria)
  doc.addPage();
  drawPageFrame(doc, W, H);

  doc.setFont("times", "italic");
  doc.setFontSize(19);
  doc.setTextColor(65, 52, 40);
  const dedLines = doc.splitTextToSize(`“${story.dedication}”`, W - 64) as string[];
  const dedStartY = H / 2 - (dedLines.length * 8) / 2;
  doc.text(dedLines, W / 2, dedStartY, { align: "center", lineHeightFactor: 1.4 });

  doc.setDrawColor(212, 163, 89);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 24, dedStartY - 12, W / 2 + 24, dedStartY - 12);
  doc.line(
    W / 2 - 24,
    dedStartY + dedLines.length * 8 + 8,
    W / 2 + 24,
    dedStartY + dedLines.length * 8 + 8
  );

  // 3. ORRIALDEAK
  for (let i = 0; i < story.pages.length; i++) {
    const page = story.pages[i];
    doc.addPage();
    drawPageFrame(doc, W, H);

    const pageImg = await loadImagePreserveRatio(page.imageUrl || coverImageUrl);
    const fontSize = page.text.length > 220 ? 13.5 : page.text.length > 130 ? 15.5 : 17.5;
    doc.setFont("times", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(38, 30, 22);

    if (isPortrait) {
      // 3 maketazio bertikal desberdin (inoiz moztu gabe)
      const pVar = i % 3;
      if (pVar === 0) {
        // P-A: Ilustrazio bertikal handia goian + testu-txartel beroa behean
        if (pageImg) {
          drawFittedImage(doc, pageImg, 20, 18, W - 40, 186, true);
        }
        doc.setFillColor(244, 236, 222);
        doc.setDrawColor(218, 178, 114);
        doc.setLineWidth(0.45);
        doc.roundedRect(20, 212, W - 40, 58, 3, 3, "FD");

        const lines = doc.splitTextToSize(page.text, W - 56) as string[];
        const lineH = fontSize * 0.48;
        const startY = 241 - (lines.length * lineH) / 2 + 2;
        doc.text(lines, W / 2, startY, { align: "center", lineHeightFactor: 1.4 });
        drawPageNumber(doc, page.pageNumber, W / 2, H - 15);
      } else if (pVar === 1) {
        // P-B: Testua goian urrezko marrarekin + ilustrazio handia behean
        const lines = doc.splitTextToSize(page.text, W - 52) as string[];
        const lineH = fontSize * 0.48;
        const blockH = lines.length * lineH;
        const startY = 44 - blockH / 2;
        doc.text(lines, W / 2, Math.max(24, startY), {
          align: "center",
          lineHeightFactor: 1.4,
        });

        doc.setDrawColor(212, 163, 89);
        doc.setLineWidth(0.5);
        doc.line(W / 2 - 26, 74, W / 2 + 26, 74);

        if (pageImg) {
          drawFittedImage(doc, pageImg, 20, 82, W - 40, 188, true);
        }
        drawPageNumber(doc, page.pageNumber, W / 2, H - 15);
      } else {
        // P-C: Ilustrazio bertikal erraldoia + pergamino-kaxa behean
        if (pageImg) {
          drawFittedImage(doc, pageImg, 16, 16, W - 32, 226, true);
        }
        doc.setFillColor(251, 246, 236);
        doc.setDrawColor(208, 158, 84);
        doc.setLineWidth(0.6);
        const lines = doc.splitTextToSize(page.text, W - 56) as string[];
        const lineH = fontSize * 0.48;
        const boxH = Math.max(40, lines.length * lineH + 18);
        const boxY = H - boxH - 22;
        doc.roundedRect(20, boxY, W - 40, boxH, 3, 3, "FD");
        doc.text(lines, W / 2, boxY + 12, { align: "center", lineHeightFactor: 1.38 });
        drawPageNumber(doc, page.pageNumber, W / 2, H - 13);
      }
      continue;
    }

    // Etzana (A4 landscape): 4 maketazio txandakatuta
    const variant = i % 4;
    if (variant === 0) {
      if (pageImg) {
        drawFittedImage(doc, pageImg, 22, 16, W - 44, 126, true);
      }
      doc.setFillColor(244, 236, 222);
      doc.setDrawColor(218, 178, 114);
      doc.setLineWidth(0.45);
      doc.roundedRect(26, 148, W - 52, 42, 3, 3, "FD");

      const lines = doc.splitTextToSize(page.text, W - 72) as string[];
      const lineH = fontSize * 0.48;
      const startY = 169 - (lines.length * lineH) / 2 + 2;
      doc.text(lines, W / 2, startY, { align: "center", lineHeightFactor: 1.38 });
      drawPageNumber(doc, page.pageNumber, W / 2, 196);
    } else if (variant === 1) {
      doc.setDrawColor(228, 218, 204);
      doc.setLineWidth(0.5);
      doc.line(W / 2, 14, W / 2, H - 14);

      if (pageImg) {
        drawFittedImage(doc, pageImg, 16, 20, W / 2 - 24, H - 40, true);
      }

      const rightCenterX = W * 0.75;
      const lines = doc.splitTextToSize(page.text, W / 2 - 36) as string[];
      const lineH = fontSize * 0.52;
      const startY = H / 2 - (lines.length * lineH) / 2 + 2;

      doc.setDrawColor(212, 163, 89);
      doc.setLineWidth(0.45);
      doc.line(rightCenterX - 18, startY - 10, rightCenterX + 18, startY - 10);

      doc.text(lines, rightCenterX, startY, { align: "center", lineHeightFactor: 1.45 });
      drawPageNumber(doc, page.pageNumber, rightCenterX, H - 16);
    } else if (variant === 2) {
      doc.setDrawColor(228, 218, 204);
      doc.setLineWidth(0.5);
      doc.line(W / 2, 14, W / 2, H - 14);

      const leftCenterX = W * 0.25;
      const lines = doc.splitTextToSize(page.text, W / 2 - 36) as string[];
      const lineH = fontSize * 0.52;
      const startY = H / 2 - (lines.length * lineH) / 2 + 2;

      doc.setDrawColor(194, 92, 62);
      doc.setLineWidth(0.55);
      doc.line(leftCenterX - 18, startY - 10, leftCenterX + 18, startY - 10);

      doc.text(lines, leftCenterX, startY, { align: "center", lineHeightFactor: 1.45 });
      drawPageNumber(doc, page.pageNumber, leftCenterX, H - 16);

      if (pageImg) {
        drawFittedImage(doc, pageImg, W / 2 + 8, 20, W / 2 - 24, H - 40, true);
      }
    } else {
      if (pageImg) {
        drawFittedImage(doc, pageImg, 78, 16, W - 96, H - 42, true);
      }

      doc.setFillColor(251, 246, 236);
      doc.setDrawColor(208, 158, 84);
      doc.setLineWidth(0.6);
      const boxW = 122;
      const lines = doc.splitTextToSize(page.text, boxW - 18) as string[];
      const lineH = fontSize * 0.48;
      const boxH = Math.max(44, lines.length * lineH + 20);
      const boxX = 16;
      const boxY = H - boxH - 18;

      doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3, "FD");
      doc.text(lines, boxX + boxW / 2, boxY + 13, {
        align: "center",
        lineHeightFactor: 1.38,
      });
      drawPageNumber(doc, page.pageNumber, boxX + boxW / 2, H - 12);
    }
  }

  // 4. KONTRAZALA
  doc.addPage();
  drawPageFrame(doc, W, H);

  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.setTextColor(42, 33, 24);
  doc.text("Amaiera", W / 2, H / 2 - 6, { align: "center" });

  doc.setDrawColor(212, 163, 89);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 22, H / 2 + 2, W / 2 + 22, H / 2 + 2);

  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.setTextColor(140, 122, 104);
  doc.text("IpuinMagikoak · Zure ipuin ilustratua", W / 2, H / 2 + 12, {
    align: "center",
  });

  const safeFileName =
    story.title
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜçÇ\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "ipuina";

  doc.save(`${safeFileName}.pdf`);
}
