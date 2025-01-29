"use client";

import { useEffect, useRef, useState } from "react";
import SAT from "sat";
import _ from "underscore";

const SlimeMold = () => {
  const canvasRef = useRef();
  const [isInitialized, setIsInitialized] = useState(true);

  const numParticlesSlime = 5000;
  const sensorSlime = 15;
  const angleSlime = 0.3;
  const color = "#a4d9ea";
  const absSpeedSlime = 3;
  const decaySlime = 0.05;
  const PARTICLE_RADIUS = 0.1;
  const mouseWidth = 20;
  let gridPheromones = [];
  let _particles = [];
  let ww, wh, offsetX, offsetY, gridStep, gridX, gridY;

  useEffect(() => {
    if (!canvasRef.current) return;
    initializeCanvas();
    setIsInitialized(true);

    // Handle resize
    const handleResize = () => {
      if (canvasRef.current) {
        initializeCanvas();
        setIsInitialized(true);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearParticles();
    };
  }, []);

  useEffect(() => {
    if (isInitialized) {
      initScene(ww, wh);
      requestAnimationFrame(loopSlime);
    }
  }, [isInitialized]);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the container size
    const parent = canvas.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    // Handle high DPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Adjust the canvas offset
    setOffsets(width, height);

    // Add event listeners
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseout", onMouseUp);
  };

  const setOffsets = (width, height) => {
    offsetX = Math.floor((window.innerWidth - width) * 0.5);
    offsetY = Math.floor((window.innerHeight - height) * 0.5);

    // Ensure the values update correctly
    ww = width;
    wh = height;

    // Adjust for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    gridStep = 1;
    gridX = Math.floor((ww * dpr) / gridStep);
    gridY = Math.floor((wh * dpr) / gridStep);

    initGrid();
  };

  const initGrid = () => {
    gridStep = 1;
    gridPheromones = []; // Reset gridPheromones

    for (let i = 0, stepx = 0; stepx < ww; stepx += gridStep, i++) {
      gridPheromones[i] = []; // Initialize row
      for (let j = 0, stepy = 0; stepy < wh; stepy += gridStep, j++) {
        gridPheromones[i][j] = 0;
      }
    }
  };

  const decayGrid = () => {
    for (let stepx = 0, i = 0; stepx < ww; stepx += gridStep, i++) {
      for (let stepy = 0, j = 0; stepy < wh; stepy += gridStep, j++) {
        gridPheromones[i][j] *= decaySlime;
      }
    }
  };

  const clearParticles = () => {
    _particles = [];
  };

  const initScene = (width, height) => {
    clearParticles();
    setOffsets(width, height);
    makeParticles(numParticlesSlime);
    initGrid();
  };

  const makeParticles = (num) => {
    for (let i = 0; i < num; i++) {
      const p = new Particle(
        Math.floor(ww * Math.random()),
        Math.floor(wh * Math.random()),
        PARTICLE_RADIUS,
        2 * Math.PI * Math.random(),
        angleSlime * Math.PI
      );
      _particles.push(p);
    }
  };

  const loopSlime = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Get device pixel ratio for high-DPI screens
    const dpr = window.devicePixelRatio || 1;

    // Reset transformations and scale according to DPR
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear the canvas with a semi-transparent black overlay
    context.save();
    context.fillStyle = "rgba(0,0,0,0.1)";
    context.fillRect(0, 0, ww, wh);
    context.restore();

    // Create an offscreen buffer canvas to draw particles
    const bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = ww * dpr;
    bufferCanvas.height = wh * dpr;
    const bufferContext = bufferCanvas.getContext("2d");
    bufferContext.scale(dpr, dpr); // Scale the buffer for high-DPI

    bufferContext.save();
    bufferContext.globalCompositeOperation = "destination-out";
    bufferContext.globalAlpha = 1;
    bufferContext.fillRect(0, 0, ww, wh);
    bufferContext.restore();

    bufferContext.save();
    bufferContext.fillStyle = bufferContext.strokeStyle = color;
    bufferContext.lineCap = bufferContext.lineJoin = "round";
    bufferContext.lineWidth = PARTICLE_RADIUS * (2 + Math.random());
    bufferContext.beginPath();

    _particles.forEach((p) => {
      const route = findRoute(p);
      p.update(route);
      bufferContext.moveTo(p.pos.x, p.pos.y);
      bufferContext.lineTo(p._latest.x, p._latest.y);
      diffuseParticle(
        Math.floor(p.pos.x / gridStep) % gridX,
        Math.floor(p.pos.y / gridStep) % gridY,
        1
      );
    });

    bufferContext.stroke();
    bufferContext.restore();

    // Draw the buffer to the main canvas
    context.drawImage(bufferCanvas, 0, 0);

    // Apply pheromone decay
    decayGrid();

    requestAnimationFrame(loopSlime);
  };

  const findRoute = (p) => {
    // Calculate the indices based on the particle's position and speed
    const xs = Math.floor((p.pos.x + sensorSlime * p._speed.x) / gridStep);
    const ys = Math.floor((p.pos.y + sensorSlime * p._speed.y) / gridStep);
    const xl = Math.floor((p.pos.x + sensorSlime * p._speedL.x) / gridStep);
    const yl = Math.floor((p.pos.y + sensorSlime * p._speedL.y) / gridStep);
    const xr = Math.floor((p.pos.x + sensorSlime * p._speedR.x) / gridStep);
    const yr = Math.floor((p.pos.y + sensorSlime * p._speedR.y) / gridStep);

    // Wrap the indices to ensure no negative values
    const wrappedXs = (xs + gridX) % gridX;
    const wrappedYs = (ys + gridY) % gridY;
    const wrappedXl = (xl + gridX) % gridX;
    const wrappedYl = (yl + gridY) % gridY;
    const wrappedXr = (xr + gridX) % gridX;
    const wrappedYr = (yr + gridY) % gridY;

    // Prevent out of bounds by checking the wrapped indices
    if (
      wrappedXs < 0 ||
      wrappedYs < 0 ||
      wrappedXl < 0 ||
      wrappedYl < 0 ||
      wrappedXr < 0 ||
      wrappedYr < 0 ||
      wrappedXs >= gridX ||
      wrappedYs >= gridY ||
      wrappedXl >= gridX ||
      wrappedYl >= gridY ||
      wrappedXr >= gridX ||
      wrappedYr >= gridY
    ) {
      console.error(
        "Out of bounds index detected",
        wrappedXs,
        wrappedYs,
        wrappedXl,
        wrappedYl,
        wrappedXr,
        wrappedYr
      );
      return 0; // Prevent crash by returning a default route value
    }

    // Access the pheromone values using wrapped indices
    const straight = gridPheromones[wrappedXs][wrappedYs];
    const left = gridPheromones[wrappedXl][wrappedYl];
    const right = gridPheromones[wrappedXr][wrappedYr];

    // Determine the route based on pheromone values
    if (left === right) {
      return left >= straight ? Math.floor(2 * Math.random()) + 1 : 0;
    }
    return left > right
      ? left >= straight
        ? 1
        : 0
      : right >= straight
      ? 2
      : 0;
  };

  const diffuseParticle = (i, j, amount) => {
    if (i < 0 || j < 0 || i >= gridX || j >= gridY) return;
    const left = i - 1 < 0 ? gridX - 1 : i - 1;
    const right = (i + 1) % gridX;
    const up = j - 1 < 0 ? gridY - 1 : j - 1;
    const down = (j + 1) % gridY;

    gridPheromones[left][up] += amount;
    gridPheromones[left][j] += amount;
    gridPheromones[left][down] += amount;
    gridPheromones[right][up] += amount;
    gridPheromones[right][j] += amount;
    gridPheromones[right][down] += amount;
    gridPheromones[i][up] += amount;
    gridPheromones[i][down] += amount;
    gridPheromones[i][j] += amount;
  };

  const onMouseDown = (e) => {
    handleMove(e.clientX - offsetX, e.clientY - offsetY);
  };

  const onMouseUp = () => {};

  const onMouseMove = (e) => {
    handleMove(e.clientX - offsetX, e.clientY - offsetY);
  };

  const handleMove = (x, y) => {
    for (let i = -mouseWidth; i < mouseWidth; i++) {
      for (let j = -mouseWidth; j < mouseWidth; j++) {
        diffuseParticle(Math.floor(x + i), Math.floor(y + j), 10000000);
      }
    }
  };

  class Particle {
    constructor(x, y, radius, alfa, lambda) {
      this.pos = new SAT.Vector(x, y);
      this.radius = radius;
      this.alfa = alfa;
      this.lambda = lambda;
      this._latest = new SAT.Vector(0, 0);
      this.setSpeed(absSpeedSlime);
    }

    setSpeed(speed) {
      this._speed = new SAT.Vector(
        Math.cos(this.alfa),
        Math.sin(this.alfa)
      ).scale(speed);
      this._speedL = new SAT.Vector(
        Math.cos(this.alfa + this.lambda),
        Math.sin(this.alfa + this.lambda)
      ).scale(speed);
      this._speedR = new SAT.Vector(
        Math.cos(this.alfa - this.lambda),
        Math.sin(this.alfa - this.lambda)
      ).scale(speed);
    }

    update(dir) {
      if (dir === 2) this.alfa -= this.lambda;
      else if (dir === 1) this.alfa += this.lambda;
      this.setSpeed(absSpeedSlime);
      this._latest = this.pos.clone();
      this.pos.add(this._speed);
    }
  }

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default SlimeMold;
