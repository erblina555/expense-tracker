"use client";

import Link from "next/link";

export default function ConfirmPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 via-white to-blue-100 px-6">
      <section className="w-full max-w-md rounded-2xl border border-pink-200 bg-white p-10 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-pink-200 to-blue-200 text-4xl">
          💌
        </div>

        <h1 className="text-3xl font-bold text-[#253044]">Email u Konfirmua</h1>

        <p className="mt-4 text-sm text-gray-600">
          Account-i juaj u verifikua me sukses.
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Tani mund te beni login ne aplikacion.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-block rounded-xl bg-gradient-to-r from-pink-300 to-blue-300 px-6 py-3 font-semibold text-white shadow-md transition hover:scale-105"
        >
          Shko te Login
        </Link>
      </section>
    </main>
  );
}
