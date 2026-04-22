window.onload = function() {

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ================= POSISI REL =================
const XRAY_Y = 200;
const XRAY_X_MIN = canvas.width * 0.35;
const XRAY_X_MAX = canvas.width * 0.65;

// ================= BACKGROUND =================
const bgImage = new Image();
let bgLoaded = false;
bgImage.onload = () => bgLoaded = true;
bgImage.src = "images/bg.png";

// ================= STORY & INSTRUCTION =================
const storyImage = new Image();
storyImage.src = "images/story.png";

const instructionImage = new Image();
instructionImage.src = "images/instruction.png";

// ================= DATA =================
let objects = [];
let score = 0;
let lives = 5;
let highScore = localStorage.getItem("highScore") || 0;

let gameState = "menu";
let speed = 0.7;
let level = 1;

// ================= UI =================
function updateUI() {
  document.getElementById("score").innerText = score;
  document.getElementById("high").innerText = highScore;
  document.getElementById("level").innerText = level;
  document.getElementById("lives").innerText = lives;
}

// ================= GAMBAR =================
const itemFiles = ["koper.png","tas.png","tiket.png","paspor.png","kacamata.png","laptop.png"];
const bombFiles = ["bom.png","pisau.png","granat.png","gunting.png","bahan_kimia.png"];

const itemImages = [];
const bombImages = [];

itemFiles.forEach(name => {
  let img = new Image();
  img.src = "images/items/" + name;
  img.onerror = () => console.log("Gagal load:", img.src);
  itemImages.push(img);
});

bombFiles.forEach(name => {
  let img = new Image();
  img.src = "images/bombs/" + name;
  img.onerror = () => console.log("Gagal load:", img.src);
  bombImages.push(img);
});

// ================= SOUND =================
const clickSound = new Audio("click.mp3");
const boomSound = new Audio("boom.mp3");

// ================= SPAWN =================
let spawnTimer = 0;

function spawnObject() {
  let bombChance = Math.min(0.18 + level * 0.004, 0.4);
  let isBomb = Math.random() < bombChance;

  let img = isBomb
    ? bombImages[Math.floor(Math.random() * bombImages.length)]
    : itemImages[Math.floor(Math.random() * itemImages.length)];

  objects.push({
    x: XRAY_X_MIN + Math.random() * (XRAY_X_MAX - XRAY_X_MIN),
    y: XRAY_Y,
    baseSize: 60,
    type: isBomb ? "bomb" : "item",
    img: img,
    alpha: 0,
    scale: 0.3,
    phase: Math.random() * Math.PI * 2,
    hitScale: 1 
  });
}

// ================= INPUT =================
canvas.addEventListener("click", function(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  handleClick(x, y);
});

function handleClick(x, y) {
  if (gameState === "menu") {
    gameState = "story";
    return;
  }

  if (gameState === "story") {
    gameState = "instruction"; 
    return;
  }

  if (gameState === "instruction") {
    startPlaying();
    return;
  }

  // MODIFIKASI: Saat Game Over, balik ke Story
  if (gameState === "gameover") {
    gameState = "story";
    return;
  }

  for (let i = objects.length - 1; i >= 0; i--) {
    let obj = objects[i];
    let size = obj.baseSize * obj.scale;

    if (
      x >= obj.x - size/2 &&
      x <= obj.x + size/2 &&
      y >= obj.y - size/2 &&
      y <= obj.y + size/2
    ) {
      if (obj.type === "bomb") {
        boomSound.play();
        lives--;
      } else {
        clickSound.play();
        score++;
        obj.hitScale = 1.3;
      }
      objects.splice(i, 1);
      return;
    }
  }
}

// ================= GAME =================
function startPlaying() {
  objects = [];
  score = 0;
  lives = 5;
  gameState = "playing";
}

function endGame() {
  gameState = "gameover";
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
}

// ================= TEXT =================
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// ================= LOOP =================
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateUI();

  level = Math.floor(score / 15) + 1;
  speed = 0.7 + (1 - Math.exp(-level * 0.05)) * 1.5;

  spawnTimer++;
  let spawnDelay = Math.max(110 - level * 1.5, 45);

  if (spawnTimer >= spawnDelay) {
    spawnObject();
    spawnTimer = 0;
  }

  // ===== MENU =====
  if (gameState === "menu") {
    ctx.fillStyle = "#eee";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.font = "24px Arial";
    ctx.fillText("Klik untuk mulai", 90, 300);
  }

  // ===== STORY =====
  if (gameState === "story") {
    if (storyImage.complete && storyImage.naturalWidth !== 0) {
      ctx.drawImage(storyImage, 0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(30, canvas.height/2 - 60, 340, 120);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "14px Arial";
    wrapText(ctx, "Halo saya Syahqilla Avsec Bandara Wahai. Bantu aku mengumpulkan barang berbahaya yuk!", canvas.width/2, canvas.height/2 - 10, 300, 18);
    ctx.fillText("Klik untuk lanjut", canvas.width/2, canvas.height/2 + 40);
    ctx.textAlign = "left";
  }

  // ===== INSTRUCTION =====
  if (gameState === "instruction") {
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (instructionImage.complete && instructionImage.naturalWidth !== 0) {
      ctx.drawImage(instructionImage, 40, 140, 320, 200);
    }

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(20, 20, 360, 80);
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.font = "bold 14px Arial";
    wrapText(ctx, "AMBIL barang berbahaya seperti di bawah ini. JANGAN ambil barang milik penumpang atau nyawamu berkurang!", canvas.width/2, 45, 330, 18);
    
    ctx.fillStyle = "white";
    ctx.fillText("Klik untuk Mulai Bermain", canvas.width/2, 370);
    ctx.textAlign = "left";
  }

  // ===== PLAYING =====
  if (gameState === "playing") {
    if (bgLoaded) {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }

    for (let i = objects.length - 1; i >= 0; i--) {
      let obj = objects[i];
      obj.y += speed;

      let progress = (obj.y - XRAY_Y) / (canvas.height - XRAY_Y);
      progress = Math.max(0, Math.min(1, progress));

      obj.scale = 0.3 + progress * 1.2;
      let drawSize = obj.baseSize * obj.scale;
      obj.phase += 0.05;
      let sway = Math.sin(obj.phase) * 25;
      let drawX = obj.x + sway;

      let minX = XRAY_X_MIN - progress * 50;
      let maxX = XRAY_X_MAX + progress * 50;
      drawX = Math.max(minX + drawSize/2, Math.min(maxX - drawSize/2, drawX));

      if (obj.alpha < 1) obj.alpha += 0.05;

      if (obj.img.complete && obj.img.naturalWidth !== 0) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 8;
        ctx.globalAlpha = obj.alpha;
        ctx.drawImage(obj.img, drawX - drawSize / 2, obj.y - drawSize / 2, drawSize, drawSize);
        ctx.restore();
      }

      if (obj.y > canvas.height) {
        if (obj.type === "item") lives--;
        objects.splice(i, 1);
      }
    }
    if (lives <= 0) endGame();
  }

  // ===== GAME OVER =====
  if (gameState === "gameover") {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "28px Arial";
    ctx.fillText("GAME OVER", canvas.width/2, 280);
    ctx.font = "18px Arial";
    ctx.fillText("Klik untuk ulang", canvas.width/2, 320);
    ctx.textAlign = "left";
  }

  requestAnimationFrame(update);
}

update();

};