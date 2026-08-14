import { useEffect, useRef, useState } from "react";

const ORIGIN = "https://www.usmortgagecalc.com";

/**
 * The US Mortgage Calculator widget, self-sizing.
 *
 * The origin check is the important line: postMessage delivers from anywhere,
 * and a listener that trusts any sender is a listener any page can drive.
 */
export function MortgageCalculator({ state, price, rate }) {
  const frame = useRef(null);
  const [height, setHeight] = useState(720);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== ORIGIN) return;
      if (event.data?.type !== "usmc:height") return;
      if (event.source !== frame.current?.contentWindow) return;

      const next = Number(event.data.height);
      if (Number.isFinite(next) && next > 0) setHeight(Math.ceil(next));
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const params = new URLSearchParams({ utm_source: "embed" });
  if (state) params.set("state", state);
  if (price) params.set("price", String(price));
  if (rate) params.set("rate", String(rate));

  return (
    <iframe
      ref={frame}
      src={`${ORIGIN}/embed/calculator?${params}`}
      title="US Mortgage Calculator"
      loading="lazy"
      style={{ width: "100%", height, border: 0, display: "block" }}
    />
  );
}
