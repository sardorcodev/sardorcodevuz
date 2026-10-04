"use client";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import type { Locale } from "@/lib/locales";
import { workshop } from "@/content/workshop";

type Stroke = { color: string; width: number; points: [number, number][] };
export function DrawingBoard({ locale }: { locale: Locale }) {
  const d = workshop[locale];
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const [color, setColor] = useState("#243342");
  const [width, setWidth] = useState(4);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const paint = useCallback(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    context.fillStyle = "#fffdf6";
    context.fillRect(0, 0, element.width, element.height);
    for (const stroke of [...strokes.current, ...(current.current ? [current.current] : [])]) {
      context.strokeStyle = stroke.color;
      context.fillStyle = stroke.color;
      context.lineWidth = (stroke.width * element.width) / 700;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      stroke.points.forEach(([x, y], index) => {
        if (index === 0) context.moveTo(x * element.width, y * element.height);
        else context.lineTo(x * element.width, y * element.height);
      });
      context.stroke();
      if (stroke.points.length === 1) {
        const [x, y] = stroke.points[0];
        context.beginPath();
        context.arc(x * element.width, y * element.height, context.lineWidth / 2, 0, Math.PI * 2);
        context.fill();
      }
    }
  }, []);
  useEffect(() => {
    const element = canvas.current!;
    const observer = new ResizeObserver(() => {
      const rect = element.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.round(rect.width * ratio);
      element.height = Math.round(rect.height * ratio);
      paint();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [paint]);
  function point(event: PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = event.currentTarget.getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    ];
  }
  function finish() {
    if (!current.current) return;
    strokes.current = [...strokes.current.slice(-99), current.current];
    current.current = null;
    setCount(strokes.current.length);
    paint();
    setMessage(d.canvasChanged);
  }
  const colors = [
    ["#243342", d.ink],
    ["#2553c7", d.ocean],
    ["#a44225", d.clay],
    ["#326d40", d.leaf],
  ];
  return (
    <div className="drawing-board">
      <div className="drawing-tools">
        <div className="swatches" aria-label={d.ink}>
          {colors.map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-label={label}
              aria-pressed={color === value}
              onClick={() => setColor(value)}
              style={{ "--swatch": value } as React.CSSProperties}
            />
          ))}
        </div>
        <label className="brush-size">
          {d.width}
          <input
            aria-label={d.width}
            type="range"
            min="2"
            max="16"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </label>
        <span className="drawing-note" aria-hidden="true">
          make something.
        </span>
      </div>
      <canvas
        ref={canvas}
        aria-label={d.canvasLabel}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          current.current = { color, width, points: [point(event)] };
          paint();
        }}
        onPointerMove={(event) => {
          if (!current.current || !event.isPrimary || current.current.points.length >= 5000) return;
          current.current.points.push(point(event));
          paint();
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
      >
        {d.canvasLabel}
      </canvas>
      <div className="drawing-actions">
        <button
          type="button"
          className="button button-secondary"
          disabled={!count}
          onClick={() => {
            strokes.current.pop();
            setCount(strokes.current.length);
            paint();
            setMessage(d.canvasChanged);
          }}
        >
          {d.canvasUndo}
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={!count}
          onClick={() => {
            strokes.current = [];
            current.current = null;
            setCount(0);
            paint();
            setMessage(d.canvasCleared);
          }}
        >
          {d.canvasClear}
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            const points: [number, number][] = Array.from({ length: 60 }, (_, i) => [
              0.15 + i / 85,
              0.48 + Math.sin(i / 8) * 0.15,
            ]);
            strokes.current = [...strokes.current.slice(-99), { color, width, points }];
            setCount(strokes.current.length);
            paint();
            setMessage(d.canvasChanged);
          }}
        >
          {d.canvasSample}
        </button>
        <button
          type="button"
          className="button button-primary"
          disabled={!count}
          onClick={() => {
            const a = document.createElement("a");
            a.download = "sardorcodev-drawing.png";
            a.href = canvas.current!.toDataURL("image/png");
            a.click();
            setMessage(d.canvasSaved);
          }}
        >
          {d.canvasSave}
        </button>
      </div>
      <p className="drawing-status" aria-live="polite">
        {message || d.canvasNote}
      </p>
    </div>
  );
}
