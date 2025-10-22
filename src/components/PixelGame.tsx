import { useEffect, useRef } from 'react';
import { Howl } from 'howler';

interface PixelGameProps {
  animalType: string;
  biomeType: string;
  onWin: () => void;
  onLose: () => void;
  onExit?: () => void;
}

// Game constants
const NONE = 4;
const UP = 3;
const LEFT = 2;
const DOWN = 1;
const RIGHT = 11;
const WAITING = 5;
const PAUSE = 6;
const PLAYING = 7;
const COUNTDOWN = 8;
const EATEN_PAUSE = 9;
const DYING = 10;

const FPS = 30;

// Key codes
const KEY_N = 78;
const KEY_P = 80;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_ESC = 27;

const PixelGame = ({ onWin, onLose, onExit }: PixelGameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameInitialized = useRef(false);

  useEffect(() => {
    if (gameInitialized.current || !containerRef.current) return;
    gameInitialized.current = true;

    console.log('🎮 Starting Pacman game initialization...');

    const wrapper = containerRef.current;

    // Clear any existing canvases (in case of double render)
    while (wrapper.firstChild) {
      wrapper.removeChild(wrapper.firstChild);
    }

    const blockSize = Math.min(wrapper.offsetWidth / 19, 30);

    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', (blockSize * 19) + 'px');
    canvas.setAttribute('height', (blockSize * 17) + 30 + 'px');
    wrapper.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;

    // Map data
    const WALL = 0;
    const BISCUIT = 1;
    const EMPTY = 2;
    const BLOCK = 3;
    const PILL = 4;

    const MAP_LAYOUT = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 4, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 4, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
      [2, 2, 2, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 2, 2, 2],
      [0, 0, 0, 0, 1, 0, 1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 0, 0],
      [2, 2, 2, 2, 1, 1, 1, 0, 3, 3, 3, 0, 1, 1, 1, 2, 2, 2, 2],
      [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
      [2, 2, 2, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 2, 2, 2],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 4, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 4, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    // Game state
    let state = WAITING;
    let tick = 0;
    let level = 0;
    let timerStart = 0;
    let lastTime = 0;
    let eatenCount = 0;
    let ghosts: any[] = [];
    let user: any = null;
    let map: any = null;
    let timer: any = null;
    let stored: any = null;
    let stateChanged = true;
    let ghostPos: any[] = [];
    let userPos: any = null;

    // Sound system
    const sounds = {
      pellet: new Howl({ src: ['/sounds/pellet-eat.mp3'], volume: 0.3 }),
      powerPellet: new Howl({ src: ['/sounds/power-pellet.mp3'], volume: 0.4 }),
      eatGhost: new Howl({ src: ['/sounds/eat-ghost.mp3'], volume: 0.5 }),
      death: new Howl({ src: ['/sounds/death.mp3'], volume: 0.5 }),
      win: new Howl({ src: ['/sounds/win.mp3'], volume: 0.6 }),
      background: new Howl({
        src: ['/sounds/background-music.mp3'],
        volume: 0.2,
        loop: true
      })
    };

    function cloneArray(arr: any[]): any[] {
      return arr.map(row => Array.isArray(row) ? cloneArray(row) : row);
    }

    // Map factory
    function createMap(size: number) {
      let height: number;
      let width: number;
      let pillSize = 0;
      let mapData: number[][];

      function reset() {
        mapData = cloneArray(MAP_LAYOUT);
        height = mapData.length;
        width = mapData[0].length;
      }

      function withinBounds(y: number, x: number) {
        return y >= 0 && y < height && x >= 0 && x < width;
      }

      function isWall(pos: { y: number; x: number }) {
        return withinBounds(pos.y, pos.x) && mapData[pos.y][pos.x] === WALL;
      }

      function isFloorSpace(pos: { y: number; x: number }) {
        if (!withinBounds(pos.y, pos.x)) return false;
        const piece = mapData[pos.y][pos.x];
        return piece === EMPTY || piece === BISCUIT || piece === PILL;
      }

      function drawBlock(y: number, x: number, ctx: CanvasRenderingContext2D) {
        const layout = mapData[y][x];
        if (layout === PILL) return;

        ctx.beginPath();
        if (layout === EMPTY || layout === BLOCK || layout === BISCUIT) {
          ctx.fillStyle = '#000';
          ctx.fillRect(x * size, y * size, size, size);

          if (layout === BISCUIT) {
            ctx.fillStyle = '#FFF';
            ctx.fillRect(x * size + size / 2.5, y * size + size / 2.5, size / 6, size / 6);
          }
        }
        ctx.closePath();
      }

      function drawPills(ctx: CanvasRenderingContext2D) {
        if (++pillSize > 30) pillSize = 0;

        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            if (mapData[i][j] === PILL) {
              ctx.beginPath();
              ctx.fillStyle = '#000';
              ctx.fillRect(j * size, i * size, size, size);
              ctx.fillStyle = '#FFF';
              ctx.arc(j * size + size / 2, i * size + size / 2, Math.abs(5 - pillSize / 3), 0, Math.PI * 2, false);
              ctx.fill();
              ctx.closePath();
            }
          }
        }
      }

      function draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width * size, height * size);

        // Draw walls (simplified - just blue borders)
        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 5;
        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            if (mapData[i][j] === WALL) {
              ctx.fillStyle = '#0000FF';
              ctx.fillRect(j * size, i * size, size, size);
            }
          }
        }

        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            drawBlock(i, j, ctx);
          }
        }
      }

      reset();

      return {
        draw,
        drawBlock,
        drawPills,
        block: (pos: { y: number; x: number }) => mapData[pos.y][pos.x],
        setBlock: (pos: { y: number; x: number }, type: number) => { mapData[pos.y][pos.x] = type; },
        reset,
        isWallSpace: isWall,
        isFloorSpace,
        height,
        width,
        blockSize: size
      };
    }

    // Ghost factory
    function createGhost(colour: string, spriteType: string) {
      let position: any = null;
      let direction: any = null;
      let eatable: any = null;
      let eaten: any = null;
      let due: any = null;
      let image = new Image();
      image.src = `/images/poops/${spriteType}.png`;
      let imageLoaded = false;
      image.onload = () => { imageLoaded = true; };

      // Create offscreen canvas for tinting
      const offscreenCanvas = document.createElement('canvas');
      const offscreenCtx = offscreenCanvas.getContext('2d')!;

      function getRandomDirection() {
        const moves = (direction === LEFT || direction === RIGHT) ? [UP, DOWN] : [LEFT, RIGHT];
        return moves[Math.floor(Math.random() * 2)];
      }

      function reset() {
        eaten = null;
        eatable = null;
        position = { x: 90, y: 70 };
        direction = getRandomDirection();
        due = getRandomDirection();
      }

      function onWholeSquare(x: number) {
        return x % 10 === 0;
      }

      function pointToCoord(x: number) {
        return Math.round(x / 10);
      }

      function nextSquare(x: number, dir: number) {
        const rem = x % 10;
        if (rem === 0) return x;
        else if (dir === RIGHT || dir === DOWN) return x + (10 - rem);
        else return x - rem;
      }

      function addBounded(x1: number, x2: number) {
        const rem = x1 % 10;
        const result = rem + x2;
        if (rem !== 0 && result > 10) return x1 + (10 - rem);
        else if (rem > 0 && result < 0) return x1 - rem;
        return x1 + x2;
      }

      function getNewCoord(dir: number, current: any) {
        const speed = eatable !== null ? 1 : eaten !== null ? 4 : 1;
        const xSpeed = (dir === LEFT && -speed) || (dir === RIGHT && speed) || 0;
        const ySpeed = (dir === DOWN && speed) || (dir === UP && -speed) || 0;
        return {
          x: addBounded(current.x, xSpeed),
          y: addBounded(current.y, ySpeed)
        };
      }

      function move(ctx: CanvasRenderingContext2D, depth = 0) {
        const oldPos = position;
        const onGrid = onWholeSquare(position.y) && onWholeSquare(position.x);
        let npos = null;

        if (due !== direction) {
          npos = getNewCoord(due, position);
          if (onGrid && map.isFloorSpace({
            y: pointToCoord(nextSquare(npos.y, due)),
            x: pointToCoord(nextSquare(npos.x, due))
          })) {
            direction = due;
          } else {
            npos = null;
          }
        }

        if (npos === null) {
          npos = getNewCoord(direction, position);
        }

        if (onGrid && map.isWallSpace({
          y: pointToCoord(nextSquare(npos.y, direction)),
          x: pointToCoord(nextSquare(npos.x, direction))
        })) {
          due = getRandomDirection();
          direction = due;
          if (depth < 4) {
            return move(ctx, depth + 1);
          } else {
            // If stuck after retries, just stay in place
            return { new: position, old: oldPos };
          }
        }

        position = npos;

        // Tunnel wrapping
        if (position.y === 90 && position.x >= 190 && direction === RIGHT) {
          position = { y: 90, x: -10 };
        }
        if (position.y === 90 && position.x <= -10 && direction === LEFT) {
          position = { y: 90, x: 190 };
        }

        due = getRandomDirection();

        return { new: position, old: oldPos };
      }

      function draw(ctx: CanvasRenderingContext2D) {
        const s = map.blockSize;
        const top = (position.y / 10) * s;
        const left = (position.x / 10) * s;

        if (eatable && (tick - eatable) / FPS > 8) {
          eatable = null;
        }
        if (eaten && (tick - eaten) / FPS > 3) {
          eaten = null;
        }

        if (!imageLoaded) {
          // Fallback to circle if image not loaded yet
          ctx.fillStyle = colour;
          ctx.beginPath();
          ctx.arc(left + s / 2, top + s / 2, s / 2, 0, Math.PI * 2);
          ctx.fill();
          return;
        }

        // Apply color tinting to scared or eaten states
        if (eatable || eaten) {
          // Setup offscreen canvas
          offscreenCanvas.width = s;
          offscreenCanvas.height = s;

          // Draw sprite to offscreen canvas
          offscreenCtx.drawImage(image, 0, 0, s, s);

          // Apply color tint using multiply blend mode
          offscreenCtx.globalCompositeOperation = 'multiply';

          if (eatable) {
            // Cyan tint for scared mode with flashing
            const flash = (tick - eatable) / FPS > 5 && tick % 20 > 10;
            if (flash) {
              offscreenCtx.fillStyle = '#FFFFFF';
            } else {
              offscreenCtx.fillStyle = '#00CED1';
            }
          } else if (eaten) {
            // Dark gray for eaten
            offscreenCtx.fillStyle = '#444444';
          }

          offscreenCtx.fillRect(0, 0, s, s);

          // Preserve the alpha channel
          offscreenCtx.globalCompositeOperation = 'destination-in';
          offscreenCtx.drawImage(image, 0, 0, s, s);

          // Draw the tinted sprite to main canvas
          ctx.drawImage(offscreenCanvas, left, top);

          // Reset offscreen context
          offscreenCtx.globalCompositeOperation = 'source-over';
        } else {
          // Normal drawing
          ctx.drawImage(image, left, top, s, s);
        }

        // Draw eyes on top (unless eaten)
        if (!eaten) {
          // Draw eyes
          const eyeSize = s * 0.12;
          const eyeY = top + s * 0.35;
          const eyeLeftX = left + s * 0.3;
          const eyeRightX = left + s * 0.7;

          // White part of eyes
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(eyeLeftX, eyeY, eyeSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(eyeRightX, eyeY, eyeSize, 0, Math.PI * 2);
          ctx.fill();

          // Black pupils
          const pupilSize = eyeSize * 0.6;
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(eyeLeftX, eyeY, pupilSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(eyeRightX, eyeY, pupilSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      reset();

      return {
        reset,
        move,
        draw,
        makeEatable: () => { eatable = tick; direction = direction === LEFT ? RIGHT : direction === RIGHT ? LEFT : direction === UP ? DOWN : UP; },
        eat: () => { eatable = null; eaten = tick; },
        isVunerable: () => eatable !== null,
        isDangerous: () => eaten === null
      };
    }

    // User factory
    function createUser() {
      let position: any = null;
      let direction: any = null;
      let eaten = 0;
      let due: any = null;
      let lives = 5;
      let score = 0;

      let image = new Image();
      image.src = '/images/robot.png';
      let imageLoaded = false;
      image.onload = () => { imageLoaded = true; };

      function resetPosition() {
        position = { x: 90, y: 150 };
        direction = LEFT;
        due = LEFT;
      }

      function newLevel() {
        resetPosition();
        eaten = 0;
      }

      function reset() {
        score = 0;
        lives = 3;
        newLevel();
      }

      function onWholeSquare(x: number) {
        return x % 10 === 0;
      }

      function pointToCoord(x: number) {
        return Math.round(x / 10);
      }

      function nextSquare(x: number, dir: number) {
        const rem = x % 10;
        if (rem === 0) return x;
        else if (dir === RIGHT || dir === DOWN) return x + (10 - rem);
        else return x - rem;
      }

      function next(pos: any, dir: number) {
        return {
          y: pointToCoord(nextSquare(pos.y, dir)),
          x: pointToCoord(nextSquare(pos.x, dir))
        };
      }

      function getNewCoord(dir: number, current: any) {
        return {
          x: current.x + ((dir === LEFT && -2) || (dir === RIGHT && 2) || 0),
          y: current.y + ((dir === DOWN && 2) || (dir === UP && -2) || 0)
        };
      }

      function isOnSamePlane(due: number, dir: number) {
        return ((due === LEFT || due === RIGHT) && (dir === LEFT || dir === RIGHT)) ||
          ((due === UP || due === DOWN) && (dir === UP || dir === DOWN));
      }

      function isMidSquare(x: number) {
        const rem = x % 10;
        return rem > 3 || rem < 7;
      }

      function move(ctx: CanvasRenderingContext2D) {
        let npos = null;
        const oldPosition = position;

        if (due !== direction) {
          npos = getNewCoord(due, position);
          if (isOnSamePlane(due, direction) ||
            (onWholeSquare(position.y) && onWholeSquare(position.x) && map.isFloorSpace(next(npos, due)))) {
            direction = due;
          } else {
            npos = null;
          }
        }

        if (npos === null) {
          npos = getNewCoord(direction, position);
        }

        if (onWholeSquare(position.y) && onWholeSquare(position.x) && map.isWallSpace(next(npos, direction))) {
          direction = NONE;
        }

        if (direction === NONE) {
          return { new: position, old: position };
        }

        // Tunnel wrapping
        if (npos.y === 90 && npos.x >= 190 && direction === RIGHT) {
          npos = { y: 90, x: -10 };
        }
        if (npos.y === 90 && npos.x <= -12 && direction === LEFT) {
          npos = { y: 90, x: 190 };
        }

        position = npos;
        const nextWhole = next(position, direction);
        const block = map.block(nextWhole);

        if ((isMidSquare(position.y) || isMidSquare(position.x)) && (block === BISCUIT || block === PILL)) {
          map.setBlock(nextWhole, EMPTY);
          score += (block === BISCUIT) ? 10 : 50;
          eaten += 1;

          // Play appropriate sound
          if (block === PILL) {
            sounds.powerPellet.play();
            eatenPill();
          } else {
            sounds.pellet.play();
          }

          if (eaten === 129) {
            completedLevel();
          }
        }

        return { new: position, old: oldPosition };
      }

      function calcAngle(dir: number, pos: any) {
        if (dir === RIGHT && pos.x % 10 < 5) {
          return { start: 0.25, end: 1.75, direction: false };
        } else if (dir === DOWN && pos.y % 10 < 5) {
          return { start: 0.75, end: 2.25, direction: false };
        } else if (dir === UP && pos.y % 10 < 5) {
          return { start: 1.25, end: 1.75, direction: true };
        } else if (dir === LEFT && pos.x % 10 < 5) {
          return { start: 0.75, end: 1.25, direction: true };
        }
        return { start: 0, end: 2, direction: false };
      }

      function draw(ctx: CanvasRenderingContext2D) {
        const s = map.blockSize;
        const top = (position.y / 10) * s;
        const left = (position.x / 10) * s;

        if (!imageLoaded) {
          // Fallback to yellow circle if image not loaded yet
          ctx.fillStyle = '#FFFF00';
          ctx.beginPath();
          ctx.arc(left + s / 2, top + s / 2, s / 2, 0, Math.PI * 2);
          ctx.fill();
          return;
        }

        // Draw robot sprite at normal size
        ctx.drawImage(image, left, top, s, s);
      }

      function drawDead(ctx: CanvasRenderingContext2D, amount: number) {
        const size = map.blockSize;
        const half = size / 2;

        if (amount >= 1) return;

        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.moveTo((position.x / 10) * size + half, (position.y / 10) * size + half);
        ctx.arc((position.x / 10) * size + half, (position.y / 10) * size + half, half, 0, Math.PI * 2 * amount, true);
        ctx.fill();
      }

      reset();

      return {
        draw,
        drawDead,
        move,
        reset,
        resetPosition,
        newLevel,
        getLives: () => lives,
        loseLife: () => { lives -= 1; },
        theScore: () => score,
        addScore: (s: number) => {
          score += s;
          if (score >= 10000 && score - s < 10000) lives += 1;
        },
        keyDown: (e: KeyboardEvent) => {
          if (e.keyCode === KEY_LEFT) { due = LEFT; e.preventDefault(); return false; }
          if (e.keyCode === KEY_UP) { due = UP; e.preventDefault(); return false; }
          if (e.keyCode === KEY_RIGHT) { due = RIGHT; e.preventDefault(); return false; }
          if (e.keyCode === KEY_DOWN) { due = DOWN; e.preventDefault(); return false; }
          return true;
        }
      };
    }

    // Game functions
    function dialog(text: string) {
      ctx.fillStyle = '#FFFF00';
      ctx.font = '18px Arial';
      const width = ctx.measureText(text).width;
      const x = (map.width * map.blockSize - width) / 2;
      ctx.fillText(text, x, map.height * 10 + 8);
    }

    function drawFooter() {
      const topLeft = map.height * map.blockSize;
      const textBase = topLeft + 17;
      const centerX = (map.width * map.blockSize) / 2;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, topLeft, map.width * map.blockSize, 30);

      ctx.fillStyle = '#FFFF00';
      ctx.font = '14px Arial';

      // Score on the left side
      const scoreText = 'Score: ' + user.theScore();
      ctx.fillText(scoreText, centerX - 150, textBase);

      // Robot emoji lives in the center
      ctx.font = '20px Arial';
      const numLives = user.getLives();
      const livesStartX = centerX - (numLives * 25) / 2;
      for (let i = 0; i < numLives; i++) {
        ctx.fillText('🤖', livesStartX + 25 * i, textBase);
      }

      // Level on the right side
      ctx.fillStyle = '#FFFF00';
      ctx.font = '14px Arial';
      const levelText = 'Level: ' + level;
      ctx.fillText(levelText, centerX + 100, textBase);
    }

    function redrawBlock(pos: any) {
      map.drawBlock(Math.floor(pos.y / 10), Math.floor(pos.x / 10), ctx);
      map.drawBlock(Math.ceil(pos.y / 10), Math.ceil(pos.x / 10), ctx);
    }

    function collided(user: any, ghost: any) {
      return Math.sqrt(Math.pow(ghost.x - user.x, 2) + Math.pow(ghost.y - user.y, 2)) < 10;
    }

    function mainDraw() {
      ghostPos = [];

      for (let i = 0; i < ghosts.length; i++) {
        ghostPos.push(ghosts[i].move(ctx));
      }
      const u = user.move(ctx);

      for (let i = 0; i < ghosts.length; i++) {
        redrawBlock(ghostPos[i].old);
      }
      redrawBlock(u.old);

      for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].draw(ctx);
      }
      user.draw(ctx);

      userPos = u.new;

      for (let i = 0; i < ghosts.length; i++) {
        if (collided(userPos, ghostPos[i].new)) {
          if (ghosts[i].isVunerable()) {
            ghosts[i].eat();
            eatenCount += 1;
            const nScore = eatenCount * 50;
            user.addScore(nScore);
            sounds.eatGhost.play();
            state = EATEN_PAUSE;
            timerStart = tick;
          } else if (ghosts[i].isDangerous()) {
            sounds.death.play();
            state = DYING;
            timerStart = tick;
          }
        }
      }
    }

    function mainLoop() {
      if (state !== PAUSE) {
        ++tick;
      }

      map.drawPills(ctx);

      if (state === PLAYING) {
        mainDraw();
      } else if (state === WAITING && stateChanged) {
        stateChanged = false;
        map.draw(ctx);
        dialog('Press N to start a New game');
      } else if (state === EATEN_PAUSE && tick - timerStart > FPS / 3) {
        map.draw(ctx);
        state = PLAYING;
      } else if (state === DYING) {
        if (tick - timerStart > FPS * 2) {
          loseLife();
        } else {
          redrawBlock(userPos);
          for (let i = 0; i < ghosts.length; i++) {
            redrawBlock(ghostPos[i].old);
            ghosts[i].draw(ctx);
          }
          user.drawDead(ctx, (tick - timerStart) / (FPS * 2));
        }
      } else if (state === COUNTDOWN) {
        const diff = 5 + Math.floor((timerStart - tick) / FPS);
        if (diff === 0) {
          map.draw(ctx);
          state = PLAYING;
        } else {
          if (diff !== lastTime) {
            lastTime = diff;
            map.draw(ctx);
            dialog('Starting in: ' + diff);
          }
        }
      }

      drawFooter();
    }

    function eatenPill() {
      timerStart = tick;
      eatenCount = 0;
      for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].makeEatable();
      }
    }

    function completedLevel() {
      state = WAITING;
      sounds.background.stop();
      sounds.win.play();
      // Player won! Exit the game
      setTimeout(onWin, 1000); // Wait for win sound to play
    }

    function startLevel() {
      user.resetPosition();
      for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].reset();
      }
      timerStart = tick;
      state = COUNTDOWN;
    }

    function startNewGame() {
      state = WAITING;
      level = 1;
      user.reset();
      map.reset();
      map.draw(ctx);
      sounds.background.play();
      startLevel();
    }

    function loseLife() {
      state = WAITING;
      user.loseLife();
      if (user.getLives() > 0) {
        startLevel();
      } else {
        onLose();
      }
    }

    function keyDown(e: KeyboardEvent) {
      if (e.keyCode === KEY_ESC) {
        if (onExit) onExit();
        return false;
      }
      if (e.keyCode === KEY_N) {
        startNewGame();
      } else if (e.keyCode === KEY_P && state === PAUSE) {
        map.draw(ctx);
        state = stored;
      } else if (e.keyCode === KEY_P) {
        stored = state;
        state = PAUSE;
        map.draw(ctx);
        dialog('Paused');
      } else if (state !== PAUSE) {
        return user.keyDown(e);
      }
      return true;
    }

    function keyPress(e: KeyboardEvent) {
      if (state !== WAITING && state !== PAUSE) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    // Initialize game
    map = createMap(blockSize);
    user = createUser();

    const ghostSpecs = [
      { color: '#00FFDE', sprite: 'lumpy_upright' },
      { color: '#FFB8DE', sprite: 'whippy' }
    ];
    for (let i = 0; i < ghostSpecs.length; i++) {
      ghosts.push(createGhost(ghostSpecs[i].color, ghostSpecs[i].sprite));
    }

    map.draw(ctx);
    dialog('Press N to Start');

    document.addEventListener('keydown', keyDown, true);
    document.addEventListener('keypress', keyPress, true);

    timer = window.setInterval(mainLoop, 1000 / FPS);

    console.log('✅ Pacman game initialized!');

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up Pacman game...');
      if (timer) clearInterval(timer);
      document.removeEventListener('keydown', keyDown, true);
      document.removeEventListener('keypress', keyPress, true);

      // Stop all sounds
      sounds.background.stop();
      sounds.pellet.stop();
      sounds.powerPellet.stop();
      sounds.eatGhost.stop();
      sounds.death.stop();
      sounds.win.stop();

      // Remove canvas
      if (wrapper && wrapper.firstChild) {
        wrapper.removeChild(wrapper.firstChild);
      }

      gameInitialized.current = false;
    };
  }, [onWin, onLose, onExit]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      padding: '1.5rem',
      background: 'url(/images/pixelgame-bg.png) center / cover no-repeat',
      backgroundColor: '#000',
      minHeight: '100vh'
    }}>
      <div style={{ textAlign: 'center', color: '#fff', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: '#FFD700' }}>
          Poopy Minion Escape Game
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#aaa', margin: 0 }}>
          Arrow keys: move | N: new game | P: pause | ESC: exit
        </p>
      </div>
      <div ref={containerRef} style={{ width: '600px', height: '550px' }} />
    </div>
  );
};

export default PixelGame;
