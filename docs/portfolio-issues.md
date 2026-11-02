# Portfolio issue table

Difficulty is an estimate from 1 (small, isolated edit) to 10 (research, hardware, or a large redesign). Ratings cover a portfolio demonstration, not a production service. The earlier pass fixed the original rows at 5 or below for the tested portfolio workflow. The follow-up review found additional unresolved issues listed below. This is not a claim that every possible input or device has been verified.

| Issue | Difficulty / 10 | Resolution | Status |
| --- | ---: | --- | --- |
| No ready-made demonstration project | 3 | Add a furnished example that opens as a separate local project | Fixed and verified |
| Undo counts selection and tool changes | 4 | Record only actual design changes and clear history when changing projects | Fixed and verified |
| Room detection loses names after wall edits | 5 | Build a planar graph at T junctions and crossings, then retain named room metadata | Fixed and verified |
| Export notifications cover export buttons | 2 | Move notifications and keep panel content within its scroll area | Fixed and verified |
| 3D view can crash when changing tools | 4 | Remove incompatible optional scene acceleration | Fixed and verified |
| Material preview differs from applied finish | 4 | Use the same built-in color and surface settings in preview and scene | Fixed and verified |
| Materials disappear or leak across projects | 5 | Save material definitions per project and restore only that project's definitions | Fixed and verified |
| Furniture and material edits can be lost between tools | 5 | Use one validated, versioned document capture and save adapter across tools | Fixed and verified |
| Imported furniture breaks after reload | 4 | Store self-contained GLB data instead of temporary object URLs | Fixed and verified |
| Blueprint accepts unreadable PDFs and leaks previews | 3 | Accept supported images, bound size, release old previews, explain PDF conversion | Fixed and verified |
| Blueprint scale control has no real reference | 4 | Calibrate between two measured points and save an image reference for manual tracing | Fixed and verified |
| Black-and-white or empty blueprints give false results | 4 | Fix the threshold and show an error instead of inventing a room | Fixed and verified |
| Sample furniture looks like original AI output and hits a demo quota | 3 | Explain catalog matching and apply quotas only to enabled live generation | Fixed and verified |
| Gallery omits rooms, openings, and furnishings | 4 | Render saved room labels, wall colors, openings, and furniture positions | Fixed and verified |
| PDF has an estimate but no actual floor plan | 5 | Add a proportional plan sheet; check PDF and DXF downloads | Fixed and verified |
| Tool controls and previews are hard to reach on phones | 4 | Make the studio panels scroll, preserve the viewport, label controls | Fixed and verified |
| Supporting pages promise a commercial service | 2 | Rewrite pricing, showcase, about, notes, contact, and data pages for a student demo | Fixed and verified |
| Real room measurement and object recognition | 8 | Needs chosen hardware, a real detection pipeline, and measurement tests | Needs a later decision |
| Reliable recognition of arbitrary messy blueprints | 8 | Needs image datasets, better recognition, and evaluation across drawing styles | Needs a later decision |
| Live original AI model generation | 6 | Needs a provider/model choice and a real image-to-model acceptance test | Needs a later decision |
| Full IFC/CAD compatibility across external tools | 7 | Needs round-trip fixtures in selected external CAD viewers | Needs a later decision |
| Complete touch CAD and complex multi-storey workflows | 7 | Needs dedicated gesture design and broader real-device tests | Needs a later decision |
| Broad React architecture and diagnostic cleanup | 7 | Needs a separate review of large components and scene-specific diagnostics | Optional follow-up |

Accounts, payments, supplier checkout, and a public online community are outside this portfolio scope. They are not requirements for presenting the project.

A wall drawing, finish, or model that works in the provided demonstration is not a claim that every input and every device is supported. Remaining rows above 5 are described separately so they do not block the core presentation.

## Evidence

The complete browser walkthrough passed: furnished example, wall edit, undo and redo, 3D view, applied finish after reload, project identity across tools, catalog placement, imported GLB after reload, PDF and DXF downloads, gallery details, sample blueprint tracing, unsupported-file feedback, supporting pages, and mobile controls. Results are in [results.json](portfolio-verification/results.json).

Example downloads: [PDF plan](portfolio-verification/demo-plan.pdf) and [DXF drawing](portfolio-verification/demo-plan.dxf). These verify the provided sample, not universal CAD compatibility.

The source also fixes the camera reset and ceiling visibility in 3D, preserves room names during wall edits, and centres the furnished example. Built-in material finishes and scene lighting do not need remote texture or environment downloads.

No paid AI calls, actual room measurements, purchases, or message deliveries were made. The remaining rows above 5 need separate work only if you want those features in the presentation.

Final checks: all 55 tests pass, lint is clear, and TypeScript passes. The full portfolio browser walkthrough passed with no uncaught page errors. React Doctor remains at 46/100 in the changed checkout, with 683 warnings across 37 files. The score has not regressed, but the remaining architecture and scene-specific diagnostics are still an optional follow-up, not a clean bill of health.

The final production build also passes. Its existing Edge and XR compatibility notices remain documented in the earlier review.


## Root fixes in this pass

The [architecture report](architecture-root-fixes.md) explains the causes, comparisons, and implemented changes. The shared save path, document validation, unit contract, undo quantity updates, and wall topology now have regression coverage. The calibrated manual reference survives a browser reload without inventing geometry. Automatic tracing no longer fabricates openings, room uses, building dimensions, or compliance claims.

The IFC exporter now creates opening solids, wall void relationships, and door/window fill relationships. The installed independent IFC reader opens the sample and meshes its walls. Full external CAD compatibility remains above difficulty 5 because this check does not cover every viewer or round trip.

The brown clay visual pass follows these software changes. Desktop and mobile landing and workshop previews are in the README.


The final repeat of the complete browser workflow passed with no uncaught errors. An earlier repeat timed out opening the furniture route while several checks ran together. A direct visit and the full repeat both succeeded; there is no confirmed furniture regression from that timeout.

The same installed React Doctor version retains its 46/100 score. The latest tool reports 57/100 with 55 findings and uses a different rule set, so these scores are not directly comparable. Accessibility labels and large editor components remain a real cleanup backlog. Passing the workflow is not a claim that this backlog is resolved.


## Follow-up fixes and final review

The earlier walkthrough did not prove all 3D modes or AI entry points. The follow-up review found the issues below and this implementation addresses their causes.

| Issue | Difficulty / 10 | Change | Verification and limits |
| --- | ---: | --- | --- |
| Orthographic toggle still used perspective | 4 | Use actual perspective and orthographic cameras, with framing based on the plan | Browser checks the rendered projection matrices and walking view changes |
| Fake headset pairing success | 3 | Request real WebXR sessions after capability detection; remove the fake PIN and pairing state | Unsupported-device browser path tested; physical headset verification remains open |
| Lighting toggle called ray tracing | 2 | Remove ray tracing and bounce claims; provide studio and sun lighting | Scene and controls reviewed in the browser |
| CAD catalog inserted a fallback before a job finished | 5 | All model entry points use one completed-job client with cancellation when leaving the project | Pending, failed, timed-out, successful, and explicit catalog responses tested |
| AI blueprint analysis ignored calibration | 6 | Extract pixel coordinates, convert through measured scale, validate references and bounds | Conversion and controlled API results tested; real recognition quality needs provider access |
| Generated bedrooms overlapped | 6 | Partition concept layouts, reject overlap and missing circulation connections, derive boundary walls | Room counts, areas, alternatives, L footprints, and invalid provider drafts tested |
| Alternative buttons changed scores without geometry | 4 | Render and apply the actual returned alternatives | Selection and reload checked through saved project geometry |
| Nonrectangular floors rendered as boxes | 5 | Extrude real room polygons; use them for floors and ceilings | L-shaped volume regression test; visual preview reviewed |
| Model load failures silently became boxes | 4 | Mark failed models in the scene and show an error | Controlled missing-model browser check verifies visible failure and continued editing |
| Too many floating and differently colored controls | 4 | One neutral toolbar, labeled catalog, one View settings panel, simple save status | Desktop and phone screenshots reviewed; catalog and view settings exercised |
| Dark 3D view hid furniture | 4 | Bright local studio lighting, softer shadows, textured floor, view-only lowered walls | Reviewed cutaway and full-height views; saved dimensions remain unchanged |
| Broken mobile quick-generate and stale AR message | 4 | Remove the old shortcut bar; use shared controls and a focused requirements panel | Mobile layout and requirements checks included in the final pass |
| Repeated brain/CPU symbols and artificial badges | 2 | Remove decorative AI symbols, neural labels, duplicated arrows, and excessive depth | Source and rendered UI reviewed |
| Inspector fields and catalog cards were awkward with a keyboard | 4 | Associate labels with controls, guard invalid numeric edits, separate native place/favorite actions | TypeScript and lint; browser catalog interaction and React diagnostics |

The final built-app checks pass. The current suite has 83 passing tests across 23 files. Final built-app results are recorded in [feature acceptance](portfolio-verification/feature-acceptance.json), [3D controls](portfolio-verification/3d-control-audit.json), and the [portfolio walkthrough](portfolio-verification/results.json). The missing-model test deliberately injects a 404; its expected errors are recorded separately from unexpected page errors.

The editor follows a common commercial pattern: keep 2D/3D prominent, group catalog actions, and put less-used view controls together. References: [Planner 5D navigation](https://support.planner5d.com/en/articles/5876772-how-to-navigate-through-planner-5d), [RoomSketcher toolbar guide](https://help.roomsketcher.com/hc/en-us/articles/14476178785437-Toolbar-Buttons-and-Options).

The 3D implementation follows the documented camera and local lighting APIs: [Drei orthographic camera](https://drei.docs.pmnd.rs/cameras/orthographic-camera), [Drei Lightformer](https://drei.docs.pmnd.rs/staging/lightformer), [Drei Environment](https://drei.docs.pmnd.rs/staging/environment). The local environment avoids a remote HDR dependency. These choices improve a real-time editing preview; they do not make it a photographic renderer.

### Still needs a separate decision or external verification

- Live AI output quality: no OpenAI or Replicate credentials are configured. Controlled tests establish request handling and validation, not visual reconstruction quality.
- Live model setup: set a documented images-input firtoz/trellis version in REPLICATE_TRELLIS_VERSION. The old unverified version hash was removed. [Provider schema](https://replicate.com/firtoz/trellis/api/schema).
- Real headset, camera measurement, and full touch drafting need actual device tests.
- Arbitrary messy blueprint recognition needs representative drawings and acceptance criteria.
- Full IFC/CAD compatibility still needs selected external applications and round trips.
- Pitched roof previews support rectangular outlines. Other footprints show a flat cover and the inspector explains this limit.
- Large editor components and remaining React diagnostics remain a cleanup backlog. The broader follow-up React Doctor scan reports 55 with 41 warnings and no errors. The scan of this follow-up against the last reviewed commit reports no new findings. The app does not have a clean diagnostic bill of health.


Final review evidence: [accepted scope and known limits](portfolio-verification/final-review.json). TypeScript, lint, the optimized build, and all 83 tests pass. The complete built-app walkthrough and the targeted feature checks pass. The screenshot review includes both the editor and the landing/workshop pages. The only model-loading error in the negative test is the deliberately injected missing file, which is visibly reported in the scene.


The final 2D screenshot review also removed the old help overlay and fixed drawing framing after screen-size changes. New plans fit on screen; a panned view keeps its center when the canvas resizes. Fit plan to screen is available under Tools. Wall dimensions can be enabled in View settings, and editing handles appear only when relevant. A viewport regression test and rendered-canvas checks cover centering.

The final walkthrough also caught drawing clicks intercepted by existing room and furniture shapes. Selection hit testing now runs only in selection mode, so wall drawing and measurement can reach the canvas over existing geometry. The browser regression draws inside a room and checks undo. The final 2D opening symbols use the neutral palette.


### Follow-up: landing section, BIM, furniture, and multiple floors

The old enclosed inspiration card was replaced with larger type, an open layout, a warm oak interior study, and physical-looking material swatches. Desktop and phone screenshots were reviewed.

The multi-floor checks found and fixed issues missed in the earlier walkthrough:

- 2D furniture now belongs to its own floor. Older records are assigned to their original ground floor.
- Copying a floor plan creates independent wall, opening, room, and plan IDs. Furniture is not copied, as the interface explains.
- Deleting a floor removes its furniture and connecting stairs. Undo restores them together.
- A new level starts above the highest floor using its actual height.
- Stairs connect to the next actual floor. Their total rise matches the floor elevation gap. Add an upper floor before placing stairs.
- Drawing tools no longer reset to selection when launched from the Tools menu, and can switch from 3D into 2D.
- Stair tread height, sloped handrails, and slab openings now follow the stair run and rotation. Nonstraight openings are approximate bounding shapes.
- Catalog furniture starts at the living room center and is selected for adjustment. Placement does not check clearances or prevent overlap.
- 3D framing includes the visible floor stack. Walkthrough eye height follows the active floor.
- IFC export preserves coordinate precision. An independent reader opens and meshes two floors.

Evidence: [multi-floor and BIM browser walkthrough](portfolio-verification/multi-floor-bim.json). The bundled blueprint traces into six walls, opens in the editor, saves, and reloads. Browser checks also cover floor copying, upper-floor furniture, stair connections, two-floor IFC download, floor deletion, and undo. There are 83 passing regression tests across 23 files.

This does **not** establish that every feature is complete. Live AI recognition on arbitrary drawings remains untested without provider credentials. IFC currently exports walls, doors, windows, and rectangular floor slabs. It does not export furniture, stairs, or stair openings, and slab outlines need further work for irregular footprints. This is a limited BIM export, not a complete building model. Real headset/camera use, full touch drafting, and external CAD round trips still need separate verification. The stair models remain editable previews rather than building-code checks.
