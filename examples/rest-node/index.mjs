/**
 * Calling the US Mortgage Calculator REST API from Node.
 *
 *   node examples/rest-node/index.mjs
 *
 * Requires Node 18 or newer for the built-in fetch. No dependencies, no key.
 */

const API = "https://www.usmortgagecalc.com/api/v1";

/**
 * One request, with the error shape handled properly.
 *
 * The API validates input against a schema before the engine sees it, so a bad
 * request comes back with the offending field named rather than as a plausible
 * number computed from a coerced value. Surfacing that beats a generic throw.
 */
async function call(operation, body) {
  const response = await fetch(`${API}/${operation}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json();

  if (!response.ok) {
    const { type, message, field } = payload.error ?? {};
    throw new Error(`${type ?? response.status}: ${message ?? "request failed"}${field ? ` (${field})` : ""}`);
  }

  // Calculation endpoints wrap the result as { data, meta }; `meta` carries the
  // assumptions that were applied. The GET reference endpoints below return
  // their object directly, so unwrap only where there is a wrapper.
  return payload.data ?? payload;
}

const money = (value) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/* ------------------------------------------------------- a single payment */

const payment = await call("calculate-mortgage", {
  homePrice: 400_000,
  downPaymentPercent: 20,
  annualInterestRatePercent: 6.5,
  loanTermYears: 30,
  state: "Texas",
});

console.log("Monthly payment in Texas");
console.log("  principal & interest ", money(payment.monthlyMortgage));
console.log("  property tax         ", money(payment.monthlyPropertyTax));
console.log("  home insurance       ", money(payment.monthlyInsurance));
console.log("  mortgage insurance   ", money(payment.monthlyPmi));
console.log("  total                ", money(payment.totalMonthlyCost));

/* ------------------------------ the same house in the cheapest state, and the dearest */

const states = await call("list-states", {});

const sorted = [...states.states].sort((a, b) => a.avgTaxRate - b.avgTaxRate);
const cheapest = sorted[0];
const dearest = sorted[sorted.length - 1];

const compare = await Promise.all(
  [cheapest, dearest].map((state) =>
    call("calculate-mortgage", {
      homePrice: 400_000,
      downPaymentPercent: 20,
      annualInterestRatePercent: 6.5,
      loanTermYears: 30,
      state: state.state,
    }).then((result) => ({ state: state.state, rate: state.avgTaxRate, result })),
  ),
);

console.log("\nThe same $400,000 house, lowest versus highest property tax");
for (const row of compare) {
  console.log(`  ${row.state.padEnd(14)} ${String(row.rate).padStart(5)}%  ${money(row.result.totalMonthlyCost)}/mo`);
}

const gap = compare[1].result.totalMonthlyCost - compare[0].result.totalMonthlyCost;
console.log(`  difference     ${money(gap)}/mo — ${money(gap * 12)} a year`);

/* ------------------------------------------- what the engine assumed, with sources */

const assumptions = await fetch(`${API}/assumptions`).then((response) => response.json());

console.log("\nPublished assumptions applied above");
for (const entry of assumptions.figures.slice(0, 4)) {
  console.log(`  ${entry.key.padEnd(38)} ${entry.value}${entry.unit === "percent" ? "%" : ""}  (${entry.source}, ${entry.asOf})`);
}
