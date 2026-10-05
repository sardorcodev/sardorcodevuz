"use client";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/locales";
import { studio } from "@/content/studio";
import { Icon } from "./icon";
import styles from "./particle-field.module.css";

// An original flowing knot. All particle motion runs in one GPU draw call.
const vertex = `
attribute vec4 aSeed;
uniform float uTime;
uniform float uDpr;
uniform float uDark;
uniform vec2 uSize;
uniform vec2 uPointer;
varying vec4 vColor;
void main() {
  float a = aSeed.x * 6.2831853 + uTime * 0.09;
  float band = (aSeed.y - 0.5) * 0.32;
  float r = 1.0 + 0.32 * cos(3.0 * a + uTime * 0.13) + band;
  vec3 p = vec3(r * cos(2.0 * a), r * sin(2.0 * a), 0.62 * sin(3.0 * a) + (aSeed.z - 0.5) * 0.28);
  float turn = 0.55 + uTime * 0.055 + uPointer.x * 0.12;
  float x = p.x * cos(turn) + p.z * sin(turn);
  float z = -p.x * sin(turn) + p.z * cos(turn);
  float y = p.y * 0.86 + p.z * 0.28 + uPointer.y * 0.04;
  float mobile = step(uSize.x, 760.0);
  float scale = min(uSize.x * 0.56, uSize.y * 0.43);
  vec2 center = vec2(uSize.x * mix(0.68, 0.50, mobile), uSize.y * mix(0.50, 0.28, mobile));
  vec2 pixel = center + vec2(x, y) * scale / (1.0 + z * 0.15);
  gl_Position = vec4(pixel / uSize * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = mix(1.25, 2.7, aSeed.w) * uDpr;
  vec3 blue = mix(vec3(0.18, 0.32, 0.68), vec3(0.35, 0.63, 1.0), uDark);
  vec3 green = mix(vec3(0.24, 0.47, 0.38), vec3(0.30, 0.86, 0.69), uDark);
  vec3 gold = mix(vec3(0.68, 0.43, 0.16), vec3(1.0, 0.73, 0.39), uDark);
  vec3 color = mix(blue, green, smoothstep(0.20, 0.75, aSeed.x));
  color = mix(color, gold, smoothstep(0.78, 1.0, aSeed.x));
  vColor = vec4(color, mix(0.50, 0.84, uDark) * (0.6 + aSeed.w * 0.4));
}`;
const fragment = `
precision mediump float;
varying vec4 vColor;
void main() {
  float distance = length(gl_PointCoord - vec2(0.5));
  float alpha = 1.0 - smoothstep(0.25, 0.5, distance);
  gl_FragColor = vec4(vColor.rgb, vColor.a * alpha);
}`;

function renderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
    premultipliedAlpha: true,
  });
  if (!gl) return null;
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const dispose = () => {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    shaders.forEach((shader) => gl.deleteShader(shader));
  };
  if (!program || !buffer) {
    dispose();
    return null;
  }
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) {
      dispose();
      return null;
    }
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      dispose();
      return null;
    }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose();
    return null;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const count = window.matchMedia("(max-width: 760px)").matches ? 2800 : 7200;
  const seeds = new Float32Array(count * 4);
  // Seeded noise keeps static/reduced-motion views stable across reloads.
  let noise = 271828;
  for (let i = 0; i < seeds.length; i++) {
    noise = (Math.imul(noise, 1664525) + 1013904223) >>> 0;
    seeds[i] = noise / 4294967296;
  }
  gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  const attribute = gl.getAttribLocation(program, "aSeed");
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, 4, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(
    ["uTime", "uDpr", "uDark", "uSize", "uPointer"].map((name) => [
      name,
      gl.getUniformLocation(program, name),
    ]),
  );
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  return {
    dispose,
    draw(time: number, pointer: [number, number]) {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(width * dpr),
        h = Math.round(height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.uTime, time);
      gl.uniform1f(uniforms.uDpr, dpr);
      gl.uniform1f(uniforms.uDark, document.documentElement.dataset.theme === "dark" ? 1 : 0);
      gl.uniform2f(uniforms.uSize, width, height);
      gl.uniform2f(uniforms.uPointer, pointer[0], pointer[1]);
      gl.drawArrays(gl.POINTS, 0, count);
    },
  };
}

export function ParticleField({ locale }: { locale: Locale }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const control = useRef<(paused: boolean) => void>(() => {});
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    let gpu: ReturnType<typeof renderer> = null;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false,
      initialized = false,
      userPaused = false,
      frame = 0,
      previous = 0,
      elapsed = 0;
    const pointer: [number, number] = [0, 0];
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    };
    const paint = () => gpu?.draw(elapsed, pointer);
    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      if (previous && now - previous < 32) return;
      if (previous) elapsed += Math.min(now - previous, 80) / 1000;
      previous = now;
      paint();
    }
    function sync() {
      stop();
      if (!gpu) {
        node!.dataset.motion = initialized ? "fallback" : "static";
        return;
      }
      const state = motion.matches
        ? "reduced"
        : userPaused
          ? "paused"
          : document.hidden
            ? "hidden"
            : !inView
              ? "offscreen"
              : "running";
      node!.dataset.motion = state;
      if (state === "running") frame = requestAnimationFrame(tick);
      else if (inView && !document.hidden) paint();
    }
    function init() {
      gpu?.dispose();
      initialized = true;
      gpu = renderer(node!);
      sync();
      paint();
    }
    control.current = (value) => {
      userPaused = value;
      sync();
    };
    const visible = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !gpu) init();
        else sync();
      },
      { rootMargin: "0px" },
    );
    visible.observe(node);
    const resize = new ResizeObserver(() => {
      if (inView) paint();
    });
    resize.observe(node);
    const theme = new MutationObserver(() => {
      if (inView) paint();
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const bounds = node.getBoundingClientRect();
      pointer[0] = (event.clientX - bounds.left) / bounds.width - 0.5;
      pointer[1] = (event.clientY - bounds.top) / bounds.height - 0.5;
    };
    const leave = () => {
      pointer[0] = 0;
      pointer[1] = 0;
    };
    const lost = (event: Event) => {
      event.preventDefault();
      stop();
      gpu?.dispose();
      gpu = null;
      node.dataset.motion = "fallback";
    };
    const host = node.closest("section");
    host?.addEventListener("pointermove", move, { passive: true });
    host?.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    node.addEventListener("webglcontextlost", lost);
    node.addEventListener("webglcontextrestored", init);
    return () => {
      stop();
      gpu?.dispose();
      visible.disconnect();
      resize.disconnect();
      theme.disconnect();
      host?.removeEventListener("pointermove", move);
      host?.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      node.removeEventListener("webglcontextlost", lost);
      node.removeEventListener("webglcontextrestored", init);
      control.current = () => {};
    };
  }, []);
  useEffect(() => {
    control.current(paused);
  }, [paused]);
  const label = paused ? studio[locale].playMotion : studio[locale].pauseMotion;
  return (
    <>
      <div className={styles.field} aria-hidden="true">
        <canvas ref={canvas} data-motion="static" />
      </div>
      <button
        type="button"
        className={styles.control}
        onClick={() => setPaused((value) => !value)}
        aria-label={label}
        title={label}
      >
        <Icon name={paused ? "play" : "pause"} />
      </button>
    </>
  );
}
