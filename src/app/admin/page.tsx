"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AdminUser = {
  budget: number;
  createdAt: string;
  email?: string;
  expenseCount: number;
  id: string;
  isAdmin: boolean;
  lastSignIn?: string;
  totalAlerts: number;
  totalSpent: number;
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const totals = useMemo(
    () => ({
      expenses: users.reduce((sum, user) => sum + user.expenseCount, 0),
      spent: users.reduce((sum, user) => sum + user.totalSpent, 0),
      users: users.length,
    }),
    [users],
  );

  const loadUsers = useCallback(async () => {
    setIsLoading(true);

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      router.push("/admin/login");
      return;
    }

    const response = await fetch("/api/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.error ?? "Nuk u lexuan te dhenat e adminit.");
      return;
    }

    setUsers(result.users ?? []);
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(loadUsers);
  }, [loadUsers]);

  async function deleteUser(user: AdminUser) {
    if (user.isAdmin) {
      setMessage("Admin account nuk mund te fshihet nga dashboard.");
      return;
    }

    const confirmed = window.confirm(`Delete account ${user.email}?`);

    if (!confirmed) {
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      router.push("/admin/login");
      return;
    }

    const response = await fetch("/api/admin/users", {
      body: JSON.stringify({ userId: user.id }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "User nuk u fshi.");
      return;
    }

    setUsers((current) => current.filter((item) => item.id !== user.id));
    setMessage("User u fshi me sukses.");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#f7fbff] px-6 py-8 text-[#253044]">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[#c56b95]">
              Admin
            </p>
            <h1 className="text-3xl font-bold">Expense Tracker</h1>
          </div>
          <div className="flex gap-3">
            <Link
              className="rounded-md border border-[#bdd7fb] bg-white px-4 py-2 font-semibold text-[#4f74a8] shadow-sm"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <button
              className="rounded-md border border-[#f7b7d2] bg-white px-4 py-2 font-semibold text-[#8f456f] shadow-sm"
              onClick={logout}
              type="button"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-3">
          <section className="rounded-lg border border-[#bdd7fb] bg-[#eaf4ff] p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#4f74a8]">Users</p>
            <p className="mt-2 text-3xl font-bold">{totals.users}</p>
          </section>
          <section className="rounded-lg border border-[#f7b7d2] bg-[#fff0f6] p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#8f456f]">Expenses</p>
            <p className="mt-2 text-3xl font-bold">{totals.expenses}</p>
          </section>
          <section className="rounded-lg border border-[#bdd7fb] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#4f74a8]">Total spent</p>
            <p className="mt-2 text-3xl font-bold">
              {totals.spent.toFixed(2)} EUR
            </p>
          </section>
        </div>

        {message ? (
          <p className="mt-5 rounded-md border border-[#f7b7d2] bg-[#fff0f6] p-3 text-sm font-medium text-[#8f456f]">
            {message}
          </p>
        ) : null}

        <section className="mt-5 rounded-lg border border-[#bdd7fb] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Perdoruesit</h2>
            <button
              className="rounded-md bg-[#7ba9df] px-3 py-2 text-sm font-semibold text-white"
              onClick={loadUsers}
              type="button"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <p className="py-8 text-sm text-[#66738c]">Duke u ngarkuar...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#bdd7fb] text-[#4f74a8]">
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Budget</th>
                    <th className="py-3 pr-4">Spent</th>
                    <th className="py-3 pr-4">Expenses</th>
                    <th className="py-3 pr-4">Alerts</th>
                    <th className="py-3 pr-4">Created</th>
                    <th className="py-3 pr-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr className="border-b border-[#eef5ff]" key={user.id}>
                      <td className="py-3 pr-4 font-medium">
                        {user.email}
                        {user.isAdmin ? (
                          <span className="ml-2 rounded bg-[#eaf4ff] px-2 py-1 text-xs text-[#4f74a8]">
                            admin
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">{user.budget.toFixed(2)} EUR</td>
                      <td className="py-3 pr-4">
                        {user.totalSpent.toFixed(2)} EUR
                      </td>
                      <td className="py-3 pr-4">{user.expenseCount}</td>
                      <td className="py-3 pr-4">{user.totalAlerts}</td>
                      <td className="py-3 pr-4">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          className="rounded-md border border-[#f7b7d2] bg-[#fff0f6] px-3 py-1.5 font-semibold text-[#8f456f] disabled:opacity-50"
                          disabled={user.isAdmin}
                          onClick={() => deleteUser(user)}
                          type="button"
                        >
                          Delete account
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
