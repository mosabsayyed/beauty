from fastapi import HTTPException


def assert_userid_matches(payload: dict, current_user_id: int):
    """
    If the incoming payload includes a `user_id` field, assert it matches
    the authenticated `current_user_id`. Raise HTTPException(403) if mismatch.
    This helper is intentionally small and explicit; endpoints that accept
    a `user_id` in the body should call it to enforce the policy described
    in `docs/MULTI-USER_SUPPORT.md`.
    """
    if not payload or not isinstance(payload, dict):
        return
    supplied = payload.get('user_id')
    if supplied is None:
        return
    try:
        if int(supplied) != int(current_user_id):
            raise HTTPException(status_code=403, detail="user_id in body does not match authenticated user")
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid user_id in request body")
