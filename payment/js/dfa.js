import { digitsOnly } from "./cardRules.js";

const NODE_RADIUS = 28;

const NODES = [
  { id: "q0", x: 64, y: 180, label: "q0", detail: "start" },
  { id: "q4", x: 210, y: 70, label: "q4", detail: "Visa family", accept: true },
  { id: "q5", x: 210, y: 180, label: "q5", detail: "MasterCard?" },
  { id: "qM", x: 375, y: 180, label: "qM", detail: "MC accept", accept: true },
  { id: "q2", x: 210, y: 290, label: "q2", detail: "2-series?" },
  { id: "q2a", x: 390, y: 290, label: "q2a", detail: "22–27" },
  { id: "q2b", x: 550, y: 290, label: "q2b", detail: "222x–272x" },
  { id: "qM2", x: 715, y: 290, label: "qM2", detail: "MC accept", accept: true },
  { id: "q3", x: 375, y: 70, label: "q3", detail: "AmEx?" },
  { id: "qA", x: 550, y: 70, label: "qA", detail: "AmEx accept", accept: true },
  { id: "q6", x: 550, y: 180, label: "q6", detail: "RuPay?" },
  { id: "qR", x: 715, y: 180, label: "qR", detail: "RuPay accept", accept: true },
  { id: "q8", x: 550, y: 20, label: "q8", detail: "81?" },
  { id: "qDead", x: 860, y: 180, label: "qDead", detail: "reject", dead: true }
];

const EDGES = [
  { id: "q0-q4", from: "q0", to: "q4", label: "4" },
  { id: "q0-q5", from: "q0", to: "q5", label: "5" },
  { id: "q0-q2", from: "q0", to: "q2", label: "2" },
  { id: "q0-q3", from: "q0", to: "q3", label: "3" },
  { id: "q0-q6", from: "q0", to: "q6", label: "6" },
  { id: "q0-q8", from: "q0", to: "q8", label: "8" },
  { id: "q0-qDead", from: "q0", to: "qDead", label: "other", dead: true },

  { id: "q5-qM", from: "q5", to: "qM", label: "1–5" },
  { id: "q5-qDead", from: "q5", to: "qDead", label: "else", dead: true },

  { id: "q2-q2a", from: "q2", to: "q2a", label: "2–7" },
  { id: "q2-qDead", from: "q2", to: "qDead", label: "else", dead: true },
  { id: "q2a-q2b", from: "q2a", to: "q2b", label: "0–9" },
  { id: "q2b-qM2", from: "q2b", to: "qM2", label: "range valid" },
  { id: "q2b-qDead", from: "q2b", to: "qDead", label: "range invalid", dead: true },

  { id: "q3-qA", from: "q3", to: "qA", label: "4 or 7" },
  { id: "q3-qDead", from: "q3", to: "qDead", label: "else", dead: true },

  { id: "q6-qR", from: "q6", to: "qR", label: "0 or 5" },
  { id: "q6-qDead", from: "q6", to: "qDead", label: "else", dead: true },

  { id: "q8-qR", from: "q8", to: "qR", label: "1" },
  { id: "q8-qDead", from: "q8", to: "qDead", label: "else", dead: true }
];

const NODE_LOOKUP = Object.fromEntries(NODES.map((node) => [node.id, node]));

function edgeLine(fromId, toId) {
  const from = NODE_LOOKUP[fromId];
  const to = NODE_LOOKUP[toId];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const ux = dx / distance;
  const uy = dy / distance;

  return {
    x1: from.x + ux * NODE_RADIUS,
    y1: from.y + uy * NODE_RADIUS,
    x2: to.x - ux * NODE_RADIUS,
    y2: to.y - uy * NODE_RADIUS,
    lx: (from.x + to.x) / 2 + (Math.abs(dy) < 30 ? 0 : -uy * 18),
    ly: (from.y + to.y) / 2 + (Math.abs(dx) < 30 ? 0 : ux * 18)
  };
}

function createSvgElement(tag, attrs = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });
  return element;
}

export function renderDfaGraph(svg) {
  svg.innerHTML = "";

  const defs = createSvgElement("defs");
  const marker = createSvgElement("marker", {
    id: "arrowHead",
    viewBox: "0 0 10 10",
    refX: "8",
    refY: "5",
    markerWidth: "8",
    markerHeight: "8",
    orient: "auto-start-reverse"
  });
  const arrowPath = createSvgElement("path", {
    d: "M 0 0 L 10 5 L 0 10 z",
    class: "arrow-head"
  });
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.appendChild(defs);

  EDGES.forEach((edge) => {
    const line = edgeLine(edge.from, edge.to);
    const path = createSvgElement("line", {
      x1: line.x1,
      y1: line.y1,
      x2: line.x2,
      y2: line.y2,
      class: `edge-path arrowed ${edge.dead ? "dead-edge" : ""}`,
      "data-edge-id": edge.id
    });
    svg.appendChild(path);

    const labelBg = createSvgElement("rect", {
      x: line.lx - 34,
      y: line.ly - 13,
      width: 68,
      height: 24,
      rx: 8,
      class: "edge-label-bg"
    });
    const label = createSvgElement("text", {
      x: line.lx,
      y: line.ly + 5,
      class: "edge-label",
      "text-anchor": "middle"
    });
    label.textContent = edge.label;
    svg.appendChild(labelBg);
    svg.appendChild(label);
  });

  NODES.forEach((node) => {
    const group = createSvgElement("g", {
      class: `node ${node.accept ? "accept" : ""} ${node.dead ? "dead" : ""}`,
      "data-node-id": node.id
    });

    const outer = createSvgElement("circle", {
      cx: node.x,
      cy: node.y,
      r: NODE_RADIUS,
      class: "outer"
    });
    group.appendChild(outer);

    if (node.accept) {
      const inner = createSvgElement("circle", {
        cx: node.x,
        cy: node.y,
        r: NODE_RADIUS - 6,
        class: "inner"
      });
      group.appendChild(inner);
    }

    const label = createSvgElement("text", {
      x: node.x,
      y: node.y + 5,
      "text-anchor": "middle"
    });
    label.textContent = node.label;
    group.appendChild(label);

    const detail = createSvgElement("text", {
      x: node.x,
      y: node.y + NODE_RADIUS + 18,
      "text-anchor": "middle",
      class: "node-detail"
    });
    detail.textContent = node.detail;
    group.appendChild(detail);

    svg.appendChild(group);
  });

  const startText = createSvgElement("text", {
    x: 16,
    y: 142,
    class: "start-label"
  });
  startText.textContent = "start →";
  svg.appendChild(startText);
}

function masterCardRangeTrace(prefix4) {
  const first4 = Number(prefix4);
  if (Number.isNaN(first4)) return { valid: false, detail: "Need four digits" };
  return {
    valid: first4 >= 2221 && first4 <= 2720,
    detail: `Range check on ${prefix4} ${first4 >= 2221 && first4 <= 2720 ? "passes" : "fails"}.`
  };
}

export function simulatePrefixDfa(value) {
  const digits = digitsOnly(value);
  const transitions = [];
  const visitedEdges = [];
  const visitedNodes = ["q0"];
  let state = "q0";

  if (!digits) {
    return {
      finalState: state,
      visitedNodes,
      visitedEdges,
      transitions,
      summary: "Start state q0. Waiting for the first digit.",
      prefixAccepted: false,
      inProgress: true
    };
  }

  const pushStep = (digit, from, to, reason, status = "progress") => {
    transitions.push({ digit, from, to, reason, status });
    visitedEdges.push(`${from}-${to}`);
    if (!visitedNodes.includes(to)) visitedNodes.push(to);
    state = to;
  };

  const first = digits[0];
  switch (first) {
    case "4":
      pushStep(first, "q0", "q4", "Digit 4 matches the Visa prefix family.", "accept");
      break;
    case "5":
      pushStep(first, "q0", "q5", "Digit 5 may lead to MasterCard (51–55).", "progress");
      break;
    case "2":
      pushStep(first, "q0", "q2", "Digit 2 may lead to the 2221–2720 MasterCard range.", "progress");
      break;
    case "3":
      pushStep(first, "q0", "q3", "Digit 3 may lead to American Express.", "progress");
      break;
    case "6":
      pushStep(first, "q0", "q6", "Digit 6 may lead to a supported RuPay demo prefix.", "progress");
      break;
    case "8":
      pushStep(first, "q0", "q8", "Digit 8 may lead to the supported RuPay demo prefix 81.", "progress");
      break;
    default:
      pushStep(first, "q0", "qDead", `Digit ${first} is not a supported starting prefix in this demo.`, "reject");
  }

  if (state === "q4" || state === "qDead") {
    return finalize(state, transitions, visitedNodes, visitedEdges);
  }

  if (state === "q5") {
    if (digits.length < 2) return finalize(state, transitions, visitedNodes, visitedEdges);
    const second = digits[1];
    if (/[1-5]/.test(second)) {
      pushStep(second, "q5", "qM", `Second digit ${second} completes the 51–55 MasterCard family.`, "accept");
    } else {
      pushStep(second, "q5", "qDead", `Second digit ${second} breaks the 51–55 MasterCard rule.`, "reject");
    }
    return finalize(state, transitions, visitedNodes, visitedEdges);
  }

  if (state === "q3") {
    if (digits.length < 2) return finalize(state, transitions, visitedNodes, visitedEdges);
    const second = digits[1];
    if (second === "4" || second === "7") {
      pushStep(second, "q3", "qA", `Second digit ${second} matches the American Express prefix.`, "accept");
    } else {
      pushStep(second, "q3", "qDead", `Second digit ${second} is not 4 or 7, so the AmEx prefix is rejected.`, "reject");
    }
    return finalize(state, transitions, visitedNodes, visitedEdges);
  }

  if (state === "q6") {
    if (digits.length < 2) return finalize(state, transitions, visitedNodes, visitedEdges);
    const second = digits[1];
    if (second === "0" || second === "5") {
      pushStep(second, "q6", "qR", `Second digit ${second} matches a supported RuPay demo prefix (${first}${second}).`, "accept");
    } else {
      pushStep(second, "q6", "qDead", `Second digit ${second} does not match the supported RuPay demo prefixes 60 or 65.`, "reject");
    }
    return finalize(state, transitions, visitedNodes, visitedEdges);
  }

  if (state === "q8") {
    if (digits.length < 2) return finalize(state, transitions, visitedNodes, visitedEdges);
    const second = digits[1];
    if (second === "1") {
      pushStep(second, "q8", "qR", "Second digit 1 completes the supported RuPay demo prefix 81.", "accept");
    } else {
      pushStep(second, "q8", "qDead", `Second digit ${second} does not match the supported RuPay demo prefix 81.`, "reject");
    }
    return finalize(state, transitions, visitedNodes, visitedEdges);
  }

  if (state === "q2") {
    if (digits.length < 2) return finalize(state, transitions, visitedNodes, visitedEdges);
    const second = digits[1];
    if (/[2-7]/.test(second)) {
      pushStep(second, "q2", "q2a", `Second digit ${second} keeps the number inside the 22–27 MasterCard corridor.`, "progress");
    } else {
      pushStep(second, "q2", "qDead", `Second digit ${second} leaves the 22–27 MasterCard corridor.`, "reject");
      return finalize(state, transitions, visitedNodes, visitedEdges);
    }

    if (digits.length < 3) return finalize(state, transitions, visitedNodes, visitedEdges);
    const third = digits[2];
    pushStep(third, "q2a", "q2b", `Third digit ${third} is stored while the DFA prepares for the final 4-digit range check.`, "progress");

    if (digits.length < 4) return finalize(state, transitions, visitedNodes, visitedEdges);
    const fourth = digits[3];
    const range = masterCardRangeTrace(digits.slice(0, 4));
    if (range.valid) {
      pushStep(fourth, "q2b", "qM2", `${range.detail} The prefix belongs to the 2221–2720 MasterCard series.`, "accept");
    } else {
      pushStep(fourth, "q2b", "qDead", `${range.detail} The prefix is rejected.`, "reject");
    }
  }

  return finalize(state, transitions, visitedNodes, visitedEdges);
}

function finalize(state, transitions, visitedNodes, visitedEdges) {
  const prefixAccepted = ["q4", "qM", "qM2", "qA", "qR"].includes(state);
  const rejected = state === "qDead";
  const inProgress = !prefixAccepted && !rejected;

  let summary = "Prefix is still in progress.";
  if (prefixAccepted) summary = `Prefix accepted at state ${state}.`;
  if (rejected) summary = "Prefix rejected by the educational DFA.";

  return {
    finalState: state,
    visitedNodes,
    visitedEdges,
    transitions,
    summary,
    prefixAccepted,
    inProgress,
    rejected
  };
}

export function applyDfaHighlight(svg, simulation) {
  svg.querySelectorAll("[data-node-id]").forEach((nodeEl) => {
    const nodeId = nodeEl.getAttribute("data-node-id");
    nodeEl.classList.remove("active", "visited");
    if (simulation.visitedNodes.includes(nodeId)) nodeEl.classList.add("visited");
    if (simulation.finalState === nodeId) nodeEl.classList.add("active");
  });

  svg.querySelectorAll("[data-edge-id]").forEach((edgeEl) => {
    const edgeId = edgeEl.getAttribute("data-edge-id");
    edgeEl.classList.toggle("visited", simulation.visitedEdges.includes(edgeId));
  });
}
