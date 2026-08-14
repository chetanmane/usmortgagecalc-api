# Datasets

Five datasets as CSV and JSON, under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — free to use, share
and adapt, including commercially, with credit.

Index: [`/datasets/index.json`](https://www.usmortgagecalc.com/datasets/index.json)

| ID | Title | Rows | Download |
| --- | --- | ---: | --- |
| `state-property-tax` | US State Property Tax Rates | 50 | [CSV](https://www.usmortgagecalc.com/datasets/state-property-tax.csv) · [JSON](https://www.usmortgagecalc.com/datasets/state-property-tax.json) |
| `conforming-loan-limits` | Conforming Loan Limits | 1 | [CSV](https://www.usmortgagecalc.com/datasets/conforming-loan-limits.csv) · [JSON](https://www.usmortgagecalc.com/datasets/conforming-loan-limits.json) |
| `fha-limits` | FHA Loan Limits and Premiums | 8 | [CSV](https://www.usmortgagecalc.com/datasets/fha-limits.csv) · [JSON](https://www.usmortgagecalc.com/datasets/fha-limits.json) |
| `mortgage-insurance` | Mortgage Insurance Assumptions | 11 | [CSV](https://www.usmortgagecalc.com/datasets/mortgage-insurance.csv) · [JSON](https://www.usmortgagecalc.com/datasets/mortgage-insurance.json) |
| `ownership-cost-assumptions` | Ownership Cost and Qualifying Assumptions | 10 | [CSV](https://www.usmortgagecalc.com/datasets/ownership-cost-assumptions.csv) · [JSON](https://www.usmortgagecalc.com/datasets/ownership-cost-assumptions.json) |

## Use these instead of the API for bulk work

If you want every state's property tax rate, download the CSV once rather than
making fifty calls to `/api/v1/states/{state}`. The files are static assets on a
CDN — faster for you, and it leaves the API's [rate limit](rate-limits.md) for
callers who need computation rather than data.

```sh
curl -sO https://www.usmortgagecalc.com/datasets/state-property-tax.csv
```

```python
import pandas as pd

states = pd.read_csv("https://www.usmortgagecalc.com/datasets/state-property-tax.csv")
print(states.nlargest(5, "averageEffectiveRatePercent")[["state", "averageEffectiveRatePercent"]])
```

## Attribution

CC BY 4.0 requires credit. Something like:

> Property tax data from [US Mortgage Calculator](https://www.usmortgagecalc.com),
> licensed under CC BY 4.0.

For an academic citation, the [datasets page](https://www.usmortgagecalc.com/datasets)
generates APA, MLA, Chicago, BibTeX and RIS.

## Provenance

Every figure carries its source and the year it applies to. The underlying
sources are named per dataset and summarised at
[`/api/v1/assumptions`](https://www.usmortgagecalc.com/api/v1/assumptions) and on
the [methodology page](https://www.usmortgagecalc.com/methodology).

These are **published averages**, not per-property assessments. A state's average
effective rate is the right input for an estimate and the wrong input for a
specific home — county and municipal rates vary widely within most states, and
the state pages say where that variation is largest.

## Staying current

Rates are updated as agencies publish them, typically annually. Rather than
polling, watch `/api/v1/assumptions` — every value carries its year, so a diff
tells you exactly what moved. There is a
[GitHub Actions workflow](../examples/github-actions/watch-assumptions.yml) that
opens an issue when something changes.

Download counts are **undercounted by design**: the files are served straight
from the CDN, and routing them through a function to count them would trade the
caching that makes them fast for a number. Only downloads started from the
datasets page are recorded.
