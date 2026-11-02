> Latest review: the editor was rebuilt around a neutral toolbar, labeled catalog, and grouped view controls. The earlier feature issues were also addressed. See the [current issue table](portfolio-issues.md#follow-up-fixes-and-final-review) for evidence and remaining limits. Older sections below describe the history of the work.

# Fix status and next work

The latest portfolio-focused pass is recorded in the [issue difficulty table](portfolio-issues.md). Production service work below is not required for this student demonstration.

Updated 2 November 2026. This follows the original developer and user review. It describes the local checkout, including existing editor changes that were already in progress.

## Completed in this pass

- Removed account gating and the Puter browser SDK. The workshop opens without a password or consent popup.
- Rebuilt the landing page, workshop, navigation, footer, and project entry with SVG plans, existing interior images, and an interactive material board. No 3D scene is loaded for the landing page or tool selector.
- Stored projects and preferences in this browser. Saved snapshots update the main project record immediately, so navigation cannot cancel a pending save. Existing matching local backups can be recovered. Cloud-only records are not imported.
- Added a visible save failure state and removed the unsupported Cloud Sync ON message.
- Made New plan create a fresh project. A missing project no longer restores a different latest backup.
- Disabled automatic public-room collaboration.
- Replaced simulated settings saves with real local persistence. The profile starts empty instead of using someone else's details.
- Replaced the contact form's fake sent state with a downloadable message draft. It explicitly says nothing was sent.
- Allowed same-origin camera access and repaired stream attachment and cleanup. Camera tracking and room dimensions are explicitly labeled as samples.
- Replaced simulated supplier ordering with a CSV planning-list download. Removed claims about placed orders, free shipping, reservations, and referral payments.
- Corrected the CSV column order and quoted special characters. Text that could become a spreadsheet formula is escaped.
- Moved project detail pages under /community/[projectId]. Unknown top-level URLs return 404.
- Replaced the fake community feed and creators with a local gallery. Gallery previews draw saved wall geometry. Make a copy creates a new project ID before opening the editor.
- Removed the shared index requirement for listing local projects, avoiding lost entries from concurrent index writes.
- Added server-side generation polling with signed, expiring job links. Provider credentials stay on the server. The status handling follows the [Replicate prediction lifecycle](https://replicate.com/docs/topics/predictions/create-a-prediction). Pending, failed, canceled, unsupported-output, and successful jobs have distinct outcomes. Failed jobs do not insert a fallback asset.
- Labeled catalog model fallbacks honestly. Added image size and type checks and API input validation. Live generation requires an image and explicit ENABLE_PAID_GENERATION=true. It stays off by default for the open-access prototype.
- Added a scrolling drawing toolbar on narrow screens and made the project panel available on mobile. Moved the panel below the toolbar after a browser test caught blocked export tabs. Closed panels are removed from keyboard navigation. Tool buttons retain labels and keyboard focus.
- Removed unsupported compliance claims from the layout checks and PDF export. These are preliminary design checks, not a construction approval.
- Removed the obsolete ESLint ignore file and changed the Vitest configuration to an ES module, removing those warnings.
- Fixed clipboard feedback so success appears only after the copy completes.

## What was verified

All 36 tests pass, including local storage, backup recovery, independent project records, immediate snapshots, gallery visibility, CSV escaping, generation input checks, signed job access, processing states, and failed jobs. The production build and TypeScript check pass. Lint passes without warnings.

The browser check completed the landing palette interaction, workshop entry, creation of a new plan, drawing a wall, local persistence, reload, dashboard listing, a separate fresh plan, profile persistence, saved gallery geometry, a separate project copy, message draft download, and a real 404. It also checked four routes at 390 pixels wide and exercised mobile navigation. No account or collaboration requests and no uncaught page errors were observed in that check.

A second targeted browser check covers the material planning download and camera preview using a simulated browser camera. This is not a real-device scan test.

The installed React Doctor diff scan reports 46/100 with 636 warnings in the changed checkout. The score matches the earlier diff scan, but the file set differs. This is still a backlog of diagnostic leads, not a clean health report. Many relate to existing editor structure and Three.js JSX. Do not interpret passing helper tests as proof that every drawing or 3D workflow works.

The build still reports the Edge static-generation notice and the existing XR CommonJS/ES module warning.

## Larger items to work through together

### Cloud accounts and project sharing

Current behavior is intentionally local and open access. Real accounts need a database, an ownership model, storage migration, public-read rules, and a recovery plan. Decide whether public sharing is needed before selecting that architecture. Existing cloud-only Puter projects need an explicit export or migration path.

### Measured room scanning and furniture detection

The camera preview works, but its markers and sample room are demonstrations. Accurate scanning needs a supported hardware/browser target, real plane or depth acquisition, calibration, and field tests. Choose the target devices first. A desktop fake camera cannot validate measurement accuracy.

### Paid AI generation

The request and polling path is implemented and tested with controlled responses. It still needs a chosen model/version, valid provider credentials, a real image-to-model acceptance test, and model quality checks. Add durable quotas and spending limits before enabling it for public use. The current in-memory rate limit cannot enforce a reliable production budget across instances.

### Supplier ordering and contact delivery

The app now exports planning quantities and message drafts honestly. Real orders need supplier contracts or APIs, live prices, tax and shipping rules, checkout, and payment handling. Contact delivery needs a real recipient, a delivery service, and spam controls. Keep these as exports until those decisions are made.

### CAD interoperability and full design correctness

The existing DXF and IFC helper tests pass, but that does not prove every roof, stair, opening, storey, or material survives an export/import round trip. Use a small set of real architectural fixtures and select external viewers for acceptance tests. The saved gallery preview currently shows walls, not a complete renderer of doors, materials, and 3D furniture.

### Full mobile drafting and accessibility

The navigation, entry pages, toolbar, and project panel have been improved. Drawing a complete plan with touch, rotating 3D scenes, using a screen reader, and operating every dense editor panel still need task-based testing. A mobile layout screenshot is not a substitute for those tests.

### React diagnostics and editor structure

Triage the remaining warnings by real impact. Start with reproducible state bugs and unlabeled controls, then break up large panels and reduce broad store subscriptions. Three.js elements need a separate review because some DOM lint rules do not apply to scene objects. Do not blanket-disable the rules or rewrite the entire editor only to raise a score.

### Product and policy copy

The redesigned entry points use plain, honest copy. Older marketing and policy pages still need a content pass against the local-only product. Privacy, terms, pricing, and compliance claims should describe the service actually provided. Those pages should be settled before a public launch.

## Repeat the checks

Run npm test, npm run lint, npx tsc --noEmit, and npm run build. Start a production preview on 127.0.0.1:3110, then run node scripts/verify-workshop.mjs and node scripts/verify-isolated-fixes.mjs.

No paid inference, real purchase, actual message delivery, real camera capture, or cloud publication was performed in this pass.


## Latest architecture pass

The [root fix report](architecture-root-fixes.md) supersedes older notes above about saving, room topology, scale calibration, and IFC opening relationships. The current suite has 55 passing tests. The complete portfolio walkthrough and calibrated manual reference reload check pass. The gallery now shows rooms, openings, and furniture; the supporting pages have been rewritten for the student project.

The landing page and workshop now use the requested brown clay style. Updated desktop and mobile images are linked in the README. Real measurement, arbitrary blueprint recognition, live AI quality, full external CAD round trips, touch drafting, and the remaining React/accessibility findings are still separate work.


The final built-app revision passes 77 tests, TypeScript, lint without warnings, and the optimized build. The targeted model/layout checks and the complete portfolio walkthrough also pass. React Doctor 0.9.22 reports 60/100 with 19 findings and no errors. The [final review](portfolio-verification/final-review.json) records the accepted visual scope and external checks still needed.
