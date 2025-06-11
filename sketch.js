// template is from https://github.com/aferriss/p5jsShaderExamples/tree/gh-pages

let uniformsShader;
let smallFBO, largeFBO;
let aspectRatio;

function setup() {
  pixelDensity(1);
  
  // square canvas (90vh)
  let canvasSize = min(windowWidth * 0.9, windowHeight * 0.9);
  canvasSize = max(400, min(canvasSize, 800)); // min 400px，max 800px
  
  createCanvas(canvasSize, canvasSize, WEBGL);

  uniformsShader = loadShader("uniform.vert", "uniform.frag");



  aspectRatio = 1.0;

  let highRes = canvasSize * 2; // 2x resolution
  
  smallFBO = createFramebuffer({
    width: highRes,
    height: highRes,
    format: UNSIGNED_BYTE,
    density: 1,
  });

  noStroke();
}

function draw() {

  renderToFBO(smallFBO);

  background(0);
  imageMode(CENTER);

  image(smallFBO, 0, 0, width, height);
}

function renderToFBO(fbo) {
  fbo.begin();

  // Clear the FBO
  clear();

  // shader() sets the active shader with our shader
  shader(uniformsShader);

  // Send uniforms to shader
  uniformsShader.setUniform("time", millis() / 1000);
  uniformsShader.setUniform("width", fbo.width);
  uniformsShader.setUniform("height", fbo.height);

  // Draw a rect that covers the full FBO size
  push();
  noStroke();
  // Flip Y-axis to match shader coordinate system
  scale(1, -1);
  rect(-fbo.width / 2, -fbo.height / 2, fbo.width, fbo.height);
  pop();

  fbo.end();
}

function windowResized() {
  // recalculate canvas size
  let canvasSize = min(windowWidth * 0.9, windowHeight * 0.9);
  canvasSize = max(400, min(canvasSize, 800));
  
  resizeCanvas(canvasSize, canvasSize);
  
  let highRes = canvasSize * 2;
  
  smallFBO = createFramebuffer({
    width: highRes,
    height: highRes,
    format: UNSIGNED_BYTE,
    density: 1,
  });
}



//------------------------------------
// download pic (high res)

function keyPressed() {
  if (key === 's' || key === 'S') {
    let currentWidth = width;
    let currentHeight = height;
    
    resizeCanvas(4000, 4000);
    
    // re render
    renderToFBO(smallFBO);
    background(0);
    image(smallFBO, 0, 0, 4000, 4000);
    
    // save
    saveCanvas('output', 'png');
    
    // ori size
    resizeCanvas(currentWidth, currentHeight);
    
    console.log("高解析度圖片已儲存！");
  }
}

// monitor fps

// function displayFPS() {
//   fill(255);
//   textAlign(LEFT);
//   text('FPS: ' + Math.round(frameRate()), 10, 20);
//   text('Canvas: ' + width + 'x' + height, 10, 40);
//   text('FBO: ' + smallFBO.width + 'x' + smallFBO.height, 10, 60);
// }