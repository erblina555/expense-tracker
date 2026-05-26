"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ConfirmEmailPage() {
  const [message, setMessage] = useState("Duke konfirmuar email-in...");

  useEffect(() => {
    async function confirmEmail() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMessage("Email nuk u konfirmua. Provo perseri linkun nga email-i.");
          return;
        }
      }

      setMessage("Email u konfirmua me sukses.");
    }

    void confirmEmail();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fbff] px-6 py-10 text-[#253044]">
      <section className="w-full max-w-md rounded-lg border border-[#f7b7d2] bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold">Expense Tracker</h1>
        <p className="mt-4 rounded-md border border-[#bdd7fb] bg-[#eaf4ff] p-3 text-sm font-medium text-[#4f74a8]">
          {message}
        </p>
        <Link
          className="mt-6 inline-flex rounded-md bg-[#f7b7d2] px-4 py-2 font-semibold text-[#253044] transition hover:bg-[#f4a6c8]"
          href="/"
        >
          Kthehu ne faqen kryesore
        </Link>
      </section>
    </main>
  );
}
