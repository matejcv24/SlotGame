import { TextStyle } from 'pixi.js';

// Text Styles
export const headerTextStyle = new TextStyle({
  fontFamily: 'Comic Sans MS',
  fontSize: 50,
  fontStyle: 'italic',
  fontWeight: 'bold',
  fill: { color: 0xff0000 },
  stroke: { color: 0xffd700, width: 10 },
  dropShadow: {
    color: 0x000000,
    angle: Math.PI / 6,
    blur: 4,
    distance: 8,
  },
  wordWrap: true,
  wordWrapWidth: 440,
});

export const balanceTextStyle = new TextStyle({
  fontSize: 20,
  fill: 0xffffff,
});

export const balanceAmountTextStyle = new TextStyle({
  fontSize: 24,
  fill: 0xffffff,
  fontWeight: 'bold',
});

export const betLabelTextStyle = new TextStyle({
  fontSize: 20,
  fill: 0xffffff,
});

export const winAmountTextStyle = new TextStyle({
  fontSize: 20,
  fill: 0xffffff,
  fontWeight: 'bold',
});

export const betButtonTextStyle = new TextStyle({
  fontSize: 16,
  fill: 0xffffff,
  fontWeight: 'bold',
});

// Reel Constants
export const REEL_WIDTH = 140;
export const SYMBOL_SIZE = 100;
export const BORDER_THICKNESS = 8;
export const REEL_HEIGHT = SYMBOL_SIZE * 3 + 15;
export const REEL_SPACING = 5;
export const TOTAL_REEL_WIDTH = 7 * REEL_WIDTH + 6 * REEL_SPACING;

// Button Constants
export const BUTTON_SCALE = 0.2;
export const BUTTON_WIDTH = 60;
export const BUTTON_HEIGHT = 40;
export const BUTTON_SPACING = 10;
export const TOTAL_BUTTONS_WIDTH = 5 * BUTTON_WIDTH + 4 * BUTTON_SPACING; // 5 bet buttons

// Colors
export const BACKGROUND_COLOR = 0x1099bb;
export const REEL_BACKGROUND_COLOR = 0xc69c6d;
export const REEL_BORDER_COLOR = 0xffd700;
export const BUTTON_ACTIVE_COLOR = 0x568203;
export const BUTTON_INACTIVE_COLOR = 0x333333;
export const AUTOPLAY_ACTIVE_TINT = 0x00ff80;
export const AUTOPLAY_INACTIVE_TINT = 0xffffff;

// Positioning Offsets
export const SLOT_BORDER_HEIGHT_SCALE = 0.38;
export const SLOT_BORDER_Y_OFFSET = 62;
export const REEL_OFFSET_Y_ADJUST = 20;
export const REEL_CONTAINER_Y_ADJUST = 5;
export const HEADER_Y_POSITION = 50;

// Margin Calculation Functions
export const getMarginTop = (screenHeight, slotBorderHeight) =>
  (screenHeight - slotBorderHeight) / 2;
export const getMarginLeft = (screenWidth, slotBorderWidth) =>
  (screenWidth - slotBorderWidth) / 2;
