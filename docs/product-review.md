# Developer and user review

Historical baseline. See [fix status](fix-status.md) for changes made after this review.

Reviewed on 2 November 2026. This review covers the local checkout and a production preview, not a live deployment. Product fixes are proposed below for owner review. This commit updates documentation and adds a repeatable browser review; it does not implement the proposed product changes.

## Verdict on the earlier assessment

The assessment points toward real trust, saving, camera, and collaboration problems. Its detailed report was not included in the attachment, so its 52 user issues and 35 developer issues cannot be verified one by one. The attachment is a command transcript and summary, not evidence for every claim.

The claim that the project route overrides other pages is inaccurate. Named pages still load. The root dynamic project route catches unknown single-part paths and returns a project loading view with HTTP 200. That is a navigation and error-handling problem, not a takeover of existing named routes.

Do not use a React Doctor score as a release decision by itself. The installed version 0.2.16 reported 39/100 and 1,956 warnings across 480 files, including code under references/. This differs from the earlier 20/100 result and is not a comparable app-only measurement. Diagnostics are leads that need code review.

## What feels good

The warm colors and clear tool cards give the product a consistent look. The home page makes the main entry points visible. The editor hub groups the five tools well. Shared scene state, local floor plan backup, geometry helpers, and export libraries provide a useful foundation.

The experience is not ready to call smooth end to end. Several actions promise results they do not deliver, and a first-time visitor can hit a cloud consent prompt before reaching a blank plan. Fix reliability and honest feedback before adding more tools.

## Validation performed

- TypeScript: `npx tsc --noEmit` completed without errors.
- Lint: `npm run lint` completed without code errors. ESLint warns that .eslintignore is unsupported.
- Tests: `npm test` passed all 20 tests across six files. These cover geometry, snapping, vectorization, quantities, DXF, and IFC helpers. They do not cover the complete user journey.
- Production build: `npm run build` passed. It warns about Edge static generation and CommonJS loading the XR ES module.
- React Doctor: installed version 0.2.16 completed. Its broad scan includes reference projects and needs a narrower scope before using the score to track progress.
- Browser: 12 desktop routes and four mobile route visits returned HTTP 200, with no uncaught page errors during the observation windows. The unknown URL returning 200 is itself a finding. No page-level horizontal overflow was detected at 1440 x 1000 or 390 x 844 in those visits.
- Screenshots were visually inspected. Floor plan entry displayed a Puter consent overlay while initializing. The browser text snapshot does not include all content inside that external overlay.

The first restricted test/build attempts failed because of file permissions. Rerunning with normal access passed. Those failures were environment problems, not test failures in application logic.

Raw browser observations are in [browser-review.json](browser-review.json). Repeat with `scripts/review-smoke.mjs` against a running production preview. The check visits pages; it does not prove drawing, saving, exporting, or account services work.

## Findings and proposed fixes

### 1. Shared editing can mix unrelated projects

Priority: P0, resolve before private project use. Confirmed in `lib/multiplayer.ts`, with the hook mounted by `components/editor/EditorCanvas.tsx`.

Every client constructs the same public room, domus-ai-room-alpha, at module load. There is no project or membership boundary. Local and remote object changes share the same map. This creates a credible risk of unwanted object sharing and deletion between editors.

Fix: disable automatic collaboration first. Add explicit opt-in, project-specific rooms, verified membership, and provider cleanup before enabling it again. Avoid using a project ID alone as permission to join.

Check: two unrelated projects never exchange objects. Authorized members of one project can join and leave without duplicate objects or deletion loops. Closing a project closes its provider.

### 2. Cloud access interrupts the first design

Priority: P1. Observed in the browser on `/floor-plan`; entry logic is in `app/(editor)/floor-plan/page.tsx` and `lib/puter.ts`.

A new visitor gets a Puter consent overlay while the workspace is still initializing. The page calls cloud project helpers during startup. The observed page text remained in initialization during the short capture window. This does not establish an infinite hang, but it does interrupt the first task.

Fix: open a local blank plan immediately. Ask for cloud access when the user chooses cloud save. Offer clear local-only, retry, and sign-in choices. Keep cloud requests out of the critical path to drawing.

Check: in a clean browser with cloud access denied, a visitor can draw, reload, and recover a local plan. A slow cloud service must not block the editor.

### 3. Saving does not distinguish local backup from cloud success

Priority: P1. Confirmed in `app/(editor)/floor-plan/page.tsx`, `components/dashboard/DashboardClient.tsx`, and `lib/puter.ts`.

The floor plan sets the saved time after writing a local backup, then awaits saveProject without checking its boolean result. The dashboard displays Cloud Sync ON without checking cloud state. Users cannot tell where their work is safe.

Fix: show separate local and cloud states, check save results, retry failures, and preserve local changes until confirmed. Do not show cloud success for a local-only backup.

Check: disconnect during editing. Local save succeeds and cloud failure remains visible. Reconnect and confirm the same project reaches cloud storage without losing changes.

### 4. A missing project can load a different local backup

Priority: P1. Confirmed in `app/(editor)/floor-plan/page.tsx`.

If cloud loading fails, the restore path tries the requested backup and then domus_latest_project. It does not verify that the latest backup matches the requested project ID. A link to one project can restore another project's contents.

Fix: restore only a backup whose ID matches the requested project. Offer recovery of other backups as an explicit separate action. Distinguish unavailable cloud data from a genuinely missing project.

Check: create projects A and B, make B the latest backup, then open A with cloud access unavailable. B must never appear under A's identity.

### 5. Contact and settings report success without persistence

Priority: P1. Confirmed in `components/contact/ContactForm.tsx` and `app/(dashboard)/settings/page.tsx`.

Contact uses a timer to show Message Sent. Settings uses a timer to show saved feedback and starts with hardcoded profile details. Neither handler saves the requested data.

Fix: connect each action to a real service and acknowledge success only after confirmation. Until then, label the interface as a preview and remove misleading success states. Load real profile details or a clear empty form.

Check: a contact request produces an actual stored submission. A saved profile survives reload and sign-in on another device. Service errors preserve input and show a retry action.

### 6. Camera access is blocked by the app's own policy

Priority: P1. Confirmed in `next.config.ts` and `components/editor/ArMap/CameraDetector.tsx`.

Permissions-Policy sets camera=(), while the camera tool asks for a video stream. The page policy denies camera access even when a visitor wants to allow it.

Fix: allow camera for the intended origin and only request permission after a clear user action. Show useful messages for denied permission, unsupported browsers, and missing hardware.

Check: camera permission can be granted on a supported secure origin. Denial produces a usable recovery message. Test on real mobile hardware.

### 7. Scan, procurement, and generation claims exceed their results

Priority: P1. Confirmed in `app/(editor)/ar-map/page.tsx`, `components/editor/FloorPlanEngine/ResultsPanel.tsx`, and `app/api/generate-3d/route.ts`.

The scan handler uses fixed room geometry. Procurement transitions to success after a timer. Generation can return a bundled furniture model, and the image fallback message says it synthesized a mesh from the uploaded photo. These results can mislead people about measured geometry, purchases, and original model creation.

Fix: clearly label sample scans and catalog matches. Replace simulated procurement with an honest quantity or purchase-list export until real ordering exists. Keep measured, generated, and sample results visibly distinct.

Check: no sample flow claims that a room was measured or an order was placed. A fallback explicitly identifies the catalog asset used.

### 8. Live 3D generation has an incomplete polling path

Priority: P1. Confirmed by code review in `app/api/generate-3d/route.ts` and `components/editor/FurnitureSwap/TrellisGenerator.tsx`. A paid provider call was not executed.

The server returns a provider polling URL. The browser fetches it once without the server credential, does not wait through processing states, and can substitute a fallback model. A working submission alone does not establish a working generation flow.

Fix: poll through a server endpoint with provider credentials kept on the server. Validate prediction ownership, bound retries, and handle processing, failed, canceled, and completed states explicitly.

Check: exercise each provider state with controlled responses, then perform one authorized live generation. Failed jobs must not be shown as original generated assets.

### 9. Public project viewing and forking need real data transfer

Priority: P1. Confirmed in `lib/puter.ts` and `app/(community)/[projectId]/page.tsx`; cross-account behavior needs validation.

The community list uses account KV helpers rather than a demonstrated public backend. The detail page passes only type and title into its visualizer, not the saved scene. Fork & Open links to a tool without a source project ID or a clone operation.

Fix: define public read permissions, render the saved project data, and create a distinct copy before opening the fork. Keep private projects inaccessible.

Check: publish from account A, view from account B, fork, and edit the copy. Geometry must match the source and edits must not change the original.

### 10. Unknown URLs enter project loading instead of a normal missing page

Priority: P2. Browser confirmed `/review-missing-page` returns 200 and project loading text. Route: `app/(community)/[projectId]/page.tsx`.

Fix: move detail URLs under `/community/[projectId]`, update links, and use a real missing-page response for absent projects. Preserve old valid links with a deliberate redirect strategy if required.

Check: named pages still work, valid project links open, and unknown URLs return 404 without asking for cloud access.

### 11. Index updates can overwrite concurrent changes

Priority: P2. Confirmed by code inspection in `lib/puter.ts`. The race was not reproduced live.

Project and community indexes use read-modify-write arrays. Two concurrent saves can read the same index and overwrite each other's new entry. Saving the project and updating its index are separate operations, so partial success is also possible.

Fix: use transactional storage or an atomic index operation. Add reconciliation for orphaned records and define recovery for partial writes.

Check: save two new projects concurrently and verify both remain listed. Inject an index failure and confirm the saved record can be recovered.

### 12. Mobile readiness and accessibility need task-based checks

Priority: P2. No page-level overflow was detected in four mobile visits, but that measurement does not establish usable controls. Several tools use fixed-width panels, canvas controls, and dense icon actions.

Fix: test the actual design task at phone widths. Use drawers for side panels, visible labels for key actions, clear keyboard focus, and comfortable touch targets. Reduce jargon such as spatial coordinate registry in user-facing loading messages.

Check: with touch and keyboard, start a plan, choose a tool, edit an object, undo, and save without hidden controls or blocked scrolling. Check contrast and screen-reader names. Do not mark this complete from screenshots alone.

## Suggested order

1. Stop automatic shared-room access.
2. Make local first use, project identity, and save status reliable.
3. Remove false success claims and repair the camera policy.
4. Complete live generation and public project data flows.
5. Improve mobile task completion, error pages, accessibility, and diagnostic scope.

## Limits and release checks still needed

No paid AI requests, real purchases, message deliveries, cloud writes, or hardware scans were performed as part of this review. Authenticated cross-account access, real XR devices, large IFC files, export round trips in other CAD tools, and multi-user editing remain unverified. Page loads and 20 helper tests do not justify claiming the full product works.

Before a release, verify one complete journey: start a local plan, draw walls and openings, place furniture, switch to 3D, undo and redo, save, reload, export, and reopen the exported file in another viewer. Repeat with offline access and on a phone. Record failures separately from unsupported device features.

Existing application edits were present in the working tree during review. They are outside this documentation commit and were left intact. Test results describe the checkout reviewed, not a clean remote revision or a guarantee about later concurrent edits.
