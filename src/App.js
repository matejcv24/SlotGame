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
        '/symbols/clubsymbol1.png',
        '/symbols/acesymbol1.png',
        '/symbols/diamondsymbol1.png',
        '/symbols/heartsymbol1.png',
        '/symbols/7symbol1.png',
        '/symbols/startbutton.png',
        '/symbols/pausebutton.png',
        '/symbols/autoplaybutton.png',
        '/audio/audio1.mp3',
        '/audio/audio2.mp3',
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

      const slotTextures = [
        Texture.from('/symbols/clubsymbol1.png'),
        Texture.from('/symbols/acesymbol1.png'),
        Texture.from('/symbols/diamondsymbol1.png'),
        Texture.from('/symbols/heartsymbol1.png'),
        Texture.from('/symbols/7symbol1.png'),
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

      const startButton = new Sprite(startButtonTexture);
      startButton.scale.set(BUTTON_SCALE);
      startButton.x = Math.round((app.screen.width - startButton.width) / 2);
      startButton.y = app.screen.height - 100;
      startButton.eventMode = 'static';
      startButton.cursor = 'pointer';

      const autoplayButton = new Sprite(autoplayButtonTexture);
      autoplayButton.scale.set(BUTTON_SCALE);
      autoplayButton.x = startButton.x - startButton.width - 10;
      autoplayButton.y = app.screen.height - 100;
      autoplayButton.eventMode = 'static';
      autoplayButton.cursor = 'pointer';

      let isSpinning = false;
      let isAutoPlaying = false;

      autoplayButton.addListener('pointerdown', () => {
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
        if (!isSpinning) {
          startPlay();
        } else {
          stopSpinning();
        }
      });

      app.stage.addChild(startButton);
      app.stage.addChild(autoplayButton);

      let running = false;
      const tweening = [];

      function startPlay() {
        if (running) return;
        running = true;
        isSpinning = true;

        startButton.texture = pauseButtonTexture;
        startButton.x = Math.round((app.screen.width - startButton.width) / 2);
        startButton.y = app.screen.height - 100;

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

        startButton.texture = startButtonTexture;
        startButton.x = Math.round((app.screen.width - startButton.width) / 2);
        startButton.y = app.screen.height - 100;

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
        startButton.x = Math.round((app.screen.width - startButton.width) / 2);
        startButton.y = app.screen.height - 100;
        autoplayButton.x = startButton.x - startButton.width - 10;
        autoplayButton.y = app.screen.height - 100;
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
      });

      return () => {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        if (soundInstance) soundInstance.stop();
        if (spinSound) spinSound.stop();
        window.removeEventListener('resize', () => {});
      };
    })();
  }, []);

  return <div className="App"></div>;
}

export default App;
