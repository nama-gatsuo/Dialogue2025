// template is from https://github.com/aferriss/p5jsShaderExamples/tree/gh-pages

let uniformsShader;
let smallFBO;
let aspectRatio;
let randonclrpos = [];
let randomGauss = [];
let lensType;
let canvas;

// render / display settings
// fixed render resolution (display will be half size)
let renderWidth = 1080 * 2;
let renderHeight = 1920 * 2;
let displayScaleFromRender = 0.5;
let exportScale = 1; // additional scale for export

// frame export
let exportFBO = null;
let isRecording = false;
let recordFrameIndex = 0;
let recordFps = 30;
let recordEvery = 1;
let recordEndFrame = 300; // stop after this many exported frames
let zip = null;
let zipChunkSize = 100;
let zipChunkIndex = 0;
let zipFrameCount = 0;

function preload() {
  uniformsShader = loadShader("uniform.vert", "uniform.frag");
}

function setup() {
  pixelDensity(1);

  // random color(combo1&combo2) every time
  for (let i = 0; i < 6; i++) {
    randonclrpos.push(Math.floor(Math.random() * 3));
  }
  // random combinedGauss
  for (let i = 0; i < 5; i++) {
    let sign = Math.random() > 0.5 ? 1 : -1;
    let strength = 0.1 + Math.random() * 0.9;
    randomGauss.push(sign * strength);
  }
  resultString = randonclrpos.map(x => ['r','g','b'][x]).join('');
  console.log(randonclrpos);

  let canvasWidth = Math.floor(renderWidth * displayScaleFromRender);
  let canvasHeight = Math.floor(renderHeight * displayScaleFromRender);

  canvas = createCanvas(renderWidth, renderHeight, WEBGL);
  setCanvasDisplaySize(canvasWidth, canvasHeight);

  aspectRatio = renderWidth / renderHeight;

  smallFBO = createFramebuffer({
    width: renderWidth,
    height: renderHeight,
    format: UNSIGNED_BYTE,
    density: 1,
  });

  noStroke();

  lensType = Math.floor(random(0, 4));
}

function draw() {

  const time = isRecording ? (recordFrameIndex / recordFps) : (millis() / 1000);
  renderToFBO(smallFBO, time);

  background(0);
  imageMode(CENTER);

  image(smallFBO, 0, 0, width, height);

  if (isRecording && frameCount % recordEvery === 0) {
    exportFrame(time);
    recordFrameIndex += 1;
    if (zipFrameCount >= zipChunkSize) {
      rotateZip();
    }
    if (recordFrameIndex >= recordEndFrame) {
      isRecording = false;
      finalizeZipIfNeeded();
    }
  }

  // if (frameCount > 10000) {
  //   window.location.reload();
  // }
}

function renderToFBO(fbo, time) {
  fbo.begin();

  // Clear the FBO
  clear();

  // shader() sets the active shader with our shader
  shader(uniformsShader);

  // Send uniforms to shader
  uniformsShader.setUniform("time", time);
  uniformsShader.setUniform("width", fbo.width);
  uniformsShader.setUniform("height", fbo.height);
  uniformsShader.setUniform("rand", randonclrpos);
  uniformsShader.setUniform("gauss", randomGauss);
  // uniformsShader.setUniform("lensType", lensType);
  
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
  let w = Math.floor(renderWidth * displayScaleFromRender);
  let h = Math.floor(renderHeight * displayScaleFromRender);
  setCanvasDisplaySize(w, h);
}

function setCanvasDisplaySize(w, h) {
  if (!canvas || !canvas.elt) return;
  canvas.elt.style.width = `${w}px`;
  canvas.elt.style.height = `${h}px`;
  canvas.elt.style.position = "absolute";
  canvas.elt.style.left = "50%";
  canvas.elt.style.top = "50%";
  canvas.elt.style.transform = "translate(-50%, -50%)";
}

function ensureExportFBO() {
  if (!smallFBO) return null;
  let exportW = Math.floor(smallFBO.width * exportScale);
  let exportH = Math.floor(smallFBO.height * exportScale);
  if (exportFBO && exportFBO.width === exportW && exportFBO.height === exportH) {
    return exportFBO;
  }
  if (exportFBO) exportFBO.remove();
  exportFBO = createFramebuffer({
    width: exportW,
    height: exportH,
    format: UNSIGNED_BYTE,
    density: 1,
  });
  return exportFBO;
}

function exportFrame(time) {
  let fbo = ensureExportFBO();
  if (!fbo) return;

  fbo.begin();
  clear();
  shader(uniformsShader);
  uniformsShader.setUniform("time", time);
  uniformsShader.setUniform("width", float(fbo.width));
  uniformsShader.setUniform("height", float(fbo.height));
  uniformsShader.setUniform("rand", randonclrpos);
  uniformsShader.setUniform("gauss", randomGauss);
  uniformsShader.setUniform("lensType", lensType);

  push();
  scale(1, -1);
  rect(-fbo.width / 2, -fbo.height / 2, fbo.width, fbo.height);
  pop();
  fbo.end();

  let img = fbo.get();
  let filename = `frame_${String(recordFrameIndex).padStart(5, "0")}.png`;
  if (zip) {
    let dataUrl = img.canvas.toDataURL("image/png");
    let base64 = dataUrl.split(",")[1];
    zip.file(filename, base64, { base64: true });
    zipFrameCount += 1;
  } else {
    img.save(filename.replace(".png", ""), "png");
  }
}


//------------------------------------
// download pic (high res)

function keyPressed() {
  if (key === 's' || key === 'S') {
    const time = millis() / 1000;
    exportFrame(time);
  }

  if (key === 'r' || key === 'R') {
    isRecording = !isRecording;
    if (isRecording) {
      recordFrameIndex = 0;
      zipChunkIndex = 0;
      startZip();
    } else {
      finalizeZipIfNeeded();
    }
  }
}

function startZip() {
  if (typeof JSZip === "undefined") {
    console.warn("JSZip is not loaded.");
    zip = null;
    return;
  }
  zip = new JSZip();
  zipFrameCount = 0;
}

async function finalizeZip(zipToSave, index) {
  try {
    let blob = await zipToSave.generateAsync({ type: "blob" });
    let name = `frames_${String(index).padStart(3, "0")}.zip`;
    triggerDownload(blob, name);
  } catch (e) {
    console.error("ZIP generation failed:", e);
  }
}

function rotateZip() {
  if (!zip) return;
  let zipToSave = zip;
  let index = zipChunkIndex;
  zipChunkIndex += 1;
  startZip();
  finalizeZip(zipToSave, index);
}

function finalizeZipIfNeeded() {
  if (!zip || zipFrameCount === 0) return;
  let zipToSave = zip;
  let index = zipChunkIndex;
  zip = null;
  zipFrameCount = 0;
  finalizeZip(zipToSave, index);
}

function triggerDownload(blob, filename) {
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// monitor fps

// function displayFPS() {
//   fill(255);
//   textAlign(LEFT);
//   text('FPS: ' + Math.round(frameRate()), 10, 20);
//   text('Canvas: ' + width + 'x' + height, 10, 40);
//   text('FBO: ' + smallFBO.width + 'x' + smallFBO.height, 10, 60);
// }
