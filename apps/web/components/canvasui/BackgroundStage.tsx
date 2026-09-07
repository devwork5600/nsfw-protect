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
        style={{ position: 'absolute', inset: 0 }}
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
