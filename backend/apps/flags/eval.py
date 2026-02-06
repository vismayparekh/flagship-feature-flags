import hashlib

def stable_percent(user_key: str, flag_key: str) -> int:
    raw = f"{user_key}:{flag_key}".encode("utf-8")
    h = hashlib.sha256(raw).hexdigest()
    n = int(h[:8], 16)
    return n % 100  # 0..99

def clause_match(user: dict, clause: dict) -> bool:
    attr = clause.get("attr")
    op = clause.get("op")
    values = clause.get("values", [])
    if not attr or not op:
        return False
    v = user.get(attr)
    if op == "equals":
        return v in values
    if op == "in":
        return v in values
    if op == "contains" and isinstance(v, str):
        return any(str(x).lower() in v.lower() for x in values)
    return False

def rule_matches(user: dict, clauses: list) -> bool:
    for c in clauses or []:
        if not clause_match(user, c):
            return False
    return True
