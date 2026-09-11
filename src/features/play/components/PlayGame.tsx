"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { playArcadeSound, unlockArcadeAudio } from "@shared/arcade-audio";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import styles from "./PlayGame.module.css";

const HIGH_SCORE_KEYS = {
  invaders: "space-invaders-high-score",
  pong: "pong-high-score",
} as const;

type GameStatus = "playing" | "game-over";

const INVADER_SPRITES = [
  ["0011100", "0111110", "1111111", "1101011", "1111111", "0100010", "1010101"],
  ["0011100", "1111111", "1101011", "1111111", "0111110", "0101010", "1000001"],
  ["0100010", "0011100", "0111110", "1101011", "1111111", "1011101", "0010100"],
  ["1000001", "0100010", "1111111", "1011101", "1111111", "0111110", "1100011"],
] as const;

const INVADER_COLORS = [
  "#ff3b30",
  "#00e5ff",
  "#ffd400",
  "#b967ff",
  "#00ff41",
  "#ff7a00",
] as const;

const PONG_BALL_COLORS = [
  "#fff",
  "#00ff41",
  "#ffd400",
  "#00e5ff",
  "#ff3131",
  "#b967ff",
] as const;

const PIXEL_GLYPHS: Record<string, readonly string[]> = {
  G: ["1111", "1000", "1000", "1011", "1001", "1001", "1111"],
  A: ["0110", "1001", "1001", "1111", "1001", "1001", "1001"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  E: ["1111", "1000", "1000", "1110", "1000", "1000", "1111"],
  O: ["0110", "1001", "1001", "1001", "1001", "1001", "0110"],
  V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
  R: ["1110", "1001", "1001", "1110", "1010", "1001", "1001"],
};

function PixelMessage({ text }: { text: string }) {
  return (
    <strong className={styles.pixelMessage} aria-label={text}>
      {Array.from(text).map((character, characterIndex) => {
        if (character === " ") {
          return <span key={characterIndex} className={styles.pixelSpace} aria-hidden="true" />;
        }
        const glyph = PIXEL_GLYPHS[character] ?? PIXEL_GLYPHS.E;
        return (
          <span
            key={`${character}-${characterIndex}`}
            className={styles.pixelGlyph}
            style={{ "--glyph-columns": glyph[0].length } as CSSProperties}
            aria-hidden="true"
          >
            {glyph.flatMap((row, rowIndex) =>
              Array.from(row).map((cell, columnIndex) => (
                <span
                  key={`${rowIndex}-${columnIndex}`}
                  className={styles.pixelCell}
                  data-on={cell === "1" ? "true" : "false"}
                />
              )),
            )}
          </span>
        );
      })}
    </strong>
  );
}

type Props = {
  mobile: boolean;
  onScore: (score: number) => void;
  onGameOver: () => void;
  onChargeChange?: (charge: number) => void;
  onEnemyChargeChange?: (charge: number) => void;
  onPowerDenied?: () => void;
  restartToken: number;
};

function SpaceInvaders({ onScore, onGameOver, onChargeChange, restartToken }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    const keys = new Set<string>();
    const player = { x: width / 2, y: height - 42, width: 34, speed: 300 };
    const bullets: { x: number; y: number }[] = [];
    type Invader = {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      entryDelay: number;
      row: number;
      color: string;
      bobOffset: number;
      alive: boolean;
      sprite: number;
    };
    let invaders: Invader[] = [];
    let wave = 0;
    let waveStartedAt = performance.now();
    let direction = 1;
    let rowDirections = [1, -1, 1, -1];
    let score = 0;
    let lastShot = 0;
    let lastTime = performance.now();
    let frame = 0;
    let stopped = false;
    let nextArrivalSound = 0;
    let power = 0;
    let reportedPower = 0;
    let lastKillAt = Number.NEGATIVE_INFINITY;

    const spawnWave = () => {
      const waveIndex = wave;
      const sprite = waveIndex % INVADER_SPRITES.length;
      const accent = INVADER_COLORS[waveIndex % INVADER_COLORS.length];
      invaders = Array.from({ length: 32 }, (_, index) => {
        const column = index % 8;
        const row = Math.floor(index / 8);
        const targetX = 114 + column * 64;
        const targetY = 70 + row * 48;
        const pattern = waveIndex % 4;
        const isWhite =
          pattern === 0
            ? (column + row) % 2 === 0
            : pattern === 1
              ? row % 2 === 0
              : pattern === 2
                ? column % 3 !== 1
                : (column + row * 2) % 4 < 2;
        return {
          x: targetX,
          y: -55 - row * 18,
          targetX,
          targetY,
          entryDelay: column * 55 + row * 85,
          row,
          color: isWhite ? "#fff" : accent,
          bobOffset: 0,
          alive: true,
          sprite: (sprite + row) % INVADER_SPRITES.length,
        };
      });
      direction = waveIndex % 2 === 0 ? 1 : -1;
      rowDirections = Array.from(
        { length: 4 },
        (_, row) => (waveIndex + row) % 2 === 0 ? 1 : -1,
      );
      wave += 1;
      bullets.length = 0;
      waveStartedAt = performance.now();
      nextArrivalSound = 0;
    };
    spawnWave();

    const fireBullet = (blaster = false) => {
      bullets.push({ x: player.x, y: player.y - 18 });
      playArcadeSound(blaster ? "blaster" : "shoot", blaster ? false : true);
    };

    const shoot = () => {
      const now = performance.now();
      const rapidFire = power >= 90;
      if (now - lastShot < (rapidFire ? 75 : 180) || stopped) return;
      fireBullet(rapidFire);
      lastShot = now;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      unlockArcadeAudio();
      if (["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      keys.add(event.code);
      if (event.code === "Space") shoot();
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    const pointerX = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      player.x = ((event.clientX - rect.left) / rect.width) * width;
    };
    const onPointerDown = (event: PointerEvent) => {
      unlockArcadeAudio();
      pointerX(event);
      shoot();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointermove", pointerX);
    canvas.addEventListener("pointerdown", onPointerDown);

    const drawInvader = (invader: Invader, shake: number) => {
      const sprite = INVADER_SPRITES[invader.sprite];
      const pixel = 6;
      const shakeX = shake ? (Math.random() - 0.5) * shake : 0;
      const shakeY = shake ? (Math.random() - 0.5) * shake : 0;
      context.fillStyle = invader.color;
      sprite.forEach((row, rowIndex) => {
        Array.from(row).forEach((cell, columnIndex) => {
          if (cell === "1") {
            context.fillRect(
              invader.x + shakeX + (columnIndex - 3.5) * pixel,
              invader.y + shakeY + (rowIndex - 3.5) * pixel,
              pixel,
              pixel,
            );
          }
        });
      });
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#fff";
      context.imageSmoothingEnabled = false;

      context.fillRect(player.x - 17, player.y, 34, 8);
      context.fillRect(player.x - 11, player.y - 7, 22, 7);
      context.fillRect(player.x - 3, player.y - 13, 6, 6);
      const shake = power >= 70 ? 2 + ((power - 70) / 30) * 3 : 0;
      invaders.forEach((invader) => {
        if (invader.alive) drawInvader(invader, shake);
      });
      context.fillStyle = "#fff";
      bullets.forEach((bullet) => context.fillRect(bullet.x - 2, bullet.y, 4, 12));
    };

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.034);
      lastTime = now;
      if (now - lastKillAt > 250 && power > 0) {
        power = Math.max(0, power - 26 * dt);
      }
      const roundedPower = Math.round(power);
      if (roundedPower !== reportedPower) {
        reportedPower = roundedPower;
        onChargeChange?.(roundedPower);
      }
      if (keys.has("ArrowLeft")) player.x -= player.speed * dt;
      if (keys.has("ArrowRight")) player.x += player.speed * dt;
      player.x = Math.max(24, Math.min(width - 24, player.x));

      const living = invaders.filter((invader) => invader.alive);
      const powerSpeedMultiplier = power >= 70 ? 1 + ((power - 70) / 30) * 0.55 : 1;
      const speed = (22 + wave * 10 + (32 - living.length) * 2.4) *
        powerSpeedMultiplier;
      const entryElapsed = now - waveStartedAt;
      const isEntering = entryElapsed < 1320;
      if (isEntering) {
        if (entryElapsed >= nextArrivalSound) {
          playArcadeSound("arrival", false);
          nextArrivalSound += 165;
        }
        living.forEach((invader) => {
          const progress = Math.max(
            0,
            Math.min(1, (entryElapsed - invader.entryDelay) / 620),
          );
          const eased = 1 - Math.pow(1 - progress, 3);
          const side = (Math.round(invader.targetX / 64) % 2 === 0 ? -1 : 1);
          invader.x =
            invader.targetX + side * Math.sin(progress * Math.PI) * 42;
          invader.y = -55 + (invader.targetY + 55) * eased;
          invader.bobOffset = 0;
        });
      } else if (wave > 1) {
        const rowsAtEdge = new Set<number>();
        living.forEach((invader) => {
          invader.y -= invader.bobOffset;
          const rowSpeed = speed * (0.78 + invader.row * 0.14);
          invader.x += rowDirections[invader.row] * rowSpeed * dt;
          if (invader.x < 28 || invader.x > width - 28) rowsAtEdge.add(invader.row);
        });
        rowsAtEdge.forEach((row) => {
          rowDirections[row] *= -1;
          living.forEach((invader) => {
            if (invader.row !== row) return;
            invader.x = Math.max(28, Math.min(width - 28, invader.x));
            invader.y += 11;
          });
        });
        living.forEach((invader) => {
          invader.bobOffset = Math.sin(now / 310 + invader.row * 1.35) * 5;
          invader.y += invader.bobOffset;
        });
      } else {
        let hitEdge = false;
        living.forEach((invader) => {
          invader.x += direction * speed * dt;
          if (invader.x < 28 || invader.x > width - 28) hitEdge = true;
        });
        if (hitEdge) {
          direction *= -1;
          living.forEach((invader) => {
            invader.x = Math.max(28, Math.min(width - 28, invader.x));
            invader.y += 15;
          });
        }
      }

      bullets.forEach((bullet) => {
        bullet.y -= 390 * dt;
        const hit = living.find(
          (invader) =>
            invader.alive &&
            Math.abs(invader.x - bullet.x) < 23 &&
            Math.abs(invader.y - bullet.y) < 18,
        );
        if (hit) {
          hit.alive = false;
          bullet.y = -20;
          score += 10;
          const quickKill = now - lastKillAt <= 900;
          power = Math.min(100, power + (quickKill ? 13 : 3));
          lastKillAt = now;
          playArcadeSound("hit", false);
          onScore(score);
        }
      });
      for (let index = bullets.length - 1; index >= 0; index -= 1) {
        if (bullets[index].y < -12) bullets.splice(index, 1);
      }

      if (!invaders.some((invader) => invader.alive)) {
        playArcadeSound("wave-clear", false);
        spawnWave();
      }
      draw();
      if (living.some((invader) => invader.alive && invader.y > player.y - 28)) {
        stopped = true;
        playArcadeSound("game-over", false);
        onGameOver();
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointermove", pointerX);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onChargeChange, onGameOver, onScore, restartToken]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={720}
      height={480}
      aria-label="Space Invaders game. Use arrow keys or the pointer to move and space or click to fire."
    />
  );
}

function VerticalPong({
  onScore,
  onGameOver,
  onChargeChange,
  onEnemyChargeChange,
  onPowerDenied,
  restartToken,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    const player = { x: width / 2, y: height - 34, width: 82 };
    const opponent = { x: width / 2, y: 34, width: 70 };
    const ball = {
      x: width / 2,
      y: height / 2,
      vx: 105,
      vy: 175,
      size: 10,
      color: PONG_BALL_COLORS[0] as string,
    };
    const keys = new Set<string>();
    let score = 0;
    let stopped = false;
    let frame = 0;
    let lastTime = performance.now();
    let opponentTarget = width / 2;
    let nextOpponentDecision = 0;
    let charge = 0;
    let enemyCharge = 0;
    let lastTap = 0;
    let powerShotArmed = false;
    let powerDeniedUntil = 0;
    let activeTouchPointer: number | null = null;
    let lastTouchClientX = 0;
    let rallyBounces = 0;
    const sparks: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
    }> = [];

    const movePlayer = (event: PointerEvent) => {
      if (event.pointerType === "touch" && event.pointerId !== activeTouchPointer) return;
      const rect = canvas.getBoundingClientRect();
      if (event.pointerType === "touch") {
        const deltaX = event.clientX - lastTouchClientX;
        player.x += (deltaX / rect.width) * width;
        lastTouchClientX = event.clientX;
        return;
      }
      player.x = ((event.clientX - rect.left) / rect.width) * width;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      unlockArcadeAudio();
      if (["ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      keys.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    const registerPowerTap = (now: number) => {
      const ballIsNearPaddle = ball.vy > 0 && ball.y > height * 0.62;
      if (now - lastTap <= 280) {
        if (charge >= 5 && ballIsNearPaddle) {
          powerShotArmed = true;
        } else if (charge < 5 && now >= powerDeniedUntil) {
          playArcadeSound("deny");
          onPowerDenied?.();
        }
      }
      lastTap = now;
    };
    const onPointerDown = (event: PointerEvent) => {
      unlockArcadeAudio();
      if (event.pointerType === "touch") {
        activeTouchPointer = event.pointerId;
        lastTouchClientX = event.clientX;
        canvas.setPointerCapture(event.pointerId);
      } else {
        movePlayer(event);
      }
      registerPowerTap(performance.now());
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId === activeTouchPointer) activeTouchPointer = null;
    };
    const onExternalPointer = (event: Event) => {
      const { phase, clientX, pointerId, pointerType } = (
        event as CustomEvent<{
          phase: "down" | "move" | "up";
          clientX: number;
          pointerId: number;
          pointerType: string;
        }>
      ).detail;
      if (phase === "down") {
        unlockArcadeAudio();
        if (pointerType === "touch") {
          activeTouchPointer = pointerId;
          lastTouchClientX = clientX;
        }
        registerPowerTap(performance.now());
        return;
      }
      if (phase === "up") {
        if (pointerId === activeTouchPointer) activeTouchPointer = null;
        return;
      }
      if (pointerType === "touch" && pointerId !== activeTouchPointer) return;
      const rect = canvas.getBoundingClientRect();
      if (pointerType === "touch") {
        const deltaX = clientX - lastTouchClientX;
        player.x += (deltaX / rect.width) * width;
        lastTouchClientX = clientX;
        return;
      }
      player.x = ((clientX - rect.left) / rect.width) * width;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", movePlayer);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pong-external-pointer", onExternalPointer);

    const resetBall = () => {
      const speedIncrease = score * 14;
      ball.x = width / 2;
      ball.y = height / 2;
      ball.vx = (Math.random() > 0.5 ? 1 : -1) * (105 + speedIncrease * 0.55);
      ball.vy = 175 + speedIncrease;
      rallyBounces = 0;
      ball.color = PONG_BALL_COLORS[0];
    };

    const registerBounce = () => {
      rallyBounces += 1;
      const availableColors = PONG_BALL_COLORS.filter((color) => color !== ball.color);
      ball.color = availableColors[Math.floor(Math.random() * availableColors.length)];
      ball.vy *= 1.045;
      ball.vx *= 1.025;
    };

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.034);
      lastTime = now;
      if (keys.has("ArrowLeft")) player.x -= 260 * dt;
      if (keys.has("ArrowRight")) player.x += 260 * dt;
      player.x = Math.max(player.width / 2, Math.min(width - player.width / 2, player.x));

      if (now >= nextOpponentDecision) {
        const opponentIsSmart = score >= 5;
        opponentTarget = width / 2;
        if (ball.vy < 0) {
          const secondsToPaddle = Math.max(0, (ball.y - opponent.y) / -ball.vy);
          const travelWidth = width - ball.size;
          const projected = ball.x - ball.size / 2 + ball.vx * secondsToPaddle;
          const wrapped = ((projected % (travelWidth * 2)) + travelWidth * 2) %
            (travelWidth * 2);
          const intercept =
            ball.size / 2 + (wrapped <= travelWidth ? wrapped : travelWidth * 2 - wrapped);
          const errorRange = opponentIsSmart
            ? Math.max(90, 150 - (score - 5) * 4)
            : 220;
          opponentTarget = intercept + (Math.random() - 0.5) * errorRange;
        }
        nextOpponentDecision = now + (opponentIsSmart ? 260 : 360);
      }
      const opponentSpeed = score >= 5
        ? Math.min(185, 145 + (score - 5) * 4)
        : 105;
      const opponentStep = Math.max(
        -opponentSpeed * dt,
        Math.min(opponentSpeed * dt, opponentTarget - opponent.x),
      );
      opponent.x += opponentStep;
      opponent.x = Math.max(
        opponent.width / 2,
        Math.min(width - opponent.width / 2, opponent.x),
      );
      const previousBallY = ball.y;
      const canvasBounds = canvas.getBoundingClientRect();
      const ballWidth = ball.size *
        (canvasBounds.height / height) /
        (canvasBounds.width / width);
      const ballHalfWidth = ballWidth / 2;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        spark.vy += 180 * dt;
        spark.life -= dt;
        if (spark.life <= 0) sparks.splice(index, 1);
      }
      if (ball.x < ballHalfWidth || ball.x > width - ballHalfWidth) {
        ball.vx *= -1;
        ball.x = Math.max(ballHalfWidth, Math.min(width - ballHalfWidth, ball.x));
      }

      const playerSurface = player.y - 6;
      const opponentSurface = opponent.y + 6;
      const crossesPlayer =
        ball.vy > 0 &&
        previousBallY + ball.size / 2 <= playerSurface &&
        ball.y + ball.size / 2 >= playerSurface;
      const crossesOpponent =
        ball.vy < 0 &&
        previousBallY - ball.size / 2 >= opponentSurface &&
        ball.y - ball.size / 2 <= opponentSurface;
      const hitsPlayer =
        crossesPlayer &&
        Math.abs(ball.x - player.x) <= player.width / 2 + ballHalfWidth;
      const hitsOpponent =
        crossesOpponent &&
        Math.abs(ball.x - opponent.x) <= opponent.width / 2 + ballHalfWidth;
      if (hitsPlayer) {
        ball.y = playerSurface - ball.size / 2;
        if (powerShotArmed) {
          ball.vy = -Math.max(Math.abs(ball.vy) * 1.85, 520);
          ball.vx =
            (ball.vx + ((ball.x - player.x) / player.width) * 140) * 1.25;
          powerShotArmed = false;
          charge = 0;
          powerDeniedUntil = now + 2500;
          lastTap = 0;
          onChargeChange?.(charge);
          for (let index = 0; index < 22; index += 1) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
            const speed = 80 + Math.random() * 190;
            sparks.push({
              x: ball.x,
              y: playerSurface,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 0.22 + Math.random() * 0.28,
              color: "#00ff41",
            });
          }
          playArcadeSound("power");
        } else {
          ball.vy = -Math.abs(ball.vy);
          ball.vx += ((ball.x - player.x) / player.width) * 95;
          charge = Math.min(5, charge + 1);
          onChargeChange?.(charge);
          playArcadeSound("bounce");
        }
        registerBounce();
      }
      if (hitsOpponent) {
        ball.y = opponentSurface + ball.size / 2;
        if (enemyCharge >= 5) {
          ball.vy = Math.max(Math.abs(ball.vy) * 1.75, 500);
          ball.vx *= 1.2;
          enemyCharge = 0;
          onEnemyChargeChange?.(enemyCharge);
          for (let index = 0; index < 22; index += 1) {
            const angle = Math.PI / 2 + (Math.random() - 0.5) * 1.8;
            const speed = 80 + Math.random() * 190;
            sparks.push({
              x: ball.x,
              y: opponentSurface,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 0.22 + Math.random() * 0.28,
              color: "#ff3131",
            });
          }
          playArcadeSound("power", false);
        } else {
          ball.vy = Math.abs(ball.vy);
          enemyCharge = Math.min(5, enemyCharge + 1);
          onEnemyChargeChange?.(enemyCharge);
          playArcadeSound("bounce", false);
        }
        registerBounce();
      }

      if (ball.y < -20) {
        score += 1;
        playArcadeSound("score", false);
        onScore(score);
        resetBall();
      } else if (ball.y > height + 20) {
        stopped = true;
        playArcadeSound("game-over", false);
        onGameOver();
      }

      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(255,255,255,.3)";
      for (let y = 18; y < height; y += 28) context.fillRect(width / 2 - 2, y, 4, 14);
      context.fillStyle = "#fff";
      context.fillRect(player.x - player.width / 2, player.y - 6, player.width, 12);
      context.fillRect(
        opponent.x - opponent.width / 2,
        opponent.y - 6,
        opponent.width,
        12,
      );
      context.fillStyle = ball.color;
      context.fillRect(
        ball.x - ballHalfWidth,
        ball.y - ball.size / 2,
        ballWidth,
        ball.size,
      );
      sparks.forEach((spark) => {
        context.fillStyle = spark.color;
        const size = spark.life > 0.22 ? 4 : 2;
        context.fillRect(spark.x - size / 2, spark.y - size / 2, size, size);
      });

      if (!stopped) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", movePlayer);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pong-external-pointer", onExternalPointer);
    };
  }, [
    onChargeChange,
    onEnemyChargeChange,
    onGameOver,
    onPowerDenied,
    onScore,
    restartToken,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={360}
      height={560}
      aria-label="Vertical Pong game. Drag or tap to move your bottom paddle."
    />
  );
}

export function PlayGame() {
  const mobile = useMediaQuery("(max-width: 900px)");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const highScoreRef = useRef(0);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [restartToken, setRestartToken] = useState(0);
  const [bestFlashToken, setBestFlashToken] = useState(0);
  const [powerCharge, setPowerCharge] = useState(0);
  const [enemyPowerCharge, setEnemyPowerCharge] = useState(0);
  const [powerDeniedToken, setPowerDeniedToken] = useState(0);

  useEffect(() => {
    const key = mobile ? HIGH_SCORE_KEYS.pong : HIGH_SCORE_KEYS.invaders;
    setScore(0);
    setPowerCharge(0);
    setEnemyPowerCharge(0);
    setPowerDeniedToken(0);
    setStatus("playing");
    setRestartToken((current) => current + 1);
    const savedHighScore = Number.parseInt(localStorage.getItem(key) ?? "0", 10) || 0;
    highScoreRef.current = savedHighScore;
    setHighScore(savedHighScore);
  }, [mobile]);

  const handleScore = useCallback((nextScore: number) => {
    setScore(nextScore);
    if (nextScore > highScoreRef.current) setBestFlashToken((token) => token + 1);
    const next = Math.max(highScoreRef.current, nextScore);
    highScoreRef.current = next;
    setHighScore(next);
    const key = mobile ? HIGH_SCORE_KEYS.pong : HIGH_SCORE_KEYS.invaders;
    localStorage.setItem(key, String(next));
  }, [mobile]);
  const handleGameOver = useCallback(() => setStatus("game-over"), []);
  const handlePowerDenied = useCallback(
    () => setPowerDeniedToken((token) => token + 1),
    [],
  );
  const handlePowerCharge = useCallback((charge: number) => {
    setPowerCharge(charge);
    if (charge === 0) setPowerDeniedToken(0);
  }, []);
  const restart = () => {
    playArcadeSound("select");
    setScore(0);
    setPowerCharge(0);
    setEnemyPowerCharge(0);
    setPowerDeniedToken(0);
    setStatus("playing");
    setRestartToken((current) => current + 1);
  };

  return (
    <div className={styles.game}>
      <div className={styles.hud}>
        <span key={`score-${score}`} className={styles.scoreFlash}>
          score {String(score).padStart(4, "0")}
        </span>
        <span
          key={`best-${bestFlashToken}`}
          className={bestFlashToken ? styles.bestFlash : undefined}
        >
          personal best {String(highScore).padStart(4, "0")}
        </span>
      </div>
      {mobile ? (
        <div className={styles.energyBars}>
          <div className={styles.energyRow}>
            <span className={styles.energyLabel}>power</span>
            <span
              key={`power-${powerDeniedToken}`}
              className={`${styles.energyTrack} ${
                powerDeniedToken ? styles.deniedEnergyTrack : ""
              }`}
              aria-label={`Power ${powerCharge} of 5`}
            >
              <span style={{ width: `${powerCharge * 20}%` }} />
            </span>
            {powerCharge >= 5 ? (
              <span className={styles.powerHint}>double tap</span>
            ) : powerDeniedToken ? (
              <span key={powerDeniedToken} className={styles.noPower}>no power</span>
            ) : null}
          </div>
          <div className={`${styles.energyRow} ${styles.enemyEnergyRow}`}>
            <span className={styles.energyLabel}>enemy power</span>
            <span
              className={`${styles.energyTrack} ${styles.enemyEnergyTrack}`}
              aria-label={`Enemy power ${enemyPowerCharge} of 5`}
            >
              <span style={{ width: `${enemyPowerCharge * 20}%` }} />
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.invaderEnergyRow}>
          <span className={styles.energyLabel}>rapid kill power</span>
          <span
            className={`${styles.energyTrack} ${styles.invaderEnergyTrack}`}
            aria-label={`Rapid kill power ${powerCharge}%`}
          >
            <span style={{ width: `${powerCharge}%` }} />
          </span>
          {powerCharge >= 90 ? (
            <span className={styles.burstReady}>rapid fire active</span>
          ) : null}
        </div>
      )}
      <div className={styles.frame}>
        {mobile ? (
          <VerticalPong
            mobile
            onScore={handleScore}
            onGameOver={handleGameOver}
            onChargeChange={handlePowerCharge}
            onEnemyChargeChange={setEnemyPowerCharge}
            onPowerDenied={handlePowerDenied}
            restartToken={restartToken}
          />
        ) : (
          <SpaceInvaders
            mobile={false}
            onScore={handleScore}
            onGameOver={handleGameOver}
            onChargeChange={setPowerCharge}
            restartToken={restartToken}
          />
        )}
        {status === "game-over" ? (
          <div className={styles.overlay}>
            <PixelMessage text="GAME OVER" />
            <div className={styles.overlayActions}>
              <button type="button" onClick={restart}>restart</button>
              <Link href="/hire-me" onClick={() => playArcadeSound("select")}>
                contact me
              </Link>
            </div>
          </div>
        ) : null}
      </div>
      <p className={styles.instructions}>
        {mobile ? (
          <>
            drag or tap to move the paddle
            <br />
            double tap to use power shot
          </>
        ) : (
          "arrow keys or mouse to move · space or click to fire"
        )}
      </p>
    </div>
  );
}
