# Smart Payment Card Validator & Visualizer

A polished Theory of Computation project that shows how **DFA**, **regular expressions**, **string processing**, and the **Luhn checksum** appear in a realistic banking-style validation workflow.

## Why this project is good for ToC evaluation

This project demonstrates a practical concept with clear academic value:

- **DFA-based prefix recognition** for payment card families
- **Regex-based full-pattern validation** for supported networks
- **Deterministic string processing** for sanitization and formatting
- **Step-by-step Luhn algorithm visualization** for checksum validation
- **Interactive UI** that makes the automata idea visible

It is strong for:

- academic demos
- project review
- viva explanation
- portfolio presentation

## Supported demo card families

This implementation supports the card families requested in the project brief:

- Visa
- MasterCard
- American Express
- RuPay (demo prefixes: `60`, `65`, `81`)

## Important note about the DFA

The DFA graph in this project is an **educational abstraction** of prefix recognition.

That means:

- it is designed to clearly show how a DFA can process digits one-by-one
- it models the **decision logic for supported prefix families**
- for complex commercial prefix tables, production systems would often combine metadata tables, regex/pattern rules, and deterministic code paths rather than drawing a giant raw DFA

So the DFA here is academically meaningful and visually understandable, while still staying practical for a class demo.

## Project structure

```text
smart-payment-card-validator/
├── index.html
├── styles.css
├── README.md
└── js/
    ├── app.js
    ├── cardRules.js
    ├── dfa.js
    └── luhn.js
```

## How to run

No setup is required.

1. Open the project folder
2. Double-click `index.html`
3. Or serve the folder with any lightweight static server

## Features

### 1. Card input panel
- digit-only sanitization
- live formatting
- clear button
- sample card autofill

### 2. Card type detection
- detects supported card family
- updates the digital card badge live
- explains whether the prefix is accepted, rejected, or still in progress

### 3. Animated digital card
- modern card UI
- live number update
- flip interaction for front/back card visualization

### 4. Luhn algorithm visualization
- reverse digits
- double every second digit from the right
- subtract 9 where needed
- sum all digits
- final divisibility-by-10 verdict

### 5. DFA simulator
- graph of states and transitions
- active state highlighting
- visited transition highlighting
- readable trace panel

### 6. Educational explanation panel
- what DFA is
- how regex is used
- why automata matter in real systems
- how layered validation works in practice

## Demo inputs

Use these built-in examples:

- Visa: `4111 1111 1111 1111`
- MasterCard: `5555 5555 5555 4444`
- AmEx: `3782 822463 10005`
- RuPay: `6546 3235 6115 7565`
- Invalid checksum: `4111 1111 1111 1112`

## Viva explanation you can say

> First, the input is sanitized into digits only.
> Then the prefix is checked using DFA-style step transitions.
> After that, full card-family rules are checked using regex-style constraints.
> Finally, the Luhn checksum verifies whether the number is structurally valid.
> This shows how Theory of Computation ideas combine with practical algorithms in real payment systems.

## Suggested future upgrades

- add CVV validation and expiry input
- support more card networks
- add an NFA vs DFA explanation card
- export trace as PDF or image
- animate edges with timed playback mode

