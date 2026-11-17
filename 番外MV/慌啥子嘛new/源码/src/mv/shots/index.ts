import type { ShotDef } from '../engine';
import { INTRO_SHOTS } from './intro';
import { VERSE1_SHOTS } from './verse1';
import { CHORUS1_SHOTS } from './chorus1';
import { VERSE2_SHOTS } from './verse2';
import { CHORUS2_SHOTS } from './chorus2';

export const ALL_SHOTS: ShotDef[] = [
  ...INTRO_SHOTS,
  ...VERSE1_SHOTS,
  ...CHORUS1_SHOTS,
  ...VERSE2_SHOTS,
  ...CHORUS2_SHOTS,
];
