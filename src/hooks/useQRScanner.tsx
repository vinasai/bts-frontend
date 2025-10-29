// src/hooks/useQRScanner.tsx
import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export function useQRScanner(
  elementId: string,
  onScanSuccess: (decodedText: string) => void,
  onScanError?: (error: any) => void,
  active: boolean = true // 👈 new flag
) {
  useEffect(() => {
    if (!active) return; // don't init scanner when not active

    const scanner = new Html5QrcodeScanner(elementId, {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    }, false);

    scanner.render(
      (decodedText) => onScanSuccess(decodedText),
      (errorMessage) => onScanError?.(errorMessage)
    );

    return () => {
      scanner.clear().catch((err) => console.error("Scanner clear error:", err));
    };
  }, [elementId, active, onScanSuccess, onScanError]);
}
