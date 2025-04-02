import { Container, Graphics } from 'pixi.js';

export function tweenTo(
  object,
  property,
  target,
  time,
  easing,
  onchange,
  oncomplete,
  tweening
) {
  const tween = {
    object,
    property,
    propertyBeginValue: object[property],
    target,
    easing,
    time,
    change: onchange,
    complete: oncomplete,
    start: Date.now(),
  };
  tweening.push(tween); // Add to the provided tweening array
}

export function lerp(a1, a2, t) {
  return a1 * (1 - t) + a2 * t;
}

export function linear() {
  return (t) => t;
}

export function createBlinkEffect(symbol, lineNumber, app, SYMBOL_SIZE) {
  const blinkContainer = new Container();

  // Define border colors based on the winning line
  const borderColors = {
    1: 0x0000ff, // Blue for Line 1
    2: 0xffff00, // Yellow for Line 2
    3: 0x00ff00, // Green for Line 3
    4: 0xff69b4, // Pink for Line 4
    5: 0xff0000, // Red for Line 5
  };

  const borderColor = borderColors[lineNumber] || 0xffd700;
  console.log(
    `Applying border color for line ${lineNumber}: ${borderColor.toString(16)}`
  );

  const border = new Graphics();
  const borderThickness = 4;
  const widthIncrease = 20;
  const heightIncrease = 1;
  border.lineStyle(borderThickness, borderColor, 1);
  border.beginFill(0xffea00, 0.6);
  border.drawRect(
    -widthIncrease / 2,
    -heightIncrease / 2,
    SYMBOL_SIZE + widthIncrease,
    SYMBOL_SIZE + heightIncrease
  );
  border.endFill();

  const symbolOffsetX = (SYMBOL_SIZE - symbol.width) / 2;
  const symbolOffsetY = (SYMBOL_SIZE - symbol.height) / 2;
  blinkContainer.x = symbol.x - symbolOffsetX;
  blinkContainer.y = symbol.y - symbolOffsetY;

  blinkContainer.addChild(border);
  symbol.parent.addChildAt(blinkContainer, symbol.parent.getChildIndex(symbol));

  const originalScale = { x: symbol.scale.x, y: symbol.scale.y };
  let blinkDirection = -1;
  const blinkSpeed = 0.05;
  const minAlpha = 0.3;
  const maxAlpha = 1.0;
  let pulseDirection = 2;
  const pulseSpeed = 0.002;
  const minScale = 0.9;
  const maxScale = 1;

  const animateEffects = () => {
    border.alpha += blinkDirection * blinkSpeed;
    symbol.scale.x += pulseDirection * pulseSpeed;
    symbol.scale.y += pulseDirection * pulseSpeed;

    if (border.alpha <= minAlpha) {
      border.alpha = minAlpha;
      blinkDirection = 1;
    } else if (border.alpha >= maxAlpha) {
      border.alpha = maxAlpha;
      blinkDirection = -1;
    }

    if (symbol.scale.x <= originalScale.x * minScale) {
      symbol.scale.x = originalScale.x * minScale;
      symbol.scale.y = originalScale.y * minScale;
      pulseDirection = 1;
    } else if (symbol.scale.x >= originalScale.x * maxScale) {
      symbol.scale.x = originalScale.x * maxScale;
      symbol.scale.y = originalScale.y * maxScale;
      pulseDirection = -1;
    }
  };

  app.ticker.add(animateEffects);

  return () => {
    app.ticker.remove(animateEffects);
    blinkContainer.destroy({ children: true });
    symbol.scale.set(originalScale.x, originalScale.y);
  };
}

export function printReelSymbols(reels, REEL_HEIGHT, SYMBOL_SIZE) {
  console.log('Current symbols on each reel:');
  reels.forEach((reel, reelIndex) => {
    const symbolOffset = (REEL_HEIGHT - SYMBOL_SIZE * 3) / 2;
    const visibleSymbols = reel.symbols
      .filter(
        (symbol) =>
          symbol.y >= symbolOffset && symbol.y < symbolOffset + SYMBOL_SIZE * 3
      )
      .sort((a, b) => a.y - b.y)
      .map((symbol) => symbol.textureName);
    console.log(`Reel ${reelIndex + 1}: ${visibleSymbols.join(', ')}`);
  });
}

export function checkForWins(
  reels,
  symbolValues,
  player,
  REEL_HEIGHT,
  SYMBOL_SIZE
) {
  const reelSymbols = reels.map((reel) => {
    const symbolOffset = (REEL_HEIGHT - SYMBOL_SIZE * 3) / 2;
    return reel.symbols
      .filter(
        (symbol) =>
          symbol.y >= symbolOffset && symbol.y < symbolOffset + SYMBOL_SIZE * 3
      )
      .sort((a, b) => a.y - b.y)
      .map((symbol) => ({ name: symbol.textureName, sprite: symbol }));
  });

  const lines = [
    reelSymbols.map((symbols) => symbols[0]), // Line 1
    reelSymbols.map((symbols) => symbols[1]), // Line 2
    reelSymbols.map((symbols) => symbols[2]), // Line 3
    [
      reelSymbols[0][0],
      reelSymbols[1][1],
      reelSymbols[2][2],
      reelSymbols[3][1],
      reelSymbols[4][0],
    ], // Line 4
    [
      reelSymbols[0][2],
      reelSymbols[1][1],
      reelSymbols[2][0],
      reelSymbols[3][1],
      reelSymbols[4][2],
    ], // Line 5
  ];

  console.log(
    'Winning lines:',
    lines.map((line) => line.map((s) => s.name))
  );

  let totalWinnings = 0;
  const winningSymbols = new Set();
  let hasWin = false;
  let winningLine = null;

  lines.forEach((line, index) => {
    const firstSymbol = line[0].name;
    let winLength = 1;

    for (let i = 1; i < line.length; i++) {
      if (line[i].name === firstSymbol) {
        winLength++;
      } else {
        break;
      }
    }

    if (winLength >= 3) {
      hasWin = true;
      const symbolValue = symbolValues[firstSymbol];
      const lineWinnings = symbolValue * winLength * player.chip;
      totalWinnings += lineWinnings;
      console.log(
        `Win on line ${
          index + 1
        }: ${firstSymbol} x${winLength} = ${lineWinnings.toFixed(2)}`
      );

      for (let i = 0; i < winLength; i++) {
        winningSymbols.add(line[i].sprite);
      }

      if (winningLine === null) {
        winningLine = index + 1;
      }
    }
  });

  if (totalWinnings > 0) {
    player.credits += totalWinnings;
    console.log(`Total winnings: ${totalWinnings.toFixed(2)} credits`);
  }

  return {
    winnings: totalWinnings,
    winningSymbols: Array.from(winningSymbols),
    winningLine,
    hasWin,
  };
}

export function updateUI(
  app,
  player,
  betLabel,
  winAmountText,
  balanceText,
  balanceAmountText,
  betButtons,
  slotBorderSprite,
  totalButtonsWidth,
  buttonWidth,
  buttonSpacing
) {
  const marginLeft = (app.screen.width - slotBorderSprite.width) / 2;
  // const marginTop = (app.screen.height - slotBorderSprite.height) / 2;

  balanceAmountText.text = `${player.credits.toFixed(2)}`;
  balanceText.x = marginLeft;
  balanceAmountText.x = marginLeft;
  betLabel.x = Math.round((app.screen.width - betLabel.width) / 2);
  if (winAmountText.visible) {
    winAmountText.x = betLabel.x + betLabel.width + 5;
  }
  betButtons.forEach((button, index) => {
    button.x =
      (app.screen.width - totalButtonsWidth) / 2 +
      index * (buttonWidth + buttonSpacing);
  });
}
