import { setupGround, updateGround } from './ground.js';
import { getDinoRect, setDinoLose, setupDino, updateDino } from './dino.js';
import { getCactusRects, setupCactus, updateCactus } from './cactus.js';

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
    return getCactusRects().some(rect => isCollision(rect, dinoRect));
}

function isCollision(rect1, rect2) {
    return rect1.left < rect2.right &&
        rect1.top < rect2.bottom &&
        rect1.right > rect2.left &&
        rect1.bottom > rect2.top;
}

function updateSpeedScale(delta) {
    speedScale += delta * SPEED_SCALE_INCREASE;
}

function updateScore(delta) {
    score += delta * 0.01;

    if (Number.parseInt(score) % 100 == 0 && Number.parseInt(score) != 0) {
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
    if (Number.parseInt(score) % 200 == 0 && Number.parseInt(score) !== prev_score && Number.parseInt(score) > 0) {
        toggleBackground();
        console.log(score);
        prev_score = Number.parseInt(score);
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
