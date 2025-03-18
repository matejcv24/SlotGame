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
  TextStyle,
  Texture,
} from 'pixi.js';

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

      document.body.appendChild(app.view);
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';

      await Assets.load([
        '/symbols/clubsymbol.png',
        '/symbols/acesymbol.png',
        '/symbols/diamondsymbol.png',
        '/symbols/heartsymbol.png',
        '/symbols/7symbol.png',
        '/audio/audio1.mp3',
      ]);

      const soundInstance = Sound.from(Assets.get('/audio/audio1.mp3'));
      console.log('Audio loaded:', soundInstance);

      const REEL_WIDTH = 120;
      const SYMBOL_SIZE = 80; 
      const BORDER_THICKNESS = 8; 
      const REEL_HEIGHT = SYMBOL_SIZE * 3 + 20; 
      const REEL_SPACING = 10; 

      const slotTextures = [
        Texture.from('/symbols/clubsymbol.png'),
        Texture.from('/symbols/acesymbol.png'),
        Texture.from('/symbols/diamondsymbol.png'),
        Texture.from('/symbols/heartsymbol.png'),
        Texture.from('/symbols/7symbol.png'),
      ];

      const reels = [];
      const reelContainer = new Container();

      for (let i = 0; i < 5; i++) {
        const rc = new Container();
        rc.x = i * (REEL_WIDTH + REEL_SPACING);
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

        // Center symbols vertically within the taller reel
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

      // Center the slot container vertically and horizontally
      const marginTop = (app.screen.height - REEL_HEIGHT) / 2;
      const totalWidth = 5 * REEL_WIDTH + 4 * REEL_SPACING;
      const marginLeft = (app.screen.width - totalWidth) / 2;
      reelContainer.x = marginLeft;
      reelContainer.y = marginTop;

      // Create the "Symbols Hot" text at the top of the screen
      const style = new TextStyle({
        fontFamily: 'Verdana',
        fontSize: 36,
        fontStyle: 'italic',
        fontWeight: 'bold',
        fill: { color: 0xff0000 },
        stroke: { color: 0xFFD700, width: 5 },
        dropShadow: {
          color: 0x000000,
          angle: Math.PI / 6,
          blur: 4,
          distance: 6,
        },
        wordWrap: true,
        wordWrapWidth: 440,
      });

      const headerText = new Text('Symbols Hot', style);
      headerText.x = Math.round((app.screen.width - headerText.width) / 2);
      headerText.y = 20;
      app.stage.addChild(headerText);

      // Create the "Start" button at the bottom of the screen
      const playText = new Text('START', style);
      playText.x = Math.round((app.screen.width - playText.width) / 2);
      playText.y = app.screen.height - 100;
      app.stage.addChild(playText);

      playText.eventMode = 'static';
      playText.cursor = 'pointer';
      playText.addListener('pointerdown', () => {
        startPlay();
      });

      let running = false;

      function startPlay() {
        if (running) return;
        running = true;

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
              // Play the sound after each reel stops
              if (soundInstance) {
                console.log(`Reel ${i} stopped, playing sound`);
                soundInstance.play();
              } else {
                console.error('Sound instance is not available');
              }
              if (i === reels.length - 1) {
                reelsComplete();
              }
            }
          );
        }
      }

      function reelsComplete() {
        running = false;
        console.log('All reels have stopped');
      }

      function linear() {
        return (t) => t;
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

      const tweening = [];

      function tweenTo(object, property, target, time, easing, onchange, oncomplete) {
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
        tweening.push(tween);
        return tween;
      }

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

      function lerp(a1, a2, t) {
        return a1 * (1 - t) + a2 * t;
      }

      return () => {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        if (soundInstance) {
          soundInstance.stop();
        }
        document.body.style.margin = '';
        document.body.style.padding = '';
        document.body.style.overflow = '';
      };
    })();
  }, []);

  return <div className="App"></div>;
}

export default App;
