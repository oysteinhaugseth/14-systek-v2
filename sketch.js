let font;
let svg;
let img;
let fontsize = 60;
let strokeweight = 2;
let pills = [];
// the offset of the line to the corner of the pill in pixels
let offset = fontsize / 10;
let texts = ["mellom", "folk", "og", "teknologi"];
let currentTextIndex = 0;
let mouseStartX = 0;
let mouseStartY = 0;
let isDragging = false;
let cornerRadius = 4; // Added corner radius variable

// Add timing variables
let startTime;
let initialPillsCreated = 0;
let lastPillTime = 0;
const PILL_DELAY = 1000; // 1 second delay between pills

function preload() {
  font = loadFont("assets/fonts/KHTeka/WOFF/KHTeka-Light.woff");
  svg = loadSVG("assets/svg/logo.svg");
  img = loadImage("assets/image/img.png");
}

class Pill {
  // Static property that applies to all instances
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
    this.isSvg = false;
    this.isImage = false;
    this.hasBeenClicked = false;
    this.isActive = false;
    this.hasBeenRendered = false;
    this.isInitialPill = false; // Track if this is one of the initial pills
    this.opacity = 0; // Start with 0 opacity
    this.fadeInSpeed = 0.05; // Speed of fade in animation
    this.recalculate();
  }

  recalculate() {
    if (this.isSvg) {
      this.width = 182 + 24; // SVG width
      this.height = 44 + 24; // SVG height
    } else if (this.isImage) {
      this.width = 300; // Image width (doubled from 150)
      this.height = 360; // Image height (doubled from 180)
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
        this.isSvg = false;
      }
      this.hasBeenClicked = true;
    } else if (this.text === "Vi") {
      this.isSvg = !this.isSvg;
      this.isImage = false;
    } else {
      // For initial pills, change color immediately
      if (this.isInitialPill) {
        this.isActive = !this.isActive;
      } else {
        // For dynamically added pills, wait for render
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
      this.x = x + this.dragOffsetX;
      this.y = y + this.dragOffsetY;
    }
  }

  stopDrag() {
    this.isDragging = false;
  }

  display() {
    // Update opacity for fade in
    if (this.opacity < 1) {
      this.opacity += this.fadeInSpeed;
    }

    if (!this.isSvg && !this.isImage) {
      noStroke();
      // Change fill color based on active state and if it has been rendered
      if (
        (this.isActive && this.hasBeenRendered) ||
        (this.isActive && this.isInitialPill)
      ) {
        fill(255, 210, 76, this.opacity * 255); // Yellow color when active
      } else {
        fill(255, 255, 255, this.opacity * 255); // Inactive color or not yet rendered
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

    if (this.isSvg) {
      tint(255, this.opacity * 255);
      image(svg, this.x - this.width / 2, this.y - this.height / 2, 182, 44);
      noTint();
    } else if (this.isImage) {
      tint(255, this.opacity * 255);
      image(img, this.x - this.width / 2, this.y - this.height / 2, 300, 360);
      noTint();
    } else {
      fill(0, this.opacity * 255);
      text(this.text, this.x, this.y + Pill.textOffsetY);
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight, SVG);
  textFont(font);
  textSize(fontsize);
  textAlign(CENTER, CENTER);
  startTime = millis();
}

function draw() {
  background(252, 246, 238);

  // Create initial pills with delay
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

  // Draw connecting strokes between pills first (so pills appear on top)
  if (pills.length > 1) {
    // Draw lines from bottom right of each pill to top left of next pill
    stroke(151, 210, 236);
    strokeWeight(strokeweight);
    for (let i = 0; i < pills.length - 1; i++) {
      // Calculate bottom right corner of current pill
      let pill1 = pills[i];
      let pill2 = pills[i + 1];

      let startX, startY, endX, endY;

      // Adjust connection points based on whether first pill is showing SVG or image
      if (i === 0) {
        if (pill1.isSvg) {
          // For SVG, connect from the bottom right of the SVG area
          startX = pill1.x + pill1.width / 2 - pill1.padding - 6;
          startY = pill1.y + pill1.height / 2 - pill1.padding - 6;
        } else if (pill1.isImage) {
          // For image, connect from the bottom right of the image area
          startX = pill1.x + pill1.width / 2 - pill1.padding - 10;
          startY = pill1.y + pill1.height / 2 - pill1.padding - 10;
        } else {
          // For text pills, use the original corner connection
          startX = offset + pill1.x + pill1.width / 2 - pill1.cornerRadius / 2;
          startY = offset + pill1.y + pill1.height / 2 - pill1.cornerRadius / 2;
        }
      } else {
        // For other pills, use the original corner connection
        startX = offset + pill1.x + pill1.width / 2 - pill1.cornerRadius / 2;
        startY = offset + pill1.y + pill1.height / 2 - pill1.cornerRadius / 2;
      }

      // Top left of next pill (consider the corner radius)
      endX = pill2.x - pill2.width / 2 + pill2.cornerRadius / 2 - offset;
      endY = pill2.y - pill2.height / 2 + pill2.cornerRadius / 2 - offset;

      // Draw the connecting line
      line(startX, startY, endX, endY);
    }
  }

  // Display all pills on top of the connections
  for (let pill of pills) {
    pill.display();
  }
}

function createInitialPill() {
  const initialTexts = ["Vi", "bygger", "broer"];
  const text = initialTexts[initialPillsCreated];

  // Try to find a non-overlapping position
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    // Generate random position with padding from edges
    const padding = 100;
    const x = random(padding, width - padding);
    const y = random(padding, height - padding);

    // Check if this position overlaps with existing pills
    let overlaps = false;
    for (let pill of pills) {
      const distance = dist(x, y, pill.x, pill.y);
      if (distance < 150) {
        // Minimum distance between pills
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      let newPill = new Pill(text, x, y);
      newPill.isInitialPill = true;
      return newPill;
    }

    attempts++;
  }

  // If we couldn't find a non-overlapping position, place it in a default position
  let newPill = new Pill(text, width / 2, height / 2);
  newPill.isInitialPill = true;
  return newPill;
}

function mousePressed() {
  mouseStartX = mouseX;
  mouseStartY = mouseY;
  isDragging = false;

  // Check if we're clicking on any existing pill
  for (let i = 0; i < pills.length; i++) {
    if (pills[i].contains(mouseX, mouseY)) {
      pills[i].startDrag(mouseX, mouseY);
      return;
    }
  }

  // If not clicking on a pill, add a new one if there are words left
  if (currentTextIndex < texts.length) {
    pills.push(new Pill(texts[currentTextIndex], mouseX, mouseY));
    currentTextIndex++;
  }
}

function mouseDragged() {
  // Check if we've moved enough to consider this a drag
  if (dist(mouseStartX, mouseStartY, mouseX, mouseY) > 5) {
    isDragging = true;
  }

  // Update position of any pill being dragged
  for (let pill of pills) {
    if (pill.isDragging) {
      pill.drag(mouseX, mouseY);
    }
  }
}

function mouseReleased() {
  // If it wasn't a drag, handle it as a click
  if (!isDragging) {
    for (let i = 0; i < pills.length; i++) {
      if (pills[i].contains(mouseX, mouseY)) {
        pills[i].toggleState();
        break;
      }
    }
  }

  // Stop dragging all pills
  for (let pill of pills) {
    pill.stopDrag();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
