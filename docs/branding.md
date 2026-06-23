# Branding and Themes

hackd can be lightly branded without changing application code. Branding values are read from environment variables at runtime and applied server-side when pages render.

Use this for internal program names, department labels, customer-specific demos, or a house visual theme.

## Brand Text

| Variable | Default | Purpose |
| --- | --- | --- |
| `HACKD_BRAND_NAME` | `hackd` | Product name shown in the header, landing page, login page, and metadata. |
| `HACKD_BRAND_TAGLINE` | `Containerized control plane for hands-on security training.` | Short description shown on the landing and login pages. |
| `HACKD_BRAND_LOGO_URL` | unset | Optional logo URL or public asset path, such as `/brand/logo.svg`. |
| `HACKD_BRAND_ADMIN_LABEL` | `Admin control plane` | Header label for admin pages. |
| `HACKD_BRAND_LEARNER_LABEL` | `Learner workspace` | Header label for learner pages. |

`HACKD_BRAND_LOGO_URL` may point to a file served from `public/` or to an external URL. Prefer a compact horizontal logo that works at roughly 32 pixels tall.

## Theme Colors

Theme colors use hex values. Three-digit and six-digit values are supported, with or without a leading `#`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `HACKD_THEME_PRIMARY` | `#14a391` | Main accent color for buttons, links, progress, and branded labels. |
| `HACKD_THEME_PRIMARY_FOREGROUND` | `#f8ffff` | Text color on primary buttons. |
| `HACKD_THEME_BACKGROUND` | `#f8fafc` | Page background starting color. |
| `HACKD_THEME_SURFACE` | `#eef5f8` | Subtle panel and page background ending color. |
| `HACKD_THEME_FOREGROUND` | `#0f172a` | Main text color. |
| `HACKD_THEME_CARD` | `#ffffff` | Card and header surface color. |
| `HACKD_THEME_MUTED` | `#e2e8f0` | Muted control background. |
| `HACKD_THEME_MUTED_FOREGROUND` | `#536171` | Secondary text color. |
| `HACKD_THEME_BORDER` | `#cbd5e1` | Border color. |

Invalid color values fall back to the default theme value for that variable.

## Example

```env
HACKD_BRAND_NAME="Acme Security Lab"
HACKD_BRAND_TAGLINE="Hands-on secure engineering training for Acme teams."
HACKD_BRAND_LOGO_URL="/brand/acme-logo.svg"
HACKD_BRAND_ADMIN_LABEL="Training admin"
HACKD_BRAND_LEARNER_LABEL="Learning portal"
HACKD_THEME_PRIMARY="#2563eb"
HACKD_THEME_PRIMARY_FOREGROUND="#ffffff"
HACKD_THEME_BACKGROUND="#f8fafc"
HACKD_THEME_SURFACE="#eef2ff"
HACKD_THEME_FOREGROUND="#111827"
HACKD_THEME_CARD="#ffffff"
HACKD_THEME_MUTED="#e5e7eb"
HACKD_THEME_MUTED_FOREGROUND="#4b5563"
HACKD_THEME_BORDER="#cbd5e1"
```

For Docker Compose deployments, place these values in `.env` and pass them through to the `web` service, or update the Compose environment block directly for a local demo.

## Current Limits

- Branding is instance-wide.
- There is no per-group or per-user theme selection.
- Uploaded logos are not managed through the admin UI yet.
- Theme colors are applied to the application shell and core UI surfaces, not to external challenge containers.
