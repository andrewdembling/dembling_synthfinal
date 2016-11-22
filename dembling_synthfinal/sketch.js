var img;
var capture;

var osc;
var osc2;
var playing = false;
var f;
var g;
var s;

var inc = 0.01;

var fft;
var mic;

function setup() {
  canvas = createCanvas(640, 480);
  capture = createCapture(VIDEO);
  capture.size(320, 240);

  osc = new p5.Oscillator();
  osc.setType('sine');
  osc.amp(0);
  osc.start();
  osc.disconnect();

  osc2 = new p5.Oscillator();
  osc2.setType('saw');
  osc2.amp(0);
  osc2.start();
  osc2.disconnect();

  distortion = new p5.Distortion(s, '2x');
  osc.connect(distortion);
  osc2.connect(distortion);

  mic = new p5.AudioIn();
  mic.start();

  fft = new p5.FFT();
  fft.setInput(osc);
}

function preload() {
  drum = loadSound('libraries/drum.mp3');
}

function draw() {
  background(255)
  micLevel = mic.getLevel();
  img = createImage(640, 480);
  img.loadPixels();
  capture.loadPixels();

  var yoff = 0;
  for (var y = 0; y < capture.height; y++) {
    var xoff = 0;
    for (var x = 0; x < capture.width; x++) {
      var i = (x + y * capture.width) * 4;
      var n = noise(xoff, yoff) * 255;

      var r = capture.pixels[i];
      var g = capture.pixels[i + 1];
      var b = capture.pixels[i + 2];
      var a = capture.pixels[i + 3];

      img.pixels[i] = (g - (mouseY / 10) + n) / 2;
      img.pixels[i + 1] = (r - (mouseX / 10) + n) / 2;
      img.pixels[i + 2] = (b + n) / 2;
      img.pixels[i + 3] = a;
      xoff += inc;
    }
    yoff += inc;
  }
  inc = map(mouseX, 0, width, 0, 0.15) * micLevel;
  noiseDetail(8, 0.5);

  img.updatePixels();
  image(img, 0, 0);

  osc.freq(map(f, 0, 10000, 0, 1200));
  f = (mouseX - mouseY) * (r + g + b) / (pow(2, (50000 * micLevel)));
  osc2.freq(g);
  g = ((mouseY - mouseX) * (r + g + b) * n) - (5000 * micLevel);
  s = (map(f, 0, 1200, 0, 1));

  var drumPat = [r / 100, g / 100, b / 100, n / 100, noise(mouseX / 100), micLevel / 5000, mouseY / 100]
  var drumPhrase = new p5.Phrase('drum', playDrum, drumPat);
  myPart = new p5.Part();
  myPart.addPhrase(drumPhrase);
  myPart.setBPM(n * 1.1);

  blendMode(DIFFERENCE);
  copy(img, mouseX, mouseY, width - mouseX, height - mouseY, mouseX, mouseY, width, height);
  copy(img, mouseX, mouseY, width - mouseX, height - mouseY, mouseX, mouseY, 0 - width, 0 - height);

  var waveform = fft.waveform();
  noFill();
  beginShape();
  stroke(255, 0, 0);
  strokeWeight(1);
  for (var i = 0; i < waveform.length; i++) {
    var x = map(i, 0, waveform.length, 0, width);
    var y = map(waveform[i], -1, 1, 0, height);
    vertex(x, y);
    //g=lerp(waveform[i],waveform[i+1],0.1)*n/micLevel;
  }
  endShape();
}

function playDrum(time, playbackRate) {
  drum.rate(playbackRate);
  drum.play(time);
}

function mouseClicked() {
  if (!playing) {
    osc.amp(0.5, 0.05);
    osc2.amp(0.4, 0.05);
    myPart.start();
    myPart.loop();
    playing = true;
  } else {
    osc.amp(0, 0.5);
    osc2.amp(0, 0.05);
    myPart.noLoop();
    myPart.stop();
    playing = false;
  }
}