# Patent Fee Calculator (GitHub Pages Ready)

Static single-page calculator for:
- India
- EP (EPO)
- US
- UK
- Korea
- Japan
- China
- PCT
- Australia

It supports:
- Single jurisdiction mode
- All-jurisdictions mode
- Applicant type, application type, prior-art options
- Claim/page sensitivity for jurisdictions with formula-based fees
- Live INR conversion with source note (Frankfurter/ECB)
- Editable professional fee assumptions

## Files
- `index.html` - UI shell
- `styles.css` - responsive layout/styling
- `app.js` - fee engine + exchange-rate logic
- `SOURCES.md` - fee-source mapping and assumptions

## Run locally

From this folder:

```bash
python3 -m http.server 8080
```

Open:

`http://localhost:8080`

## Deploy to GitHub Pages

1. Create a GitHub repository and push these files to the default branch.
2. In GitHub repo settings, open `Pages`.
3. Set source as:
   - Deploy from branch
   - Branch: `main` (or your default)
   - Folder: `/ (root)`
4. Save; GitHub will publish your URL:
   - `https://<username>.github.io/<repo-name>/`

If you publish from a user root repo (`<username>.github.io`), the URL will be:
- `https://<username>.github.io/`

## Data updates

When fee schedules change:
1. Update constants in `app.js`.
2. Update notes in `SOURCES.md`.
