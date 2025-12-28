import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to CDN to avoid local bundling issues in this environment
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

export const extractTextFromPDF = async (base64Data: string): Promise<string> => {
  try {
    // Remove data URI prefix if present
    const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const numPages = pdf.numPages;

    // Process pages
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `[Page ${i}]\n${pageText}\n\n`;
    }

    return fullText;
  } catch (error) {
    console.error("PDF Extraction Failed:", error);
    throw new Error("Failed to extract text from PDF.");
  }
};