"use client";
import { usePublicSettings } from "./public-settings";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/locales";
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
  float band = (aSeed.y - 0.5) * 0.34 + sin(a * 8.0 + uTime * 0.65 + aSeed.z * 6.2831853) * 0.035;
  float r = 1.0 + 0.26 * cos(3.0 * a + uTime * 0.13) + band;
  vec3 p = vec3(r * cos(2.0 * a), r * sin(2.0 * a), 0.62 * sin(3.0 * a) + (aSeed.z - 0.5) * 0.34);
  float turn = 0.55 + uTime * 0.055 + uPointer.x * 0.12;
  float x = p.x * cos(turn) + p.z * sin(turn);
  float z = -p.x * sin(turn) + p.z * cos(turn);
  float y = p.y * 0.79 + p.z * 0.22 + uPointer.y * 0.04;
  float mobile = 1.0 - step(760.0, uSize.x);
  float scale = min(uSize.x * 0.29, uSize.y * 0.33);
  float stretch = mix(2.05, 1.20, mobile);
  // A smaller cloud of dispersed points gives the dense ribbon a soft outer halo.
  float halo = step(0.91, aSeed.w);
  x *= 1.0 + halo * (aSeed.z - 0.3) * 0.65;
  y *= 1.0 + halo * (aSeed.y - 0.3) * 0.35;
  vec2 center = uSize * vec2(0.50, 0.51);
  vec2 pixel = center + vec2(x * stretch, y) * scale / (1.0 + z * 0.10);
  gl_Position = vec4(pixel / uSize * 2.0 - 1.0, 0.0, 1.0);
  float depth = smoothstep(-0.9, 0.9, z);
  gl_PointSize = mix(1.15, 2.65, aSeed.w) * (0.7 + depth * 0.55) * uDpr;
  vec3 blue = mix(vec3(0.18, 0.32, 0.88), vec3(0.38, 0.63, 1.0), uDark);
  vec3 cyan = mix(vec3(0.05, 0.49, 0.67), vec3(0.36, 0.88, 0.98), uDark);
  vec3 lilac = mix(vec3(0.55, 0.32, 0.83), vec3(0.74, 0.62, 1.0), uDark);
  vec3 color = mix(blue, cyan, smoothstep(0.10, 0.58, aSeed.x));
  color = mix(color, lilac, smoothstep(0.58, 0.96, aSeed.x));
  vColor = vec4(color, mix(0.63, 0.95, uDark) * (0.5 + depth * 0.5) * (0.6 + aSeed.w * 0.4) * mix(1.0, 0.40, halo));
}`;
const fragment = `
precision mediump float;
varying vec4 vColor;
void main() {
  float distance = length(gl_PointCoord - vec2(0.5));
  float alpha = 1.0 - smoothstep(0.25, 0.5, distance);
  gl_FragColor = vec4(vColor.rgb, vColor.a * alpha);
}`;

type Surface = { width: number; height: number; dpr: number; dark: boolean };

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
  const seeds = new Float32Array(7200 * 4);
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
  let count = 7200;
  let drawable = false;
  return {
    dispose,
    configure({ width, height, dpr, dark }: Surface) {
      drawable = width > 0 && height > 0;
      if (!drawable) return;
      count = width <= 760 ? 2800 : 7200;
      const w = Math.round(width * dpr),
        h = Math.round(height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform1f(uniforms.uDpr, dpr);
      gl.uniform1f(uniforms.uDark, dark ? 1 : 0);
      gl.uniform2f(uniforms.uSize, width, height);
    },
    draw(time: number, pointer: [number, number]) {
      if (!drawable) return;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.uTime, time);
      gl.uniform2f(uniforms.uPointer, pointer[0], pointer[1]);
      gl.drawArrays(gl.POINTS, 0, count);
    },
  };
}

export function ParticleField({ locale, tone }: { locale: Locale; tone?: "dark" }) {
  const { copy } = usePublicSettings();
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
      contextLost = false,
      userPaused = false,
      frame = 0,
      previous = 0,
      elapsed = 0;
    const pointer: [number, number] = [0, 0];
    const targetPointer: [number, number] = [0, 0];
    let bounds = node.getBoundingClientRect();
    const surface: Surface = {
      width: bounds.width,
      height: bounds.height,
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      dark: tone === "dark" || document.documentElement.dataset.theme === "dark",
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    };
    const paint = () => gpu?.draw(elapsed, pointer);
    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      if (previous && now - previous < 1000 / 30) return;
      if (previous) elapsed += Math.min(now - previous, 80) / 1000;
      previous = now;
      pointer[0] += (targetPointer[0] - pointer[0]) * 0.12;
      pointer[1] += (targetPointer[1] - pointer[1]) * 0.12;
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
      gpu?.configure(surface);
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
        if (inView && !initialized && !contextLost) init();
        else sync();
      },
      { rootMargin: "0px" },
    );
    visible.observe(node);
    const measure = () => {
      // Read layout only when the stage changes, never inside the animation loop.
      bounds = node.getBoundingClientRect();
      surface.width = bounds.width;
      surface.height = bounds.height;
      surface.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      gpu?.configure(surface);
      if (inView && !document.hidden) paint();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    const theme = new MutationObserver(() => {
      surface.dark = tone === "dark" || document.documentElement.dataset.theme === "dark";
      gpu?.configure(surface);
      if (inView && !document.hidden) paint();
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !bounds.width || !bounds.height) return;
      targetPointer[0] = Math.max(
        -0.5,
        Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5),
      );
      targetPointer[1] = Math.max(
        -0.5,
        Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5),
      );
    };
    const position = () => {
      if (inView) bounds = node.getBoundingClientRect();
    };
    const leave = () => {
      targetPointer[0] = 0;
      targetPointer[1] = 0;
    };
    const lost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      stop();
      gpu?.dispose();
      gpu = null;
      node.dataset.motion = "fallback";
    };
    const restored = () => {
      contextLost = false;
      init();
    };
    const stage = node.closest(".hero-universe") || node.closest("section");
    const host = stage instanceof HTMLElement ? stage : null;
    host?.addEventListener("pointerenter", measure, { passive: true });
    host?.addEventListener("pointermove", move, { passive: true });
    host?.addEventListener("pointerleave", leave);
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("scroll", position, { passive: true });
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    node.addEventListener("webglcontextlost", lost);
    node.addEventListener("webglcontextrestored", restored);
    return () => {
      stop();
      gpu?.dispose();
      visible.disconnect();
      resize.disconnect();
      theme.disconnect();
      host?.removeEventListener("pointerenter", measure);
      host?.removeEventListener("pointermove", move);
      host?.removeEventListener("pointerleave", leave);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", position);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      node.removeEventListener("webglcontextlost", lost);
      node.removeEventListener("webglcontextrestored", restored);
      control.current = () => {};
    };
  }, [tone]);
  useEffect(() => {
    control.current(paused);
  }, [paused]);
  const label = paused ? copy.studio.playMotion : copy.studio.pauseMotion;
  return (
    <>
      <div lang={locale} className={styles.field} aria-hidden="true">
        <canvas ref={canvas} data-motion="static" />
      </div>
      <button
        type="button"
        className={styles.control}
        onClick={() => setPaused((value) => !value)}
        aria-label={label}
        aria-pressed={paused}
        title={label}
      >
        <Icon name={paused ? "play" : "pause"} />
      </button>
    </>
  );
}
