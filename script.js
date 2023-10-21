import { setupGround, updateGround } from './ground.js';
import { getDinoRect, getDinoImage, setDinoLose, setupDino, updateDino } from './dino.js';
import { getCactusRect, getCactuses, setupCactus, updateCactus } from './cactus.js';

const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 30;
const SPEED_SCALE_INCREASE = 0.00001;
const checkpoint_sound = new Audio('assets/checkpoint.mp3');
const die_sound = new Audio('assets/die.mp3');

const worldElem = document.querySelector('[data-world]')
const scoreElem = document.querySelector('[data-score]')
const startScreenElem = document.querySelector('[data-start-screen]')
const highScoreElem = document.querySelector('[data-high-score]')

let lastTime;
let speedScale;
let highScore;
let score;
let prev_score;

setPixelToWorldScale();
updateHighScore();

window.addEventListener('resize', setPixelToWorldScale)
document.addEventListener('keydown', handleStart, { once: true })

function setPixelToWorldScale() {
    let worldToPixelScale;
    if (window.innerWidth / window.innerHeight < WORLD_WIDTH / WORLD_HEIGHT) {
        worldToPixelScale = window.innerWidth / WORLD_WIDTH;
    } else {
        worldToPixelScale = window.innerHeight / WORLD_HEIGHT;
    }

    worldElem.style.width = `${WORLD_WIDTH * worldToPixelScale}px`;
    worldElem.style.height = `${WORLD_HEIGHT * worldToPixelScale}px`;
}


function update(time) {
    if (lastTime == null) {
        lastTime = time;
        window.requestAnimationFrame(update);
        return;
    }
    const delta = time - lastTime;

    updateGround(delta, speedScale);
    updateDino(delta, speedScale);
    updateCactus(delta, speedScale);
    updateSpeedScale(delta);
    updateScore(delta);
    updateBackground();

    if (checkLose()) {
        die_sound.play();
        return handleLose();
    }

    lastTime = time;

    window.requestAnimationFrame(update);
}

function checkLose() {
    const dinoRect = getDinoRect();
    const cactuses = getCactuses();

    return cactuses.some(cactus => {
        const cactusRect = getCactusRect(cactus);
        const collisionRect = getCollisionRect(dinoRect, cactusRect);
        if (collisionRect !== null && checkPixelCollision(collisionRect, dinoRect, cactusRect, cactus)) {
            return true;
        }
    });
}

function getCollisionRect(dinoRect, cactusRect) {

    const collisionRect = {
        left: Math.max(dinoRect.left, cactusRect.left),
        top: Math.max(dinoRect.top, cactusRect.top),
        right: Math.min(dinoRect.right, cactusRect.right),
        bottom: Math.min(dinoRect.bottom, cactusRect.bottom),
    };

    if (collisionRect.left > collisionRect.right || collisionRect.top > collisionRect.bottom) {
        return null;
    }

    return collisionRect;
}

let sharedCanvas = document.createElement('canvas');

function checkPixelCollision(collisionRect, dinoRect, cactusRect, cactusImage) {

    const dinoImage = getDinoImage();

    const width = Math.floor(collisionRect.right - collisionRect.left);
    const height = Math.floor(collisionRect.bottom - collisionRect.top);

    if (width === 0 || height === 0) {
        return false;
    }

    sharedCanvas.width = width;
    sharedCanvas.height = height;
    let sharedContext = sharedCanvas.getContext('2d', { willReadFrequently: true }); 

    // Draw Dino
    sharedContext.clearRect(0, 0, width, height);
    sharedContext.drawImage(dinoImage, collisionRect.left - dinoRect.left, collisionRect.top - dinoRect.top, width, height, 0, 0, width, height);
    let dinoImageData = sharedContext.getImageData(0, 0, width, height).data;

    // Draw Cactus
    sharedContext.clearRect(0, 0, width, height);
    sharedContext.drawImage(cactusImage, collisionRect.left - cactusRect.left, collisionRect.top - cactusRect.top, width, height, 0, 0, width, height);
    let cactusImageData = sharedContext.getImageData(0, 0, width, height).data;

    for (let i = 0; i < width * height; i += 4) {
        if (dinoImageData[i + 3] !== 0 && cactusImageData[i + 3] !== 0) {
            return true;
        }
    }

    return false;
}

function updateSpeedScale(delta) {
    speedScale += delta * SPEED_SCALE_INCREASE;
}

function updateScore(delta) {
    score += delta * 0.01;

    if (Math.floor(score) % 100 == 0 && Math.floor(score) != 0) {
        checkpoint_sound.play();
    }

    scoreElem.textContent = Math.floor(score);
}

function updateHighScore() {
    if (highScore === undefined) {
        highScore = parseInt(localStorage.getItem('highScore'), 10) || 0;
    }

    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('highScore', highScore);
    }

    if (highScore > 0) {
        highScoreElem.textContent = 'HI:' + highScore;
    }
}

function toggleBackground() {
    if (document.body.classList.contains("dark")) {
        document.body.classList.remove("dark");
    } else {
        document.body.classList.add("dark");
    }
}

function updateBackground() {
    if (Math.floor(score) % 200 == 0 && Math.floor(score) !== prev_score && Math.floor(score) > 0) {
        toggleBackground();
        prev_score = Math.floor(score);
    }
}

function handleStart() {
    lastTime = null;
    speedScale = 1;
    score = 0;
    setupGround();
    setupDino();
    setupCactus();
    startScreenElem.classList.add('hide');
    window.requestAnimationFrame(update);
}

function handleLose() {
    setDinoLose();
    updateHighScore();
    setTimeout(() => {
        document.addEventListener('keydown', handleStart, { once: true });
        startScreenElem.classList.remove('hide');
        document.body.classList.remove('dark');
    }, 100);
}
