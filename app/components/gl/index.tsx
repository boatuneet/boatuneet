"use client";

// Particle-wave background from the skal-ventures template, trimmed for
// production: leva dev controls replaced by their default values.

import { Effects } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Particles } from "./particles";
import { VignetteShader } from "./shaders/vignetteShader";

const SPEED = 1.0;
const NOISE_SCALE = 0.6;
const NOISE_INTENSITY = 0.52;
const TIME_SCALE = 1;
const FOCUS = 3.8;
const APERTURE = 1.79;
const POINT_SIZE = 10.0;
const OPACITY = 0.8;
const PLANE_SCALE = 10.0;
const SIZE = 512;
const VIGNETTE_DARKNESS = 1.5;
const VIGNETTE_OFFSET = 0.4;

export const GL = ({ hovering }: { hovering: boolean }) => {
  return (
    <div className="absolute inset-0">
      <Canvas
        // Don't re-measure on scroll — the debounced remeasure made the
        // canvas visibly stretch for a frame when scrolling back to the hero.
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
        camera={{
          position: [
            1.2629783123314589, 2.664606471394044, -1.8178993743288914,
          ],
          fov: 50,
          near: 0.01,
          far: 300,
        }}
      >
        <color attach="background" args={["#000"]} />
        <Particles
          speed={SPEED}
          aperture={APERTURE}
          focus={FOCUS}
          size={SIZE}
          noiseScale={NOISE_SCALE}
          noiseIntensity={NOISE_INTENSITY}
          timeScale={TIME_SCALE}
          pointSize={POINT_SIZE}
          opacity={OPACITY}
          planeScale={PLANE_SCALE}
          introspect={hovering}
        />
        <Effects multisamping={0} disableGamma>
          <shaderPass
            args={[VignetteShader]}
            uniforms-darkness-value={VIGNETTE_DARKNESS}
            uniforms-offset-value={VIGNETTE_OFFSET}
          />
        </Effects>
      </Canvas>
    </div>
  );
};
