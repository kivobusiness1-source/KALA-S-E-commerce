# Task 8-9: Enhance Partner Dashboard & Admin Commissions Section

## Agent: main

## Summary
Completed both PART A (Enhanced Partner Dashboard) and PART B (Admin Partners & Commissions Section).

## Files Modified
1. `src/components/storefront/AffiliateDashboard.tsx` — Complete rewrite with tabs (Aperçu/Ventes/Commissions), period filter, commission detail breakdown, sales summary, commissions history with pagination
2. `src/components/admin/types.ts` — Added 'partners' Section type, Affiliate, Commission, AffiliatePayout, CommissionStatus types
3. `src/app/admin/page.tsx` — Added "Partenaires" nav item with Handshake icon, PartnersSection import and rendering
4. `src/app/api/affiliate-stats/route.ts` — Enhanced to support `allCommissions=1` param for returning all commissions (up to 500)

## Files Created
1. `src/components/admin/PartnersSection.tsx` — Full admin partners management component with:
   - PartnersList: search, pagination, create dialog, toggle active/inactive
   - PartnerDetail: info card, inline edit, commission summary, commissions table with admin actions, payout history, create payout dialog
2. `src/app/api/admin/partners/route.ts` — Admin partners API:
   - GET: list affiliates (with search/pagination) OR single affiliate (with payouts)
   - POST: create affiliate (admin sets code, name, email, commissionRate, password)
   - PUT: update affiliate OR create payout (action: 'createPayout')

## Key Decisions
- Partner dashboard uses client-side pagination and period filtering (period filter computes from all commissions fetched)
- Period filter supports: Aujourd'hui, Cette semaine, Ce mois, Tout
- Commission status transitions enforced at API level: pending→validated/cancelled, validated→paid/cancelled
- Payout creation is atomic (within DB transaction) — creates payout record and decrements paidEarnings
- All amounts in FCFA, all UI in French
- Partner can ONLY VIEW data, admin can manage everything

## API Endpoints
- `GET /api/admin/partners` — List affiliates (admin only)
- `GET /api/admin/partners?id=X` — Single affiliate detail
- `GET /api/admin/partners?id=X&payouts=1` — Affiliate with payouts
- `POST /api/admin/partners` — Create affiliate
- `PUT /api/admin/partners` — Update affiliate or create payout
- `GET /api/commissions` — List commissions (admin only, already existed)
- `PUT /api/commissions` — Update commission status (admin only, already existed)
- `GET /api/affiliate-stats?allCommissions=1` — Affiliate stats with all commissions

## Testing
- Homepage compiles: `GET / 200`
- Admin page compiles: `GET /admin 200`
- API endpoints respond correctly (401 for unauthenticated)
- All existing lint issues are pre-existing (not from this task)
