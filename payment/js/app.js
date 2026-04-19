import {
  SAMPLE_CARDS,
  digitsOnly,
  formatCardNumber,
  maskCardVisual,
  detectCardFamily,
  validateByNetworkRules,
  getBadgeClass,
  getCardLogoMarkup
} from "./cardRules.js";
import { runLuhnDetailed } from "./luhn.js";
import { renderDfaGraph, simulatePrefixDfa, applyDfaHighlight } from "./dfa.js";

const STORAGE_THEME_KEY = "spcv-theme";
const DEFAULT_CARD_HOLDER = "BRUCE WAYNE";
const ACCEPT_STATES = new Set(["q4", "qM", "qM2", "qA", "qR"]);

const elements = {
  input: document.getElementById("cardNumberInput"),
  clearButton: document.getElementById("clearButton"),
  flipButton: document.getElementById("flipButton"),
  themeToggle: document.getElementById("themeToggle"),
  paymentCard: document.getElementById("paymentCard"),
  cardBadge: document.getElementById("cardBadge"),
  cardNumberVisual: document.getElementById("cardNumberVisual"),
  cardTypeOutput: document.getElementById("cardTypeOutput"),
  prefixOutput: document.getElementById("prefixOutput"),
  lengthOutput: document.getElementById("lengthOutput"),
  luhnOutput: document.getElementById("luhnOutput"),
  overallStatus: document.getElementById("overallStatus"),
  traceList: document.getElementById("traceList"),
  luhnSteps: document.getElementById("luhnSteps"),
  resultPanel: document.getElementById("resultPanel"),
  sampleList: document.getElementById("sampleList"),
  dfaSvg: document.getElementById("dfaSvg"),
  dfaNote: document.getElementById("dfaNote"),
  dfaInputTrack: document.getElementById("dfaInputTrack"),
  dfaPlaybackStatus: document.getElementById("dfaPlaybackStatus"),
  dfaPrevButton: document.getElementById("dfaPrevButton"),
  dfaPlayButton: document.getElementById("dfaPlayButton"),
  dfaPauseButton: document.getElementById("dfaPauseButton"),
  dfaNextButton: document.getElementById("dfaNextButton"),
  dfaResetButton: document.getElementById("dfaResetButton"),
  dfaSpeedInput: document.getElementById("dfaSpeedInput"),
  holderNameVisual: document.getElementById("holderNameVisual"),
  signatureNameVisual: document.getElementById("signatureNameVisual")
};

const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const tabContents = Array.from(document.querySelectorAll(".tab-content"));

const playbackState = {
  digits: "",
  simulation: simulatePrefixDfa(""),
  currentStep: 0,
  timerId: null,
  speed: Number(elements.dfaSpeedInput?.value || 900)
};

applyStoredTheme();
renderDfaGraph(elements.dfaSvg);
renderSamples();
attachEvents();
updateApp("");

function attachEvents() {
  elements.input.addEventListener("input", () => {
    const formatted = formatCardNumber(elements.input.value);
    elements.input.value = formatted;
    updateApp(formatted);
  });

  elements.clearButton.addEventListener("click", () => {
    elements.input.value = "";
    updateApp("");
    elements.input.focus();
  });

  elements.flipButton.addEventListener("click", () => {
    elements.paymentCard.classList.toggle("flipped");
  });

  elements.themeToggle?.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
  });

  elements.dfaPrevButton?.addEventListener("click", () => {
    stopPlayback();
    setPlaybackStep(playbackState.currentStep - 1);
  });

  elements.dfaNextButton?.addEventListener("click", () => {
    stopPlayback();
    setPlaybackStep(playbackState.currentStep + 1);
  });

  elements.dfaResetButton?.addEventListener("click", () => {
    stopPlayback();
    setPlaybackStep(0);
  });

  elements.dfaPauseButton?.addEventListener("click", () => {
    stopPlayback();
    updatePlaybackControls();
  });

  elements.dfaPlayButton?.addEventListener("click", () => {
    startPlayback();
  });

  elements.dfaSpeedInput?.addEventListener("input", () => {
    playbackState.speed = Number(elements.dfaSpeedInput.value);
    if (playbackState.timerId) {
      startPlayback();
    }
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((item) => item.classList.remove("active"));
      tabContents.forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      const target = document.getElementById(`${button.dataset.tab}Tab`);
      target?.classList.add("active");
    });
  });
}

function applyStoredTheme() {
  const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
  setTheme(savedTheme === "light" ? "light" : "dark", { persist: false });
}

function setTheme(theme, options = { persist: true }) {
  document.documentElement.dataset.theme = theme;
  if (elements.themeToggle) {
    elements.themeToggle.textContent = theme === "light" ? "Dark Mode" : "Light Mode";
  }
  if (options.persist) {
    localStorage.setItem(STORAGE_THEME_KEY, theme);
  }
}

function renderSamples() {
  elements.sampleList.innerHTML = "";

  SAMPLE_CARDS.forEach((sample) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sample-btn";
    button.innerHTML = `
      <span>
        <strong>${sample.label}</strong>
        <small>${sample.type}</small>
      </span>
      <span class="sample-number">${formatCardNumber(sample.number)}</span>
    `;
    button.addEventListener("click", () => {
      const formatted = formatCardNumber(sample.number);
      elements.input.value = formatted;
      updateApp(formatted);
    });
    elements.sampleList.appendChild(button);
  });
}

function updateApp(rawValue) {
  const digits = digitsOnly(rawValue);
  const family = detectCardFamily(digits);
  const networkValidation = validateByNetworkRules(digits);
  const luhn = runLuhnDetailed(digits);
  const dfa = simulatePrefixDfa(digits);

  updateVisualCard(digits, family, networkValidation, luhn, dfa);
  updateSummary(digits, family, networkValidation, luhn, dfa);
  updateTrace(dfa);
  updateLuhnPanel(digits, luhn);
  updateResultPanel(digits, family, networkValidation, luhn, dfa);
  setPlaybackSource(digits, dfa);
}

function updateVisualCard(digits, family, networkValidation, luhn, dfa) {
  const showLogo = shouldDisplayLogo(digits, family, networkValidation, luhn, dfa);
  const typeForLogo = networkValidation.isKnown && !dfa.rejected ? networkValidation.type : family.type;

  elements.cardNumberVisual.textContent = maskCardVisual(digits);
  elements.cardBadge.innerHTML = showLogo ? getCardLogoMarkup(typeForLogo) : "";
  elements.cardBadge.className = `network-badge ${showLogo ? getBadgeClass(typeForLogo) : "badge-hidden"}`;
  elements.cardBadge.classList.toggle("is-hidden", !showLogo);
  elements.holderNameVisual.textContent = DEFAULT_CARD_HOLDER;
  elements.signatureNameVisual.textContent = DEFAULT_CARD_HOLDER;
}

function shouldDisplayLogo(digits, family, networkValidation, luhn, dfa) {
  if (!digits.length) return false;
  if (dfa.rejected) return false;
  if (family.type === "Unknown") return false;

  const lengths = networkValidation.lengths || [];
  const maxLength = lengths.length ? Math.max(...lengths) : Infinity;
  const exactSupportedLength = lengths.includes(digits.length);

  if (digits.length > maxLength) return false;
  if (exactSupportedLength && (!networkValidation.isPatternValid || (luhn.canRun && !luhn.isValid))) return false;

  return true;
}

function updateSummary(digits, family, networkValidation, luhn, dfa) {
  const effectiveType = networkValidation.isKnown && networkValidation.isPatternValid ? networkValidation.type : family.type;
  const statusText = buildOverallStatus(effectiveType, networkValidation, luhn, dfa, digits.length);

  elements.cardTypeOutput.textContent = effectiveType;
  elements.prefixOutput.textContent = dfa.prefixAccepted ? "Accepted" : dfa.rejected ? "Rejected" : "In progress";
  elements.lengthOutput.textContent = `${digits.length} digit${digits.length === 1 ? "" : "s"}`;
  elements.luhnOutput.textContent = digits.length ? (luhn.isValid ? "Valid" : "Invalid") : "Not run";
  elements.overallStatus.textContent = statusText;
}

function buildOverallStatus(type, networkValidation, luhn, dfa, length) {
  if (!length) return "Awaiting input";
  if (dfa.rejected) return "Rejected by prefix simulator";
  if (!networkValidation.isKnown) return "Unknown network family";
  if (!networkValidation.isLengthValid) return `Prefix matches ${type}, but length is not valid yet`;
  if (!luhn.canRun) return "Waiting for checksum";
  if (networkValidation.isPatternValid && luhn.isValid) return `${type} detected — fully valid`;
  if (networkValidation.isPatternValid && !luhn.isValid) return `${type} detected — checksum failed`;
  return `${type} family detected — still incomplete`;
}

function updateTrace(dfa) {
  elements.traceList.innerHTML = "";

  if (!dfa.transitions.length) {
    elements.traceList.className = "trace-list empty-state-box";
    elements.traceList.textContent = "No transitions yet.";
    return;
  }

  elements.traceList.className = "trace-list";
  dfa.transitions.forEach((step, index) => {
    const item = document.createElement("div");
    const typeClass = step.status === "accept" ? "success" : step.status === "reject" ? "error" : "warning";
    item.className = `trace-item ${typeClass}`;
    item.innerHTML = `
      <strong>Step ${index + 1}: digit ${step.digit}</strong>
      <div class="trace-meta">${step.from} → ${step.to}</div>
      <div>${step.reason}</div>
    `;
    elements.traceList.appendChild(item);
  });
}

function updateLuhnPanel(digits, luhn) {
  elements.luhnSteps.innerHTML = "";

  if (!digits.length) {
    elements.luhnSteps.className = "luhn-steps empty-state-box";
    elements.luhnSteps.textContent = "Enter a full card number to see the step-by-step checksum.";
    return;
  }

  elements.luhnSteps.className = "luhn-steps";

  const intro = document.createElement("div");
  intro.className = "luhn-step";
  intro.innerHTML = `
    <strong>Step 1 — Reverse the digits</strong>
    <div class="digit-row">${luhn.reversed.map((digit) => `<span class="digit-pill">${digit}</span>`).join("")}</div>
  `;
  elements.luhnSteps.appendChild(intro);

  const doubleStep = document.createElement("div");
  doubleStep.className = "luhn-step";
  doubleStep.innerHTML = `
    <strong>Step 2 — Double every second digit from the right</strong>
    <div class="digit-row">
      ${luhn.processed
        .map((item) => `<span class="digit-pill ${item.shouldDouble ? "highlight" : ""}">${item.original}${item.shouldDouble ? ` → ${item.doubled}` : ""}</span>`)
        .join("")}
    </div>
  `;
  elements.luhnSteps.appendChild(doubleStep);

  const normalizeStep = document.createElement("div");
  normalizeStep.className = "luhn-step";
  normalizeStep.innerHTML = `
    <strong>Step 3 — Subtract 9 when a doubled value is greater than 9</strong>
    <div class="digit-row">
      ${luhn.processed
        .map((item) => {
          const changed = item.shouldDouble && item.doubled !== item.normalized;
          return `<span class="digit-pill ${changed ? "transformed" : ""}">${item.normalized}</span>`;
        })
        .join("")}
    </div>
  `;
  elements.luhnSteps.appendChild(normalizeStep);

  const sumStep = document.createElement("div");
  sumStep.className = "luhn-step";
  sumStep.innerHTML = `
    <strong>Step 4 — Sum the normalized digits</strong>
    <div>${luhn.processed.map((item) => item.normalized).join(" + ")} = <strong>${luhn.sum}</strong></div>
  `;
  elements.luhnSteps.appendChild(sumStep);

  const verdict = document.createElement("div");
  verdict.className = "luhn-step";
  verdict.innerHTML = `
    <strong>Step 5 — Check divisibility by 10</strong>
    <div>${luhn.message}</div>
  `;
  elements.luhnSteps.appendChild(verdict);
}

function updateResultPanel(digits, family, networkValidation, luhn, dfa) {
  elements.resultPanel.innerHTML = "";

  if (!digits.length) {
    elements.resultPanel.className = "result-panel empty-state-box";
    elements.resultPanel.textContent = "Your final validation summary will appear here.";
    return;
  }

  const effectiveType = networkValidation.isKnown && networkValidation.isPatternValid ? networkValidation.type : family.type;
  const fullyValid = networkValidation.isKnown && networkValidation.isPatternValid && luhn.isValid;

  elements.resultPanel.className = "result-panel";
  const grid = document.createElement("div");
  grid.className = "result-grid";

  const networkCard = document.createElement("div");
  networkCard.className = `result-card ${networkValidation.isKnown ? "valid" : "invalid"}`;
  networkCard.innerHTML = `
    <strong>Network detection</strong>
    <div>${family.message}</div>
    <div class="result-small">Detected family: ${effectiveType}</div>
  `;
  grid.appendChild(networkCard);

  const lengthCard = document.createElement("div");
  lengthCard.className = `result-card ${networkValidation.isLengthValid ? "valid" : "invalid"}`;
  const expected = networkValidation.lengths.length ? networkValidation.lengths.join(", ") : "no supported lengths";
  lengthCard.innerHTML = `
    <strong>Length check</strong>
    <div>${networkValidation.isLengthValid ? `Length ${digits.length} is valid for ${effectiveType}.` : `Length ${digits.length} is not valid yet for ${effectiveType}.`}</div>
    <div class="result-small">Expected lengths: ${expected}</div>
  `;
  grid.appendChild(lengthCard);

  const dfaCard = document.createElement("div");
  dfaCard.className = `result-card ${dfa.rejected ? "invalid" : "valid"}`;
  dfaCard.innerHTML = `
    <strong>DFA prefix result</strong>
    <div>${dfa.summary}</div>
    <div class="result-small">Final state: ${dfa.finalState}</div>
  `;
  grid.appendChild(dfaCard);

  const checksumCard = document.createElement("div");
  checksumCard.className = `result-card ${luhn.isValid ? "valid" : "invalid"}`;
  checksumCard.innerHTML = `
    <strong>Luhn checksum</strong>
    <div>${luhn.message}</div>
    <div class="result-small">Computed sum: ${luhn.sum}</div>
  `;
  grid.appendChild(checksumCard);

  const finalCard = document.createElement("div");
  finalCard.className = `result-card ${fullyValid ? "valid" : "invalid"}`;
  finalCard.innerHTML = `
    <strong>Final verdict</strong>
    <div>${buildFinalVerdict(effectiveType, networkValidation, luhn, dfa)}</div>
    <div class="result-badge ${fullyValid ? "valid" : "invalid"}">${fullyValid ? "VALID CARD NUMBER" : "INVALID OR INCOMPLETE NUMBER"}</div>
  `;
  grid.appendChild(finalCard);

  elements.resultPanel.appendChild(grid);
}

function buildFinalVerdict(type, networkValidation, luhn, dfa) {
  if (dfa.rejected) {
    return "The prefix was rejected by the DFA simulation, so the number does not belong to one of the supported demo card families.";
  }

  if (!networkValidation.isKnown) {
    return "The number does not match any supported demo network pattern yet.";
  }

  if (!networkValidation.isLengthValid) {
    return `${type} was tentatively detected, but the number length is not complete for that network.`;
  }

  if (!networkValidation.isPatternValid) {
    return `${type} family was detected, but the full number still does not satisfy the supported regex pattern.`;
  }

  if (!luhn.isValid) {
    return `${type} format looks correct, but the Luhn checksum fails, so the card number is invalid.`;
  }

  return `${type} matches the supported pattern, has a valid length, and passes the Luhn checksum.`;
}

function setPlaybackSource(digits, simulation) {
  stopPlayback();
  playbackState.digits = digits;
  playbackState.simulation = simulation;
  playbackState.currentStep = 0;
  renderPlayback();
}

function startPlayback() {
  const totalSteps = playbackState.simulation.transitions.length;
  if (!totalSteps) {
    renderPlayback();
    return;
  }

  if (playbackState.currentStep >= totalSteps) {
    playbackState.currentStep = 0;
  }

  stopPlayback();
  playbackState.timerId = window.setInterval(() => {
    if (playbackState.currentStep >= totalSteps) {
      stopPlayback();
      updatePlaybackControls();
      return;
    }

    playbackState.currentStep += 1;
    renderPlayback();

    if (playbackState.currentStep >= totalSteps) {
      stopPlayback();
      updatePlaybackControls();
    }
  }, playbackState.speed);

  updatePlaybackControls();
}

function stopPlayback() {
  if (playbackState.timerId) {
    window.clearInterval(playbackState.timerId);
    playbackState.timerId = null;
  }
}

function setPlaybackStep(nextStep) {
  const boundedStep = Math.max(0, Math.min(nextStep, playbackState.simulation.transitions.length));
  playbackState.currentStep = boundedStep;
  renderPlayback();
}

function renderPlayback() {
  const snapshot = buildPlaybackSnapshot(playbackState.simulation, playbackState.currentStep);
  applyDfaHighlight(elements.dfaSvg, snapshot);
  elements.dfaNote.textContent = buildPlaybackNote(snapshot, playbackState.simulation, playbackState.currentStep);
  renderInputTrack(playbackState.digits, playbackState.currentStep, playbackState.simulation.transitions.length);
  updatePlaybackControls();
}

function buildPlaybackSnapshot(simulation, consumedSteps) {
  const transitions = simulation.transitions.slice(0, consumedSteps);
  const visitedNodes = ["q0"];
  const visitedEdges = [];
  let finalState = "q0";

  transitions.forEach((step) => {
    visitedEdges.push(`${step.from}-${step.to}`);
    if (!visitedNodes.includes(step.to)) {
      visitedNodes.push(step.to);
    }
    finalState = step.to;
  });

  const rejected = finalState === "qDead";
  const prefixAccepted = ACCEPT_STATES.has(finalState);
  const inProgress = !prefixAccepted && !rejected;

  return {
    finalState,
    visitedNodes,
    visitedEdges,
    transitions,
    prefixAccepted,
    rejected,
    inProgress,
    summary: consumedSteps === simulation.transitions.length ? simulation.summary : "Prefix is still being processed."
  };
}

function buildPlaybackNote(snapshot, fullSimulation, currentStep) {
  const totalSteps = fullSimulation.transitions.length;

  if (!playbackState.digits.length) {
    return "Start state q0. Enter digits to simulate transitions.";
  }

  if (!totalSteps) {
    return fullSimulation.summary;
  }

  if (currentStep === 0) {
    return `Ready to process ${totalSteps} symbol${totalSteps === 1 ? "" : "s"}. Press Play or Next to feed the prefix into the DFA.`;
  }

  const lastStep = snapshot.transitions[snapshot.transitions.length - 1];
  if (currentStep < totalSteps) {
    return `Step ${currentStep}/${totalSteps}: digit ${lastStep.digit} moved ${lastStep.from} → ${lastStep.to}. ${lastStep.reason}`;
  }

  return `Playback complete. ${fullSimulation.summary}`;
}

function renderInputTrack(digits, consumedSteps, totalDfaSteps) {
  if (!digits.length) {
    elements.dfaInputTrack.className = "dfa-input-track is-empty";
    elements.dfaInputTrack.textContent = "No digits entered yet.";
    elements.dfaPlaybackStatus.textContent = "0 / 0 symbols consumed";
    return;
  }

  elements.dfaInputTrack.className = "dfa-input-track";
  const symbols = digits.split("");
  const currentIndex = consumedSteps < totalDfaSteps ? consumedSteps : -1;

  elements.dfaInputTrack.innerHTML = symbols
    .map((symbol, index) => {
      let stateClass = "idle";
      if (index < consumedSteps) {
        stateClass = "consumed";
      } else if (index === currentIndex) {
        stateClass = "current";
      } else if (index >= totalDfaSteps && totalDfaSteps > 0) {
        stateClass = "not-used";
      }
      return `<span class="dfa-symbol ${stateClass}">${symbol}</span>`;
    })
    .join("");

  elements.dfaPlaybackStatus.textContent = `${Math.min(consumedSteps, totalDfaSteps)} / ${totalDfaSteps} symbol${totalDfaSteps === 1 ? "" : "s"} consumed`;
}

function updatePlaybackControls() {
  const totalSteps = playbackState.simulation.transitions.length;
  const atStart = playbackState.currentStep === 0;
  const atEnd = playbackState.currentStep >= totalSteps;
  const isPlaying = Boolean(playbackState.timerId);

  elements.dfaPrevButton.disabled = atStart;
  elements.dfaResetButton.disabled = atStart;
  elements.dfaNextButton.disabled = atEnd;
  elements.dfaPlayButton.disabled = isPlaying || totalSteps === 0;
  elements.dfaPauseButton.disabled = !isPlaying;
}
