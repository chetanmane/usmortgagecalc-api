/**
 * US Mortgage Calculator — JavaScript.
 *
 *   node examples/sdk/mortgage.js
 *
 * Node 18+ for the built-in fetch. No dependencies, no API key.
 */

const API = "https://www.usmortgagecalc.com/api/v1";

/**
 * Calculation endpoints wrap their result as { data, meta }; `meta` carries the
 * assumptions that were applied. The GET reference endpoints return their
 * object directly, so unwrap only where there is a wrapper.
 */
async function call(operation, body) {
  const response = await fetch(`${API}/${operation}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Optional. Without it you get the anonymous rate limit, which is
      // generous — a key raises the ceiling, it does not grant access.
      ...(process.env.USMC_API_KEY ? { authorization: `Bearer ${process.env.USMC_API_KEY}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();

  if (!response.ok) {
    // `code`, not `type` — and the offending fields arrive in `issues[]` rather
    // than a single `field`. Reading the wrong names silently yields undefined,
    // which is how these examples shipped saying "undefined: ..." on any error.
    const { code, message, issues } = payload.error ?? {};
    const fields = issues?.map((issue) => issue.field).join(", ");
    throw new Error(
      `${code ?? response.status}: ${message ?? "request failed"}${fields ? ` (${fields})` : ""}`,
    );
  }

  return payload.data ?? payload;
}

const result = await call("calculate-mortgage", {
  homePrice: 400_000,
  downPaymentPercent: 20,
  annualInterestRatePercent: 6.5,
  loanTermYears: 30,
  state: "Texas",
});

console.log(`Total monthly cost: $${result.totalMonthlyCost.toFixed(2)}`);
console.log(`  principal & interest $${result.monthlyMortgage.toFixed(2)}`);
console.log(`  property tax         $${result.monthlyPropertyTax.toFixed(2)}`);
