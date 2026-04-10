let currentInput = '';
let previousInput = '';
let operator = null;
let shouldResetScreen = false;

const resultEl     = document.getElementById('result');
const expressionEl = document.getElementById('expression');
const historyPanel = document.getElementById('historyPanel');
const historyList  = document.getElementById('historyList');
const historyToggleBtn = document.getElementById('historyToggle');

// Load history from localStorage
let history = JSON.parse(localStorage.getItem('calcHistory') || '[]');
renderHistory();

function toggleHistory() {
  const open = historyPanel.classList.toggle('open');
  historyToggleBtn.classList.toggle('active', open);
}

function addToHistory(expr, result) {
  history.unshift({ expr, result });
  if (history.length > 50) history.pop();
  localStorage.setItem('calcHistory', JSON.stringify(history));
  renderHistory();
}

function clearHistory() {
  history = [];
  localStorage.removeItem('calcHistory');
  renderHistory();
}

function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = '<li class="history-empty">No calculations yet</li>';
    return;
  }
  historyList.innerHTML = history.map((item, i) => `
    <li class="history-item" onclick="recallHistory(${i})">
      <span class="h-expr">${item.expr}</span>
      <span class="h-result">${item.result}</span>
    </li>
  `).join('');
}

function recallHistory(index) {
  const item = history[index];
  currentInput = item.result;
  shouldResetScreen = true;
  updateDisplay(currentInput);
  // close panel
  historyPanel.classList.remove('open');
  historyToggleBtn.classList.remove('active');
}

function updateDisplay(value) {
  // Shrink font for long numbers
  const len = String(value).length;
  if (len > 12)      resultEl.style.fontSize = '28px';
  else if (len > 9)  resultEl.style.fontSize = '36px';
  else if (len > 6)  resultEl.style.fontSize = '44px';
  else               resultEl.style.fontSize = '52px';

  resultEl.textContent = value;
  triggerPop();
}

function triggerPop() {
  resultEl.classList.remove('pop');
  void resultEl.offsetWidth; // reflow
  resultEl.classList.add('pop');
}

function inputDigit(digit) {
  if (shouldResetScreen) {
    currentInput = digit;
    shouldResetScreen = false;
  } else {
    if (currentInput === '0' && digit !== '.') {
      currentInput = digit;
    } else {
      if (currentInput.length >= 12) return;
      currentInput += digit;
    }
  }
  updateDisplay(currentInput);
}

function inputDot() {
  if (shouldResetScreen) {
    currentInput = '0.';
    shouldResetScreen = false;
    updateDisplay(currentInput);
    return;
  }
  if (currentInput.includes('.')) return;
  if (currentInput === '') currentInput = '0';
  currentInput += '.';
  updateDisplay(currentInput);
}

function inputOperator(op) {
  clearActiveOp();

  if (operator && !shouldResetScreen) {
    calculate(true);
  }

  previousInput = currentInput || resultEl.textContent;
  operator = op;
  shouldResetScreen = true;

  expressionEl.textContent = `${previousInput} ${op}`;

  // Highlight active operator button
  document.querySelectorAll('.btn.operator').forEach(btn => {
    if (btn.textContent.trim() === op) btn.classList.add('active-op');
  });
}

function calculate(chained = false) {
  if (!operator || (!currentInput && !shouldResetScreen)) return;

  clearActiveOp();

  const prev = parseFloat(previousInput);
  const curr = parseFloat(shouldResetScreen ? previousInput : currentInput);
  let result;

  switch (operator) {
    case '+': result = prev + curr; break;
    case '−': result = prev - curr; break;
    case '×': result = prev * curr; break;
    case '÷': result = curr === 0 ? 'Error' : prev / curr; break;
    case '%': result = prev % curr; break;
    default: return;
  }

  const formatted = result === 'Error' ? 'Error' : parseFloat(result.toPrecision(10)).toString();

  if (!chained) {
    const expr = `${previousInput} ${operator} ${currentInput} =`;
    expressionEl.textContent = expr;
    addToHistory(`${previousInput} ${operator} ${currentInput}`, formatted);
    operator = null;
  }

  currentInput = formatted;
  shouldResetScreen = !chained;
  updateDisplay(formatted);
}

function clearAll() {
  currentInput = '';
  previousInput = '';
  operator = null;
  shouldResetScreen = false;
  expressionEl.textContent = '';
  updateDisplay('0');
  clearActiveOp();
}

function toggleSign() {
  if (!currentInput || currentInput === '0') return;
  currentInput = currentInput.startsWith('-')
    ? currentInput.slice(1)
    : '-' + currentInput;
  updateDisplay(currentInput);
}

function clearActiveOp() {
  document.querySelectorAll('.btn.active-op').forEach(b => b.classList.remove('active-op'));
}

// Ripple effect
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const size = Math.max(this.offsetWidth, this.offsetHeight);
    const rect = this.getBoundingClientRect();
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
    this.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
});

// Keyboard support
document.addEventListener('keydown', e => {
  if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
  else if (e.key === '.')  inputDot();
  else if (e.key === '+')  inputOperator('+');
  else if (e.key === '-')  inputOperator('−');
  else if (e.key === '*')  inputOperator('×');
  else if (e.key === '/')  { e.preventDefault(); inputOperator('÷'); }
  else if (e.key === '%')  inputOperator('%');
  else if (e.key === 'Enter' || e.key === '=') calculate();
  else if (e.key === 'Backspace') {
    currentInput = currentInput.slice(0, -1) || '0';
    updateDisplay(currentInput || '0');
  }
  else if (e.key === 'Escape') clearAll();
});
