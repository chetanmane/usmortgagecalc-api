"""Calling the US Mortgage Calculator REST API from Python.

    pip install httpx
    python examples/rest-python/main.py

No API key. Nothing is stored server-side.
"""

from __future__ import annotations

import csv
import io

import httpx

API = "https://www.usmortgagecalc.com/api/v1"
SITE = "https://www.usmortgagecalc.com"


def call(client: httpx.Client, operation: str, body: dict) -> dict:
    """POST one calculation.

    Input is validated against a schema before the engine sees it, so a bad
    request names the offending field instead of returning a plausible number
    computed from a coerced value. Worth surfacing rather than swallowing.
    """
    response = client.post(f"{API}/{operation}", json=body, timeout=10)

    if response.status_code >= 400:
        error = response.json().get("error", {})
        field = f" ({error['field']})" if error.get("field") else ""
        raise RuntimeError(f"{error.get('type', response.status_code)}: {error.get('message')}{field}")

    payload = response.json()
    # Calculation endpoints wrap the result as {"data": ..., "meta": ...}.
    return payload.get("data", payload)


def money(value: float) -> str:
    return f"${value:,.0f}"


def main() -> None:
    with httpx.Client() as client:
        # ---------------------------------------------------- one payment
        payment = call(
            client,
            "calculate-mortgage",
            {
                "homePrice": 400_000,
                "downPaymentPercent": 10,
                "annualInterestRatePercent": 6.5,
                "loanTermYears": 30,
                "state": "New Jersey",
            },
        )

        print("A $400,000 house in New Jersey, 10% down")
        for label, key in [
            ("principal & interest", "monthlyMortgage"),
            ("property tax", "monthlyPropertyTax"),
            ("home insurance", "monthlyInsurance"),
            ("mortgage insurance", "monthlyPmi"),
            ("total", "totalMonthlyCost"),
        ]:
            print(f"  {label:<22}{money(payment[key])}")

        # ------------------------------------- when does the PMI stop
        pmi = call(
            client,
            "calculate-pmi",
            {
                "homePrice": 400_000,
                "downPaymentPercent": 10,
                "annualInterestRatePercent": 6.5,
                "loanTermYears": 30,
            },
        )
        request_month = pmi.get("monthsToRequestTermination")
        auto_month = pmi.get("monthsToAutomaticTermination")
        print(
            f"\nPMI: request cancellation at month {request_month}, "
            f"automatic at month {auto_month}"
        )
        print(f"  asking rather than waiting saves {money(pmi.get('savingsFromCancellation', 0))}")

        # ------------------------------- the dataset, straight into csv
        # CC BY 4.0 — free to reuse, credit required. Citation formats for
        # every dataset are at /datasets.
        response = client.get(f"{SITE}/datasets/state-property-tax.csv", timeout=20)
        response.raise_for_status()

        rows = list(csv.DictReader(io.StringIO(response.text)))
        dearest = sorted(rows, key=lambda r: float(r["avg_effective_tax_rate_percent"]))[-3:]

        print(f"\nHighest effective property tax rates ({len(rows)} states in the dataset)")
        for row in reversed(dearest):
            print(f"  {row['state']:<16}{row['avg_effective_tax_rate_percent']:>6}%")


if __name__ == "__main__":
    main()
