"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

const adminEmail = "erblinakalludra5@gmail.com";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(adminEmail);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.user?.email !== adminEmail) {
      await supabase.auth.signOut();
      setMessage("Ky account nuk ka qasje admin.");
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fbff] px-6 py-10 text-[#253044]">
      <section className="w-full max-w-md rounded-lg border border-[#bdd7fb] bg-white shadow-sm">
        <div className="rounded-t-lg bg-[#eaf4ff] px-6 py-5">
          <Link className="text-sm font-semibold text-[#8f456f]" href="/login">
            Back
          </Link>
          <h1 className="mt-5 text-2xl font-bold">Admin Login</h1>
        </div>

        <form className="space-y-4 p-6" onSubmit={login}>
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              className="mt-1 w-full rounded-md border border-[#bdd7fb] bg-[#f7fbff] px-3 py-2.5 outline-none focus:border-[#7ba9df]"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              className="mt-1 w-full rounded-md border border-[#f7b7d2] bg-[#fff7fb] px-3 py-2.5 outline-none focus:border-[#c56b95]"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {message ? (
            <p className="rounded-md border border-[#f7b7d2] bg-[#fff0f6] p-3 text-sm text-[#8f456f]">
              {message}
            </p>
          ) : null}

          <button
            className="w-full rounded-md bg-[#7ba9df] px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#6a9ad3] disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Duke punuar..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
