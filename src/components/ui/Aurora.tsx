import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import { useTheme } from "next-themes";

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// 基础片段着色器代码，不包含主题特定的结尾
const BASE_FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  // intensity = max(0.0, intensity);
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor;

`;

const getFragShader = (theme: string | undefined) => {
  return (
    BASE_FRAG +
    (theme === "dark"
      ? "fragColor = mix(vec4(0.0), vec4(auroraColor, auroraAlpha), auroraAlpha);}"
      : `
      auroraAlpha = 0.8 * auroraAlpha;
      vec3 background = vec3(1.0, 0.8333, 0.8647); // 白色背景
      vec3 blendedColor = mix(background, auroraColor, auroraAlpha);
      fragColor = vec4(blendedColor, auroraAlpha);
      }`)
    // "fragColor = mix(vec4(1.0), vec4(auroraColor, auroraAlpha), auroraAlpha);}"
  );
};

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
  children?: React.ReactNode;
}

export default function Aurora({
  children,
  colorStops = ["#00d8ff", "#7cff67", "#00d8ff"],
  amplitude = 1.0,
  blend = 0.5,
  ...restProps
}: AuroraProps) {
  const propsRef = useRef<AuroraProps>({
    colorStops,
    amplitude,
    blend,
    ...restProps,
  });
  propsRef.current = { colorStops, amplitude, blend, ...restProps };

  const { resolvedTheme } = useTheme();

  const ctnDom = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<{
    renderer?: Renderer;
    program?: Program;
    mesh?: Mesh;
    cleanup: () => void;
  }>({
    cleanup: () => {},
  });

  // 创建或更新渲染器和着色器程序
  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    // 清理旧的渲染器
    rendererRef.current.cleanup();

    // 获取当前主题的着色器代码
    const FRAG = getFragShader(resolvedTheme);

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = "transparent";

    // 设置canvas的样式，确保它在内容下方
    gl.canvas.style.position = "absolute";
    gl.canvas.style.top = "0";
    gl.canvas.style.left = "0";
    gl.canvas.style.zIndex = "-1";

    function resize() {
      if (!ctn) return;
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      renderer.setSize(width, height);
      if (rendererRef.current.program) {
        rendererRef.current.program.uniforms.uResolution.value = [
          width,
          height,
        ];
      }
    }
    window.addEventListener("resize", resize);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      // TypeScript may require a type assertion here.
      delete (geometry.attributes as any).uv;
    }

    const colorStopsArray = colorStops.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uBlend: { value: blend },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);

    // 保存引用以便后续更新和清理
    rendererRef.current.renderer = renderer;
    rendererRef.current.program = program;
    rendererRef.current.mesh = mesh;

    let animateId = 0;
    const update = (t: number) => {
      animateId = requestAnimationFrame(update);
      const { time = t * 0.01, speed = 1.0 } = propsRef.current;
      if (program) {
        program.uniforms.uTime.value = time * speed * 0.1;
        program.uniforms.uAmplitude.value = propsRef.current.amplitude ?? 1.0;
        program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
        const stops = propsRef.current.colorStops ?? colorStops;
        program.uniforms.uColorStops.value = stops.map((hex: string) => {
          const c = new Color(hex);
          return [c.r, c.g, c.b];
        });
        renderer.render({ scene: mesh });
      }
    };
    animateId = requestAnimationFrame(update);

    resize();

    // 更新清理函数
    rendererRef.current.cleanup = () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize);
      if (ctn && gl.canvas.parentNode === ctn) {
        ctn.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };

    return rendererRef.current.cleanup;
  }, [resolvedTheme, amplitude]); // 当resolvedTheme改变时重新创建着色器

  return (
    <div
      ref={ctnDom}
      className="w-full h-full flex items-center justify-center z-[-10] bg-linear-to-br from-indigo-300/15 to-pink-400/10 dark:bg-transparent"
    >
      {children}
    </div>
  );
}
