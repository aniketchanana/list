const STORAGE_KEY = "expenses";
const MAX_CENTS = 9999999999;

const totalEl = document.querySelector("#total");
const formEl = document.querySelector("#expense-form");
const amountEl = document.querySelector("#amount");
const descriptionEl = document.querySelector("#description");
const errorEl = document.querySelector("#form-error");
const listEl = document.querySelector("#expense-list");
const emptyEl = document.querySelector("#empty");

function parseAmountToCents(raw) {
  const cleaned = String(raw).trim().replace(/[₹$€£\s,]/g, "");
  if (!/^(?:\d+|\d*\.\d{1,2})$/.test(cleaned)) return null;

  const [whole, fraction = ""] = cleaned.split(".");
  const cents = Number(whole || "0") * 100 + Number((fraction + "00").slice(0, 2));
  if (!Number.isInteger(cents) || cents <= 0 || cents > MAX_CENTS) return null;
  return cents;
}

function formatCents(cents) {
  return (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function loadExpenses() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isExpense);
  } catch {
    return [];
  }
}

function isExpense(item) {
  return (
    item &&
    typeof item.id === "string" &&
    Number.isInteger(item.amountCents) &&
    item.amountCents > 0 &&
    typeof item.description === "string"
  );
}

function saveExpenses(expenses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

function render(expenses) {
  const total = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  totalEl.textContent = formatCents(total);

  listEl.replaceChildren();
  emptyEl.hidden = expenses.length > 0;

  for (const expense of expenses) {
    const item = document.createElement("li");

    const amount = document.createElement("p");
    amount.className = "amount";
    amount.textContent = formatCents(expense.amountCents);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.textContent = "Remove";
    remove.setAttribute(
      "aria-label",
      expense.description
        ? `Remove ${formatCents(expense.amountCents)} for ${expense.description}`
        : `Remove ${formatCents(expense.amountCents)}`
    );
    remove.addEventListener("click", () => {
      const next = loadExpenses().filter((entry) => entry.id !== expense.id);
      saveExpenses(next);
      render(next);
    });

    item.append(amount, remove);

    if (expense.description) {
      const description = document.createElement("p");
      description.className = "description";
      description.textContent = expense.description;
      item.append(description);
    }

    listEl.append(item);
  }
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const amountCents = parseAmountToCents(amountEl.value);
  if (amountCents === null) {
    showError("Enter an amount greater than zero.");
    amountEl.focus();
    return;
  }

  const description = descriptionEl.value.trim();
  const expenses = [
    {
      id: crypto.randomUUID(),
      amountCents,
      description,
      createdAt: new Date().toISOString(),
    },
    ...loadExpenses(),
  ];

  saveExpenses(expenses);
  render(expenses);
  formEl.reset();
  showError("");
  amountEl.focus();
});

render(loadExpenses());
