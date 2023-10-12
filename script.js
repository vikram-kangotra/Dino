import { setupGround, updateGround } from './ground.js';
import { getDinoRect, setDinoLose, setupDino, updateDino } from './dino.js';
import { getCactusRects, setupCactus, updateCactus } from './cactus.js';

const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 30;
const SPEED_SCALE_INCREASE = 0.00001;

const worldElem = document.querySelector('[data-world]');
const scoreElem = document.querySelector('[data-score]');
const startScreenElem = document.querySelector('[data-start-screen]');
const highScoreElem = document.querySelector('[data-high-score]');

let lastTime;
let speedScale;
let highScore;
let score;

setPixelToWorldScale();
updateHighScore();

function darkMode() {
    let element = document.body;
    element.classList.toggle("dark-mode");
}

setPixelToWorldScale();

window.addEventListener('resize', setPixelToWorldScale);
document.addEventListener('keydown', handleStart, { once: true });

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

    if (checkLose()) {
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
    scoreElem.textContent = Math.floor(score);

    if (Math.floor(score) % 200 === 0) {
        if (Math.floor(score / 200) % 2 === 0) {
            document.body.classList.remove('dark-mode');
        } else {
            document.body.classList.add('dark-mode');
        }
    }
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
    }, 100);
}
