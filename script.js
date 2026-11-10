const display = document.getElementById("display");
const expression = document.getElementById("expression");
const message = document.getElementById("message");

const MAX_DIGITS = 12;

const symbols = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷"
};

let current = "0";
let stored = null;
let operator = null;

let waiting = false;
let finished = false;
let replaceInput = false;
let hasError = false;

let lastOperator = null;
let lastOperand = null;

function render() {
  display.textContent = current;
}

function clearAll() {
  current = "0";
  stored = null;
  operator = null;

  waiting = false;
  finished = false;
  replaceInput = false;
  hasError = false;

  lastOperator = null;
  lastOperand = null;

  expression.textContent = "";
  message.textContent = "";

  render();
}

function fail(text) {
  clearAll();

  current = "Error";
  hasError = true;
  message.textContent = text;

  render();
}

function format(number) {
  if (!Number.isFinite(number)) {
    throw new Error("Hasil tidak terdefinisi atau di luar jangkauan.");
  }

  const rounded = Number(number.toPrecision(12));

  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function calculate(a, op, b) {
  switch (op) {
    case "+":
      return a + b;

    case "-":
      return a - b;

    case "*":
      return a * b;

    case "/":
      if (b === 0) {
        throw new Error("Tidak dapat membagi dengan nol.");
      }

      return a / b;

    default:
      throw new Error("Operator tidak dikenali.");
  }
}

function prepareInput() {
  if (hasError || finished) {
    clearAll();
  }

  if (waiting || replaceInput) {
    current = "0";
    waiting = false;
    replaceInput = false;
  }
}

function inputDigit(digit) {
  prepareInput();

  const digitCount = current.replace(/[^0-9]/g, "").length;
  const replacesZero = current === "0" || current === "-0";

  if (!replacesZero && digitCount >= MAX_DIGITS) {
    message.textContent = "Maksimal input 12 digit per angka.";
    return;
  }

  if (current === "0") {
    current = digit;
  } else if (current === "-0") {
    current = "-" + digit;
  } else {
    current += digit;
  }

  message.textContent = "";
  render();
}

function inputDecimal() {
  prepareInput();

  if (!current.includes(".")) {
    current += ".";
  }

  message.textContent = "";
  render();
}

function chooseOperator(nextOperator) {
  if (hasError) return;

  message.textContent = "";

  // Jika belum mengetik operand kedua, ganti operator saja.
  if (operator !== null && waiting) {
    operator = nextOperator;
    expression.textContent = `${stored} ${symbols[operator]}`;
    return;
  }

  try {
    if (operator !== null && stored !== null) {
      current = format(
        calculate(stored, operator, Number(current))
      );
    }

    stored = Number(current);
    operator = nextOperator;

    waiting = true;
    finished = false;
    replaceInput = false;

    lastOperator = null;
    lastOperand = null;

    expression.textContent = `${current} ${symbols[operator]}`;

    render();
  } catch (error) {
    fail(error.message);
  }
}

function equals() {
  if (hasError) return;

  try {
    let a;
    let b;
    let op;

    if (operator !== null) {
      a = stored;
      b = Number(current);
      op = operator;
    } else if (finished && lastOperator !== null) {
      a = Number(current);
      b = lastOperand;
      op = lastOperator;
    } else {
      return;
    }

    const result = format(calculate(a, op, b));

    expression.textContent = `${a} ${symbols[op]} ${b} =`;
    current = result;

    lastOperator = op;
    lastOperand = b;

    stored = null;
    operator = null;

    waiting = false;
    finished = true;
    replaceInput = false;

    message.textContent = "";

    render();
  } catch (error) {
    fail(error.message);
  }
}

function clearEntry() {
  if (hasError || finished) {
    clearAll();
    return;
  }

  current = "0";
  waiting = false;
  replaceInput = false;

  expression.textContent = operator !== null
    ? `${stored} ${symbols[operator]}`
    : "";

  message.textContent = "";

  render();
}

function deleteDigit() {
  if (hasError || finished) {
    clearAll();
    return;
  }

  if (waiting) return;

  if (replaceInput || /e/i.test(current)) {
    clearEntry();
    return;
  }

  current = current.slice(0, -1);

  if (current === "" || current === "-") {
    current = "0";
  }

  message.textContent = "";

  render();
}

function changeSign() {
  if (hasError) return;

  if (waiting) {
    current = "0";
    waiting = false;
    replaceInput = false;
  }

  if (finished) {
    finished = false;
    replaceInput = true;

    lastOperator = null;
    lastOperand = null;

    expression.textContent = "";
  }

  current = current.startsWith("-")
    ? current.slice(1)
    : "-" + current;

  message.textContent = "";

  render();
}

function applyFunction(action) {
  if (hasError) return;

  try {
    const value = Number(current);

    let result;
    let label;

    switch (action) {
      case "sqrt":
        if (value < 0) {
          throw new Error(
            "Akar bilangan negatif tidak tersedia dalam mode bilangan real."
          );
        }

        result = Math.sqrt(value);
        label = `√(${value})`;
        break;

      case "square":
        result = value ** 2;
        label = `(${value})²`;
        break;

      case "reciprocal":
        if (value === 0) {
          throw new Error("Tidak dapat menghitung 1 dibagi nol.");
        }

        result = 1 / value;
        label = `1 / (${value})`;
        break;

      case "percent":
        result = value / 100;
        label = `${value}%`;
        break;

      default:
        return;
    }

    current = format(result);

    expression.textContent = operator !== null
      ? `${stored} ${symbols[operator]} ${label}`
      : `${label} =`;

    waiting = false;
    replaceInput = true;
    finished = operator === null;

    lastOperator = null;
    lastOperand = null;

    message.textContent = "";

    render();
  } catch (error) {
    fail(error.message);
  }
}

function handleAction(action, value) {
  switch (action) {
    case "digit":
      inputDigit(value);
      break;

    case "decimal":
      inputDecimal();
      break;

    case "operator":
      chooseOperator(value);
      break;

    case "equals":
      equals();
      break;

    case "clear":
      clearAll();
      break;

    case "clear-entry":
      clearEntry();
      break;

    case "delete":
      deleteDigit();
      break;

    case "sign":
      changeSign();
      break;

    case "sqrt":
    case "square":
    case "reciprocal":
    case "percent":
      applyFunction(action);
      break;
  }
}

document.getElementById("buttons").addEventListener("click", event => {
  const button = event.target.closest("button");

  if (!button) return;

  handleAction(button.dataset.action, button.dataset.value);
});

document.addEventListener("keydown", event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  // Enter dan Spasi tetap dapat mengaktifkan tombol yang sedang fokus.
  if (
    event.target instanceof HTMLButtonElement &&
    (event.key === "Enter" || event.key === " ")
  ) {
    return;
  }

  let action;
  let value;

  if (/^[0-9]$/.test(event.key)) {
    action = "digit";
    value = event.key;
  } else if (["+", "-", "*", "/"].includes(event.key)) {
    action = "operator";
    value = event.key;
  } else {
    const keys = {
      ".": "decimal",
      ",": "decimal",
      "Enter": "equals",
      "=": "equals",
      "Backspace": "delete",
      "Delete": "clear-entry",
      "Escape": "clear",
      "%": "percent"
    };

    action = keys[event.key];
  }

  if (action) {
    event.preventDefault();
    handleAction(action, value);
  }
});

render();