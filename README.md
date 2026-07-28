# Patent Cost Desk

Source-linked, static single-page patent filing-cost planner for:
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
- A transparent single-office filing scenario
- Direct, provisional and PCT international filing routes where the model supports them
- Eligibility-aware India and USPTO fee categories
- Claim/page sensitivity for the United States, Korea, Japan, China, Australia and PCT
- Live INR reference conversion via Frankfurter, with static fallbacks
- Optional professional-cost inputs that default to zero
- A cross-office comparison view with clearly labelled baseline categories
- Source, assumption and exclusion disclosures for every scenario

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

## Data updates

When fee schedules change:
1. Verify values against the primary links in `SOURCES.md`.
2. Update the fee logic and source notes together.
3. Keep costs that cannot be supported by a general published schedule in the exclusions list or as explicit user-entered inputs.
