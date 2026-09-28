const STORAGE_KEY = "expenses";
const THEME_KEY = "expenses-theme";
const MAX_CENTS = 9999999999;

const totalEl = document.querySelector("#total");
const countEl = document.querySelector("#count");
const formEl = document.querySelector("#expense-form");
const formHeadingEl = document.querySelector("#form-heading");
const formNoteEl = document.querySelector("#form-note");
const amountEl = document.querySelector("#amount");
const descriptionEl = document.querySelector("#description");
const errorEl = document.querySelector("#form-error");
const submitLabelEl = document.querySelector("#submit-label");
const cancelEditEl = document.querySelector("#cancel-edit");
const listEl = document.querySelector("#expense-list");
const emptyEl = document.querySelector("#empty");
const themeToggleEl = document.querySelector("#theme-toggle");
const themeColorEl = document.querySelector('meta[name="theme-color"]');

let editingId = null;

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

function formatWhen(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCount(count) {
  if (count === 0) return "No expenses yet";
  if (count === 1) return "1 expense";
  return `${count.toLocaleString("en-US")} expenses`;
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

function svgIcon(paths) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("icon");
  for (const d of paths) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.8");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
  }
  return svg;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const dark = theme === "dark";
  themeToggleEl.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  themeToggleEl.setAttribute("aria-pressed", dark ? "true" : "false");
  if (themeColorEl) themeColorEl.setAttribute("content", dark ? "#12110f" : "#0e7a62");
}

function exitEditMode() {
  editingId = null;
  formEl.classList.remove("is-editing");
  formHeadingEl.textContent = "Add an expense";
  formNoteEl.textContent = "Amount is required. Description is optional.";
  submitLabelEl.textContent = "Add expense";
  cancelEditEl.hidden = true;
  formEl.reset();
  showError("");
}

function enterEditMode(expense) {
  editingId = expense.id;
  amountEl.value = (expense.amountCents / 100).toFixed(2);
  descriptionEl.value = expense.description;
  formEl.classList.add("is-editing");
  formHeadingEl.textContent = "Edit expense";
  formNoteEl.textContent = "Change the amount or description, then save.";
  submitLabelEl.textContent = "Save changes";
  cancelEditEl.hidden = false;
  showError("");
  render(loadExpenses());
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  formEl.scrollIntoView({ behavior: motion ? "auto" : "smooth", block: "start" });
  amountEl.focus();
  amountEl.select();
}

function render(expenses) {
  const total = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  totalEl.textContent = formatCents(total);
  countEl.textContent = formatCount(expenses.length);

  listEl.replaceChildren();
  emptyEl.hidden = expenses.length > 0;

  for (const expense of expenses) {
    const item = document.createElement("li");
    item.className = "item";
    if (expense.id === editingId) item.classList.add("is-editing");

    const main = document.createElement("div");
    main.className = "item-main";

    const title = document.createElement("p");
    title.className = "item-title";
    if (expense.description) {
      title.textContent = expense.description;
    } else {
      title.textContent = "No description";
      title.classList.add("is-muted");
    }

    const when = document.createElement("p");
    when.className = "item-when";
    if (expense.id === editingId) {
      when.textContent = "Editing now";
    } else if (expense.updatedAt) {
      when.textContent = `Edited ${formatWhen(expense.updatedAt)}`;
    } else {
      when.textContent = formatWhen(expense.createdAt) || "Saved";
    }

    const amount = document.createElement("p");
    amount.className = "item-amount";
    amount.textContent = formatCents(expense.amountCents);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn btn-soft";
    edit.append(svgIcon(["M12 20h9", "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"]), "Edit");
    edit.setAttribute(
      "aria-label",
      expense.description
        ? `Edit ${formatCents(expense.amountCents)} for ${expense.description}`
        : `Edit ${formatCents(expense.amountCents)}`
    );
    edit.addEventListener("click", () => enterEditMode(expense));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-danger";
    remove.append(
      svgIcon(["M4 7h16", "M9 7V5h6v2", "M7 7l1 13h8l1-13", "M10 11v6", "M14 11v6"]),
      "Delete"
    );
    remove.setAttribute(
      "aria-label",
      expense.description
        ? `Delete ${formatCents(expense.amountCents)} for ${expense.description}`
        : `Delete ${formatCents(expense.amountCents)}`
    );
    remove.addEventListener("click", () => {
      const next = loadExpenses().filter((entry) => entry.id !== expense.id);
      if (editingId === expense.id) exitEditMode();
      saveExpenses(next);
      render(next);
    });

    main.append(title, when);
    actions.append(edit, remove);
    item.append(main, amount, actions);
    listEl.append(item);
  }
}

themeToggleEl.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
  if (localStorage.getItem(THEME_KEY)) return;
  applyTheme(event.matches ? "dark" : "light");
});

cancelEditEl.addEventListener("click", () => {
  exitEditMode();
  render(loadExpenses());
  amountEl.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && editingId) {
    exitEditMode();
    render(loadExpenses());
    amountEl.focus();
  }
});

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const amountCents = parseAmountToCents(amountEl.value);
  if (amountCents === null) {
    showError("Enter an amount greater than zero.");
    amountEl.focus();
    return;
  }

  const description = descriptionEl.value.trim();
  const expenses = loadExpenses();

  if (editingId) {
    const index = expenses.findIndex((entry) => entry.id === editingId);
    if (index === -1) {
      showError("That expense is no longer in the list.");
      exitEditMode();
      render(expenses);
      return;
    }

    expenses[index] = {
      ...expenses[index],
      amountCents,
      description,
      updatedAt: new Date().toISOString(),
    };
    saveExpenses(expenses);
    exitEditMode();
    render(expenses);
    amountEl.focus();
    return;
  }

  expenses.unshift({
    id: crypto.randomUUID(),
    amountCents,
    description,
    createdAt: new Date().toISOString(),
  });
  saveExpenses(expenses);
  formEl.reset();
  showError("");
  render(expenses);
  amountEl.focus();
});

applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
render(loadExpenses());
