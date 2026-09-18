import React from 'react';
import { Composition } from 'remotion';
import { Reel, FPS, TOTAL_FRAMES } from './Reel';

export const Root: React.FC = () => (
  <Composition id="Reel" component={Reel} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
);
