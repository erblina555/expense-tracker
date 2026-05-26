"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  created_at: string;
};

type AlertLevel = "warning" | "exceeded";

const categories = ["food", "transport", "bills", "shopping", "other"];

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}`;

  return {
    end: end.toISOString(),
    monthKey,
    start: start.toISOString(),
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState(300);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [pushPermission, setPushPermission] = useState(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("food");

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses],
  );

  const progress = Math.min((total / budget) * 100, 100);
  const remaining = Math.max(budget - total, 0);

  let alertMessage = "";
  let alertLevel: AlertLevel | null = null;
  if (total >= budget) {
    alertMessage = "E ke kaluar limitin e buxhetit.";
    alertLevel = "exceeded";
  } else if (total >= budget * 0.9) {
    alertMessage = "Po i afrohesh limitit te buxhetit.";
    alertLevel = "warning";
  }

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setMessage("Vendos Supabase URL dhe anon key ne .env.local.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("monthly_budget")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from("profiles").insert({
        id: user.id,
        monthly_budget: 300,
      });
      setBudget(300);
    } else {
      setBudget(Number(profile.monthly_budget));
    }

    const monthRange = getCurrentMonthRange();
    const { data: expensesData, error } = await supabase
      .from("expenses")
      .select("id,title,amount,category,created_at")
      .eq("user_id", user.id)
      .gte("created_at", monthRange.start)
      .lt("created_at", monthRange.end)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setExpenses(expensesData ?? []);
    }

    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  async function requestPushNotifications() {
    if (!("Notification" in window)) {
      setMessage("Ky browser nuk i perkrah push notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    setMessage(
      permission === "granted"
        ? "Push alerts u aktivizuan."
        : "Push alerts nuk jane aktivizuar.",
    );
  }

  const sendBudgetAlert = useCallback(async (
    level: AlertLevel,
    alertText: string,
    monthKey: string,
  ) => {
    if (!userId) {
      return;
    }

    const subject =
      level === "exceeded"
        ? "Budget limit exceeded"
        : "You are close to your monthly budget";
    const fullMessage = `${alertText} Total: ${total.toFixed(
      2,
    )} EUR / Budget: ${budget.toFixed(2)} EUR.`;

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(subject, {
        body: fullMessage,
      });
    }

    await supabase.from("budget_alerts").insert({
      alert_type: level,
      message: fullMessage,
      month_key: monthKey,
      user_id: userId,
    });

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      return;
    }

    await fetch("/api/send-budget-alert", {
      body: JSON.stringify({
        message: fullMessage,
        subject,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  }, [budget, total, userId]);

  useEffect(() => {
    if (!userId || !alertLevel || !alertMessage || total <= 0) {
      return;
    }

    const monthKey = getCurrentMonthRange().monthKey;
    const alertKey = `budget-alert:${userId}:${monthKey}:${alertLevel}`;

    if (window.localStorage.getItem(alertKey)) {
      return;
    }

    window.localStorage.setItem(alertKey, "sent");
    void sendBudgetAlert(alertLevel, alertMessage, monthKey);
  }, [alertLevel, alertMessage, sendBudgetAlert, total, userId]);

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || !title.trim() || !amount) {
      setMessage("Ploteso titullin dhe shumen.");
      return;
    }

    const expenseAmount = Number(amount);

    if (expenseAmount <= 0) {
      setMessage("Shuma duhet te jete me e madhe se 0.");
      return;
    }

    if (expenseAmount > remaining) {
      setMessage(
        `Nuk ke mjaft buxhet. Te mbeten vetem ${remaining.toFixed(2)} EUR.`,
      );
      return;
    }

    const { error } = await supabase.from("expenses").insert({
      user_id: userId,
      title: title.trim(),
      amount: expenseAmount,
      category,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTitle("");
    setAmount("");
    setCategory("food");
    setMessage("");
    loadData();
  }

  async function updateBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      return;
    }

    if (budget < total) {
      setMessage(
        `Buxheti nuk mund te jete me i vogel se shpenzimet aktuale (${total.toFixed(
          2,
        )} EUR).`,
      );
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ monthly_budget: budget })
      .eq("id", userId);

    setMessage(error ? error.message : "Buxheti u perditesua.");
  }

  async function deleteExpense(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setExpenses((current) => current.filter((expense) => expense.id !== id));
  }

  function startEdit(expense: Expense) {
    setEditingExpenseId(expense.id);
    setEditTitle(expense.title);
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category);
    setMessage("");
  }

  function cancelEdit() {
    setEditingExpenseId(null);
    setEditTitle("");
    setEditAmount("");
    setEditCategory("food");
  }

  async function saveExpense(id: string) {
    if (!editTitle.trim() || !editAmount) {
      setMessage("Ploteso titullin dhe shumen para se ta ruash.");
      return;
    }

    const currentExpense = expenses.find((expense) => expense.id === id);
    const nextAmount = Number(editAmount);

    if (!currentExpense) {
      setMessage("Shpenzimi nuk u gjet.");
      return;
    }

    if (nextAmount <= 0) {
      setMessage("Shuma duhet te jete me e madhe se 0.");
      return;
    }

    const nextTotal = total - Number(currentExpense.amount) + nextAmount;

    if (nextTotal > budget) {
      const allowedAmount = budget - (total - Number(currentExpense.amount));
      setMessage(
        `Nuk ke mjaft buxhet. Maksimumi per kete shpenzim eshte ${Math.max(
          allowedAmount,
          0,
        ).toFixed(2)} EUR.`,
      );
      return;
    }

    const { error } = await supabase
      .from("expenses")
      .update({
        title: editTitle.trim(),
        amount: nextAmount,
        category: editCategory,
      })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setExpenses((current) =>
      current.map((expense) =>
        expense.id === id
          ? {
              ...expense,
              title: editTitle.trim(),
              amount: nextAmount,
              category: editCategory,
            }
          : expense,
      ),
    );
    cancelEdit();
    setMessage("Shpenzimi u perditesua.");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fbff] text-[#253044]">
        <p className="font-medium">Duke u ngarkuar...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7fbff] px-6 py-8 text-[#253044]">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[#c56b95]">
              Dashboard
            </p>
            <h1 className="text-3xl font-bold">Expense Tracker</h1>
          </div>
          <button
            className="rounded-md border border-[#cadcf3] bg-white px-4 py-2 font-medium text-[#4f74a8] shadow-sm transition hover:bg-[#eef6ff]"
            onClick={logout}
            type="button"
          >
            Logout
          </button>
        </header>

        <div className="grid gap-5 lg:grid-cols-3">
          <section className="rounded-lg border border-[#bdd7fb] bg-[#eef6ff] p-5 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Buxheti mujor</h2>
                <p className="mt-1 text-sm text-[#66738c]">
                  Ke shpenzuar {total.toFixed(2)} EUR nga {budget.toFixed(2)}{" "}
                  EUR per muajin aktual.
                </p>
              </div>
              <p className="rounded-md bg-white px-3 py-2 text-sm font-medium text-[#4f74a8]">
                Mbeten {remaining.toFixed(2)} EUR
              </p>
            </div>

            <div className="mt-5 h-3 rounded bg-[#f7b7d2]">
              <div
                className="h-3 rounded bg-[#7ba9df]"
                style={{ width: `${progress}%` }}
              />
            </div>

            {alertMessage ? (
              <p className="mt-5 rounded-md border border-[#c56b95] bg-[#fff0f6] p-3 text-sm font-medium text-[#8f456f]">
                {alertMessage}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 border-t border-[#bdd7fb] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Budget alerts</p>
                <p className="text-sm text-[#66738c]">
                  90% / limit
                </p>
              </div>
              <button
                className="rounded-md border border-[#7ba9df] bg-white px-3 py-2 text-sm font-semibold text-[#4f74a8] transition hover:bg-[#eaf4ff]"
                onClick={requestPushNotifications}
                type="button"
              >
                {pushPermission === "granted"
                  ? "Push enabled"
                  : "Enable push"}
              </button>
            </div>
          </section>

          <form
            className="rounded-lg border border-[#f7b7d2] bg-[#fff0f6] p-5 shadow-sm"
            onSubmit={updateBudget}
          >
            <h2 className="text-lg font-semibold">Ndrysho buxhetin</h2>
            <label className="mt-4 block">
              <span className="text-sm font-medium">Buxheti mujor</span>
              <input
                className="mt-1 w-full rounded-md border border-[#f7b7d2] bg-white px-3 py-2 outline-none focus:border-[#c56b95]"
                min="1"
                onChange={(event) => setBudget(Number(event.target.value))}
                type="number"
                value={budget}
              />
            </label>
            <button
              className="mt-4 w-full rounded-md bg-[#c56b95] px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-[#b75d87]"
              type="submit"
            >
              Ruaj buxhetin
            </button>
          </form>
        </div>

        {message ? (
          <p className="mt-5 rounded-md border border-[#f7b7d2] bg-[#fff0f6] p-3 text-sm font-medium text-[#8f456f]">
            {message}
          </p>
        ) : null}

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <form
            className="rounded-lg border border-[#bdd7fb] bg-[#eef6ff] p-5 shadow-sm"
            onSubmit={addExpense}
          >
            <h2 className="text-lg font-semibold">Shto shpenzim</h2>

            <label className="mt-4 block">
              <span className="text-sm font-medium">Titulli</span>
              <input
                className="mt-1 w-full rounded-md border border-[#bdd7fb] bg-white px-3 py-2 outline-none focus:border-[#7ba9df]"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="p.sh. Dreka"
                value={title}
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium">Shuma</span>
              <input
                className="mt-1 w-full rounded-md border border-[#bdd7fb] bg-white px-3 py-2 outline-none focus:border-[#7ba9df]"
                min="0"
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                step="0.01"
                type="number"
                value={amount}
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium">Kategoria</span>
              <select
                className="mt-1 w-full rounded-md border border-[#bdd7fb] bg-white px-3 py-2 outline-none focus:border-[#7ba9df]"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="mt-5 w-full rounded-md bg-[#7ba9df] px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-[#6a9ad3]"
              type="submit"
            >
              Add Expense
            </button>
          </form>

          <section className="rounded-lg border border-[#f7b7d2] bg-[#fff8fb] p-5 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold">Lista e shpenzimeve</h2>
              <p className="text-sm text-[#66738c]">
                {expenses.length} records
              </p>
            </div>

            <div className="mt-4 divide-y divide-[#eef5ff]">
              {expenses.length === 0 ? (
                <p className="py-8 text-sm text-[#66738c]">
                  Ende nuk ke shtuar shpenzime.
                </p>
              ) : (
                expenses.map((expense) => (
                  <div
                    className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    key={expense.id}
                  >
                    {editingExpenseId === expense.id ? (
                      <>
                        <div className="grid gap-3 md:grid-cols-[1fr_120px_150px]">
                          <input
                            className="rounded-md border border-[#cadcf3] bg-white px-3 py-2 outline-none focus:border-[#7ba9df]"
                            onChange={(event) =>
                              setEditTitle(event.target.value)
                            }
                            value={editTitle}
                          />
                          <input
                            className="rounded-md border border-[#cadcf3] bg-white px-3 py-2 outline-none focus:border-[#7ba9df]"
                            min="0"
                            onChange={(event) =>
                              setEditAmount(event.target.value)
                            }
                            step="0.01"
                            type="number"
                            value={editAmount}
                          />
                          <select
                            className="rounded-md border border-[#cadcf3] bg-white px-3 py-2 outline-none focus:border-[#7ba9df]"
                            onChange={(event) =>
                              setEditCategory(event.target.value)
                            }
                            value={editCategory}
                          >
                            {categories.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-md bg-[#7ba9df] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#6a9ad3]"
                            onClick={() => saveExpense(expense.id)}
                            type="button"
                          >
                            Save
                          </button>
                          <button
                            className="rounded-md border border-[#cadcf3] px-3 py-2 text-sm font-semibold text-[#4f74a8] transition hover:bg-[#eef6ff]"
                            onClick={cancelEdit}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <p className="text-sm text-[#66738c]">
                            {expense.category}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <p className="min-w-24 font-semibold">
                            {Number(expense.amount).toFixed(2)} EUR
                          </p>
                          <button
                            className="rounded-md border border-[#cadcf3] px-3 py-1.5 text-sm font-medium text-[#4f74a8] transition hover:bg-[#eef6ff]"
                            onClick={() => startEdit(expense)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-md border border-[#f0bfd4] bg-[#fff8fb] px-3 py-1.5 text-sm font-medium text-[#8f456f] transition hover:bg-[#fff0f6]"
                            onClick={() => deleteExpense(expense.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
