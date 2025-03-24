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

      const slotTextures = [
        Texture.from('/symbols/broccoli.png'),
        Texture.from('/symbols/banana.png'),
        Texture.from('/symbols/pepper.png'),
        Texture.from('/symbols/apple.png'),
        Texture.from('/symbols/grapes.png'),
      ];

      const reels = [];
      const reelContainer = new Container();

      // Add slot border to reelContainer
      const slotBorderTexture = Texture.from('/symbols/slotborder.png');
      const slotBorderSprite = new Sprite(slotBorderTexture);
      const totalWidth = 7 * REEL_WIDTH + 6 * REEL_SPACING;
      const slotBorderScaleFactor = totalWidth / slotBorderTexture.width; // Scale to match reel width
      slotBorderSprite.scale.set(slotBorderScaleFactor);

      // Adjust height independently - change this value to make the border taller or shorter
      const heightScaleFactor = 0.38;  // Scale to adjust height
      slotBorderSprite.scale.y = heightScaleFactor;

      // Center the slot border horizontally and vertically relative to its own scaled size
      slotBorderSprite.x = -(slotBorderSprite.width - totalWidth) / 2;
      slotBorderSprite.y = -(slotBorderSprite.height - REEL_HEIGHT) / 2 + 62;
      reelContainer.addChild(slotBorderSprite);

      // Adjust reel positions to center within the slot border
      const reelOffsetX = (slotBorderSprite.width - totalWidth) / 2;
      const reelOffsetY = (slotBorderSprite.height - REEL_HEIGHT) / 2 + 20;

      for (let i = 0; i < 5; i++) {
        const rc = new Container();
        rc.x = reelOffsetX + i * (REEL_WIDTH + REEL_SPACING) + 145; // Offset to center within border
        rc.y = reelOffsetY + 5; // Center vertically within border
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
          const symbol = new Sprite(
            slotTextures[Math.floor(Math.random() * slotTextures.length)]
          );
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

      // Player state
      let player = {
        credits: 9999, // Initial credits as per the image
        chip: 5.00, // Initial chip value as per the image
      };

      // Left side: Balance and Amount display (on separate lines)
      const balanceText = new Text('BALANCE:', { fontSize: 24, fill: 0xffffff });
      balanceText.x = marginLeft;
      balanceText.y = marginTop + slotBorderSprite.height + 10;
      app.stage.addChild(balanceText);

      const balanceAmountText = new Text(`${player.credits.toFixed(2)}`, { 
        fontSize: 24, 
        fill: 0xffffff, 
        fontWeight: 'bold' // Make the amount bold
      });
      balanceAmountText.x = marginLeft;
      balanceAmountText.y = marginTop + slotBorderSprite.height + 35; // Position below BALANCE
      app.stage.addChild(balanceAmountText);

      // Center: Bet selection
      let betLabel = new Text('PLEASE PLACE YOUR BET', { fontSize: 20, fill: 0xffffff });
      betLabel.x = Math.round((app.screen.width - betLabel.width) / 2);
      betLabel.y = marginTop + slotBorderSprite.height + 10;
      app.stage.addChild(betLabel);

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
            // If already spinning, clicking a chip will stop the reels
            stopSpinning();
          } else {
            // If not spinning, set the bet amount and start spinning
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

      // Right side: Play/Stop and Autoplay buttons
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

      // Update UI function
      const updateUI = () => {
        balanceAmountText.text = `${player.credits.toFixed(2)}`;
        balanceText.x = marginLeft;
        balanceAmountText.x = marginLeft;
        betLabel.x = Math.round((app.screen.width - betLabel.width) / 2);
        betButtons.forEach((button, index) => {
          button.x = (app.screen.width - totalButtonsWidth) / 2 + index * (buttonWidth + buttonSpacing);
        });
      };

      let isSpinning = false;
      let isAutoPlaying = false;
      let running = false;
      const tweening = [];

      autoplayButton.addListener('pointerdown', () => {
        if (clickSound && clickSound.isPlayable) {
          console.log('Playing click sound (clicksound.wav)');
          clickSound.play();
        } else {
          console.error('Click sound (clicksound.wav) is not playable:', clickSound);
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
        } else {
          console.error('Click sound (clicksound.wav) is not playable:', clickSound);
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

        running = true;
        isSpinning = true;

        // Change the text to "Good luck!"
        betLabel.text = 'GOOD LUCK!';
        betLabel.x = Math.round((app.screen.width - betLabel.width) / 2);

        startButton.texture = pauseButtonTexture;
        startButton.x = marginLeft + slotBorderSprite.width - startButton.width;
        startButton.y = marginTop + slotBorderSprite.height + 20;

        player.credits -= player.chip; // Deduct chip value from credits
        updateUI();

        if (spinSound && spinSound.isPlayable) {
          console.log('Playing spin sound (audio2.mp3)');
          spinSound.play();
        } else {
          console.error('Spin sound (audio2.mp3) is not playable:', spinSound);
        }

        const baseSpinTime = 1000;
        const stopDelay = 500;

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
              } else {
                console.error('Sound instance (audio1.mp3) is not playable:', soundInstance);
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

      function reelsComplete() {
        running = false;
        isSpinning = false;
        console.log('All reels have stopped');

        // Change the text back to "PLEASE PLACE YOUR BET"
        betLabel.text = 'PLEASE PLACE YOUR BET';
        betLabel.x = Math.round((app.screen.width - betLabel.width) / 2);

        startButton.texture = startButtonTexture;
        startButton.x = marginLeft + slotBorderSprite.width - startButton.width;
        startButton.y = marginTop + slotBorderSprite.height + 20;

        if (spinSound) {
          console.log('Stopping spin sound (audio2.mp3)');
          spinSound.stop();
        }

        if (isAutoPlaying) {
          setTimeout(() => {
            if (isAutoPlaying) {
              startPlay();
            }
          }, 500);
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
              s.texture = slotTextures[Math.floor(Math.random() * slotTextures.length)];
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
        window.removeEventListener('resize', () => {});
      };
    })();
  }, []);

  return <div className="App"></div>;
}

export default App;