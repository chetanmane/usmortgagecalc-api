/**
 * US Mortgage Calculator — TypeScript.
 *
 *   npx tsx examples/sdk/mortgage.ts
 *
 * Types are written out here for readability. For a full typed client generated
 * from the specification, see examples/agent-tools or run:
 *   npx openapi-typescript https://www.usmortgagecalc.com/openapi.json -o api.d.ts
 */

const API = "https://www.usmortgagecalc.com/api/v1";

interface MortgageInput {
  homePrice: number;
  downPaymentPercent: number;
  annualInterestRatePercent: number;
  loanTermYears: number;
  state: string;
}

interface MortgageResult {
  monthlyMortgage: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyPmi: number;
  totalMonthlyCost: number;
  loanAmount: number;
  totalInterestPaid: number;
}

interface ApiError {
  error: { code?: string; message?: string; issues?: { field: string; message: string }[] };
}

/** Calculation endpoints return { data, meta }; reference endpoints do not. */
type Envelope<T> = { data: T; meta?: Record<string, unknown> };

async function call<T>(operation: string, body: unknown): Promise<T> {
  const key = process.env.USMC_API_KEY;

  const response = await fetch(`${API}/${operation}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(key ? { authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as Envelope<T> & Partial<ApiError>;

  if (!response.ok) {
    // `code`, not `type`; offending fields arrive in `issues[]`.
    const { code, message, issues } = payload.error ?? {};
    const fields = issues?.map((issue) => issue.field).join(", ");
    throw new Error(
      `${code ?? response.status}: ${message ?? "request failed"}${fields ? ` (${fields})` : ""}`,
    );
  }

  return payload.data ?? (payload as unknown as T);
}

const input: MortgageInput = {
  homePrice: 400_000,
  downPaymentPercent: 20,
  annualInterestRatePercent: 6.5,
  loanTermYears: 30,
  state: "Texas",
};

const result = await call<MortgageResult>("calculate-mortgage", input);

console.log(`Total monthly cost: $${result.totalMonthlyCost.toFixed(2)}`);
console.log(`  principal & interest $${result.monthlyMortgage.toFixed(2)}`);
console.log(`  property tax         $${result.monthlyPropertyTax.toFixed(2)}`);
