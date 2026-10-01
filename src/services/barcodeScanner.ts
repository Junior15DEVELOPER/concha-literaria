import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

export class BarcodeScannerService {
  private static reader: BrowserMultiFormatReader | null = null;

  static getReader(): BrowserMultiFormatReader {
    if (!this.reader) {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E
      ]);
      this.reader = new BrowserMultiFormatReader(hints);
    }
    return this.reader;
  }

  /**
   * Start continuous scanning on a video element
   */
  static startScanning(
    videoElement: HTMLVideoElement,
    onResult: (isbn: string) => void,
    onError?: (err: any) => void
  ): { stop: () => void } {
    const reader = this.getReader();

    reader.decodeFromVideoDevice(
      null, // default/back camera
      videoElement,
      (result, error) => {
        if (result) {
          const text = result.getText();
          // Filter if looks like EAN/ISBN
          if (text && text.length >= 10) {
            onResult(text);
          }
        }
        if (error && onError && !(error.name === 'NotFoundException')) {
          onError(error);
        }
      }
    ).catch(err => {
      if (onError) onError(err);
    });

    return {
      stop: () => {
        try {
          reader.reset();
        } catch {
          // ignore
        }
      }
    };
  }

  /**
   * Cleanly stop all active video tracks
   */
  static stopAllStreams(videoElement?: HTMLVideoElement | null) {
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    if (this.reader) {
      try {
        this.reader.reset();
      } catch {
        // ignore
      }
    }
  }
}
