# RockHound-GO Architecture & Backend/Frontend Boundaries

## Overview

RockHound-GO is a unified field intelligence platform built with a clear separation of concerns between backend and frontend systems.

**Primary User Workflows:**
1. Discover a place (Explore)
2. Scan a specimen (Scan)
3. Save it to collection (Collection)
4. Learn what it means (Field notes, safety, provenance)
5. Share, trade, or plan next hunt (Market, Community)

---

## Primary Navigation (5 Tabs)

```
Hub → Explore → Scan → Collection → Market
```

- **Hub**: Command center with Field Core, companion status, mission shortcuts
- **Explore**: Map-first site discovery with offline packs
- **Scan**: Camera-first specimen identification
- **Collection**: Personal geological vault
- **Market**: Premium listings with provenance

---

## Secondary Systems (Not Primary Tabs)

- **Field Core**: Integrated into Hub. Handles offline-first database, sync queue, field packs, and future hardware.
- **Clover**: Contextual AI assistant overlay across Hub, Explore, Scan, Collection.
- **Community**: Kept as secondary feature inside Market or future dedicated tab.
- **Safety**: Global persistent action, not a dedicated tab.
- **Profile/Settings/Legal**: Top-right profile drawer.
- **Admin/Docs**: Developer tools only, not in user nav.

---

## Backend Authority (What Backend MUST Own)

The backend is the single source of truth for all critical app state.

### Authentication & Authorization
- User sessions and token validation
- Role-based access control
- User account creation and management
- Email verification and password reset

### Data Persistence
- All permanent record writes (Specimens, Findings, Listings, Orders, etc.)
- Database write authority
- Conflict resolution for sync conflicts
- Field Pack metadata and validation

### AI & Analysis
- Scan image uploads
- Mineral identification deep analysis (LLM, CV models)
- Confidence score generation
- Field test recommendations
- Provenance analysis

### Marketplace & Payments
- Stripe webhook handling
- Payment processing and subscription management
- Order state management
- Escrow and transaction safety
- Seller trust scores and verification

### Safety & Compliance
- Land access rules and legal data validation
- Safety hazard database
- Private/protected area boundaries
- Moderation and report handling
- Compliance warnings for restricted zones

### Media Management
- Image uploads and storage
- Signed temporary URLs for downloads
- Image optimization and resizing
- Private media access control

### Sync & Conflict Resolution
- Sync queue processing
- Conflict detection and resolution rules
- Merge strategy authority
- Offline draft validation

---

## Frontend Authority (What Frontend MAY Own)

The frontend handles user interaction, display, and local optimization.

### User Interface
- Component rendering
- Page navigation
- Modal and drawer management
- Form validation (client-side only, pre-submit validation)
- Status indicator updates

### Camera & Media Capture
- Live camera feed display
- Photo/video capture API
- Local preview display
- File picking for upload

### Offline Workflow
- Local draft creation (ScanDraft, SpecimenDraft)
- Local queue display (read-only)
- Offline Field Pack display (cached, read-only)
- Local specimen search (cached, read-only)

### Maps & Geolocation
- Map rendering (Leaflet, Mapbox, etc.)
- User location display
- Site proximity indicators
- Offline tile cache display

### Optimistic UI
- Immediate UI updates before network roundtrip
- Draft status indicators
- Loading states
- Sync status badges

### Local Privacy Indicators
- "Data queued" badges
- "Offline mode" labels
- "Synced" checkmarks
- Timestamp indicators

### Animations & Haptics
- Page transitions
- Result reveals
- Touch feedback
- Haptic pulses on actions

---

## Frontend Must NOT Contain

**Never place these in frontend code:**

- ❌ Stripe secret keys or webhook secrets
- ❌ API secret keys
- ❌ Admin-only permissions logic
- ❌ Payment entitlement decisions
- ❌ Permanent trust/provenance decisions
- ❌ Final AI confidence authority
- ❌ Private moderation logic
- ❌ Unrestricted database write access
- ❌ Hidden premium unlock logic
- ❌ Hardcoded sensitive endpoints
- ❌ User role overrides
- ❌ Direct database queries (except via SDK)

**Why:** Frontend code is shipped to users' browsers and can be inspected/modified. Never trust it for security decisions.

---

## Data Flow Architecture

### Standard Field Workflow

```
User Action (Capture, Input, etc.)
    ↓
Save Local Draft
    ↓
Show Optimistic UI
    ↓
Queue for Sync
    ↓ (when online)
Backend Validates & Processes
    ↓
Resolve Any Conflicts
    ↓
Update Cloud Database
    ↓
Return Result
    ↓
Refresh Local Cache
```

### Scan Workflow Example

```
User Opens Camera
  ↓
Live Camera Feed (Frontend)
  ↓
User Captures Photo
  ↓
Save ScanDraft Locally (Frontend)
  ↓
Show Quick Loading UI (Frontend)
  ↓
Upload Image to Backend
  ↓
Backend: Create Deep Analysis Job (Backend)
  ↓
Backend: Run LLM/CV Analysis (Backend)
  ↓
Return Candidates & Metadata (Backend)
  ↓
Display Results (Frontend)
  ↓
User Saves to Collection
  ↓
Save Finding Locally (Frontend)
  ↓
Queue Sync Event (Frontend)
  ↓
Backend: Validate & Persist Finding (Backend)
  ↓
Mark Finding as Synced (Frontend)
```

### Explore Map + Offline Packs

```
User Opens Explore
  ↓
Load Local Cached Map Region (Frontend)
  ↓
Load Hotspot List from Cache (Frontend)
  ↓
If Online: Stream Updated Site Data (Backend)
  ↓
User Selects Site
  ↓
Show Site Details + Safety Badges (Frontend)
  ↓
User Taps "Save Offline Pack"
  ↓
Queue Pack Save Event (Frontend)
  ↓
Backend: Validate Pack Scope & Generate Manifest (Backend)
  ↓
Return Pack Manifest (Backend)
  ↓
Cache Pack Locally (Frontend)
```

### Collection Syncing

```
User Adds Finding to Collection
  ↓
Save Finding Draft Locally (Frontend)
  ↓
Show "Syncing…" Badge (Frontend)
  ↓
Backend: Validate Finding Data (Backend)
  ↓
Backend: Resolve Any Conflicts (Backend)
  ↓
Backend: Persist Finding (Backend)
  ↓
Return Sync Confirmation (Backend)
  ↓
Update Local Finding Status to "Synced" (Frontend)
```

---

## Backend Service Layer

Use this service-layer structure:

```
/auth                    — User session, tokens, roles
/users                   — Profile, preferences, privacy
/sites                   — Hotspots, localities, access data
/field-packs             — Offline pack manifests, tile caching
/scan-jobs               — Image analysis, job status
/findings                — Specimen records, collection
/sync                    — Queue processing, retry logic
/market                  — Listings, seller profiles
/orders                  — Payments, escrow, fulfillment
/reports                 — Moderation, safety reports
/media                   — Uploads, signed URLs, optimization
/clover                  — Assistant context, field guidance
```

---

## Frontend Route Structure

```
/                        — Hub (mission control)
/explore                 — Map & site discovery
/scan                    — Camera & identification
/collection              — Personal vault
/market                  — Listings & marketplace
/profile                 — User account drawer
/settings                — Preferences
/admin                   — Developer tools (admin only)
/docs                    — API documentation (admin only)
```

---

## Visual & UX Principles

- **Dark Crystalline Base**: Deep navy/black with cyan/violet highlights
- **High Contrast Text**: White on dark for field readability
- **Large Touch Targets**: 44px minimum for mobile
- **Field-Ready Typography**: Clear, bold sans-serif
- **Status Indicators**: Pulse badges for sync, offline, pending
- **Progressive Disclosure**: Show only what's needed now
- **Consistent Component System**: One button style, one card style, etc.

---

## Security Model

### Frontend
- Display user content
- Validate input before submit
- Cache public/user data locally
- Show status indicators
- Perform no security decisions

### Backend
- Authenticate user
- Validate all input
- Check permissions
- Manage secrets
- Resolve conflicts
- Return signed URLs for media
- Log all sensitive actions

---

## Offline-First Rules

1. **Explore**: Works fully offline with cached tiles + hotspot list
2. **Scan**: Supports local draft capture, queues for cloud analysis
3. **Collection**: Displays cached findings, queues mutations
4. **Field Core**: Manages sync queue, conflict detection, pack storage
5. **Safety**: Works offline with cached hazard data

---

## Performance Targets

- Tap response: < 100ms
- Screen transition: < 250ms
- Camera first frame: < 800ms
- Quick ID (local): ~ 1.5s
- Deep ID (cloud): ~ 6s
- Cached list/search: < 800ms
- Field Pack load: < 300ms

---

## Future Expansion

- **AR Mineral Overlay**: Integrated into Scan after phase 1
- **Portable Field Core Hardware**: Concept in Field Core panel
- **Community Trading**: Phase 2, built on Market foundation
- **Real-Time Clover Training**: Phase 2, LLM fine-tuning

---

## Summary

**Backend**: Is the authoritative source for all critical decisions, security, payments, and data persistence.

**Frontend**: Provides the beautiful, fast, field-ready interface while deferring all critical logic to the backend.

This architecture ensures RockHound-GO remains secure, scalable, and user-focused.