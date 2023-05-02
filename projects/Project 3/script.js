const canvas = document.getElementById("ballCanvas");
const ctx = canvas.getContext("2d");
const increaseSpeedBtn = document.getElementById("increaseSpeed");
const decreaseSpeedBtn = document.getElementById("decreaseSpeed");
const increaseSizeBtn = document.getElementById("increaseSize");
const decreaseSizeBtn = document.getElementById("decreaseSize");
const randomColorBtn = document.getElementById("randomColor");
const addBallBtn = document.getElementById("addBall");

function setCanvasSize() {
  const maxWidth = 800; // Set the maximum canvas width
  const margin = 20; // Set the margin on both sides
  const screenWidth = window.innerWidth;

  if (screenWidth <= maxWidth + 2 * margin) {
    canvas.width = screenWidth - 2 * margin;
  } else {
    canvas.width = maxWidth;
  }
  canvas.height = 400; // Set the desired canvas height
}

setCanvasSize();

class Ball {
  constructor(x, y, radius, color, dx, dy) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.dx = dx;
    this.dy = dy;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    if (
      this.x + this.dx > canvas.width - this.radius ||
      this.x + this.dx < this.radius
    ) {
      this.dx = -this.dx;
      this.x = Math.max(
        this.radius,
        Math.min(canvas.width - this.radius, this.x)
      );
    }
    if (
      this.y + this.dy > canvas.height - this.radius ||
      this.y + this.dy < this.radius
    ) {
      this.dy = -this.dy;
      this.y = Math.max(
        this.radius,
        Math.min(canvas.height - this.radius, this.y)
      );
    }
  }

  collidesWith(ball) {
    const dx = this.x - ball.x;
    const dy = this.y - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + ball.radius;
  }

  resolveCollision(ball) {
    const dx = ball.x - this.x;
    const dy = ball.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const overlap = this.radius + ball.radius - distance;

    if (overlap <= 0) return;

    const normalX = dx / distance;
    const normalY = dy / distance;

    const moveX = (overlap / 2) * normalX;
    const moveY = (overlap / 2) * normalY;

    this.x -= moveX;
    this.y -= moveY;
    ball.x += moveX;
    ball.y += moveY;

    const relativeVelocityX = this.dx - ball.dx;
    const relativeVelocityY = this.dy - ball.dy;

    const dotProduct =
      relativeVelocityX * normalX + relativeVelocityY * normalY;

    const bounceFactor = 1;
    const impulse =
      (2 * ball.radius * dotProduct) / (this.radius + ball.radius);

    this.dx -= impulse * normalX * bounceFactor;
    this.dy -= impulse * normalY * bounceFactor;
    ball.dx += impulse * normalX * bounceFactor;
    ball.dy += impulse * normalY * bounceFactor;

    // Calculate the speeds of both balls
    const thisSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    const ballSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    // Limit the maximum speed
    const maxSpeed = 100;
    if (thisSpeed > maxSpeed) {
      const speedRatio = maxSpeed / thisSpeed;
      this.dx *= speedRatio;
      this.dy *= speedRatio;
    }
    if (ballSpeed > maxSpeed) {
      const speedRatio = maxSpeed / ballSpeed;
      ball.dx *= speedRatio;
      ball.dy *= speedRatio;
    }
    // Compare the speeds and pass along the color property
    if (thisSpeed > ballSpeed) {
      ball.color = this.color;
    } else {
      this.color = ball.color;
    }
  }
}

let balls = [
  new Ball(canvas.width / 2, canvas.height / 2, 10, "#0095DD", 2, -2),
];

function increaseSpeed() {
  for (const ball of balls) {
    ball.dx *= 1.1;
    ball.dy *= 1.1;
  }
}

function decreaseSpeed() {
  for (const ball of balls) {
    ball.dx *= 0.9;
    ball.dy *= 0.9;
  }
}

function increaseSize() {
  for (const ball of balls) {
    ball.radius += 2;
  }
}

function decreaseSize() {
  for (const ball of balls) {
    if (ball.radius > 2) {
      ball.radius -= 2;
    }
  }
}

function randomColor() {
  const random = () => Math.floor(Math.random() * 256);
  balls.forEach((ball) => {
    ball.color = `rgb(${random()}, ${random()}, ${random()})`;
  });
}

function addBall() {
  const randomPos = () => Math.floor(Math.random() * (canvas.width - 30)) + 15;
  const randomColor = () => Math.floor(Math.random() * 256);
  const randomVelocity = () => Math.random() * 4 - 2;
  const newBall = new Ball(
    randomPos(),
    randomPos(),
    10,
    `rgb(${randomColor()}, ${randomColor()}, ${randomColor()})`,
    randomVelocity(),
    randomVelocity()
  );
  balls.push(newBall);
}

increaseSpeedBtn.addEventListener("click", increaseSpeed);
decreaseSpeedBtn.addEventListener("click", decreaseSpeed);
increaseSizeBtn.addEventListener("click", increaseSize);
decreaseSizeBtn.addEventListener("click", decreaseSize);
randomColorBtn.addEventListener("click", randomColor);
addBallBtn.addEventListener("click", addBall);
window.addEventListener('resize', setCanvasSize);

function updateBalls() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      if (balls[i].collidesWith(balls[j])) {
        balls[i].resolveCollision(balls[j]);
      }
    }
    balls[i].update();
    balls[i].draw();
  }
}

setInterval(updateBalls, 10);
