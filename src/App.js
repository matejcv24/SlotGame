import React, { useEffect } from 'react';
import './App.css';
import { Sound } from '@pixi/sound';
import {
  Application,
  Assets,
  BlurFilter,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from 'pixi.js';
import { headerTextStyle, REEL_WIDTH, SYMBOL_SIZE, BORDER_THICKNESS, REEL_HEIGHT, REEL_SPACING, BUTTON_SCALE } from './styles.js';
import { tweenTo, lerp, linear } from './utils.js';

function App() {
  useEffect(() => {
    (async () => {
      const app = new Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1099bb,
        resizeTo: window,
      });

      await app.init({ background: '#1099bb', resizeTo: window });

      app.view.id = 'pixi-canvas';
      document.body.appendChild(app.view);

      await Assets.load([
        '/symbols/pozadina.jpg',
        '/symbols/slotborder.png',
        '/symbols/broccoli.png',
        '/symbols/banana.png',
        '/symbols/pepper.png',
        '/symbols/apple.png',
        '/symbols/grapes.png',
        '/symbols/startbutton.png',
        '/symbols/pausebutton.png',
        '/symbols/autoplaybutton.png',
        '/audio/audio1.mp3',
        '/audio/audio2.mp3',
        '/audio/clicksound.wav',
        '/audio/winsound.wav',
        '/gif/fire.gif',
      ]);

      const backgroundTexture = Texture.from('/symbols/pozadina.jpg');
      const backgroundSprite = new Sprite(backgroundTexture);
      backgroundSprite.width = app.screen.width;
      backgroundSprite.height = app.screen.height;
      backgroundSprite.x = 0;
      backgroundSprite.y = 0;
      app.stage.addChild(backgroundSprite);

      const soundInstance = Sound.from({
        url: '/audio/audio1.mp3',
        preload: true,
        loaded: (err, sound) => {
          if (err) console.error('Error loading audio1:', err);
          else console.log('Audio1 loaded:', sound);
        },
      });

      const spinSound = Sound.from({
        url: '/audio/audio2.mp3',
        preload: true,
        loaded: (err, sound) => {
          if (err) console.error('Error loading audio2:', err);
          else console.log('Audio2 loaded:', sound);
        },
      });

      const clickSound = Sound.from({
        url: '/audio/clicksound.wav',
        preload: true,
        loaded: (err, sound) => {
          if (err) console.error('Error loading clicksound:', err);
          else console.log('Clicksound loaded:', sound);
        },
      });

      const winSound = Sound.from({
        url: '/audio/winsound.wav',
        preload: true,
        loaded: (err, sound) => {
          if (err) console.error('Error loading winsound:', err);
          else console.log('Winsound loaded:', sound);
        },
      });

      const slotTextures = [
        { name: 'broccoli', texture: Texture.from('/symbols/broccoli.png') },
        { name: 'banana', texture: Texture.from('/symbols/banana.png') },
        { name: 'pepper', texture: Texture.from('/symbols/pepper.png') },
        { name: 'apple', texture: Texture.from('/symbols/apple.png') },
        { name: 'grapes', texture: Texture.from('/symbols/grapes.png') },
      ];

      const symbolValues = {
        'apple': 5,
        'banana': 10,
        'broccoli': 15,
        'grapes': 20,
        'pepper': 25
      };

      const reels = [];
      const reelContainer = new Container();

      const slotBorderTexture = Texture.from('/symbols/slotborder.png');
      const slotBorderSprite = new Sprite(slotBorderTexture);
      const totalWidth = 7 * REEL_WIDTH + 6 * REEL_SPACING;
      const slotBorderScaleFactor = totalWidth / slotBorderTexture.width;
      slotBorderSprite.scale.set(slotBorderScaleFactor);

      const heightScaleFactor = 0.38;
      slotBorderSprite.scale.y = heightScaleFactor;

      slotBorderSprite.x = -(slotBorderSprite.width - totalWidth) / 2;
      slotBorderSprite.y = -(slotBorderSprite.height - REEL_HEIGHT) / 2 + 62;
      reelContainer.addChild(slotBorderSprite);

      const reelOffsetX = (slotBorderSprite.width - totalWidth) / 2;
      const reelOffsetY = (slotBorderSprite.height - REEL_HEIGHT) / 2 + 20;

      for (let i = 0; i < 5; i++) {
        const rc = new Container();
        rc.x = reelOffsetX + i * (REEL_WIDTH + REEL_SPACING) + 145;
        rc.y = reelOffsetY + 5;
        reelContainer.addChild(rc);

        const reel = {
          container: rc,
          symbols: [],
          position: 0,
          previousPosition: 0,
          blur: new BlurFilter(),
        };

        reel.blur.blurX = 0;
        reel.blur.blurY = 0;
        rc.filters = [reel.blur];

        const reelBackground = new Graphics();
        reelBackground.beginFill(0xC69C6D);
        reelBackground.drawRect(0, 0, REEL_WIDTH, REEL_HEIGHT);
        reelBackground.endFill();
        rc.addChild(reelBackground);

        const symbolOffset = (REEL_HEIGHT - SYMBOL_SIZE * 3) / 2;
        for (let j = 0; j < 4; j++) {
          const randomSymbol = slotTextures[Math.floor(Math.random() * slotTextures.length)];
          const symbol = new Sprite(randomSymbol.texture);
          symbol.textureName = randomSymbol.name;
          symbol.y = symbolOffset + j * SYMBOL_SIZE;
          symbol.scale.x = symbol.scale.y = Math.min(
            SYMBOL_SIZE / symbol.width,
            SYMBOL_SIZE / symbol.height
          );
          symbol.x = Math.round((REEL_WIDTH - symbol.width) / 2);
          reel.symbols.push(symbol);
          rc.addChild(symbol);
        }

        const border = new Graphics();
        border.lineStyle(BORDER_THICKNESS, 0xFFD700, 1);
        border.beginFill(0x000000, 0);
        border.drawRect(0, 0, REEL_WIDTH, REEL_HEIGHT);
        border.endFill();
        rc.addChild(border);

        const mask = new Graphics();
        mask.beginFill(0xFFFFFF);
        mask.drawRect(0, 0, REEL_WIDTH, REEL_HEIGHT);
        mask.endFill();
        rc.addChild(mask);
        rc.mask = mask;

        reels.push(reel);
      }
      app.stage.addChild(reelContainer);

      const marginTop = (app.screen.height - slotBorderSprite.height) / 2;
      const marginLeft = (app.screen.width - slotBorderSprite.width) / 2;
      reelContainer.x = marginLeft;
      reelContainer.y = marginTop;

      const headerText = new Text('Symbols Hot', headerTextStyle);
      headerText.x = Math.round((app.screen.width - headerText.width) / 2);
      headerText.y = 50;
      app.stage.addChild(headerText);

      const startButtonTexture = Texture.from('/symbols/startbutton.png');
      const pauseButtonTexture = Texture.from('/symbols/pausebutton.png');
      const autoplayButtonTexture = Texture.from('/symbols/autoplaybutton.png');

      let player = {
        credits: 9999,
        chip: 5.00,
      };

      const balanceText = new Text('BALANCE:', { fontSize: 20, fill: 0xffffff });
      balanceText.x = marginLeft;
      balanceText.y = marginTop + slotBorderSprite.height + 10;
      app.stage.addChild(balanceText);

      const balanceAmountText = new Text(`${player.credits.toFixed(2)}`, { 
        fontSize: 24, 
        fill: 0xffffff, 
        fontWeight: 'bold'
      });
      balanceAmountText.x = marginLeft;
      balanceAmountText.y = marginTop + slotBorderSprite.height + 35;
      app.stage.addChild(balanceAmountText);

      let betLabel = new Text('PLEASE PLACE YOUR BET', { fontSize: 20, fill: 0xffffff });
      betLabel.x = Math.round((app.screen.width - betLabel.width) / 2);
      betLabel.y = marginTop + slotBorderSprite.height + 10;
      app.stage.addChild(betLabel);

      const winAmountText = new Text('', { 
        fontSize: 20, 
        fill: 0xffffff, 
        fontWeight: 'bold' 
      });
      winAmountText.y = marginTop + slotBorderSprite.height + 10;
      winAmountText.visible = false;
      app.stage.addChild(winAmountText);

      const betValues = [5, 10, 15, 20, 25];
      const betButtons = [];
      const buttonWidth = 60;
      const buttonHeight = 40;
      const buttonSpacing = 10;
      const totalButtonsWidth = betValues.length * buttonWidth + (betValues.length - 1) * buttonSpacing;

      betValues.forEach((value, index) => {
        const button = new Graphics();
        button.beginFill(value === player.chip ? 0x568203 : 0x333333);
        button.drawRect(0, 0, buttonWidth, buttonHeight);
        button.endFill();
        button.x = (app.screen.width - totalButtonsWidth) / 2 + index * (buttonWidth + buttonSpacing);
        button.y = marginTop + slotBorderSprite.height + 40;
        button.eventMode = 'static';
        button.cursor = 'pointer';
      
        const buttonText = new Text(value.toFixed(2), { 
          fontSize: 16, 
          fill: 0xffffff, 
          fontWeight: 'bold'
        });
        buttonText.x = (buttonWidth - buttonText.width) / 2;
        buttonText.y = (buttonHeight - buttonText.height) / 2;
        button.addChild(buttonText);
      
        button.addListener('pointerdown', () => {
          if (clickSound && clickSound.isPlayable) {
            clickSound.play();
          }
          
          if (isSpinning) {
            stopSpinning();
          } else {
            player.chip = value;
            betButtons.forEach((btn, idx) => {
              btn.clear();
              btn.beginFill(betValues[idx] === player.chip ? 0x568203 : 0x333333);
              btn.drawRect(0, 0, buttonWidth, buttonHeight);
              btn.endFill();
            });
            updateUI();
            startPlay();
          }
        });
      
        betButtons.push(button);
        app.stage.addChild(button);
      });

      const startButton = new Sprite(startButtonTexture);
      startButton.scale.set(BUTTON_SCALE);
      startButton.x = marginLeft + slotBorderSprite.width - startButton.width;
      startButton.y = marginTop + slotBorderSprite.height + 20;
      startButton.eventMode = 'static';
      startButton.cursor = 'pointer';

      const autoplayButton = new Sprite(autoplayButtonTexture);
      autoplayButton.scale.set(BUTTON_SCALE);
      autoplayButton.x = startButton.x - autoplayButton.width - 10;
      autoplayButton.y = marginTop + slotBorderSprite.height + 20;
      autoplayButton.eventMode = 'static';
      autoplayButton.cursor = 'pointer';

      const updateUI = () => {
        balanceAmountText.text = `${player.credits.toFixed(2)}`;
        balanceText.x = marginLeft;
        balanceAmountText.x = marginLeft;
        betLabel.x = Math.round((app.screen.width - betLabel.width) / 2);
        if (winAmountText.visible) {
          winAmountText.x = betLabel.x + betLabel.width + 5;
        }
        betButtons.forEach((button, index) => {
          button.x = (app.screen.width - totalButtonsWidth) / 2 + index * (buttonWidth + buttonSpacing);
        });
      };

      let isSpinning = false;
      let isAutoPlaying = false;
      let running = false;
      const tweening = [];
      let fireCleanups = []; // Store cleanup functions for fire effects

      function createBlinkEffect(symbol, lineNumber) {
        const blinkContainer = new Container();
        
        // Define border colors based on the winning line
        const borderColors = {
          1: 0x0000FF, // Blue for Line 1
          2: 0xFFFF00, // Yellow for Line 2
          3: 0x00FF00, // Green for Line 3
          4: 0xFF69B4, // Pink for Line 4
          5: 0xFF0000, // Red for Line 5
        };
        
        // Select the border color based on the winning line, default to gold if lineNumber is invalid
        const borderColor = borderColors[lineNumber] || 0xFFD700;
        console.log(`Applying border color for line ${lineNumber}: ${borderColor.toString(16)}`);
        
        // Define the border
        const border = new Graphics();
        const borderThickness = 4; // Thickness of the border
        const widthIncrease = 20; // How much wider we want the box to be (10px on each side)
        const heightIncrease = 1; // Keep height the same or adjust if needed
        border.lineStyle(borderThickness, borderColor, 1);
        border.beginFill(0xFFEA00, 0.6);
        border.drawRect(
          -widthIncrease/2, // Start position X (moved left to center the wider box)
          -heightIncrease/2, // Start position Y
          SYMBOL_SIZE + widthIncrease, // New width
          SYMBOL_SIZE + heightIncrease // New height
        );
        border.endFill();
        
        // Position the border to align with the symbol box
        const symbolOffsetX = (SYMBOL_SIZE - symbol.width) / 2;
        const symbolOffsetY = (SYMBOL_SIZE - symbol.height) / 2;
        blinkContainer.x = symbol.x - symbolOffsetX;
        blinkContainer.y = symbol.y - symbolOffsetY;
        
        // Add the border to the container
        blinkContainer.addChild(border);
        
        // Ensure the border is behind the symbol
        symbol.parent.addChildAt(blinkContainer, symbol.parent.getChildIndex(symbol));
      
        // Store original scale for pulsing animation
        const originalScale = { x: symbol.scale.x, y: symbol.scale.y };
        
        // Blinking animation for border and pulsing for symbol
        let blinkDirection = -1; // 1 for fading in, -1 for fading out
        const blinkSpeed = 0.05; // Speed of the blink (alpha change per frame)
        const minAlpha = 0.3; // Minimum opacity
        const maxAlpha = 1.0; // Maximum opacity
        
        // Pulsing animation variables
        let pulseDirection = 2; // 1 for growing, -1 for shrinking
        const pulseSpeed = 0.0020;
        const minScale = 0.9;
        const maxScale = 1;
        
        const animateEffects = () => {
          // Update alpha for blinking effect
          border.alpha += blinkDirection * blinkSpeed;
          
          // Update scale for pulsing effect
          symbol.scale.x += pulseDirection * pulseSpeed;
          symbol.scale.y += pulseDirection * pulseSpeed;
          
          // Reverse blink direction if alpha reaches the min or max
          if (border.alpha <= minAlpha) {
            border.alpha = minAlpha;
            blinkDirection = 1;
          } else if (border.alpha >= maxAlpha) {
            border.alpha = maxAlpha;
            blinkDirection = -1;
          }
          
          // Reverse pulse direction if scale reaches min or max
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
        
        // Add the animation to the ticker
        app.ticker.add(animateEffects);
        
        // Return a cleanup function
        return () => {
          app.ticker.remove(animateEffects);
          blinkContainer.destroy({ children: true });
          // Reset symbol scale to original when effect ends
          symbol.scale.set(originalScale.x, originalScale.y);
        };
      }

      autoplayButton.addListener('pointerdown', () => {
        if (clickSound && clickSound.isPlayable) {
          console.log('Playing click sound (clicksound.wav)');
          clickSound.play();
        }
        isAutoPlaying = !isAutoPlaying;
        console.log('Autoplay toggled:', isAutoPlaying);
        if (isAutoPlaying) {
          autoplayButton.tint = 0x00FF80;
        } else {
          autoplayButton.tint = 0xFFFFFF;
        }
        if (isAutoPlaying && !running) {
          startPlay();
        }
      });

      startButton.addListener('pointerdown', () => {
        if (clickSound && clickSound.isPlayable) {
          console.log('Playing click sound (clicksound.wav)');
          clickSound.play();
        }
        if (!isSpinning) {
          startPlay();
        } else {
          stopSpinning();
        }
      });

      app.stage.addChild(startButton);
      app.stage.addChild(autoplayButton);

      function startPlay() {
        if (running) return;
        if (player.credits < player.chip) {
          console.log('Not enough credits to spin');
          return;
        }
      
        // Reset all symbol alphas to 1.0 before starting the spin
        reels.forEach(reel => {
          reel.symbols.forEach(symbol => {
            symbol.alpha = 1.0; // Ensure all symbols start fully opaque
          });
        });
      
        fireCleanups.forEach(cleanup => cleanup());
        fireCleanups = [];
      
        running = true;
        isSpinning = true;
      
        betLabel.text = 'GOOD LUCK!';
        betLabel.x = Math.round((app.screen.width - betLabel.width) / 2);
        winAmountText.visible = false;
      
        startButton.texture = pauseButtonTexture;
        startButton.x = marginLeft + slotBorderSprite.width - startButton.width;
        startButton.y = marginTop + slotBorderSprite.height + 20;
      
        player.credits -= player.chip;
        updateUI();
      
        if (spinSound && spinSound.isPlayable) {
          console.log('Playing spin sound (audio2.mp3)');
          spinSound.play();
        }
      
        const baseSpinTime = 700;
        const stopDelay = 300;
      
        for (let i = 0; i < reels.length; i++) {
          const r = reels[i];
          const extra = Math.floor(Math.random() * 3);
          const target = r.position + 10 + i * 5 + extra;
          const spinTime = baseSpinTime + i * stopDelay;
      
          tweenTo(
            r,
            'position',
            target,
            spinTime,
            linear(),
            null,
            () => {
              if (soundInstance && soundInstance.isPlayable) {
                console.log(`Reel ${i} stopped, playing sound (audio1.mp3)`);
                soundInstance.play();
              }
              if (i === reels.length - 1) {
                reelsComplete();
              }
            },
            tweening
          );
        }
      }

      function stopSpinning() {
        if (!running) return;

        const remainingTweens = tweening.filter(t => reels.includes(t.object));
        remainingTweens.forEach((tween) => {
          tween.object[tween.property] = tween.target;
          if (tween.complete) {
            tween.complete(tween);
          }
        });

        tweening.length = 0;
        reelsComplete();
      }

      function printReelSymbols() {
        console.log('Current symbols on each reel:');
        reels.forEach((reel, reelIndex) => {
          const symbolOffset = (REEL_HEIGHT - SYMBOL_SIZE * 3) / 2;
          const visibleSymbols = reel.symbols
            .filter(symbol => symbol.y >= symbolOffset && symbol.y < symbolOffset + SYMBOL_SIZE * 3)
            .sort((a, b) => a.y - b.y)
            .map(symbol => symbol.textureName);
          console.log(`Reel ${reelIndex + 1}: ${visibleSymbols.join(', ')}`);
        });
      }

      function checkForWins() {
        const reelSymbols = reels.map(reel => {
          const symbolOffset = (REEL_HEIGHT - SYMBOL_SIZE * 3) / 2;
          return reel.symbols
            .filter(symbol => symbol.y >= symbolOffset && symbol.y < symbolOffset + SYMBOL_SIZE * 3)
            .sort((a, b) => a.y - b.y)
            .map(symbol => ({ name: symbol.textureName, sprite: symbol }));
        });
      
        const lines = [
          reelSymbols.map(symbols => symbols[0]), // Line 1
          reelSymbols.map(symbols => symbols[1]), // Line 2
          reelSymbols.map(symbols => symbols[2]), // Line 3
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
      
        console.log('Winning lines:', lines.map(line => line.map(s => s.name)));
      
        let totalWinnings = 0;
        const winningSymbols = new Set();
        let hasWin = false;
        let winningLine = null; // Track the first winning line number
      
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
            const lineWinnings = (symbolValue * winLength) * player.chip;
            totalWinnings += lineWinnings;
            console.log(`Win on line ${index + 1}: ${firstSymbol} x${winLength} = ${lineWinnings.toFixed(2)}`);
      
            for (let i = 0; i < winLength; i++) {
              winningSymbols.add(line[i].sprite);
            }
      
            // Store the first winning line number (1-based index)
            if (winningLine === null) {
              winningLine = index + 1;
            }
          }
        });
      
        if (totalWinnings > 0) {
          player.credits += totalWinnings;
          console.log(`Total winnings: ${totalWinnings.toFixed(2)} credits`);
          updateUI();
        }
      
        if (hasWin && winSound && winSound.isPlayable) {
          console.log('Playing win sound (winsound.wav), duration:', winSound.duration);
          winSound.play();
        }
      
        return { winnings: totalWinnings, winningSymbols: Array.from(winningSymbols), winningLine };
      }

      function reelsComplete() {
        running = false;
        isSpinning = false;
        console.log('All reels have stopped');
      
        reels.forEach(reel => {
          reel.position = Math.round(reel.position);
          for (let j = 0; j < reel.symbols.length; j++) {
            reel.symbols[j].y = ((reel.position + j) % reel.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE + (REEL_HEIGHT - SYMBOL_SIZE * 3) / 2;
          }
        });
      
        printReelSymbols();
        const { winnings, winningSymbols, winningLine } = checkForWins();
      
        fireCleanups.forEach(cleanup => cleanup());
        fireCleanups = [];
      
        // Apply shading effect only if there’s a win
        if (winnings > 0) {
          console.log('Win detected, applying shading to non-winning symbols');
          reels.forEach(reel => {
            reel.symbols.forEach(symbol => {
              // Set non-winning symbols to semi-transparent
              if (!winningSymbols.includes(symbol)) {
                symbol.alpha = 0.3; // Shady effect for non-winning symbols
              } else {
                symbol.alpha = 1.0; // Ensure winning symbols are fully opaque
                const cleanup = createBlinkEffect(symbol, winningLine);
                fireCleanups.push(cleanup);
              }
            });
          });
        }
      
        if (winnings > 0) {
          betLabel.text = 'YOU WON';
          winAmountText.text = `${winnings.toFixed(2)}`;
          winAmountText.visible = true;
          betLabel.x = Math.round((app.screen.width - (betLabel.width + 5 + winAmountText.width)) / 2);
          winAmountText.x = betLabel.x + betLabel.width + 5;
        } else {
          betLabel.text = 'PLEASE PLACE YOUR BET';
          winAmountText.visible = false;
          betLabel.x = Math.round((app.screen.width - betLabel.width) / 2);
        }
      
        startButton.texture = startButtonTexture;
        startButton.x = marginLeft + slotBorderSprite.width - startButton.width;
        startButton.y = marginTop + slotBorderSprite.height + 20;
      
        if (spinSound) {
          console.log('Stopping spin sound (audio2.mp3)');
          spinSound.stop();
        }
      
        if (isAutoPlaying) {
          if (winnings > 0) {
            console.log('Win detected during autoplay, waiting for winSound to finish...');
            const waitForWinSound = () => {
              if (!winSound.isPlaying) {
                console.log('winSound finished, triggering next spin');
                if (clickSound && clickSound.isPlayable) {
                  clickSound.play();
                }
                if (isAutoPlaying) {
                  startPlay();
                }
              } else {
                setTimeout(waitForWinSound, 100);
              }
            };
            waitForWinSound();
          } else {
            console.log('No win during autoplay, proceeding with 500ms delay');
            setTimeout(() => {
              if (clickSound && clickSound.isPlayable) {
                clickSound.play();
              }
              if (isAutoPlaying) {
                startPlay();
              }
            }, 500);
          }
        }
      }

      app.ticker.add(() => {
        for (let i = 0; i < reels.length; i++) {
          const r = reels[i];
          r.blur.blurY = (r.position - r.previousPosition) * 8;
          r.previousPosition = r.position;

          for (let j = 0; j < r.symbols.length; j++) {
            const s = r.symbols[j];
            const prevy = s.y;

            s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE + (REEL_HEIGHT - SYMBOL_SIZE * 3) / 2;

            if (s.y < -SYMBOL_SIZE && prevy > SYMBOL_SIZE) {
              const randomSymbol = slotTextures[Math.floor(Math.random() * slotTextures.length)];
              s.texture = randomSymbol.texture;
              s.textureName = randomSymbol.name;
              s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.texture.width, SYMBOL_SIZE / s.texture.height);
              s.x = Math.round((REEL_WIDTH - s.width) / 2);
            }
          }
        }
      });

      app.ticker.add(() => {
        const now = Date.now();
        const remove = [];

        for (let i = 0; i < tweening.length; i++) {
          const t = tweening[i];
          const phase = Math.min(1, (now - t.start) / t.time);

          t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
          if (t.change) t.change(t);
          if (phase === 1) {
            t.object[t.property] = t.target;
            if (t.complete) t.complete(t);
            remove.push(t);
          }
        }
        for (let i = 0; i < remove.length; i++) {
          tweening.splice(tweening.indexOf(remove[i]), 1);
        }
      });

      window.addEventListener('resize', () => {
        backgroundSprite.width = app.screen.width;
        backgroundSprite.height = app.screen.height;
        headerText.x = Math.round((app.screen.width - headerText.width) / 2);
        reelContainer.x = (app.screen.width - slotBorderSprite.width) / 2;
        reelContainer.y = (app.screen.height - slotBorderSprite.height) / 2;
        slotBorderSprite.scale.set(totalWidth / slotBorderTexture.width);
        slotBorderSprite.x = -(slotBorderSprite.width - totalWidth) / 2;
        slotBorderSprite.y = -(slotBorderSprite.height - REEL_HEIGHT) / 2;
        for (let i = 0; i < reels.length; i++) {
          reels[i].container.x = reelOffsetX + i * (REEL_WIDTH + REEL_SPACING);
          reels[i].container.y = reelOffsetY;
        }
        startButton.x = marginLeft + slotBorderSprite.width - startButton.width;
        startButton.y = marginTop + slotBorderSprite.height + 20;
        autoplayButton.x = startButton.x - autoplayButton.width - 10;
        autoplayButton.y = marginTop + slotBorderSprite.height + 20;
        updateUI();
      });

      return () => {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        if (soundInstance) soundInstance.stop();
        if (spinSound) spinSound.stop();
        if (clickSound) clickSound.stop();
        if (winSound) winSound.stop();
        window.removeEventListener('resize', () => {});
      };
    })();
  }, []);

  return <div className="App"></div>;
}

export default App;