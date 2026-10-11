# Annual activity forecasting v1

## Data audit
Read-only production audit on 11 October 2026 found 27 assessments across four accounts. The company schema had no reporting period or business-history identifier. Save timestamps spanned September-October 2026; they cannot be used as observation years. No existing assessment is assigned a year automatically. No customer data is pooled, downloaded for training, or substituted with synthetic observations.

## Intended use and training
This is an exploratory, company-local annual projection, not a validated enterprise forecasting model. It fits ordinary least-squares activity against reporting year separately for electricity, gas, petrol, diesel, flights, hotels, commuting and waste. No dependency installation or paid inference is required. The fitted slope and intercept are recomputed on request from the selected company's data. Year is the only predictor. Production, headcount, weather and operational interventions are not modeled.

Minimum six consecutive completed calendar years, with all eight activities explicitly present and finite/nonnegative. Six is an implementation guardrail, not an evidence-based sufficiency threshold. Real-world reliability remains unevaluated because no eligible dated company history exists at audit time. Synthetic sequences are unit-test fixtures only.

Public national or sector datasets were not substituted for company history: their observation units and boundaries do not match this application. A separately labeled public-data research benchmark may be added later, but would not validate forecasts for individual customers.

## Validation
For each activity, fit on the first three years, predict the fourth, expand and repeat through the penultimate year. Compare mean absolute error with a last-observation baseline. Select linear trend only if its validation MAE is at least 5% lower; otherwise use the baseline. The final year is excluded from model selection and supplies a separate holdout absolute error. Then refit using all years to project the next year. Estimates are clipped at zero.

The final holdout errors are aggregated as the sum of category absolute errors multiplied by current factors, explicitly labeled. This is not the absolute error of the aggregate footprint. Changing factors are not forecast. No probability, confidence score, interval, accuracy percentage or causal feature-importance claim is made.

Method references: Hyndman & Athanasopoulos, Forecasting: Principles and Practice, Chapter 5, benchmarks and time-series cross-validation: https://otexts.com/fpp3/toolbox.html . Linear trend regression: https://otexts.com/fpp3/regression.html . These references describe methods, not validation of CarbonAI.

## Identity and versions
A company-history root is a company row UUID owned by the current account. New assessments must explicitly select the same history, with matching company name, industry and location. A new history is separate even if its company name matches another. Legacy rows without a root remain individual histories until explicitly selected for subsequent assessments.

Within each history, use the latest saved version for older years, never sum repeated annual totals. The opened assessment overrides versions of its own anchor year. Later reporting years are excluded. This is an as-of-reporting-year projection, not a reconstruction of what the system knew at the original save timestamp.

## Deployment
Apply backend/schema/forecast_setup.sql before deploying the code. It adds nullable reporting_year and forecast_series_id plus a check and index; no existing values are changed. Existing RLS remains in force. All new privileged queries additionally filter by the authenticated user's ID. Do not merge until the schema deployment is approved. The SQL setup script is a one-time reviewed change, not a generated Supabase migration-history artifact.

Verify schema columns/constraint/index after applying, then verify account ownership and period assignment on the deployed app. Native browser flows and a real six-year company forecast remain unverified until such history is provided. Historical reassignment is explicit via the Forecast form; calendar-year data only, no monthly/fiscal-year aggregation.
