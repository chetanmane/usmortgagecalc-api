<?php
/**
 * US Mortgage Calculator — PHP.
 *
 *   php examples/sdk/mortgage.php
 *
 * Uses cURL, which ships with most PHP installations. No API key required.
 */

declare(strict_types=1);

const API = 'https://www.usmortgagecalc.com/api/v1';

/**
 * POST one calculation.
 *
 * Calculation endpoints wrap the result as ['data' => ..., 'meta' => ...]; the
 * GET reference endpoints return their object directly, so unwrap only where
 * there is a wrapper.
 *
 * @param array<string, mixed> $body
 * @return array<string, mixed>
 */
function call(string $operation, array $body): array
{
    $headers = ['content-type: application/json'];

    // Optional. Without it you get the anonymous rate limit, which is generous —
    // a key raises the ceiling, it does not grant access.
    $key = getenv('USMC_API_KEY');
    if ($key !== false && $key !== '') {
        $headers[] = 'authorization: Bearer ' . $key;
    }

    $handle = curl_init(API . '/' . $operation);
    curl_setopt_array($handle, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => json_encode($body, JSON_THROW_ON_ERROR),
        CURLOPT_TIMEOUT => 10,
    ]);

    $raw = curl_exec($handle);
    if ($raw === false) {
        $message = curl_error($handle);
        curl_close($handle);
        throw new RuntimeException('Request failed: ' . $message);
    }

    $status = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    curl_close($handle);

    $payload = json_decode((string) $raw, true, 512, JSON_THROW_ON_ERROR);

    if ($status >= 400) {
        $error = $payload['error'] ?? [];
        // 'code', not 'type'; offending fields arrive in 'issues'.
        $fields = implode(', ', array_column($error['issues'] ?? [], 'field'));
        $suffix = $fields === '' ? '' : ' (' . $fields . ')';
        throw new RuntimeException(
            ($error['code'] ?? (string) $status) . ': ' . ($error['message'] ?? 'request failed') . $suffix
        );
    }

    return $payload['data'] ?? $payload;
}

$result = call('calculate-mortgage', [
    'homePrice' => 400000,
    'downPaymentPercent' => 20,
    'annualInterestRatePercent' => 6.5,
    'loanTermYears' => 30,
    'state' => 'Texas',
]);

printf("Total monthly cost: \$%s\n", number_format((float) $result['totalMonthlyCost'], 2));
printf("  principal & interest \$%s\n", number_format((float) $result['monthlyMortgage'], 2));
printf("  property tax         \$%s\n", number_format((float) $result['monthlyPropertyTax'], 2));
