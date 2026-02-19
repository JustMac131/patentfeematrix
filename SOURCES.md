# Patent Fee Inputs and Verification Notes

Last curated: **February 19, 2026**

This project separates:
- **Government fees**: sourced from official patent-office/government schedules.
- **Professional fees**: editable estimates in the UI (firm-specific, not official).

## Jurisdiction Inputs Used in `app.js`

### India (INR)
- Filing fee: `1600` (natural/startup/small) / `8000` (other than natural/startup/small)
- Examination request (Form 18): `4000` / `20000`
- PCT transmittal fee (RO/IN): `3200` / `16000`
- Sources:
  - https://ipindia.gov.in/writereaddata/Portal/ev/rules/patent-rules-2003-12-08-2024.pdf
  - https://www.jpo.go.jp/e/system/laws/rule/guideline/document/index/fourth_schedule.pdf

### United States (USD)
- Utility nonprovisional baseline:
  - Large: filing `350`, search `770`, exam `880`
  - Small: filing `70`, search `308`, exam `352`
  - Micro: filing `70`, search `154`, exam `176`
- Provisional filing:
  - Large `325`, small `130`, micro `65`
- PCT national stage baseline:
  - Large `350 + 770 + 880`
  - Small `140 + 308 + 352`
  - Micro `70 + 154 + 176`
- Source:
  - https://www.uspto.gov/learning-and-resources/fees-and-payment/uspto-fee-schedule

### EP / EPO (EUR)
- Before April 1, 2026:
  - Filing `135`, search `1520`, designation `685`, examination `1915`
- On/after April 1, 2026:
  - Filing `135`, search `1595`, designation `720`, examination `2010`
- Source:
  - https://www.epo.org/en/applying/fees

### United Kingdom (GBP)
- Before April 1, 2026:
  - Direct: filing `60`, search `150`, exam `100`
  - PCT national phase baseline: entry `30`, search `120`, exam `100`
- On/after April 1, 2026 (modeled from published proposal context):
  - Direct: filing `75`, search `200`, exam `130`
  - PCT baseline modeled: entry `30`, search `160`, exam `130`
- Sources:
  - https://www.gov.uk/government/publications/patent-forms-and-fees/patent-forms-and-fees
  - https://www.gov.uk/government/consultations/patent-fees-proposal-to-increase-fees-in-april-2026

### Korea (KRW)
- Electronic filing fee: `46000`
- Examination request: `166000 + 51000 * claim_count`
- Source:
  - https://www.kipo.go.kr/en/HtmlApp?c=01080303&catmenu=m03_05_02

### Japan (JPY)
- Filing: `14000`
- Examination request: `138000 + 4000 * claim_count`
- Source:
  - https://www.jpo.go.jp/e/system/process/tesuryo/hyoujyun_kaitei.html

### China (CNY)
- Application fee: `900`
- Publication printing fee: `50`
- Substantive examination request: `2500`
- Additional claim fee in model: `150 * (claims_over_10)`
- Additional pages in model: `50 * (pages_over_30)`
- Source:
  - https://english.cnipa.gov.cn/transfer/news/officialinformation/1117615.htm

### Australia (AUD)
- Provisional filing: `100`
- Standard patent filing: `400`
- Examination request: `550`
- Source:
  - https://www.ipaustralia.gov.au/manage-my-ip/fees-and-payment/patent-fees

### PCT / International (CHF)
- International filing fee (first 30 pages): `1330`
- Page surcharge: `15` per page above 30
- Optional e-filing reduction in model: `100/200/300`
- Source:
  - https://www.wipo.int/pct/en/guide/fees.html

## FX Conversion
- Live rates are fetched from:
  - https://www.frankfurter.app/
- Conversion shown on each card: `1 local currency = X INR`.
- If live fetch fails, fallback rates are used temporarily.

## Important Limitations
- Patent fee schedules change. Always verify against the official source at filing time.
- This tool does not fully encode every special case (late fees, restoration, multiple priorities, formal drawings, translations, excess independent claims, etc.).
- EP post-grant validation values in the UI are **user-entered estimates**, not official EPO schedule entries.
