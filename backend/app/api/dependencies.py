from __future__ import annotations

"""
Compatibility layer for API endpoints.

Several endpoints import `from app.api import dependencies` and expect a `get_db`
dependency. The canonical DB session dependency lives in `app.db.session`.
"""

from app.db.session import get_db_session

# Keep the import style stable for existing endpoints:
# `Depends(dependencies.get_db)`
get_db = get_db_session

