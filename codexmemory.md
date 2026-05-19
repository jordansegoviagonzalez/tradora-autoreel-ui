# Codex Memory - Tradora AutoReel UI

Last updated: 2026-05-15

## Purpose

This file is a local recovery and project memory document for the Tradora AutoReel UI. Use it to understand what this app is, what changed, what files matter, and how to recover the main project direction if things go sideways.

## Project Summary

This project is a Vite-based frontend for Tradora AutoReel.

The app lets a user:

- Chat with an assistant about narration/style for a vehicle walkaround.
- Upload multiple vehicle photos.
- Send photos and instructions to an AutoReel engine.
- Poll job progress.
- Preview/download the generated walkaround video.
- Configure engine URL and optional API key.

The active app is plain JavaScript, HTML, and CSS. There is no React/Vue/Svelte framework.

## Main Files

- `index.html` - Active HTML shell loaded by Vite.
- `src/main.js` - Active UI behavior: sessions, chat, attachments, generation, polling, rendering results.
- `src/api.js` - Engine config and API wrapper.
- `src/styles.css` - Active app styling.
- `README.md` - Setup notes and expected backend API.
- `package.json` - Vite scripts and dependency declaration.
- `package-lock.json` - Local npm lockfile, currently untracked as of inspection.
- `geminiui.md` - Notes from a prior/desired Axia UI adjustment request.
- `src/main.js_temp_fixed` - Backup/partial richer Axia workspace implementation, not currently wired into `index.html`.
- `public/walk-around-videos/` - Public demo/generated video assets copied into `dist` during build.
- `WALK AROUIND VIDEOS/` - Duplicate/local video asset folder with misspelled name.

## Active Runtime Entry

`index.html` loads:

```html
<script type="module" src="/src/main.js"></script>
```

That means `src/main.js` is the active app. `src/main.js_temp_fixed` is not active unless manually renamed/imported or otherwise integrated.

## Current API Contract

The frontend expects an external engine with:

- `POST /v1/jobs`
  - multipart form data
  - image files under `images[]`
  - optional `instructions` text field
  - returns `{ "job_id": "..." }`

- `GET /v1/jobs/{job_id}`
  - returns status/stage/result
  - expected statuses: `queued`, `running`, `done`, `error`
  - expected stages: `ingest`, `vision`, `script`, `tts`, `render`
  - expected result may include `script_text`

- `POST /v1/chat`
  - accepts `{ messages: [...] }`
  - returns either `{ content }`, `{ message }`, or OpenAI-style `choices[0].message.content`

- `GET /v1/artifacts/{job_id}/final.mp4`
  - used by the UI for the final video download/preview

- `GET /v1/artifacts/{job_id}/result.json`
  - used by the UI for JSON artifact download

## Current Config Defaults

`src/api.js` currently defaults the engine URL to:

```js
http://localhost:8000
```

The README mentions `http://localhost:8080`, so this mismatch should be fixed or documented.

Browser storage keys:

- `autoreel_engine_url`
- `autoreel_api_key`
- `autoreel_sessions`
- `autoreel_session_${id}`

The temp Axia file uses a different session key family:

- `autoreel_video_sessions`
- `autoreel_video_session_`

## Current UI Behavior

Active UI:

- Sidebar session list.
- New session button.
- Chat stream with welcome screen.
- Composer with image attachment button, textarea, send button, generate button.
- Generate button appears after image selection and is enabled when at least 3 images are selected.
- Settings modal with engine URL, API key, and test connection.
- Mobile sidebar toggle.

Chat behavior:

- Enter sends.
- Shift+Enter creates newline.
- User messages are stored in localStorage.
- Assistant responses are fetched from `/v1/chat`.

Generation behavior:

- User attaches images.
- App sends selected images plus the last message content as instructions.
- App polls `/v1/jobs/{job_id}` every 1 second.
- On `done`, app renders video, script text, and download links.
- Result video player is not persisted across refresh.

## Build Status

Last verified command:

```bash
npm run build
```

Last result:

```text
vite v5.4.21 building for production...
5 modules transformed.
dist/index.html generated
dist/assets/index-*.css generated
dist/assets/index-*.js generated
build completed successfully
```

## Git Status At Time Of Memory Creation

Tracked files at inspection:

- `README.md`
- `index.html`
- `package.json`
- `src/api.js`
- `src/main.js`
- `src/styles.css`

Untracked files at inspection:

- `.DS_Store`
- `.gitignore`
- `WALK AROUIND VIDEOS/`
- `dummy.jpg`
- `geminiui.md`
- `package-lock.json`
- `public/`
- `src/main.js_temp_fixed`

This file, `codexmemory.md`, was added after that inspection.

## Large Asset Notes

There are duplicate video assets:

- `public/walk-around-videos/`
- `WALK AROUIND VIDEOS/`

Approximate sizes from inspection:

- project directory: `551M`
- `public`: `160M`
- `WALK AROUIND VIDEOS`: `160M`

Because Vite copies `public` into `dist`, public videos make production builds large.

## Known Risks / Bugs

- Assistant API responses are rendered with basic newline replacement and no robust escaping.
- `result.script_text` is injected into HTML without escaping.
- `renderResult` assumes the final video filename is always `final.mp4` and does not use `result.video_url`.
- Generation instructions use the last history message, which may be an assistant message instead of the last user prompt.
- Poll intervals are not centrally tracked/cleared when sessions change or flows reset.
- Completed generation result UI is not persisted.
- README default engine URL and actual code default engine URL differ.
- `src/main.js_temp_fixed` appears to target DOM nodes that do not exist in the active `index.html`.
- `geminiui.md` references Axia, Engine Monitor, profile menu, and a larger workspace UI that are not present in the active app.
- No automated tests are configured.

## Recovery Guidance

If the app breaks, start here:

1. Confirm `index.html` still loads `/src/main.js`.
2. Run `npm run build`.
3. Check browser console for missing DOM IDs. If errors mention Axia/profile/engine monitor IDs, someone may have mixed `src/main.js_temp_fixed` into the active simple UI without updating `index.html`.
4. Verify `src/api.js` still exports `Api` and `Config`.
5. Verify `src/main.js` imports from `./api.js`.
6. Confirm settings modal IDs in `index.html` match the IDs used in `src/main.js`.
7. Confirm generation still calls:
   - `Api.createJob(...)`
   - `Api.getJob(...)`
   - `Api.getArtifactUrl(...)`
8. If video preview fails but job completes, check whether the backend returns a different `video_url` instead of `final.mp4`.
9. If chat fails, check `/v1/chat` response shape and CORS.
10. If build output is huge, inspect `public/walk-around-videos`.

## Suggested Next Cleanup

- Decide whether the canonical UI is the current simple chat UI or the richer Axia workspace.
- If using current simple UI, delete or archive `src/main.js_temp_fixed` once no longer needed.
- If using Axia UI, update `index.html` and CSS to match the Axia DOM expected by `src/main.js_temp_fixed`, then rename/integrate the JS file cleanly.
- Fix README/code engine URL mismatch.
- Escape assistant/result text before inserting into HTML.
- Use `result.video_url` when available.
- Track and clear polling intervals.
- Decide which video asset folder should remain.
- Commit `.gitignore`, `package-lock.json`, `public/` if intended, and this memory file.

