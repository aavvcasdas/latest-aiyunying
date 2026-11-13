# AI Motion Workshop

A Chinese-language pixel character motion workbench for the current
`aavvcasdas/latest-aiyunying` character system.

## Run

```bash
npm install
npm run dev
npm run build
```

The application provides nine characters and 108 real, transparent GIFs. It
supports frame-by-frame preview, playback speed, looping, background checks,
original-idle comparison, character/category filtering and local file downloads.

## Deliverables

- `public/downloads/ai-motion-v2-complete.zip`: GIFs, PNG strips, reversible installer, source data and patch.
- `public/downloads/motion-v2.patch`: patch against source commit `2779ffd5e407e39f8acee50bc274de2fa8beeaa7`.
- `docs/人物动作替换指南.md`: complete Chinese installation and image replacement guide.
- `tools/build_assets.py`: deterministic motion asset generator and packager.
- `tools/install-motion-v2.mjs`: source-repository installer with backup and rollback.

GIFs are previews. The source Remotion engine renders deterministic PNG atlas
cells through the new `Actor.motion()` API. Legacy actions are deliberately not
silently overridden; see the guide for adopting the new motions in actual shots.

## Verify

```bash
npx tsc --noEmit
npx playwright test
python3 tools/verify_assets.py
npm run build
```

The asset validator needs Pillow. The generator also needs NumPy and the source
repository checked out at `.reference/` on the specified branch. Install Python
dependencies with `python3 -m pip install --target .python-deps pillow numpy`.
Browser tests may require `npx playwright install --with-deps chromium`.

The generated source atlas, reversible installation, an actual WebGL smoke render
and 11 source-engine cast regression tests were checked in an isolated source copy.
All 6 browser interaction tests pass. Full source-repository tests, finished video rendering
and human review of complete videos are not claimed. No GitHub push was made.

## Source And Rights

Base artwork comes from the linked project's pixel atlas. New motions use those
pixels with deterministic layering, fabric movement, timing curves and
programmatically drawn props. These are not newly hand-drawn character designs.
The source repository notes that artwork redistribution permissions are unresolved.
Use for internal evaluation and verify rights before commercial use or publication.