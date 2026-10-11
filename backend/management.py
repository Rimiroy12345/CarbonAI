"""Management view permissions and summaries; account ownership remains mandatory."""

def management_access(user):
    metadata = getattr(user, 'app_metadata', None) or {}
    # Existing accounts are individual workspace owners. Never use user_metadata.
    role = metadata.get('carbonai_role', 'owner')
    return role in {'owner', 'management'} and not getattr(user, 'is_anonymous', False)

def summarize(data, previous=None):
    rows = data['activities']
    scopes = {str(scope): round(sum(row['emissions_kgco2e'] for row in rows if row['scope'] == scope) / 1000, 4) for scope in [1,2,3]}
    total = sum(row['emissions_kgco2e'] for row in rows) / 1000
    drivers = sorted(rows, key=lambda row: row['emissions_kgco2e'], reverse=True)[:3]
    comparison = None
    if previous:
        old = previous['total_kgco2e'] / 1000
        comparison = {'previous_year': previous['reporting_year'], 'previous_tco2e': round(old,4),
            'change_tco2e': round(total-old,4), 'change_pct': round((total-old)/old*100,1) if old else None}
    return {'reporting_year': data.get('reporting_year'), 'scopes': scopes, 'current_tco2e': round(total,4),
        'drivers': drivers, 'comparison': comparison,
        'method_note': 'Scope totals use each assessment’s saved factors where available; older unsaved assessments use current factors. Annual comparisons may reflect both activity and factor changes. Changes are not verified intervention impact.'}
