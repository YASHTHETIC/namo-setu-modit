"""Decisive DB-location probe: is the journey's data in .local-test/modit.db?"""
import sqlite3

ORDER_ID = "c9a3222c-eb14-444a-9e8c-f41945cfcc01"
conn = sqlite3.connect(r".local-test/modit.db")
cur = conn.cursor()

# all modit_* tables
tables = sorted(t[0] for t in cur.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'modit_%'"))
print("modit tables:", tables)

# search every table for the journey order id
for (t,) in cur.execute("SELECT name FROM sqlite_master WHERE type='table'"):
    try:
        cols = [c[1] for c in cur.execute(f"PRAGMA table_info({t})")]
        if not cols:
            continue
        n = cur.execute(f"SELECT COUNT(*) FROM {t} WHERE id = ?", (ORDER_ID,)).fetchone()[0]
        if n:
            print(f"FOUND order id in table {t}")
    except sqlite3.OperationalError:
        pass

# rows in candidate tables
for t in ("orders", "modit_payments", "modit_reviews"):
    try:
        print(t, "rows:", cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0])
    except sqlite3.OperationalError as e:
        print(t, "err:", e)
conn.close()
