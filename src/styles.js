import { TextStyle } from 'pixi.js';

export const headerTextStyle = new TextStyle({
  fontFamily: 'Comic Sans MS',
  fontSize: 50,
  fontStyle: 'italic',
  fontWeight: 'bold',
  fill: { color: 0xff0000 },
  stroke: { color: 0xFFD700, width: 10 },
  dropShadow: {
    color: 0x000000,
    angle: Math.PI / 6,
    blur: 4,
    distance: 8,
  },
  wordWrap: true,
  wordWrapWidth: 440,
});

// Reel constants
export const REEL_WIDTH = 140;
export const SYMBOL_SIZE = 100;
export const BORDER_THICKNESS = 8;
export const REEL_HEIGHT = SYMBOL_SIZE * 3 + 15;
export const REEL_SPACING = 5;

// Button scale constant
export const BUTTON_SCALE = 0.2;