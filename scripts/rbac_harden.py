#!/usr/bin/env python3
"""
Security audit fix: server-side RBAC enforcement across admin API routes.
Inserts hasAdminRole() checks after every admin-session 401 gate.
Idempotent: skips if a hasAdminRole check already follows the anchor.
"""
import re
import sys
from pathlib import Path

BASE = Path('/home/z/my-project')

STAFF = "['super_admin', 'admin', 'staff']"
ADMIN = "['super_admin', 'admin']"

# (file, anchor_regex, session_var, roles, response_style)
# response_style: 'err' -> err('...', 403) | 'nr' -> NextResponse.json(..., 403)
# block anchors end with '{' -> insert after the matching closing '}' line
TASKS = [
    ('src/app/api/products/route.ts',            r"if \(!admin\) return err\('Unauthorized', 401\)", 'admin', STAFF, 'err'),
    ('src/app/api/products/[id]/route.ts',       r"if \(!admin\) return err\('Unauthorized', 401\)", 'admin', STAFF, 'err'),
    ('src/app/api/stock/[productId]/route.ts',   r"if \(!session\) \{", 'session', STAFF, 'err'),
    ('src/app/api/stock-history/route.ts',       r"if \(!session\) \{", 'session', STAFF, 'nr'),
    ('src/app/api/site-settings/route.ts',       r"if \(!admin\) return err\('Unauthorized', 401\)", 'admin', ADMIN, 'err'),
    ('src/app/api/emails/route.ts',              r"if \(!admin\) return err\('Unauthorized', 401\)", 'admin', ADMIN, 'err'),
    ('src/app/api/contact/route.ts',             r"if \(!admin\) return err\('Unauthorized', 401\)", 'admin', STAFF, 'err'),
    ('src/app/api/reviews/route.ts',             r"if \(!admin\) return err\('Non autorisé', 401\)", 'admin', STAFF, 'err'),
    ('src/app/api/reviews/[id]/route.ts',        r"if \(!admin\) return err\('Non autorisé', 401\)", 'admin', STAFF, 'err'),
    ('src/app/api/messages/route.ts',            r"if \(!admin\) return err\('Unauthorized', 401\)", 'admin', STAFF, 'err'),
    ('src/app/api/messages/[id]/route.ts',       r"if \(!admin\) return err\('Unauthorized', 401\)", 'admin', STAFF, 'err'),
    ('src/app/api/livreurs/route.ts',            r"if \(!session\) return NextResponse\.json\(\{ success: false, error: 'Non autorisé' \}, \{ status: 401 \}\)", 'session', ADMIN, 'nr'),
    ('src/app/api/wholesale/products/route.ts',  r"if \(!admin\) return err\('Unauthorized', 401\)", 'admin', ADMIN, 'err'),
    ('src/app/api/wholesale/products/[id]/route.ts', r"if \(!admin\) return err\('Unauthorized', 401\)", 'admin', ADMIN, 'err'),
    ('src/app/api/wholesale/payment-methods/route.ts', r"if \(!admin\) return err\('Unauthorized', 401\)", 'admin', ADMIN, 'err'),
    ('src/app/api/wholesale/payment-methods/[id]/route.ts', r"if \(!admin\) return err\('Unauthorized', 401\)", 'admin', ADMIN, 'err'),
    ('src/app/api/wholesale/seed/route.ts',      r"if \(!admin\) return err\('Unauthorized', 401\)", 'admin', ADMIN, 'err'),
    ('src/app/api/admin/partner-products/route.ts', r"if \(!admin\) return err\('Non autorisé', 401\)", 'admin', ADMIN, 'err'),
    ('src/app/api/upload/route.ts',              r"if \(!admin\) return err\('Non autorisé', 401\)", 'admin', STAFF, 'err'),
    ('src/app/api/activity/route.ts',            r"if \(!admin\) \{", 'admin', ADMIN, 'nr'),
]


def add_import(src: str) -> str:
    def repl(m):
        names = [n.strip() for n in m.group(1).split(',') if n.strip()]
        if 'hasAdminRole' not in names:
            names.append('hasAdminRole')
        return "import { " + ', '.join(names) + " } from '@/lib/auth'"
    return re.sub(r"import \{([^}]*)\} from '@/lib/auth'", repl, src, count=1)


def guard_line(var: str, roles: str, style: str, indent: str) -> str:
    if style == 'err':
        return f"{indent}if (!hasAdminRole({var}, {roles})) return err('Accès refusé pour votre rôle', 403)"
    return f"{indent}if (!hasAdminRole({var}, {roles})) return NextResponse.json({{ success: false, error: 'Accès refusé pour votre rôle' }}, {{ status: 403 }})"


def process(rel: str, anchor: str, var: str, roles: str, style: str) -> tuple[str, int, int]:
    path = BASE / rel
    src = path.read_text(encoding='utf-8')
    original = src
    lines = src.split('\n')
    out = []
    inserted = 0
    skipped = 0
    i = 0
    while i < len(lines):
        line = lines[i]
        out.append(line)
        if re.search(anchor, line):
            indent = line[:len(line) - len(line.lstrip())]
            nxt = lines[i + 1] if i + 1 < len(lines) else ''
            if 'hasAdminRole' in nxt:
                skipped += 1
            elif line.rstrip().endswith('{'):
                # block anchor: copy until closing '}' at same indent, then insert
                out.append(nxt)
                i += 1
                while i + 1 < len(lines) and lines[i].strip() != '}':
                    out.append(lines[i + 1])
                    i += 1
                out.append(guard_line(var, roles, style, indent))
                inserted += 1
            else:
                out.append(guard_line(var, roles, style, indent))
                inserted += 1
        i += 1
    src = '\n'.join(out)
    if inserted and 'hasAdminRole' not in src.split('\n')[0:20].__str__():
        pass
    if inserted and "hasAdminRole" not in re.search(r"import \{[^}]*\} from '@/lib/auth'", src).group(0):
        src = add_import(src)
    elif inserted:
        src = add_import(src)  # add_import is idempotent (checks membership)
    if src != original:
        path.write_text(src, encoding='utf-8')
    return rel, inserted, skipped


results = []
for task in TASKS:
    try:
        results.append(process(*task))
    except Exception as e:
        results.append((task[0], -1, str(e)))

for rel, ins, skip in results:
    status = 'OK' if ins > 0 else ('SKIP' if ins == 0 else 'ERROR')
    print(f"{status:6} {rel}  (+{ins} guards, {skip} already present)")
print('DONE')
