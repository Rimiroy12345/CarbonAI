"""Account-local annual activity forecasting; no pooled customer or synthetic training."""
import math

CATEGORIES = ('electricity', 'natural_gas', 'petrol', 'diesel', 'air_travel', 'hotels', 'commuting', 'waste')
SCOPES = {key: 1 if key in {'natural_gas', 'petrol', 'diesel'} else 2 if key == 'electricity' else 3 for key in CATEGORIES}
MIN_YEARS = 2

def trend(years, values, target):
    xmean = sum(years) / len(years)
    ymean = sum(values) / len(values)
    denominator = sum((x - xmean) ** 2 for x in years)
    slope = sum((x - xmean) * (y - ymean) for x, y in zip(years, values)) / denominator if denominator else 0
    return max(0.0, ymean + slope * (target - xmean)), slope

def forecast_history(records, factors, selected_id):
    selected = next((row for row in records if row['id'] == selected_id), None)
    if not selected or selected.get('reporting_year') is None:
        return {'status': 'insufficient_history', 'reason': 'Add the reporting year for this assessment first.', 'years_available': 0}
    cutoff = selected['reporting_year']
    versions = {}
    for row in sorted(records, key=lambda row: (row.get('created_at', ''), row['id'])):
        year = row.get('reporting_year')
        if year is not None and year <= cutoff:
            versions[year] = row
    versions[cutoff] = selected  # An explicitly opened version owns its anchor year.
    years = sorted(versions)
    common = {'years_available': len(years), 'reporting_years': years, 'required_years': MIN_YEARS}
    if len(years) < MIN_YEARS:
        return {**common, 'status': 'insufficient_history', 'reason': f'Add at least {MIN_YEARS} consecutive complete annual assessments for this same company. Repeat versions do not add years.'}
    if any(b != a + 1 for a, b in zip(years, years[1:])):
        return {**common, 'status': 'insufficient_history', 'reason': 'Fill gaps between reporting years before forecasting.'}
    for year in years:
        values = versions[year]['values']
        if any(key not in values or not math.isfinite(values[key]) or values[key] < 0 for key in CATEGORIES):
            return {**common, 'status': 'invalid_history', 'reason': f'Review incomplete or invalid activity values for {year}.'}
    if any(key not in factors or not math.isfinite(factors[key]) or factors[key] < 0 for key in CATEGORIES):
        return {**common, 'status': 'invalid_factors', 'reason': 'One or more emission factors is missing or invalid.'}
    if len(years) < 6:
        activities = []
        scopes = {1: 0.0, 2: 0.0, 3: 0.0}
        for key in CATEGORIES:
            latest = versions[cutoff]['values'][key]
            prior = versions[years[-2]]['values'][key]
            emissions = latest * factors[key]
            scopes[SCOPES[key]] += emissions
            activities.append({'category': key, 'scope': SCOPES[key], 'latest_quantity': latest,
                'predicted_quantity': latest, 'predicted_tco2e': round(emissions / 1000, 4),
                'change_tco2e': 0.0, 'historical_change_tco2e': round((latest - prior) * factors[key] / 1000, 4),
                'method': 'last_year_baseline', 'factor': factors[key],
                'unit': {'electricity': 'kWh', 'natural_gas': 'm3', 'petrol': 'litres', 'diesel': 'litres', 'air_travel': 'km', 'hotels': 'nights', 'commuting': 'km', 'waste': 'kg'}[key]})
        total = round(sum(scopes.values()) / 1000, 4)
        return {**common, 'status': 'ready', 'preliminary': True, 'forecast_year': cutoff + 1,
            'current_tco2e': total, 'predicted_tco2e': total,
            'scopes': {str(key): round(value / 1000, 4) for key, value in scopes.items()},
            'activities': activities, 'drivers': [],
            'limitations': ['Preliminary last-year baseline: assumes activity stays unchanged next year.',
                'Two to five years is insufficient for this version’s trend selection and independent holdout testing.',
                'No validated accuracy or uncertainty range is available. Six years enables model comparison.',
                'Current emission factors held constant; intervention effects are not modeled.']}
    activities = []
    scopes = {1: 0.0, 2: 0.0, 3: 0.0}
    total_errors = {'trend': [], 'baseline': []}
    # Reserve the final year as a holdout; select models only on earlier rolling origins.
    for key in CATEGORIES:
        values = [versions[year]['values'][key] for year in years]
        errors = {'trend': [], 'baseline': []}
        for i in range(3, len(years) - 1):
            estimate, _ = trend(years[:i], values[:i], years[i])
            errors['trend'].append(abs(estimate - values[i]))
            errors['baseline'].append(abs(values[i - 1] - values[i]))
        mae = {method: sum(items) / len(items) for method, items in errors.items()}
        method = 'linear_trend' if mae['trend'] < mae['baseline'] * 0.95 else 'last_year_baseline'
        predicted, slope = trend(years, values, cutoff + 1)
        if method == 'last_year_baseline': predicted = values[-1]
        holdout_trend, _ = trend(years[:-1], values[:-1], years[-1])
        holdout_error = abs((holdout_trend if method == 'linear_trend' else values[-2]) - values[-1])
        baseline_error = abs(values[-2] - values[-1])
        total_errors['trend'].append(holdout_error * factors[key])
        total_errors['baseline'].append(baseline_error * factors[key])
        emissions = predicted * factors[key]
        scopes[SCOPES[key]] += emissions
        activities.append({'category': key, 'scope': SCOPES[key], 'unit': {'electricity': 'kWh', 'natural_gas': 'm3', 'petrol': 'litres', 'diesel': 'litres', 'air_travel': 'km', 'hotels': 'nights', 'commuting': 'km', 'waste': 'kg'}[key], 'latest_quantity': values[-1],
            'predicted_quantity': round(predicted, 4), 'method': method, 'annual_trend': round(slope, 4),
            'validation_mae': mae[ 'trend' if method == 'linear_trend' else 'baseline'],
            'baseline_validation_mae': mae['baseline'], 'holdout_absolute_error': holdout_error,
            'baseline_holdout_absolute_error': baseline_error, 'factor': factors[key],
            'predicted_tco2e': round(emissions / 1000, 4),
            'change_tco2e': round((predicted - values[-1]) * factors[key] / 1000, 4)})
    return {**common, 'status': 'ready', 'forecast_year': cutoff + 1,
        'current_tco2e': round(sum(versions[cutoff]['values'][key] * factors[key] for key in CATEGORIES) / 1000, 4),
        'predicted_tco2e': round(sum(scopes.values()) / 1000, 4),
        'scopes': {str(key): round(value / 1000, 4) for key, value in scopes.items()},
        'activities': activities, 'drivers': sorted(activities, key=lambda row: abs(row['change_tco2e']), reverse=True)[:3],
        'holdout_year': cutoff, 'validation_origins': len(years) - 4,
        'holdout_category_error_sum_tco2e': round(sum(total_errors['trend']) / 1000, 4),
        'baseline_holdout_category_error_sum_tco2e': round(sum(total_errors['baseline']) / 1000, 4),
        'limitations': ['Exploratory one-year projection; six years is a minimum guardrail, not evidence of reliability.',
            'Trend uses reporting year only; it does not model production, headcount, weather or interventions.',
            'Current emission factors held constant. This is not a market-based electricity forecast.',
            'No calibrated prediction interval is available. Holdout performance does not guarantee future accuracy.',
            'Zero activity values are treated as confirmed zero; missing activity must be corrected before use.',
            'Older-year versions use the latest saved version; the opened assessment anchors its own reporting year.']}
