"use client";
import { usePublicSettings } from "./public-settings";
import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from "react";
import type { Locale } from "@/lib/locales";
import { garden } from "@/content/garden";
import { Icon } from "./icon";
type Stroke = { color: string; width: number; points: [number, number][]; sample?: boolean };
const sampleStroke: Stroke = { color: "#326d40", width: 6, points: [], sample: true };
export function DrawingBoard({ locale }: { locale: Locale }) {
  const { copy } = usePublicSettings(),
    d = copy.workshop,
    g = garden[locale];
  const canvas = useRef<HTMLCanvasElement>(null),
    strokes = useRef<Stroke[]>([sampleStroke]),
    current = useRef<Stroke | null>(null);
  const sampleImage = useRef<HTMLImageElement | null>(null),
    paperImage = useRef<HTMLImageElement | null>(null);
  const frame = useRef<number | null>(null),
    id = useId();
  const clearOpener = useRef<HTMLButtonElement>(null),
    clearCancel = useRef<HTMLButtonElement>(null),
    sampleButton = useRef<HTMLButtonElement>(null);
  const [color, setColor] = useState("#326d40"),
    [width, setWidth] = useState(6),
    [count, setCount] = useState(1),
    [message, setMessage] = useState(""),
    [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    if (confirmClear) clearCancel.current?.focus();
  }, [confirmClear]);
  function cancelClear() {
    setConfirmClear(false);
    clearOpener.current?.focus();
  }
  const paint = useCallback(() => {
    const element = canvas.current,
      context = element?.getContext("2d");
    if (!element || !context) return;
    context.fillStyle =
      (paperImage.current && context.createPattern(paperImage.current, "repeat")) || "#f7f4e8";
    context.fillRect(0, 0, element.width, element.height);
    for (const stroke of [...strokes.current, ...(current.current ? [current.current] : [])]) {
      if (stroke.sample) {
        if (sampleImage.current) {
          const scale = Math.min((element.width * 0.75) / 790, (element.height * 0.68) / 270);
          const sw = 790 * scale,
            sh = 270 * scale;
          context.drawImage(
            sampleImage.current,
            (element.width - sw) / 2,
            (element.height - sh) / 2 + element.height * 0.04,
            sw,
            sh,
          );
        }
        continue;
      }
      context.strokeStyle = stroke.color;
      context.fillStyle = stroke.color;
      context.lineWidth = (stroke.width * element.width) / 700;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      stroke.points.forEach(([x, y], i) => {
        if (i === 0) context.moveTo(x * element.width, y * element.height);
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
    let active = true;
    const load = (name: string, ref: React.RefObject<HTMLImageElement | null>) => {
      const img = new window.Image();
      img.onload = () => {
        if (active) {
          ref.current = img;
          paint();
        }
      };
      img.src = `/images/garden/reference/${name}.webp`;
    };
    load("drawing-sample", sampleImage);
    load("drawing-paper", paperImage);
    return () => {
      active = false;
    };
  }, [paint]);
  function schedulePaint() {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      paint();
    });
  }
  useEffect(() => {
    const element = canvas.current!;
    const observer = new ResizeObserver(() => {
      const rect = element.getBoundingClientRect(),
        ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.round(rect.width * ratio);
      element.height = Math.round(rect.height * ratio);
      paint();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
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
  async function save() {
    try {
      const element = canvas.current;
      if (!element) return;
      const blob = await new Promise<Blob | null>((resolve) =>
        element.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Export failed");
      const url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.download = "sardorcodev-drawing.png";
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(d.canvasSaved);
    } catch {
      setMessage(g.saveFailed);
    }
  }
  const colors = [
    ["#173d31", d.ink],
    ["#326d40", d.leaf],
    ["#f5c95f", { uz: "Sariq", en: "Yellow", ru: "Жёлтый" }[locale]],
    ["#de7336", d.clay],
    ["#426e91", d.ocean],
    ["#282a29", { uz: "Qora", en: "Black", ru: "Чёрный" }[locale]],
  ];
  return (
    <div className="drawing-board" lang={locale}>
      <div className="drawing-tools">
        <span className="drawing-pencil">
          <Icon name="pencil" />
          {g.pencil}
        </span>
        <div className="swatches" role="group" aria-label={d.ink}>
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
          <output>{width}px</output>
        </label>
        <div className="drawing-tool-actions">
          <button
            type="button"
            className="icon-button"
            disabled={!count}
            aria-label={d.canvasUndo}
            title={d.canvasUndo}
            onClick={() => {
              strokes.current.pop();
              setCount(strokes.current.length);
              paint();
              setMessage(d.canvasChanged);
            }}
          >
            <Icon name="undo" />
            <span>{d.canvasUndo}</span>
          </button>
          <button
            type="button"
            className="icon-button"
            disabled={!count}
            aria-label={d.canvasClear}
            ref={clearOpener}
            title={d.canvasClear}
            onClick={() => setConfirmClear(true)}
          >
            <Icon name="trash" />
            <span>{d.canvasClear}</span>
          </button>
        </div>
      </div>
      <canvas
        ref={canvas}
        aria-label={d.canvasLabel}
        aria-describedby={id + "-hint"}
        onPointerDown={(e) => {
          if (!e.isPrimary || e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          current.current = { color, width, points: [point(e)] };
          schedulePaint();
        }}
        onPointerMove={(e) => {
          if (!current.current || !e.isPrimary || current.current.points.length >= 5000) return;
          current.current.points.push(point(e));
          schedulePaint();
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
      >
        {d.canvasLabel}
      </canvas>
      {confirmClear && (
        <div
          className="clear-confirm"
          role="group"
          aria-label={g.clearQuestion}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancelClear();
          }}
        >
          <p>{g.clearQuestion}</p>
          <button
            className="button button-secondary"
            type="button"
            ref={clearCancel}
            onClick={cancelClear}
          >
            {g.cancel}
          </button>
          <button
            className="button button-primary"
            type="button"
            onClick={() => {
              strokes.current = [];
              current.current = null;
              setCount(0);
              setConfirmClear(false);
              paint();
              setMessage(d.canvasCleared);
              sampleButton.current?.focus();
            }}
          >
            {d.canvasClear}
          </button>
        </div>
      )}
      <div className="drawing-actions">
        <p className="draw-hint" id={id + "-hint"}>
          {g.drawHint}
        </p>
        <button
          type="button"
          className="text-link"
          ref={sampleButton}
          onClick={() => {
            strokes.current = [...strokes.current.slice(-99), sampleStroke];
            setCount(strokes.current.length);
            paint();
            setMessage(d.canvasChanged);
          }}
        >
          {d.canvasSample}
        </button>
        <button type="button" className="button button-primary" disabled={!count} onClick={save}>
          {d.canvasSave}
          <Icon name="download" />
        </button>
      </div>
      <p className="drawing-status sr-only" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
