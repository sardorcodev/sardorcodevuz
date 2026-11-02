"use client";

import { useEffect, useRef } from "react";
import { preload } from "react-dom";
import "./workspace-scene.css";

const atlas = "/images/garden/reference/workspace-atlas.avif";

// A tightly cropped sprite from the single atlas, positioned in scene coordinates.
function sprite(x: number, y: number, w: number, h: number, atlasX: number, atlasY: number) {
  return {
    left: (100 * x) / 1080 + "%",
    top: (100 * y) / 929 + "%",
    width: (100 * w) / 1080 + "%",
    height: (100 * h) / 929 + "%",
    backgroundSize: 108000 / w + "% " + 105000 / h + "%",
    backgroundPosition:
      (w === 1080 ? 0 : (100 * atlasX) / (1080 - w)) + "% " + (100 * atlasY) / (1050 - h) + "%",
  };
}
const crown = sprite(0, 0, 1080, 445, 0, 0);
const ground = sprite(0, 429, 1080, 500, 0, 447);
const lantern = sprite(872, 230, 66, 100, 290, 950);
const body = sprite(684, 780, 174, 86, 0, 950);
const head = sprite(684, 780, 88, 86, 182, 950);

export function WorkspaceScene({ enabled }: { enabled: boolean }) {
  preload(atlas, { as: "image", type: "image/avif", fetchPriority: "high" });
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scene.current;
    if (!node || !enabled) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = matchMedia("(any-pointer: fine)");
    let visible = false,
      frame = 0,
      px = 0,
      py = 0;
    function rest() {
      cancelAnimationFrame(frame);
      frame = 0;
      node!.style.removeProperty("--wind");
      node!.style.removeProperty("--look");
      node!.style.removeProperty("--lift");
    }
    function update() {
      frame = 0;
      const rect = node!.getBoundingClientRect();
      const x = (px - rect.left) / rect.width,
        y = (py - rect.top) / rect.height;
      const clamp = (v: number) => Math.min(1, Math.max(-1, v));
      node!.style.setProperty("--wind", clamp(2 * x - 1) * 1.65 + "deg");
      node!.style.setProperty("--look", clamp(x - 0.68) * 4 + "deg");
      const attention = Math.max(0, 1 - 2 * Math.hypot(x - 0.68, y - 0.89));
      node!.style.setProperty("--lift", -(attention * 6) + "%");
    }
    function move(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      px = event.clientX;
      py = event.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    }
    function sync() {
      const awake = visible && !document.hidden && !motion.matches;
      node!.dataset.awake = String(awake);
      window.removeEventListener("pointermove", move);
      if (awake && pointer.matches) window.addEventListener("pointermove", move, { passive: true });
      else rest();
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", sync);
    document.documentElement.addEventListener("pointerleave", rest);
    window.addEventListener("blur", rest);
    motion.addEventListener("change", sync);
    pointer.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", rest);
      document.documentElement.removeEventListener("pointerleave", rest);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      pointer.removeEventListener("change", sync);
      delete node.dataset.awake;
      rest();
    };
  }, [enabled]);
  return (
    <div className="hero-workspace workspace-scene" ref={scene} aria-hidden="true">
      <span className="scene-sprite" style={ground} />
      <span className="scene-tree">
        <span className="scene-sprite" style={crown} />
        <span className="scene-sprite scene-lantern" style={lantern} />
      </span>
      <span className="scene-sprite scene-cat-body" style={body} />
      <span className="scene-sprite scene-cat-head" style={head} />
    </div>
  );
}
