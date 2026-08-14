// US Mortgage Calculator — C#.
//
//   dotnet run --project examples/sdk
//
// .NET 6 or newer, for top-level statements and System.Net.Http.Json.
// No API key required.

using System.Linq;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

const string Api = "https://www.usmortgagecalc.com/api/v1";

using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };

// Optional. Without it you get the anonymous rate limit, which is generous —
// a key raises the ceiling, it does not grant access.
var key = Environment.GetEnvironmentVariable("USMC_API_KEY");
if (!string.IsNullOrEmpty(key))
{
    client.DefaultRequestHeaders.Authorization = new("Bearer", key);
}

var response = await client.PostAsJsonAsync($"{Api}/calculate-mortgage", new MortgageInput(
    HomePrice: 400_000,
    DownPaymentPercent: 20,
    AnnualInterestRatePercent: 6.5m,
    LoanTermYears: 30,
    State: "Texas"));

var payload = await response.Content.ReadFromJsonAsync<Envelope>()
    ?? throw new InvalidOperationException("Empty response body.");

if (!response.IsSuccessStatusCode)
{
    var error = payload.Error;
    // Code, not Type; offending fields arrive in Issues.
    var fields = string.Join(", ", error?.Issues?.Select(issue => issue.Field) ?? Array.Empty<string>());
    var suffix = fields.Length == 0 ? "" : $" ({fields})";
    throw new InvalidOperationException(
        $"{error?.Code ?? ((int)response.StatusCode).ToString()}: {error?.Message ?? "request failed"}{suffix}");
}

var result = payload.Data ?? throw new InvalidOperationException("Response contained no data.");

Console.WriteLine($"Total monthly cost: ${result.TotalMonthlyCost:N2}");
Console.WriteLine($"  principal & interest ${result.MonthlyMortgage:N2}");
Console.WriteLine($"  property tax         ${result.MonthlyPropertyTax:N2}");

record MortgageInput(
    [property: JsonPropertyName("homePrice")] decimal HomePrice,
    [property: JsonPropertyName("downPaymentPercent")] decimal DownPaymentPercent,
    [property: JsonPropertyName("annualInterestRatePercent")] decimal AnnualInterestRatePercent,
    [property: JsonPropertyName("loanTermYears")] int LoanTermYears,
    [property: JsonPropertyName("state")] string State);

// Calculation endpoints wrap the result as { data, meta }; the GET reference
// endpoints return their object directly.
record Envelope(
    [property: JsonPropertyName("data")] MortgageResult? Data,
    [property: JsonPropertyName("error")] ApiError? Error);

record ApiError(
    [property: JsonPropertyName("code")] string? Code,
    [property: JsonPropertyName("message")] string? Message,
    [property: JsonPropertyName("issues")] ApiIssue[]? Issues);

record ApiIssue(
    [property: JsonPropertyName("field")] string Field,
    [property: JsonPropertyName("message")] string Message);

record MortgageResult(
    [property: JsonPropertyName("monthlyMortgage")] decimal MonthlyMortgage,
    [property: JsonPropertyName("monthlyPropertyTax")] decimal MonthlyPropertyTax,
    [property: JsonPropertyName("monthlyInsurance")] decimal MonthlyInsurance,
    [property: JsonPropertyName("monthlyPmi")] decimal MonthlyPmi,
    [property: JsonPropertyName("totalMonthlyCost")] decimal TotalMonthlyCost,
    [property: JsonPropertyName("loanAmount")] decimal LoanAmount);
