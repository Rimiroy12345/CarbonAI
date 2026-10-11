"""Bounded retries for idempotent database/auth reads only."""
from functools import wraps
from time import sleep
from httpx import ConnectError, ConnectTimeout, ReadError, ReadTimeout, RemoteProtocolError

TRANSIENT_READ_ERRORS = (ConnectError, ConnectTimeout, ReadError, ReadTimeout, RemoteProtocolError)

def retry_data_reads(operation):
    @wraps(operation)
    def wrapped(*args, **kwargs):
        for attempt in range(3):
            try:
                return operation(*args, **kwargs)
            except TRANSIENT_READ_ERRORS:
                if attempt == 2:
                    raise
                sleep(0.25 * (attempt + 1))
    return wrapped
