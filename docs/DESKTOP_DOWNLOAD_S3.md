# Desktop app download (Tauri build + S3)

The homepage shows a **Download for Desktop** button when a desktop release URL is available. The URL can come from the API (admin versions) or from an env variable.

## Admin: Releases dashboard

In the **admin dashboard** → **Releases** you can:

- See the **current desktop release** and update policy (min version, force update).
- Follow **Build & upload** steps (Tauri build command, S3 upload command, then register release).
- **Upload build to S3** from the browser (if the backend has S3 configured).
- **Register release**: version, platform (Desktop / All), download URL, release notes, min required version, force update.
- View **recent versions** and link to **Versions** for full CRUD.

To enable **direct upload to S3** from the admin, set in the backend `.env`:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_RELEASES_BUCKET`
- `AWS_REGION` (optional, default `us-east-1`)
- `AWS_RELEASES_PREFIX` (optional, default `releases`)

## Option 1: Admin dashboard (recommended)

1. Build the Tauri app and upload the installer to S3 (or any public URL).
2. In the **admin dashboard** → **Versions**, create a new version:
   - **Platform**: `all` (or `windows` / `macos` / `linux` if you have separate installers).
   - **Version**: e.g. `0.1.0`.
   - **Download URL** (stored as `update_url` in the API): your S3 public URL or CloudFront URL, e.g.  
     `https://your-bucket.s3.region.amazonaws.com/releases/likho-0.1.0.dmg`
3. Mark it as latest if needed. The homepage calls `GET /api/v1/config/releases/desktop` and uses the returned `download_url`.

## Option 2: Env variable (static URL)

If you don’t use the admin versions API, set the URL at build time:

- **`VITE_DESKTOP_DOWNLOAD_URL`**: full URL to the desktop installer (e.g. S3 or CloudFront).

Example (`.env` or CI):

```bash
VITE_DESKTOP_DOWNLOAD_URL=https://your-bucket.s3.us-east-1.amazonaws.com/releases/likho-latest.dmg
```

The homepage will show the Download button and use this URL directly (no backend call).

## Building Tauri and uploading to S3

1. From the app root (e.g. `likho-app`):
   ```bash
   cd likho-app && bun run tauri build
   ```
2. Installers are under `likho-app/src-tauri/target/release/bundle/` (e.g. `.dmg`, `.msi`, `.AppImage`).
3. Upload to S3 (example with AWS CLI):
   ```bash
   aws s3 cp src-tauri/target/release/bundle/dmg/Likho_0.1.0_aarch64.dmg s3://your-bucket/releases/ --acl public-read
   ```
4. Use the object URL (or a CloudFront distribution URL) as the **Download URL** in the admin or as `VITE_DESKTOP_DOWNLOAD_URL`.

## Where the button appears

- **Navbar**: “Download” link (desktop only; hidden inside the Tauri app).
- **Hero**: “Download for Desktop” button next to “Get Started”.
- **Mobile menu**: “Download for Desktop” link.

The button is only rendered when a URL is available (from the API or env).
