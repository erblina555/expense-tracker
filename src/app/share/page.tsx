"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

const configuredShareUrl = process.env.NEXT_PUBLIC_APP_URL;

export default function SharePage() {
  const [shareUrl, setShareUrl] = useState(() => {
    if (configuredShareUrl) {
      return configuredShareUrl;
    }

    if (typeof window !== "undefined") {
      return window.location.origin;
    }

    return "";
  });
  const [qrCode, setQrCode] = useState("");

  const isLocalhost = useMemo(() => {
    try {
      return new URL(shareUrl).hostname === "localhost";
    } catch {
      return false;
    }
  }, [shareUrl]);

  useEffect(() => {
    if (!shareUrl) {
      return;
    }

    QRCode.toDataURL(shareUrl, {
      color: {
        dark: "#253044",
        light: "#ffffff",
      },
      margin: 1,
      width: 280,
    }).then(setQrCode);
  }, [shareUrl]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fbff] px-6 py-10 text-[#253044]">
      <section className="w-full max-w-md rounded-lg border border-[#f7b7d2] bg-white shadow-sm">
        <div className="rounded-t-lg bg-[#eaf4ff] px-6 py-5">
          <Link className="text-sm font-semibold text-[#8f456f]" href="/login">
            Back
          </Link>
          <h1 className="mt-5 text-2xl font-bold">Share Expense Tracker</h1>
        </div>

        <div className="p-6">
          <label className="block">
            <span className="text-sm font-medium">Web URL</span>
            <input
              className="mt-1 w-full rounded-md border border-[#bdd7fb] bg-[#f7fbff] px-3 py-2.5 outline-none transition focus:border-[#7ba9df] focus:ring-2 focus:ring-[#eaf4ff]"
              onChange={(event) => setShareUrl(event.target.value)}
              value={shareUrl}
            />
          </label>

          {isLocalhost ? (
            <p className="mt-3 rounded-md border border-[#f7b7d2] bg-[#fff0f6] p-3 text-sm text-[#8f456f]">
              Use Network URL, not localhost, for phones.
            </p>
          ) : null}

          <div className="mt-6 flex justify-center rounded-lg border border-[#bdd7fb] bg-[#eaf4ff] p-5">
            {qrCode ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Expense Tracker QR code" src={qrCode} />
            ) : null}
          </div>

          <p className="mt-4 rounded-md border border-[#f7b7d2] bg-[#fff7fb] p-3 text-sm text-[#8f456f]">
            For Vercel hosting, use the Vercel URL. For local testing, the phone
            must be on the same Wi-Fi.
          </p>
        </div>
      </section>
    </main>
  );
}
