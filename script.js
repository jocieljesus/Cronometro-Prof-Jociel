// Elementos do DOM
const display = document.getElementById("display");
const progressBar = document.getElementById("progressBar");
const statusMessage = document.getElementById("statusMessage");
const activityTitle = document.getElementById("activityTitle");

const btnModeTimer = document.getElementById("btnModeTimer");
const btnModeStopwatch = document.getElementById("btnModeStopwatch");
const btnStartPause = document.getElementById("btnStartPause");
const btnReset = document.getElementById("btnReset");
const btnAdd1 = document.getElementById("btnAdd1");
const btnAdd5 = document.getElementById("btnAdd5");
const btnSound = document.getElementById("btnSound");
const btnTheme = document.getElementById("btnTheme");
const btnFocus = document.getElementById("btnFocus");
const btnExitFocus = document.getElementById("btnExitFocus");
const btnFullscreen = document.getElementById("btnFullscreen");

const presetButtons = document.querySelectorAll(".preset-btn");
const customForm = document.getElementById("customForm");
const inputMinutes = document.getElementById("inputMinutes");
const inputSeconds = document.getElementById("inputSeconds");

// Estado da aplicação
let mode = "timer"; // "timer" ou "stopwatch"
let isRunning = false;
let soundEnabled = true;
let intervalId = null;

// Variáveis do Temporizador (em milissegundos)
let totalTimerMs = 15 * 60 * 1000;
let remainingMs = totalTimerMs;
let endTime = 0;

// Variáveis do Cronômetro (em milissegundos)
let elapsedMs = 0;
let startTime = 0;

// Formata segundos para MM:SS ou HH:MM:SS
function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n) => String(n).padStart(2, "0");

  if (hours > 0) {
    display.classList.add("has-hours");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  display.classList.remove("has-hours");
  return `${pad(minutes)}:${pad(seconds)}`;
}

// Atualiza visor, título da aba, barra de progresso e cores de alerta
function updateUI() {
  display.classList.remove("warning", "danger");

  if (mode === "timer") {
    const secondsLeft = Math.ceil(remainingMs / 1000);
    const formatted = formatTime(secondsLeft);
    display.textContent = formatted;
    document.title = `${formatted} - Temporizador`;

    const percent = totalTimerMs > 0 ? (remainingMs / totalTimerMs) * 100 : 0;
    progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;

    if (remainingMs <= 0) {
      display.classList.add("danger");
      progressBar.style.backgroundColor = "var(--danger)";
      statusMessage.textContent = "TEMPO ESGOTADO!";
    } else if (secondsLeft <= 10) {
      display.classList.add("danger");
      progressBar.style.backgroundColor = "var(--danger)";
      statusMessage.textContent = "";
    } else if (secondsLeft <= 60) {
      display.classList.add("warning");
      progressBar.style.backgroundColor = "var(--warning)";
      statusMessage.textContent = "";
    } else {
      progressBar.style.backgroundColor = "var(--progress)";
      statusMessage.textContent = "";
    }
  } else {
    const secondsElapsed = Math.floor(elapsedMs / 1000);
    const formatted = formatTime(secondsElapsed);
    display.textContent = formatted;
    document.title = `${formatted} - Cronômetro`;
    statusMessage.textContent = "";
  }

  btnStartPause.textContent = isRunning ? "Pausar" : "Iniciar";
}

// Alerta sonoro gerado via Web Audio API (sem arquivo externo)
function playAlarm() {
  if (!soundEnabled) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const beeps = [0, 0.35, 0.7];

  beeps.forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime + delay);

    gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + delay + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.3);
  });
}

// Loop de atualização usando relógio real (evita atraso em abas em segundo plano)
function tick() {
  if (mode === "timer") {
    remainingMs = Math.max(0, endTime - Date.now());
    updateUI();

    if (remainingMs <= 0) {
      stopRunning();
      playAlarm();
    }
  } else {
    elapsedMs = Date.now() - startTime;
    updateUI();
  }
}

function startRunning() {
  if (isRunning) return;

  if (mode === "timer") {
    if (remainingMs <= 0) {
      remainingMs = totalTimerMs;
    }
    endTime = Date.now() + remainingMs;
  } else {
    startTime = Date.now() - elapsedMs;
  }

  isRunning = true;
  intervalId = setInterval(tick, 100);
  updateUI();
}

function stopRunning() {
  isRunning = false;
  clearInterval(intervalId);
  intervalId = null;
  updateUI();
}

function toggleStartPause() {
  if (isRunning) {
    stopRunning();
  } else {
    startRunning();
  }
}

function resetClock() {
  stopRunning();
  if (mode === "timer") {
    remainingMs = totalTimerMs;
  } else {
    elapsedMs = 0;
  }
  updateUI();
}

function setTimerDuration(minutes, seconds = 0) {
  const totalSec = Math.max(1, minutes * 60 + seconds);
  stopRunning();
  totalTimerMs = totalSec * 1000;
  remainingMs = totalTimerMs;

  inputMinutes.value = Math.floor(totalSec / 60);
  inputSeconds.value = totalSec % 60;
  updateUI();
}

function addMinutes(minutes) {
  if (mode !== "timer") return;
  const extraMs = minutes * 60 * 1000;
  totalTimerMs += extraMs;
  remainingMs += extraMs;

  if (isRunning) {
    endTime += extraMs;
  }
  updateUI();
}

function switchMode(newMode) {
  if (mode === newMode) return;
  stopRunning();
  mode = newMode;

  btnModeTimer.classList.toggle("active", mode === "timer");
  btnModeStopwatch.classList.toggle("active", mode === "stopwatch");
  document.body.classList.toggle("stopwatch-mode", mode === "stopwatch");

  updateUI();
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light");
  btnTheme.textContent = isLight ? "Tema Escuro" : "Tema Claro";
}

function toggleFocusMode() {
  document.body.classList.toggle("focus-mode");
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  btnSound.textContent = soundEnabled ? "Som: ON" : "Som: OFF";
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// Eventos dos botões
btnModeTimer.addEventListener("click", () => switchMode("timer"));
btnModeStopwatch.addEventListener("click", () => switchMode("stopwatch"));
btnStartPause.addEventListener("click", toggleStartPause);
btnReset.addEventListener("click", resetClock);
btnAdd1.addEventListener("click", () => addMinutes(1));
btnAdd5.addEventListener("click", () => addMinutes(5));
btnSound.addEventListener("click", toggleSound);
btnTheme.addEventListener("click", toggleTheme);
btnFocus.addEventListener("click", toggleFocusMode);
btnExitFocus.addEventListener("click", toggleFocusMode);
btnFullscreen.addEventListener("click", toggleFullscreen);

// Presets rápidos
presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    presetButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const mins = Number(btn.dataset.minutes);
    setTimerDuration(mins, 0);
  });
});

// Formulário de tempo personalizado
customForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const mins = Math.max(0, Number(inputMinutes.value) || 0);
  const secs = Math.max(0, Math.min(59, Number(inputSeconds.value) || 0));

  if (mins === 0 && secs === 0) return;

  presetButtons.forEach((b) => b.classList.remove("active"));
  setTimerDuration(mins, secs);
});

// Evita quebra de linha ao apertar Enter no título editável
activityTitle.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    activityTitle.blur();
  }
});

// Atalhos de teclado (ignorados enquanto digita no título ou inputs)
document.addEventListener("keydown", (event) => {
  const tag = event.target.tagName;
  if (tag === "INPUT" || event.target.isContentEditable) return;

  if (event.code === "Space") {
    event.preventDefault();
    toggleStartPause();
  } else if (event.key.toLowerCase() === "r") {
    resetClock();
  } else if (event.key.toLowerCase() === "h") {
    toggleFocusMode();
  } else if (event.key.toLowerCase() === "f") {
    toggleFullscreen();
  } else if (event.key.toLowerCase() === "m") {
    toggleSound();
  }
});

// Inicialização
updateUI();