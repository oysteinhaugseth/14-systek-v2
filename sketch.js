let font;
let img;
let fontsize = 60;
let strokeweight = 2;
let pills = [];
let ctx;
let texts = ["mellom", "folk", "og", "teknologi"];
let currentTextIndex = 0;
let mouseStartX = 0;
let mouseStartY = 0;
let isDragging = false;
let cornerRadius = 4;
let fadeInSpeed = 0.1;
let maxPillDistance = 400;
let cornerOffset = -2; // Global variable for line connection offset

// Add timing variables
let startTime;
let initialPillsCreated = 0;
let lastPillTime = 0;
const PILL_DELAY = 1000;

function preload() {
  font = loadFont("assets/fonts/KHTeka/WOFF/KHTeka-Light.woff");
  img = loadImage("assets/image/img.png");
}

class Pill {
  static textOffsetY = -(fontsize / 7);

  constructor(text, x, y, options = {}) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.padding = options.padding || fontsize / 4;
    this.height = options.height || fontsize * 1.2;
    this.cornerRadius = options.cornerRadius || cornerRadius;
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.isImage = false;
    this.hasBeenClicked = false;
    this.isActive = false;
    this.hasBeenRendered = false;
    this.isInitialPill = false;
    this.opacity = 0;
    this.fadeInSpeed = fadeInSpeed;
    this.repulsionForce = 500;
    this.repulsionDecay = 0.99;
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityDecay = 0.95;
    this.lastX = x;
    this.lastY = y;
    this.recalculate();
  }

  recalculate() {
    if (this.isImage) {
      this.width = 300;
      this.height = 360;
    } else {
      this.textW = textWidth(this.text);
      this.width = this.textW + this.padding * 2;
      this.height = fontsize * 1.2;
    }
  }

  toggleState() {
    if (this.text === "folk") {
      if (this.hasBeenClicked) {
        this.isImage = !this.isImage;
      }
      this.hasBeenClicked = true;
    } else {
      if (this.isInitialPill) {
        this.isActive = !this.isActive;
      } else {
        if (this.hasBeenRendered) {
          this.isActive = !this.isActive;
        }
        this.hasBeenRendered = true;
      }
    }
    this.recalculate();
  }

  contains(x, y) {
    return (
      x >= this.x - this.width / 2 &&
      x <= this.x + this.width / 2 &&
      y >= this.y - this.height / 2 &&
      y <= this.y + this.height / 2
    );
  }

  startDrag(x, y) {
    this.isDragging = true;
    this.dragOffsetX = this.x - x;
    this.dragOffsetY = this.y - y;
  }

  drag(x, y) {
    if (this.isDragging) {
      // Store last position before updating
      this.lastX = this.x;
      this.lastY = this.y;

      // Update position
      this.x = x + this.dragOffsetX;
      this.y = y + this.dragOffsetY;

      // Calculate velocity based on the difference between current and last position
      this.velocityX = (this.x - this.lastX) * 0.5;
      this.velocityY = (this.y - this.lastY) * 0.5;
    }
  }

  update() {
    if (this.opacity < 1) {
      this.opacity += this.fadeInSpeed;
    }

    // Apply velocity with repulsion-like behavior
    if (!this.isDragging) {
      this.x += this.velocityX;
      this.y += this.velocityY;

      // Decay velocity more like repulsion
      this.velocityX *= this.repulsionDecay;
      this.velocityY *= this.repulsionDecay;
    }

    if (this.repulsionForce > 0) {
      this.repulsionForce *= this.repulsionDecay;
    }
  }

  applyRepulsion(otherPill) {
    const dx = otherPill.x - this.x;
    const dy = otherPill.y - this.y;
    const distance = sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const force = this.repulsionForce / (distance * distance * 0.01);
      const angle = atan2(dy, dx);
      otherPill.x += cos(angle) * force;
      otherPill.y += sin(angle) * force;
    }
  }

  display() {
    if (this.opacity < 1) {
      this.opacity += this.fadeInSpeed;
    }

    if (!this.isImage) {
      noStroke();
      if (
        (this.isActive && this.hasBeenRendered) ||
        (this.isActive && this.isInitialPill)
      ) {
        fill(255, 210, 76, this.opacity * 255);
      } else {
        fill(255, 255, 255, this.opacity * 255);
      }
      strokeWeight(strokeweight);
      rectMode(CORNER);
      rect(
        this.x - this.width / 2,
        this.y - this.height / 2,
        this.width,
        this.height,
        this.cornerRadius
      );
    }

    if (this.isImage) {
      tint(255, this.opacity * 255);
      image(img, this.x - this.width / 2, this.y - this.height / 2, 300, 360);
      noTint();
    } else {
      fill(0, this.opacity * 255);
      text(this.text, this.x, this.y + Pill.textOffsetY);
    }
  }

  stopDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      this.repulsionForce = 1000;
    }
  }
}

function setup() {
  let renderer = createCanvas(windowWidth, windowHeight);
  ctx = renderer.drawingContext;
  textFont(font);
  textSize(fontsize);
  textAlign(CENTER, CENTER);
  startTime = millis();
}

// Add function to check if two line segments intersect
function linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denominator === 0) return false;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

// Add function to adjust line endpoints to avoid crossings
function adjustLineEndpoints(pill1, pill2, otherPills) {
  let startX, startY, endX, endY;

  // Calculate start point with proper padding
  if (pill1.isImage) {
    startX = pill1.x + pill1.width / 2 - pill1.padding - 10;
    startY = pill1.y + pill1.height / 2 - pill1.padding - 10;
  } else {
    startX = pill1.x + pill1.width / 2 - cornerOffset;
    startY = pill1.y + pill1.height / 2 - cornerOffset;
  }

  // Calculate end point with proper padding
  endX = pill2.x - pill2.width / 2 + cornerOffset;
  endY = pill2.y - pill2.height / 2 + cornerOffset;

  // Check for intersections with other lines
  for (let i = 0; i < otherPills.length - 1; i++) {
    const p1 = otherPills[i];
    const p2 = otherPills[i + 1];

    let otherStartX, otherStartY;
    if (p1.isImage) {
      otherStartX = p1.x + p1.width / 2 - p1.padding - 10;
      otherStartY = p1.y + p1.height / 2 - p1.padding - 10;
    } else {
      otherStartX = p1.x + p1.width / 2 - cornerOffset;
      otherStartY = p1.y + p1.height / 2 - cornerOffset;
    }

    const otherEndX = p2.x - p2.width / 2 + cornerOffset;
    const otherEndY = p2.y - p2.height / 2 + cornerOffset;

    if (
      linesIntersect(
        startX,
        startY,
        endX,
        endY,
        otherStartX,
        otherStartY,
        otherEndX,
        otherEndY
      )
    ) {
      // Adjust the line by moving the endpoints slightly
      const angle = atan2(endY - startY, endX - startX);
      const offset = 10; // Amount to offset the line

      // Move the line perpendicular to its direction
      startX += cos(angle + PI / 2) * offset;
      startY += sin(angle + PI / 2) * offset;
      endX += cos(angle + PI / 2) * offset;
      endY += sin(angle + PI / 2) * offset;
    }
  }

  return { startX, startY, endX, endY };
}

function draw() {
  background(241, 234, 224);

  if (initialPillsCreated < 3) {
    let currentTime = millis();
    if (currentTime - lastPillTime >= PILL_DELAY) {
      let pill = createInitialPill();
      if (pill) {
        pills.push(pill);
        initialPillsCreated++;
        lastPillTime = currentTime;
      }
    }
  }

  for (let pill of pills) {
    pill.update();
  }

  for (let i = 0; i < pills.length; i++) {
    for (let j = i + 1; j < pills.length; j++) {
      pills[i].applyRepulsion(pills[j]);
      pills[j].applyRepulsion(pills[i]);
    }
  }

  if (pills.length > 1) {
    stroke(151, 210, 236);
    strokeWeight(strokeweight);

    // Draw lines with adjusted endpoints to avoid crossings
    for (let i = 0; i < pills.length - 1; i++) {
      const pill1 = pills[i];
      const pill2 = pills[i + 1];
      const otherPills = pills.filter(
        (_, index) => index !== i && index !== i + 1
      );

      const { startX, startY, endX, endY } = adjustLineEndpoints(
        pill1,
        pill2,
        otherPills
      );
      line(startX, startY, endX, endY);
    }
  }

  for (let pill of pills) {
    pill.display();
  }
}

function createInitialPill() {
  const initialTexts = ["Vi", "bygger", "broer"];
  const text = initialTexts[initialPillsCreated];
  const tempPill = new Pill(text, 0, 0);
  const pillPadding = 20;

  // Special placement for first three pills
  if (initialPillsCreated < 3) {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseDistance = 200; // Base distance from center

    if (pills.length === 0) {
      // First pill: place near center
      const angle = random(TWO_PI);
      const distance = random(50, 100);
      const x = centerX + cos(angle) * distance;
      const y = centerY + sin(angle) * distance;

      let newPill = new Pill(text, x, y);
      newPill.isInitialPill = true;
      newPill.repulsionForce = 1000;
      return newPill;
    } else if (pills.length === 1) {
      // Second pill: place in a different quadrant
      const firstPill = pills[0];
      const angle =
        atan2(firstPill.y - centerY, firstPill.x - centerX) +
        PI +
        random(-PI / 4, PI / 4);
      const distance = baseDistance;
      const x = centerX + cos(angle) * distance;
      const y = centerY + sin(angle) * distance;

      // Ensure within bounds
      const finalX = constrain(
        x,
        tempPill.width / 2 + pillPadding,
        width - tempPill.width / 2 - pillPadding
      );
      const finalY = constrain(
        y,
        tempPill.height / 2 + pillPadding,
        height - tempPill.height / 2 - pillPadding
      );

      let newPill = new Pill(text, finalX, finalY);
      newPill.isInitialPill = true;
      newPill.repulsionForce = 1000;
      return newPill;
    } else if (pills.length === 2) {
      // Third pill: place in the remaining space
      const firstPill = pills[0];
      const secondPill = pills[1];

      // Calculate the angle between first and second pill
      const angle1 = atan2(
        secondPill.y - firstPill.y,
        secondPill.x - firstPill.x
      );

      // Place third pill perpendicular to the line between first and second
      const perpendicularAngle = angle1 + PI / 2 + random(-PI / 6, PI / 6);
      const distance = baseDistance;

      // Calculate position based on the midpoint of first two pills
      const midX = (firstPill.x + secondPill.x) / 2;
      const midY = (firstPill.y + secondPill.y) / 2;

      const x = midX + cos(perpendicularAngle) * distance;
      const y = midY + sin(perpendicularAngle) * distance;

      // Ensure within bounds
      const finalX = constrain(
        x,
        tempPill.width / 2 + pillPadding,
        width - tempPill.width / 2 - pillPadding
      );
      const finalY = constrain(
        y,
        tempPill.height / 2 + pillPadding,
        height - tempPill.height / 2 - pillPadding
      );

      let newPill = new Pill(text, finalX, finalY);
      newPill.isInitialPill = true;
      newPill.repulsionForce = 1000;
      return newPill;
    }
  }

  // For subsequent pills, use the existing random placement logic
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const minX = tempPill.width / 2 + pillPadding;
    const maxX = width - tempPill.width / 2 - pillPadding;
    const minY = tempPill.height / 2 + pillPadding;
    const maxY = height - tempPill.height / 2 - pillPadding;

    const x = random(minX, maxX);
    const y = random(minY, maxY);

    let validPosition = true;
    const lastPill = pills[pills.length - 1];

    for (let pill of pills) {
      const distance = dist(x, y, pill.x, pill.y);
      if (distance > maxPillDistance || distance < 100) {
        validPosition = false;
        break;
      }
    }

    if (validPosition) {
      for (let pill of pills) {
        if (lineIntersectsPill(lastPill.x, lastPill.y, x, y, pill)) {
          validPosition = false;
          break;
        }
      }
    }

    if (validPosition) {
      let newPill = new Pill(text, x, y);
      newPill.isInitialPill = true;
      newPill.repulsionForce = 1000;
      return newPill;
    }

    attempts++;
  }

  // Fallback placement
  const lastPill = pills[pills.length - 1];
  const angle = random(TWO_PI);
  const distance = random(100, maxPillDistance);
  let x = lastPill.x + cos(angle) * distance;
  let y = lastPill.y + sin(angle) * distance;

  x = constrain(
    x,
    tempPill.width / 2 + pillPadding,
    width - tempPill.width / 2 - pillPadding
  );
  y = constrain(
    y,
    tempPill.height / 2 + pillPadding,
    height - tempPill.height / 2 - pillPadding
  );

  let newPill = new Pill(text, x, y);
  newPill.isInitialPill = true;
  newPill.repulsionForce = 1000;
  return newPill;
}

function mousePressed() {
  mouseStartX = mouseX;
  mouseStartY = mouseY;
  isDragging = false;

  for (let i = 0; i < pills.length; i++) {
    if (pills[i].contains(mouseX, mouseY)) {
      pills[i].startDrag(mouseX, mouseY);
      return;
    }
  }

  if (currentTextIndex < texts.length) {
    pills.push(new Pill(texts[currentTextIndex], mouseX, mouseY));
    currentTextIndex++;
  }
}

function mouseDragged() {
  if (dist(mouseStartX, mouseStartY, mouseX, mouseY) > 5) {
    isDragging = true;
  }

  for (let pill of pills) {
    if (pill.isDragging) {
      pill.drag(mouseX, mouseY);
    }
  }
}

function mouseReleased() {
  if (!isDragging) {
    for (let i = 0; i < pills.length; i++) {
      if (pills[i].contains(mouseX, mouseY)) {
        pills[i].toggleState();
        break;
      }
    }
  }

  // Stop dragging all pills and add repulsion
  for (let pill of pills) {
    pill.stopDrag();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
