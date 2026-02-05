# AutoReel UI

The official frontend for the AutoReel engine. Allows users to upload vehicle photos, generate AI-narrated walkaround videos, and download the results.

## Setup & Run

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    This will start the UI at `http://localhost:5173` (default).

## Connecting to the Engine

1.  Open the UI in your browser.
2.  Expand the **⚙️ Connection Settings** panel at the top.
3.  Enter your **Engine URL**.
    *   Default: `http://localhost:8080`
    *   Ensure the engine is running and accessible.
4.  (Optional) Enter your **API Key** if the engine requires authentication.
5.  Click **Save**. Settings are persisted in your browser.

## API Requirements

The UI expects the AutoReel Engine to support the following endpoints:

*   `POST /v1/jobs` - Accepts multipart form data with `images[]`. Returns `{ "job_id": "..." }`.
    *   **New:** Optional `instructions` text field to guide the narration generation.
*   `GET /v1/jobs/{job_id}` - Returns job status and results.
    *   Response format:
        ```json
        {
          "status": "queued|running|done|error",
          "stage": "ingest|vision|script|tts|render",
          "result": {
            "video_url": "/path/to/video.mp4",
            "script_text": "..."
          }
        }
        ```

### CORS Troubleshooting

If the UI stays stuck or you see "Network Error" in the console, it is likely a CORS issue.

**The Engine MUST allow requests from the UI's origin (e.g., `http://localhost:5173`).**

Ensure your engine's CORS configuration includes:
*   **Allowed Origins:** `http://localhost:5173` (or `*` for local dev)
*   **Allowed Methods:** `GET, POST, OPTIONS`
*   **Allowed Headers:** `Content-Type, Authorization`
# tradora-autoreel-ui
