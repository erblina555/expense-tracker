"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [isLoading, setIsLoading] = useState(false);

  const passwordChecks = useMemo(
    () => [
      {
        label: "Minimum 6 karaktere",
        valid: password.length >= 6,
      },
      {
        label: "Password-at jane te njejte",
        valid: password.length > 0 && password === confirmPassword,
      },
    ],
    [confirmPassword, password],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setMessageType("error");
      setMessage("Mungon konfigurimi i Supabase.");
      return;
    }

    if (mode === "register") {
      await register();
      return;
    }

    await login();
  }

  async function login() {
    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setMessageType("error");
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
  }

  async function register() {
    if (password.length < 6) {
      setMessageType("error");
      setMessage("Password duhet te kete minimum 6 karaktere.");
      return;
    }

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Password-at nuk perputhen.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/confirm`
            : undefined,
      },
    });

    setIsLoading(false);

    if (error) {
      setMessageType("error");
      setMessage(error.message);
      return;
    }

    setMessageType("success");
    setMessage("Account u krijua. Verifiko email-in para login.");
    setMode("login");
    setConfirmPassword("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fbff] px-6 py-10 text-[#253044]">
      <section className="w-full max-w-md rounded-lg border border-[#f7b7d2] bg-white shadow-sm">
        <div className="rounded-t-lg bg-[#fce7f3] px-6 py-5">
          <div className="flex items-center justify-between">
            <Link className="text-sm font-semibold text-[#4f74a8]" href="/">
              Back
            </Link>
            <Link className="text-sm font-semibold text-[#8f456f]" href="/share">
              Share
            </Link>
          </div>
          <h1 className="mt-5 text-2xl font-bold">Expense Tracker</h1>
        </div>

        <div className="p-6">
          <div className="mb-6 grid grid-cols-2 rounded-md border border-[#bdd7fb] bg-[#eaf4ff] p-1">
            <button
              className={`rounded px-4 py-2 text-sm font-semibold ${
                mode === "login"
                  ? "bg-white text-[#253044] shadow-sm"
                  : "text-[#4f74a8]"
              }`}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              type="button"
            >
              Login
            </button>
            <button
              className={`rounded px-4 py-2 text-sm font-semibold ${
                mode === "register"
                  ? "bg-white text-[#253044] shadow-sm"
                  : "text-[#8f456f]"
              }`}
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
              type="button"
            >
              Register
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                className="mt-1 w-full rounded-md border border-[#bdd7fb] bg-[#f7fbff] px-3 py-2.5 outline-none transition focus:border-[#7ba9df] focus:ring-2 focus:ring-[#eaf4ff]"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <input
                className="mt-1 w-full rounded-md border border-[#bdd7fb] bg-[#f7fbff] px-3 py-2.5 outline-none transition focus:border-[#7ba9df] focus:ring-2 focus:ring-[#eaf4ff]"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 karaktere"
                required
                type="password"
                value={password}
              />
            </label>

            {mode === "register" ? (
              <>
                <label className="block">
                  <span className="text-sm font-medium">Confirm password</span>
                  <input
                    className="mt-1 w-full rounded-md border border-[#f7b7d2] bg-[#fff7fb] px-3 py-2.5 outline-none transition focus:border-[#c56b95] focus:ring-2 focus:ring-[#fce7f3]"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Perserit password-in"
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </label>

                <div className="rounded-md border border-[#f7b7d2] bg-[#fff7fb] p-3 text-sm">
                  {passwordChecks.map((check) => (
                    <p
                      className={check.valid ? "text-[#4f74a8]" : "text-[#8a94a8]"}
                      key={check.label}
                    >
                      {check.valid ? "[OK]" : "-"} {check.label}
                    </p>
                  ))}
                </div>
              </>
            ) : null}

            {message ? (
              <p
                className={`rounded-md border p-3 text-sm ${
                  messageType === "success"
                    ? "border-[#bdd7fb] bg-[#eaf4ff] text-[#4f74a8]"
                    : "border-[#f7b7d2] bg-[#fff0f6] text-[#8f456f]"
                }`}
              >
                {message}
              </p>
            ) : null}

            <button
              className={`w-full rounded-md px-4 py-2.5 font-semibold text-white shadow-sm transition disabled:opacity-60 ${
                mode === "login"
                  ? "bg-[#7ba9df] hover:bg-[#6a9ad3]"
                  : "bg-[#c56b95] hover:bg-[#b75d87]"
              }`}
              disabled={isLoading}
              type="submit"
            >
              {isLoading
                ? "Duke punuar..."
                : mode === "login"
                  ? "Login"
                : "Register"}
            </button>

            <Link
              className="block text-center text-sm font-semibold text-[#4f74a8]"
              href="/admin/login"
            >
              Admin
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
}
