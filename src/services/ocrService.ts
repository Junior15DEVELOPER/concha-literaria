import { createWorker } from 'tesseract.js';

export interface OcrProgress {
  status: string;
  progress: number;
}

export class OcrService {
  /**
   * Recognize text from an image (File or Blob or URL/DataURL) using Tesseract.js
   */
  static async recognizeText(
    imageSource: File | Blob | string,
    onProgress?: (progress: OcrProgress) => void
  ): Promise<string> {
    try {
      const worker = await createWorker('por+eng', 1, {
        logger: (m) => {
          if (onProgress && m.progress !== undefined) {
            onProgress({
              status: m.status || 'Processando...',
              progress: Math.round(m.progress * 100)
            });
          }
        }
      });

      const { data } = await worker.recognize(imageSource);
      await worker.terminate();

      return this.cleanOcrText(data.text);
    } catch (error) {
      console.error('OCR Recognition failed:', error);
      throw new Error('Falha no reconhecimento óptico de caracteres. Tente com uma foto mais nítida.');
    }
  }

  /**
   * Post-processing to remove OCR artifacts, hyphenated word splits across lines, and extra whitespace
   */
  private static cleanOcrText(rawText: string): string {
    if (!rawText) return '';
    return rawText
      // Re-join words broken by hyphens across lines (ex: li- \n vro -> livro)
      .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
      // Normalize multiple consecutive linebreaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove trailing weird symbols
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim();
  }
}
