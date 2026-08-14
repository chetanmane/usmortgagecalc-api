// app/tools/mortgage/page.tsx — Next.js App Router.
import Script from "next/script";

export const metadata = {
  title: "Mortgage calculator",
  description: "Work out a full monthly payment including property tax and insurance.",
};

export default function Page() {
  return (
    <main>
      <h1>Work out your monthly payment</h1>

      <div data-usmc-calculator data-state="Ohio" />

      {/*
        lazyOnload keeps the widget off the critical path — it is below the
        fold on most pages and blocking render for it would be a poor trade.

        On a client-side route change the loader has already run, so call
        window.usmcEmbed.mount() from a useEffect in a client component if the
        widget appears on a route the visitor navigates to rather than lands on.
      */}
      <Script src="https://www.usmortgagecalc.com/embed.js" strategy="lazyOnload" />
    </main>
  );
}
