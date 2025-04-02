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
import {
  headerTextStyle,
  balanceTextStyle,
  balanceAmountTextStyle,
  betLabelTextStyle,
  winAmountTextStyle,
  betButtonTextStyle,
  REEL_WIDTH,
  SYMBOL_SIZE,
  BORDER_THICKNESS,
  REEL_HEIGHT,
  REEL_SPACING,
  TOTAL_REEL_WIDTH,
  BUTTON_SCALE,
  BUTTON_WIDTH,
  BUTTON_HEIGHT,
  BUTTON_SPACING,
  TOTAL_BUTTONS_WIDTH,
  BACKGROUND_COLOR,
  REEL_BACKGROUND_COLOR,
  REEL_BORDER_COLOR,
  BUTTON_ACTIVE_COLOR,
  BUTTON_INACTIVE_COLOR,
  AUTOPLAY_ACTIVE_TINT,
  AUTOPLAY_INACTIVE_TINT,
  SLOT_BORDER_HEIGHT_SCALE,
  SLOT_BORDER_Y_OFFSET,
  REEL_OFFSET_Y_ADJUST,
  REEL_CONTAINER_Y_ADJUST,
  HEADER_Y_POSITION,
  getMarginTop,
  getMarginLeft,
} from './styles.js';
import {
  tweenTo,
  lerp,
  linear,
  createBlinkEffect,
  printReelSymbols,
  checkForWins,
  updateUI,
} from './utils.js';

function App() {
  useEffect(() => {
    (async () => {
      const app = new Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: BACKGROUND_COLOR,
        resizeTo: window,
      });

      await app.init({
        background: `#${BACKGROUND_COLOR.toString(16)}`,
        resizeTo: window,
      });

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
        apple: 5,
        banana: 10,
        broccoli: 15,
        grapes: 20,
        pepper: 25,
      };

      const reels = [];
      const reelContainer = new Container();

      const slotBorderTexture = Texture.from('/symbols/slotborder.png');
      const slotBorderSprite = new Sprite(slotBorderTexture);
      const slotBorderScaleFactor = TOTAL_REEL_WIDTH / slotBorderTexture.width;
      slotBorderSprite.scale.set(slotBorderScaleFactor);
      slotBorderSprite.scale.y = SLOT_BORDER_HEIGHT_SCALE;
      slotBorderSprite.x = -(slotBorderSprite.width - TOTAL_REEL_WIDTH) / 2;
      slotBorderSprite.y =
        -(slotBorderSprite.height - REEL_HEIGHT) / 2 + SLOT_BORDER_Y_OFFSET;
      reelContainer.addChild(slotBorderSprite);

      const reelOffsetX = (slotBorderSprite.width - TOTAL_REEL_WIDTH) / 2;
      const reelOffsetY =
        (slotBorderSprite.height - REEL_HEIGHT) / 2 + REEL_OFFSET_Y_ADJUST;

      for (let i = 0; i < 5; i++) {
        const rc = new Container();
        rc.x = reelOffsetX + i * (REEL_WIDTH + REEL_SPACING) + 145; // 145 is a magic number, could be parameterized
        rc.y = reelOffsetY + REEL_CONTAINER_Y_ADJUST;
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
        reelBackground.beginFill(REEL_BACKGROUND_COLOR);
        reelBackground.drawRect(0, 0, REEL_WIDTH, REEL_HEIGHT);
        reelBackground.endFill();
        rc.addChild(reelBackground);

        const symbolOffset = (REEL_HEIGHT - SYMBOL_SIZE * 3) / 2;
        for (let j = 0; j < 4; j++) {
          const randomSymbol =
            slotTextures[Math.floor(Math.random() * slotTextures.length)];
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
        border.lineStyle(BORDER_THICKNESS, REEL_BORDER_COLOR, 1);
        border.beginFill(0x000000, 0);
        border.drawRect(0, 0, REEL_WIDTH, REEL_HEIGHT);
        border.endFill();
        rc.addChild(border);

        const mask = new Graphics();
        mask.beginFill(0xffffff);
        mask.drawRect(0, 0, REEL_WIDTH, REEL_HEIGHT);
        mask.endFill();
        rc.addChild(mask);
        rc.mask = mask;

        reels.push(reel);
      }
      app.stage.addChild(reelContainer);

      const marginTop = getMarginTop(
        app.screen.height,
        slotBorderSprite.height
      );
      const marginLeft = getMarginLeft(
        app.screen.width,
        slotBorderSprite.width
      );
      reelContainer.x = marginLeft;
      reelContainer.y = marginTop;

      const headerText = new Text('Symbols Hot', headerTextStyle);
      headerText.x = Math.round((app.screen.width - headerText.width) / 2);
      headerText.y = HEADER_Y_POSITION;
      app.stage.addChild(headerText);

      const startButtonTexture = Texture.from('/symbols/startbutton.png');
      const pauseButtonTexture = Texture.from('/symbols/pausebutton.png');
      const autoplayButtonTexture = Texture.from('/symbols/autoplaybutton.png');

      let player = {
        credits: 9999,
        chip: 5.0,
      };

      const balanceText = new Text('BALANCE:', balanceTextStyle);
      balanceText.x = marginLeft;
      balanceText.y = marginTop + slotBorderSprite.height + 10;
      app.stage.addChild(balanceText);

      const balanceAmountText = new Text(
        `${player.credits.toFixed(2)}`,
        balanceAmountTextStyle
      );
      balanceAmountText.x = marginLeft;
      balanceAmountText.y = marginTop + slotBorderSprite.height + 35;
      app.stage.addChild(balanceAmountText);

      let betLabel = new Text('PLEASE PLACE YOUR BET', betLabelTextStyle);
      betLabel.x = Math.round((app.screen.width - betLabel.width) / 2);
      betLabel.y = marginTop + slotBorderSprite.height + 10;
      app.stage.addChild(betLabel);

      const winAmountText = new Text('', winAmountTextStyle);
      winAmountText.y = marginTop + slotBorderSprite.height + 10;
      winAmountText.visible = false;
      app.stage.addChild(winAmountText);

      const betValues = [5, 10, 15, 20, 25];
      const betButtons = [];

      betValues.forEach((value, index) => {
        const button = new Graphics();
        button.beginFill(
          value === player.chip ? BUTTON_ACTIVE_COLOR : BUTTON_INACTIVE_COLOR
        );
        button.drawRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT);
        button.endFill();
        button.x =
          (app.screen.width - TOTAL_BUTTONS_WIDTH) / 2 +
          index * (BUTTON_WIDTH + BUTTON_SPACING);
        button.y = marginTop + slotBorderSprite.height + 40;
        button.eventMode = 'static';
        button.cursor = 'pointer';

        const buttonText = new Text(value.toFixed(2), betButtonTextStyle);
        buttonText.x = (BUTTON_WIDTH - buttonText.width) / 2;
        buttonText.y = (BUTTON_HEIGHT - buttonText.height) / 2;
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
              btn.beginFill(
                betValues[idx] === player.chip
                  ? BUTTON_ACTIVE_COLOR
                  : BUTTON_INACTIVE_COLOR
              );
              btn.drawRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT);
              btn.endFill();
            });
            updateUI(
              app,
              player,
              betLabel,
              winAmountText,
              balanceText,
              balanceAmountText,
              betButtons,
              slotBorderSprite,
              TOTAL_BUTTONS_WIDTH,
              BUTTON_WIDTH,
              BUTTON_SPACING
            );
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

      let isSpinning = false;
      let isAutoPlaying = false;
      let running = false;
      const tweening = [];
      let fireCleanups = [];

      autoplayButton.addListener('pointerdown', () => {
        if (clickSound && clickSound.isPlayable) {
          console.log('Playing click sound (clicksound.wav)');
          clickSound.play();
        }
        isAutoPlaying = !isAutoPlaying;
        console.log('Autoplay toggled:', isAutoPlaying);
        if (isAutoPlaying) {
          autoplayButton.tint = AUTOPLAY_ACTIVE_TINT;
        } else {
          autoplayButton.tint = AUTOPLAY_INACTIVE_TINT;
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
        if (winSound && winSound.isPlaying) {
          console.log('Stopping win sound (winsound.wav) as new spin starts');
          winSound.stop();
        }
        if (running) return;
        if (player.credits < player.chip) {
          console.log('Not enough credits to spin');
          return;
        }

        reels.forEach((reel) => {
          reel.symbols.forEach((symbol) => {
            symbol.alpha = 1.0;
          });
        });

        fireCleanups.forEach((cleanup) => cleanup());
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
        updateUI(
          app,
          player,
          betLabel,
          winAmountText,
          balanceText,
          balanceAmountText,
          betButtons,
          slotBorderSprite,
          TOTAL_BUTTONS_WIDTH,
          BUTTON_WIDTH,
          BUTTON_SPACING
        );

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

        if (winSound && winSound.isPlaying) {
          console.log('Stopping win sound (winsound.wav) as spin was stopped');
          winSound.stop();
        }

        const remainingTweens = tweening.filter((t) =>
          reels.includes(t.object)
        );
        remainingTweens.forEach((tween) => {
          tween.object[tween.property] = tween.target;
          if (tween.complete) {
            tween.complete(tween);
          }
        });

        tweening.length = 0;
        reelsComplete();
      }

      function reelsComplete() {
        running = false;
        isSpinning = false;
        console.log('All reels have stopped');

        reels.forEach((reel) => {
          reel.position = Math.round(reel.position);
          for (let j = 0; j < reel.symbols.length; j++) {
            reel.symbols[j].y =
              ((reel.position + j) % reel.symbols.length) * SYMBOL_SIZE -
              SYMBOL_SIZE +
              (REEL_HEIGHT - SYMBOL_SIZE * 3) / 2;
          }
        });

        printReelSymbols(reels, REEL_HEIGHT, SYMBOL_SIZE);
        const { winnings, winningSymbols, winningLine, hasWin } = checkForWins(
          reels,
          symbolValues,
          player,
          REEL_HEIGHT,
          SYMBOL_SIZE
        );

        fireCleanups.forEach((cleanup) => cleanup());
        fireCleanups = [];

        if (winnings > 0) {
          console.log('Win detected, applying shading to non-winning symbols');
          reels.forEach((reel) => {
            reel.symbols.forEach((symbol) => {
              if (!winningSymbols.includes(symbol)) {
                symbol.alpha = 0.3;
              } else {
                symbol.alpha = 1.0;
                const cleanup = createBlinkEffect(
                  symbol,
                  winningLine,
                  app,
                  SYMBOL_SIZE
                );
                fireCleanups.push(cleanup);
              }
            });
          });
        }

        if (winnings > 0) {
          betLabel.text = 'YOU WON';
          winAmountText.text = `${winnings.toFixed(2)}`;
          winAmountText.visible = true;
          betLabel.x = Math.round(
            (app.screen.width - (betLabel.width + 5 + winAmountText.width)) / 2
          );
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

        if (hasWin && winSound && winSound.isPlayable) {
          console.log(
            'Playing win sound (winsound.wav), duration:',
            winSound.duration
          );
          winSound.play();
        }

        if (isAutoPlaying) {
          if (winnings > 0) {
            console.log(
              'Win detected during autoplay, waiting for winSound to finish...'
            );
            const waitForWinSound = () => {
              if (!isAutoPlaying || !winSound.isPlaying) {
                console.log(
                  'winSound finished or autoplay disabled, triggering next spin'
                );
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
              if (!isAutoPlaying) return;
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

            s.y =
              ((r.position + j) % r.symbols.length) * SYMBOL_SIZE -
              SYMBOL_SIZE +
              (REEL_HEIGHT - SYMBOL_SIZE * 3) / 2;

            if (s.y < -SYMBOL_SIZE && prevy > SYMBOL_SIZE) {
              const randomSymbol =
                slotTextures[Math.floor(Math.random() * slotTextures.length)];
              s.texture = randomSymbol.texture;
              s.textureName = randomSymbol.name;
              s.scale.x = s.scale.y = Math.min(
                SYMBOL_SIZE / s.texture.width,
                SYMBOL_SIZE / s.texture.height
              );
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

          t.object[t.property] = lerp(
            t.propertyBeginValue,
            t.target,
            t.easing(phase)
          );
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
        reelContainer.x = getMarginLeft(
          app.screen.width,
          slotBorderSprite.width
        );
        reelContainer.y = getMarginTop(
          app.screen.height,
          slotBorderSprite.height
        );
        slotBorderSprite.scale.set(TOTAL_REEL_WIDTH / slotBorderTexture.width);
        slotBorderSprite.x = -(slotBorderSprite.width - TOTAL_REEL_WIDTH) / 2;
        slotBorderSprite.y = -(slotBorderSprite.height - REEL_HEIGHT) / 2;
        for (let i = 0; i < reels.length; i++) {
          reels[i].container.x = reelOffsetX + i * (REEL_WIDTH + REEL_SPACING);
          reels[i].container.y = reelOffsetY;
        }
        startButton.x = marginLeft + slotBorderSprite.width - startButton.width;
        startButton.y = marginTop + slotBorderSprite.height + 20;
        autoplayButton.x = startButton.x - autoplayButton.width - 10;
        autoplayButton.y = marginTop + slotBorderSprite.height + 20;
        updateUI(
          app,
          player,
          betLabel,
          winAmountText,
          balanceText,
          balanceAmountText,
          betButtons,
          slotBorderSprite,
          TOTAL_BUTTONS_WIDTH,
          BUTTON_WIDTH,
          BUTTON_SPACING
        );
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
