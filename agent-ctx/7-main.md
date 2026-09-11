# Task 7 - Main Agent Work Record

## Task: Add promo/affiliate code support to checkout flow and capture ?ref= URL parameter + variant selector

### Changes Made

#### 1. Cart Store (`src/stores/cart-store.ts`)
- Added `affiliateCode: string | null` and `affiliateName: string | null` state
- Added `setAffiliateCode(code, name?)` and `clearAffiliateCode()` actions
- Added `variantId` and `variantName` optional fields to `CartItem` interface
- Updated `addItem` to use composite key (`id_variantId`) for variant-aware cart uniqueness

#### 2. StorefrontLayout (`src/components/storefront/StorefrontLayout.tsx`)
- Added `useEffect` on mount to capture `?ref=` URL parameter
- Stores ref code in `localStorage` (key: `kalas_affiliate_ref`) and cookie (30-day expiry)
- Validates code via `/api/affiliate-validate` and stores partner name
- Cleans URL after capture using `history.replaceState`
- Falls back to localStorage if no `?ref=` but stored code exists
- Updated `handleOrderSubmit` to include `affiliateCode` and `variantId` in POST body
- Passes affiliate store props to CartSheet

#### 3. CartSheet (`src/components/storefront/CartSheet.tsx`)
- Added promo/affiliate code input UI in both cart sheet footer and order dialog
- French labels: "Code promo partenaire" with "Appliquer"/"OK" button
- Green `CheckCircle2` with partner name when code is valid
- Red `XCircle` error message when code is invalid
- Remove button (trash icon) to clear applied code
- `Badge` showing applied code in order summary (Recapitulatif)
- Added variant selector state (`selectedVariantId`) for product detail dialog
- Variant buttons with "Standard" default + variant name & price
- "Ajouter au panier" passes variant-adjusted price and image to cart
- Resets variant state when dialog closes

#### 4. Products API (`src/app/api/products/route.ts`)
- Added `variants: { where: { isActive: true }, orderBy: { name: 'asc' } }` to include variants

#### 5. Types (`src/components/storefront/types.ts`)
- Added `ProductVariantType` interface
- Added `variants`, `packSize`, `packPrice`, `commissionPerUnit` fields to `ProductType`

#### 6. ProductsSection (`src/components/storefront/ProductsSection.tsx`)
- Created `VariantSelector` component for reusable variant toggle buttons
- Refactored product card into `ProductCard` component with variant state
- Variant selection toggles displayed price, image, and stock status
- Shows variant name next to price when selected

### API Endpoints Used
- `GET /api/affiliate-validate?code=XXX` — validates affiliate code (already existed)
- `POST /api/orders` — now receives `affiliateCode` and `variantId` (already supported)

### Testing Results
- Homepage loads: 200 OK
- Products API with variants: 200 OK (5 products, first has 2 variants)
- Affiliate validate: 200 OK with `valid: true` for known codes
- `?ref=` parameter capture works (URL cleaned after capture)
- All lint errors are pre-existing (not from this task)
