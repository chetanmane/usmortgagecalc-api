// US Mortgage Calculator — Go.
//
//	go run examples/sdk/mortgage.go
//
// Standard library only. No API key required.
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

const api = "https://www.usmortgagecalc.com/api/v1"

type mortgageInput struct {
	HomePrice                 float64 `json:"homePrice"`
	DownPaymentPercent        float64 `json:"downPaymentPercent"`
	AnnualInterestRatePercent float64 `json:"annualInterestRatePercent"`
	LoanTermYears             int     `json:"loanTermYears"`
	State                     string  `json:"state"`
}

type mortgageResult struct {
	MonthlyMortgage    float64 `json:"monthlyMortgage"`
	MonthlyPropertyTax float64 `json:"monthlyPropertyTax"`
	MonthlyInsurance   float64 `json:"monthlyInsurance"`
	MonthlyPmi         float64 `json:"monthlyPmi"`
	TotalMonthlyCost   float64 `json:"totalMonthlyCost"`
	LoanAmount         float64 `json:"loanAmount"`
}

// `code`, not `type`; offending fields arrive in `issues`.
type apiIssue struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type apiError struct {
	Code    string     `json:"code"`
	Message string     `json:"message"`
	Issues  []apiIssue `json:"issues"`
}

// Calculation endpoints wrap the result as {"data": ..., "meta": ...}; the GET
// reference endpoints return their object directly.
type envelope struct {
	Data  mortgageResult `json:"data"`
	Error *apiError      `json:"error"`
}

func call(operation string, input mortgageInput) (*mortgageResult, error) {
	body, err := json.Marshal(input)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest(http.MethodPost, api+"/"+operation, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}

	request.Header.Set("content-type", "application/json")

	// Optional. Without it you get the anonymous rate limit, which is generous —
	// a key raises the ceiling, it does not grant access.
	if key := os.Getenv("USMC_API_KEY"); key != "" {
		request.Header.Set("authorization", "Bearer "+key)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	var payload envelope
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return nil, err
	}

	if response.StatusCode >= 400 {
		if payload.Error != nil {
			fields := make([]string, 0, len(payload.Error.Issues))
			for _, issue := range payload.Error.Issues {
				fields = append(fields, issue.Field)
			}
			suffix := ""
			if len(fields) > 0 {
				suffix = " (" + strings.Join(fields, ", ") + ")"
			}
			return nil, fmt.Errorf("%s: %s%s", payload.Error.Code, payload.Error.Message, suffix)
		}
		return nil, fmt.Errorf("request failed with %d", response.StatusCode)
	}

	return &payload.Data, nil
}

func main() {
	result, err := call("calculate-mortgage", mortgageInput{
		HomePrice:                 400000,
		DownPaymentPercent:        20,
		AnnualInterestRatePercent: 6.5,
		LoanTermYears:             30,
		State:                     "Texas",
	})
	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}

	fmt.Printf("Total monthly cost: $%.2f\n", result.TotalMonthlyCost)
	fmt.Printf("  principal & interest $%.2f\n", result.MonthlyMortgage)
	fmt.Printf("  property tax         $%.2f\n", result.MonthlyPropertyTax)
}
