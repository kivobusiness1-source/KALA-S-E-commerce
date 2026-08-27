# Task r3-admin - Admin Features Agent Work Record

## Changes Made

### 1. Image Upload API
- Created `/src/app/api/upload/route.ts`
- POST endpoint accepting FormData with 'image' field
- Admin auth required via cookie + validateSession
- Validates file type (jpeg, png, webp) and size (max 5MB)
- Saves to `/public/uploads/` with unique filename (Date.now() + random)
- Returns `{ success: true, data: { url: '/uploads/filename.ext' } }`

### 2. Product Image Upload in Admin Dialogs
- Added `uploadingImage` state to ProductsSection
- Added image upload field at top of product create/edit dialog
- Shows image preview with X button to remove when editing product with existing image
- File input accepts jpeg, png, webp
- Uploads to `/api/upload` and sets `editingProduct.image` on success
- Added `image: editingProduct?.image || null` to the product save body
- Product table already had conditional image rendering (from r3-storefront task)

### 3. Admin User Management in Settings
- Created `/src/app/api/admin/users/route.ts`
  - GET: List all admins (id, email, name, role, createdAt) - auth required, excludes password
  - POST: Create new admin (email, name, password) - super_admin only, Zod validated
- Expanded SettingsSection with:
  - `AdminUser` interface
  - Admin users query (enabled only for super_admin)
  - Admin users table showing Email, Nom, Rôle, Date de création
  - "Ajouter" button opens dialog with name, email, password, confirm password
  - Client-side validation (required fields, password match, min 8 chars)
  - Role badges (Super Admin vs Admin with different colors)
  - Only visible when current admin has super_admin role

### Files Modified
- `/src/app/api/upload/route.ts` (NEW)
- `/src/app/api/admin/users/route.ts` (NEW)
- `/src/app/admin/page.tsx` (MODIFIED - image upload + admin user management)
- `/public/uploads/` (CREATED directory)

### Lint Result
- Zero ESLint errors
