import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fbff] px-6 py-10 text-[#253044]">
      <section className="mx-auto flex max-w-5xl flex-col gap-10">
        <nav className="flex items-center justify-between">
          <p className="text-lg font-semibold text-[#5e6f95]">
            Expense Tracker
          </p>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-md border border-[#f7b7d2] bg-white px-4 py-2 text-sm font-semibold text-[#8f456f] shadow-sm transition hover:bg-[#fff0f6]"
              href="/share"
            >
              Share
            </Link>
            <Link
              className="rounded-md bg-[#9ec9ff] px-4 py-2 text-sm font-semibold text-[#253044] shadow-sm transition hover:bg-[#8bbcff]"
              href="/login"
            >
              Login
            </Link>
          </div>
        </nav>

        <div className="grid gap-8 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase text-[#d56f9f]">
              Personal budget app
            </p>
            <h1 className="max-w-2xl text-4xl font-bold tracking-normal md:text-5xl">
              Menaxho shpenzimet dhe merr alarm kur i afrohesh buxhetit.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#66738c]">
              Shto shpenzime, kategorizoji dhe shiko ne dashboard sa afer je
              me limitin mujor.
            </p>
            <Link
              className="mt-8 inline-flex rounded-md bg-[#f7b7d2] px-5 py-3 text-sm font-semibold text-[#253044] shadow-sm transition hover:bg-[#f4a6c8]"
              href="/login"
            >
              Fillo tani
            </Link>
          </div>

          <div className="rounded-lg border border-[#dbeafe] bg-white/90 p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-semibold">Muaji aktual</p>
              <span className="rounded bg-[#eaf4ff] px-2 py-1 text-sm text-[#4b79b7]">
                280 EUR / 300 EUR
              </span>
            </div>
            <div className="h-3 rounded bg-[#fce7f3]">
              <div className="h-3 w-[93%] rounded bg-[#9ec9ff]" />
            </div>
            <p className="mt-4 rounded-md bg-[#fff4fa] p-3 text-sm text-[#9b4f78]">
              Po i afrohesh limitit te buxhetit.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
