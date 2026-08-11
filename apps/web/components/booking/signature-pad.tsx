"use client";

import { useEffect, useRef, useState } from "react";

import { Eraser, PenLine } from "lucide-react";

type SignaturePadProps = {
  /** An earlier drawing to restore, e.g. when the dialog reopens. */
  initial?: string | null;
  /** Called with a PNG data URL after each stroke, or null when cleared. */
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
};

/**
 * A small canvas the guest signs with the mouse, finger or pen. The drawing
 * is reported as a PNG data URL, which the API stores with the booking as
 * part of the electronic acceptance of the rental terms.
 */
export function SignaturePad({
  initial = null,
  onChange,
  disabled,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  // The latest drawing, redrawn after resizes (which wipe the canvas).
  const saved = useRef<string | null>(initial);
  const [signed, setSigned] = useState(Boolean(initial));

  // The canvas backing store follows the element's size and the display's
  // pixel density, so strokes stay sharp and never distort on resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const scale = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);

      const context = canvas.getContext("2d");
      if (!context) return;

      context.scale(scale, scale);
      context.lineWidth = 2;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#1c2a1a";

      // Sizing the backing store wipes the canvas, so bring back what was
      // already signed — both on mount and on later layout changes.
      if (saved.current) {
        const image = new Image();
        image.onload = () => context.drawImage(image, 0, 0, width, height);
        image.src = saved.current;
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    // Capturing keeps the stroke alive when the pointer leaves the canvas.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Not supported for this pointer; drawing still works inside the canvas.
    }
    drawing.current = true;

    const { x, y } = point(event);
    context.beginPath();
    context.moveTo(x, y);
    // A dot for taps, so even the shortest press leaves a mark.
    context.lineTo(x + 0.1, y + 0.1);
    context.stroke();
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    setSigned(true);
    const canvas = canvasRef.current;
    if (canvas) {
      saved.current = canvas.toDataURL("image/png");
      onChange(saved.current);
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    saved.current = null;
    setSigned(false);
    onChange(null);
  }

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          aria-label="Signaturfelt – tegn signaturen din her"
          className="h-36 w-full cursor-crosshair touch-none rounded-sm bg-white ring-1 ring-ink/15"
        />

        {!signed ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-ink-muted/60 text-sm">
            <PenLine className="size-4" strokeWidth={1.75} aria-hidden />
            Signer her med musen eller fingeren
          </p>
        ) : null}

        {/* The line the signature rests on, as on a paper form. */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-6 bottom-8 left-6 border-ink/20 border-b border-dashed"
        />
      </div>

      {signed ? (
        <button
          type="button"
          onClick={clear}
          className="mt-2 inline-flex items-center gap-1.5 text-ink-muted text-xs underline underline-offset-2 transition-colors hover:text-ink"
        >
          <Eraser className="size-3.5" strokeWidth={1.75} aria-hidden />
          Tøm og signer på nytt
        </button>
      ) : null}
    </div>
  );
}
