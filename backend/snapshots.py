from datetime import datetime, timezone

def calculation_snapshot(factors, entries, provenance='at_assessment'):
    return {'version': 1, 'captured_at': datetime.now(timezone.utc).isoformat(),
        'provenance': provenance, 'factors': dict(factors),
        'entries': [{key: row[key] for key in ('category','value','unit')} for row in entries]}

def calculation_source(result, entries, current_factors):
    snapshot = result.get('calculation_snapshot')
    if snapshot:
        return snapshot['entries'], snapshot['factors']
    return entries, current_factors
