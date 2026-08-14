"""US Mortgage Calculator — Python.

    pip install httpx
    python examples/sdk/mortgage.py

No API key required.
"""

from __future__ import annotations

import os

import httpx

API = "https://www.usmortgagecalc.com/api/v1"


def call(client: httpx.Client, operation: str, body: dict) -> dict:
    """POST one calculation.

    Input is validated against a schema before the engine sees it, so a bad
    request names the offending field instead of returning a plausible number
    computed from a coerced value.
    """
    key = os.environ.get("USMC_API_KEY")
    headers = {"authorization": f"Bearer {key}"} if key else {}

    response = client.post(f"{API}/{operation}", json=body, headers=headers, timeout=10)

    if response.status_code >= 400:
        error = response.json().get("error", {})
        # "code", not "type"; offending fields arrive in "issues".
        fields = ", ".join(issue["field"] for issue in error.get("issues", []))
        suffix = f" ({fields})" if fields else ""
        raise RuntimeError(f"{error.get('code', response.status_code)}: {error.get('message')}{suffix}")

    payload = response.json()
    # Calculation endpoints wrap as {"data": ..., "meta": ...}; GET reference
    # endpoints return their object directly.
    return payload.get("data", payload)


def main() -> None:
    with httpx.Client() as client:
        result = call(
            client,
            "calculate-mortgage",
            {
                "homePrice": 400_000,
                "downPaymentPercent": 20,
                "annualInterestRatePercent": 6.5,
                "loanTermYears": 30,
                "state": "Texas",
            },
        )

    print(f"Total monthly cost: ${result['totalMonthlyCost']:,.2f}")
    print(f"  principal & interest ${result['monthlyMortgage']:,.2f}")
    print(f"  property tax         ${result['monthlyPropertyTax']:,.2f}")


if __name__ == "__main__":
    main()
