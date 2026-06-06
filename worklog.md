# Al-Falah Order Booker - Feature Update Worklog

## Date: 2026-06-06 — Connect App to Finexa AFE Website API

## Task Summary
Connected the Order Booker app to the live Finexa AFE website backend at `https://alfalah-traders.vercel.app`. All API calls now go through Next.js rewrites that proxy requests to the website, avoiding CORS issues.

## Changes Made

### 1. next.config.ts — API Proxy Rewrites
- Added `rewrites()` to proxy all `/api/*` requests to `https://alfalah-traders.vercel.app/api/*`
- Special path mapping: `/api/tracking/*` → `/api/route-sessions/*` (website uses different route names)
- This avoids CORS issues since the browser sees same-origin requests

### 2. Local API Routes — Moved to Backup
- Renamed `/src/app/api/` → `/api_local_backup/` (at project root)
- Local SQLite-based API routes are no longer used
- All data now comes from the live PostgreSQL database via the website

### 3. Type Definitions Updated
- `Shop`: `latitude/longitude` → `lat/lng`, `routeDay: string` → `routeDays: string[]`, added `status`, `companyBalances[]`, `assignedOrderbookers[]`
- `Transaction`: `approved: boolean` → `status: string` ("pending"/"approved"/"rejected"), added `previousBalance`, `newBalance`, `approvedBy`, `rejectReason`, `idempotencyKey`, `creator` (instead of nested shop/company)
- `Company`: `shortName/color/active` → `description/distributorPhone/status`
- `ShopNote`: `text` → `note`, added `creatorName`, `updatedAt`
- `ShopVisit`: `userId/visitDate/user` → `orderbookerId/orderbookerName/inRange`
- `DailyTarget`: Added `createdBy`, `createdAt`, `updatedAt`
- `UserObj`: Added `status`, `allRoutesEnabled`, `companyId`, `companies[]`

### 4. API Request Format Changes
- **Tracking Start**: `{ orderbookerId, date, totalShops }` → `{ orderbookerId, startLat?, startLng? }`
- **Tracking Location**: `{ latitude, longitude, routeSessionId }` → `{ lat, lng, sessionId }`
- **Tracking End**: `{ routeSessionId, totalDistance }` → `{ sessionId, totalDistance }`
- **Shop PATCH**: `/api/shops/{id}` with path param → `/api/shops` with `{ id, ...fields }` in body
- **Transaction Create**: Removed `approved: false` and `date`, added `idempotencyKey`
- **Transaction Edit**: `/api/transactions/{id}` → `/api/transactions/edit-pending` with `{ id, amount, updatedBy }`
- **Transaction Delete**: `/api/transactions/{id}` → `/api/transactions?id={id}&deletedBy={userId}`
- **Shop Notes**: `{ text }` → `{ note }`
- **Shop Visits**: `{ userId, visitDate }` → `{ orderbookerId, inRange? }`
- **Companies**: Response mapped from `{ companyId, companyName }` format
- **Visited Status**: Now determined by fetching `/api/visits/recent` instead of `shop.visited` field

### 5. Data Model Mapping in Frontend
- All `shop.latitude/longitude` → `shop.lat/lng` references
- All `tx.approved` → `tx.status === 'approved'` comparisons
- All `note.text` → `note.note` references
- All `v.visitDate` → `v.createdAt` references
- All `tx.date` → `tx.createdAt` references

## Build Status
- ✅ Build passes successfully
- ✅ No local API routes (all proxied to website)
- ✅ All type definitions updated

## Files Changed
- `/home/z/my-project/next.config.ts` — Added rewrites for API proxy
- `/home/z/my-project/src/app/page.tsx` — MAJOR UPDATE (types, API calls, data mapping)

---

## Date: 2025-03-05

## Task Summary
Added all missing features to match the original Finexa AFE app.

## Changes Made

### 1. Prisma Schema Updates (`prisma/schema.prisma`)
- Added `Company` model (name, shortName, color, active)
- Added `ShopCompanyBalance` model (shopId, companyId, balance with unique constraint)
- Added `UserCompany` model (userId, companyId, isPrimary with unique constraint)
- Added `ShopNote` model (shopId, text, createdBy with creator relation)
- Added `ShopVisit` model (shopId, userId, GPS data, visitDate)
- Added `DailyTarget` model (orderbookerId, target, month with unique constraint)
- Updated `User` model: added shopNotes, shopVisits, dailyTargets, userCompanies relations
- Updated `Shop` model: added companyBalances, notes, visits relations
- Updated `Transaction` model: added companyId (optional) and company relation

### 2. New API Routes

#### 2a. Companies API (`/api/companies/route.ts`)
- GET: List all companies, supports ?userId= filter for user's assigned companies
- POST: Create a new company

#### 2b. Shop Notes API (`/api/shops/[id]/notes/route.ts`)
- GET: List notes for a shop (with creator info)
- POST: Add a note to a shop

#### 2c. Change Password API (`/api/auth/change-password/route.ts`)
- POST: Change password (requires userId, currentPassword, newPassword)
- Validates current password with bcrypt, hashes and updates new password

#### 2d. Daily Target API (`/api/users/[id]/daily-target/route.ts`)
- GET: Get daily target for user (current month)
- POST: Set daily target for user (current month, uses upsert)

#### 2e. Shop Visits API (`/api/shops/[id]/visits/route.ts`)
- GET: Get visit history for a shop (last 20, with user info)
- POST: Record a shop visit with GPS data

#### 2f. Updated Seed Route (`/api/seed/route.ts`)
- Added seed data for 3 companies: CBL, Cadbury, Shan Foods
- Added user-company assignments (all users get all companies, CBL as primary)
- Added daily target for current month (Rs. 500,000)
- Added company balances for shops
- Added companyId to some transactions
- Kept existing seed data (users, shops, transactions)

### 3. Frontend Updates (`page.tsx`)

#### 3a. Updated Types
- Added Company, ShopNote, ShopVisit, DailyTarget interfaces
- Added companyId and company to Transaction interface

#### 3b. Profile Page REMAKE
- Green header with "My Profile" title
- User Info Card with avatar (first letter, green-100 rounded-2xl), name, @username, role badge
- Details section with User/Phone/Shield icons
- Stats Grid (3-col): This Month recovery (green), Total Shops (blue), Today recovery (amber)
- Day-wise Performance Card with:
  - Bar chart (7 bars, today in green-600, others in green-200)
  - Day labels (today bold green, others gray)
  - List view: last 7 days with (Today) marker, amounts, tx counts
  - Today's row highlighted with bg-green-50 border-green-200
- Change Password button with modal (current/new/confirm fields)
- Logout Button (red themed with confirmation modal)
- Delete Account Button (subtle, requires typing @username to confirm)

#### 3c. Multi-Company Support
- Company pills filter in RoutePage header (below search)
- Companies fetched from /api/companies?userId=xxx
- Selected company passed to RecoveryModal
- Company dropdown in RecoveryModal (optional)
- companyId included in transaction payload

#### 3d. Shop Notes
- "Notes" button on each shop card in RoutePage
- Opens bottom sheet with existing notes + ability to add new note
- Notes fetched from /api/shops/[id]/notes
- New note submitted via POST

#### 3e. Shop Visit Tracking
- When "Collect Recovery" is clicked, also records ShopVisit via API
- GPS location captured automatically on visit
- In LedgerView, shows last 3 visit dates with GPS location link

#### 3f. Recovery Approval Status
- Transactions submitted with approved: false by default
- Pending (amber) and Approved (green) status badges in LedgerView transactions
- Pending Approval count shown in DashboardPage

#### 3g. Daily Target to Dashboard
- Fetches daily target from /api/users/[id]/daily-target
- Shows progress bar: "Monthly Target: Rs. X / Rs. Y"
- Shows percentage completion
- Monthly recovery fetched separately for accurate calculation

#### 3h. Better Offline Sync
- When submitting recovery offline, adds to proper queue with full payload
- Auto-retry sync when coming back online (via 'online' event listener)
- Persistent banner showing pending count
- Queue entries include shopId, amount, note, gpsLocation, timestamp, companyId

## Build Status
- ✅ Build passes successfully
- ✅ All API routes registered
- ✅ Database seeded with companies, user-company assignments, and daily targets

## Files Changed
- `/home/z/my-project/prisma/schema.prisma` - Schema updates
- `/home/z/my-project/src/app/api/companies/route.ts` - NEW
- `/home/z/my-project/src/app/api/shops/[id]/notes/route.ts` - NEW
- `/home/z/my-project/src/app/api/auth/change-password/route.ts` - NEW
- `/home/z/my-project/src/app/api/users/[id]/daily-target/route.ts` - NEW
- `/home/z/my-project/src/app/api/shops/[id]/visits/route.ts` - NEW
- `/home/z/my-project/src/app/api/seed/route.ts` - UPDATED
- `/home/z/my-project/src/app/page.tsx` - MAJOR UPDATE
