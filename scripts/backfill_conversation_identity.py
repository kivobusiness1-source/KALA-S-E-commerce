"""
One-time backfill: populate customerName/customerEmail on Conversation rows
that have a `customer-{id}` sessionId but missing identity fields.
Idempotent - safe to re-run.
"""
import sqlite3

DB_PATH = '/home/z/my-project/db/custom.db'

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Find conversations missing name or email with customer-{id} session
    cur.execute(
        "SELECT id, sessionId, customerName, customerEmail FROM Conversation "
        "WHERE (customerName IS NULL OR customerEmail IS NULL) "
        "AND sessionId LIKE 'customer-%'"
    )
    rows = cur.fetchall()
    print(f"Conversations needing backfill: {len(rows)}")

    updated = 0
    for conv_id, session_id, name, email in rows:
        cust_id = session_id.replace('customer-', '', 1)
        if not cust_id:
            continue
        cur.execute("SELECT name, email FROM Customer WHERE id = ?", (cust_id,))
        cust = cur.fetchone()
        if cust:
            new_name = name or cust[0]
            new_email = email or cust[1]
            cur.execute(
                "UPDATE Conversation SET customerName = ?, customerEmail = ? WHERE id = ?",
                (new_name, new_email, conv_id),
            )
            updated += 1
            print(f"  Updated {conv_id}: name={new_name!r}, email={new_email!r}")
        else:
            print(f"  No Customer found for {cust_id} (conversation {conv_id})")

    conn.commit()

    # Report final state
    cur.execute("SELECT sessionId, customerName, customerEmail FROM Conversation")
    print("\nFinal conversation state:")
    for row in cur.fetchall():
        print(f"  {row}")
    conn.close()
    print(f"\nDone: {updated} conversation(s) updated.")

if __name__ == '__main__':
    main()
