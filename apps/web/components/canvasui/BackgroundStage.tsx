'use client';

import { useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

import { ForceField } from './ForceField';

export interface BackgroundStageProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function BackgroundStage({ as: As = 'div', className, children }: BackgroundStageProps) {
  const [ready, setReady] = useState(false);

  const style: CSSProperties = {
    opacity: ready ? 1 : 0,
    transition: 'opacity 300ms ease-out',
  };

  return (
    <As className={className} style={style}>
      <ForceField
        // Fixed to the viewport, not absolute within this (growing) container:
        // on a long page (the homepage especially), `absolute` stretches the
        // canvas to the full scrollable content height, feeding the shader's
        // pageFrag.y = frag.y - uScroll compensation (see ForceField.tsx)
        // ever-larger coordinate magnitudes as the page/scroll grows.
        // mediump fragment shaders — the silent fallback on a lot of real
        // mobile GPUs even when `precision highp float` is requested, since
        // GLSL ES only guarantees highp support in the vertex stage — lose
        // precision on that subtraction at those magnitudes, visible as
        // noise/static. uScroll already exists specifically to fake a
        // page-scroll parallax on a viewport-pinned canvas, so `fixed` is
        // the setup it was actually built for.
        style={{ position: 'fixed', inset: 0 }}
        shape="hexagon"
        color={[0.15, 0.68, 1]}
        cellScale={26}
        gridReveal="always"
        gridOpacity={0.2}
        hoverGlow={0}
        hoverCharge={0}
        clickRipples={false}
        refraction={0}
        opacity={0.35}
        onReady={() => setReady(true)}
      >
        <></>
      </ForceField>
      {children}
    </As>
  );
}

export default BackgroundStage;
