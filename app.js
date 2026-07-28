const JURISDICTIONS = [
  { id: "IN", name: "India", short: "India", currency: "INR" },
  { id: "US", name: "United States", short: "United States", currency: "USD" },
  { id: "EP", name: "European Patent Office", short: "EPO", currency: "EUR" },
  { id: "UK", name: "United Kingdom", short: "United Kingdom", currency: "GBP" },
  { id: "KR", name: "Republic of Korea", short: "Korea", currency: "KRW" },
  { id: "JP", name: "Japan", short: "Japan", currency: "JPY" },
  { id: "CN", name: "China", short: "China", currency: "CNY" },
  { id: "AU", name: "Australia", short: "Australia", currency: "AUD" },
  { id: "PCT", name: "PCT international filing", short: "PCT", currency: "CHF" },
];

const SOURCES = {
  IN: [{ label: "IP India: Patent forms and official fees", url: "https://ipindia.gov.in/patents-before-you-apply-forms-official-fees", note: "First Schedule fee table; accessed July 2026." }],
  US: [{ label: "USPTO current fee schedule", url: "https://www.uspto.gov/learning-and-resources/fees-and-payment/uspto-fee-schedule", note: "Utility filing, search, examination and claim fees; revised July 2026." }],
  EP: [{ label: "EPO fees and payments", url: "https://www.epo.org/en/applying/fees/fees", note: "European fees effective 1 April 2026." }],
  UK: [{ label: "UK IPO patent-fee changes", url: "https://www.gov.uk/government/publications/intellectual-property-office-new-fees-from-1-april-2026", note: "Online filing, search and examination fees effective 1 April 2026." }],
  KR: [{ label: "KIPO patent fees", url: "https://www.kipo.go.kr/en/HtmlApp?c=92004", note: "Electronic application and substantive examination fee schedule." }],
  JP: [{ label: "JPO fee information", url: "https://www.jpo.go.jp/e/system/process/tesuryo/", note: "Patent application and examination fee schedule." }],
  CN: [{ label: "CNIPA national intellectual property fees", url: "https://english.cnipa.gov.cn/col/col3000/index.html", note: "Invention application, examination, claim and page fee table." }],
  AU: [{ label: "IP Australia patent timeframes and fees", url: "https://www.ipaustralia.gov.au/patents/timeframes-and-fees/", note: "Preferred-means filing, examination and excess-claims fees." }],
  PCT: [{ label: "WIPO PCT fees and payments", url: "https://www.wipo.int/en/web/pct-system/fees/index", note: "International filing fee schedule; receiving-office and ISA fees vary." }],
};

const ROUTE_LABELS = {
  direct: "Direct patent application",
  provisional: "Provisional application",
  pct: "PCT international application",
};

const ROUTE_SUPPORT = {
  IN: ["direct", "provisional"], US: ["direct", "provisional"], EP: ["direct"], UK: ["direct"],
  KR: ["direct"], JP: ["direct"], CN: ["direct"], AU: ["direct", "provisional"], PCT: ["pct"],
};

const FALLBACK_RATES_TO_INR = { INR: 1, USD: 86.1, EUR: 100.4, GBP: 116.7, KRW: 0.072, JPY: 0.62, CNY: 12.0, AUD: 57.4, CHF: 107.2 };

const state = {
  mode: "single",
  jurisdiction: "IN",
  route: "direct",
  entity: "indiaReduced",
  claims: 10,
  independentClaims: 3,
  pages: 30,
  multipleDependent: false,
  pctReduction: 0,
  pctAddOn: 0,
  professional: { search: 0, drafting: 0, foreign: 0, other: 0 },
  ratesToINR: { ...FALLBACK_RATES_TO_INR },
  rateMeta: { source: "Fallback reference rates", date: null, fallback: true },
};

const controls = {};
const byId = (id) => document.getElementById(id);
const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const min = (value, minimum) => Math.max(minimum, n(value, minimum));
const jurisdictionById = (id) => JURISDICTIONS.find((item) => item.id === id);

function money(amount, currency) {
  const digits = currency === "JPY" || currency === "KRW" ? 0 : 2;
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: digits }).format(amount);
}

function rateToInr(currency) {
  return currency === "INR" ? 1 : state.ratesToINR[currency] || null;
}

function toInr(amount, currency) {
  const rate = rateToInr(currency);
  return rate ? amount * rate : Number.NaN;
}

function fromInr(amount, currency) {
  const rate = rateToInr(currency);
  return rate ? amount / rate : Number.NaN;
}

function entityOptions(jurisdiction) {
  if (jurisdiction.id === "IN") {
    return {
      label: "Applicant fee category",
      help: "India reduced tier covers natural persons, start-ups and small entities in this baseline.",
      values: [
        ["indiaReduced", "Natural person, start-up or small entity"],
        ["indiaOther", "Other than reduced-tier applicant"],
      ],
    };
  }
  if (jurisdiction.id === "US") {
    return {
      label: "USPTO entity status",
      help: "Choose only a status you are eligible to claim under USPTO rules.",
      values: [["micro", "Micro entity"], ["small", "Small entity"], ["large", "Undiscounted entity"]],
    };
  }
  return {
    label: "Fee category",
    help: jurisdiction.id === "PCT" ? "PCT filing fee is not entity-discounted in this model." : "Published standard fee baseline.",
    values: [["standard", "Standard published fee"]],
  };
}

function syncDynamicInputs() {
  const jurisdiction = jurisdictionById(state.jurisdiction);
  const supported = ROUTE_SUPPORT[jurisdiction.id];
  [...controls.routeSelect.options].forEach((option) => {
    option.disabled = !supported.includes(option.value);
  });
  if (!supported.includes(state.route)) state.route = supported[0];
  controls.routeSelect.value = state.route;

  const options = entityOptions(jurisdiction);
  controls.entityLabel.textContent = options.label;
  controls.entityHelp.textContent = options.help;
  controls.entitySelect.innerHTML = options.values.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  if (!options.values.some(([value]) => value === state.entity)) state.entity = options.values[0][0];
  controls.entitySelect.value = state.entity;

  const isPCT = state.route === "pct";
  controls.pctInputs.hidden = !isPCT;
  controls.multipleDependentField.hidden = state.jurisdiction !== "US" || state.route !== "direct";
  controls.independentClaimCount.closest("label").hidden = state.jurisdiction !== "US" || state.route !== "direct";
  controls.routeHelp.textContent = routeHelp(jurisdiction, state.route);
}

function routeHelp(jurisdiction, route) {
  if (route === "pct") return "This models the international filing fee only. National-phase entry, ISA and receiving-office fees must be added separately.";
  if (route === "provisional") return "A provisional filing preserves an early date but does not itself result in an examined patent.";
  if (jurisdiction.id === "EP") return "Direct EPC filing baseline. Euro-PCT entry and post-grant validation are not included.";
  return "This is a filing-stage baseline. Grant, renewal and post-filing costs are outside the estimate.";
}

function item(label, amount, type = "government") { return { label, amount, type }; }

function buildGovernment(jurisdiction, entity = state.entity) {
  const items = [];
  const assumptions = [];
  const exclusions = [
    "Attorney / agent charges, translations, drawings, taxes and disbursements unless you enter them below.",
    "Grant, renewal, maintenance, appeal, opposition, late and restoration fees.",
  ];
  let unsupported = "";

  if (jurisdiction.id === "IN") {
    const reduced = entity === "indiaReduced";
    const filing = reduced ? 1600 : 8000;
    if (state.route === "provisional") {
      items.push(item("Provisional specification filing (Form 1/2)", filing));
      assumptions.push("Examination is not included for a provisional filing.");
    } else {
      items.push(item("Patent filing fee (Form 1/2)", filing));
      items.push(item("Request for examination (Form 18)", reduced ? 4000 : 20000));
    }
    assumptions.push(reduced ? "Reduced India fee category selected." : "Other-than-reduced India fee category selected.");
    exclusions.push("India excess-claim, page, priority and PCT receiving-office fees are not modelled in this scenario.");
  }

  if (jurisdiction.id === "US") {
    const tier = entity;
    const direct = { large: { filing: 350, search: 770, exam: 880, independent: 600, claims: 200, multiple: 925 }, small: { filing: 70, search: 308, exam: 352, independent: 240, claims: 80, multiple: 370 }, micro: { filing: 70, search: 154, exam: 176, independent: 120, claims: 40, multiple: 185 } };
    const provisional = { large: 325, small: 130, micro: 65 };
    if (state.route === "provisional") {
      items.push(item("Provisional application filing fee", provisional[tier]));
      assumptions.push("No search or examination fee is due for a provisional application.");
    } else {
      const fees = direct[tier];
      items.push(item("Utility application filing fee (electronic)", fees.filing));
      items.push(item("Utility search fee", fees.search));
      items.push(item("Utility examination fee", fees.exam));
      if (state.independentClaims > 3) items.push(item(`Independent claims over 3 (${state.independentClaims - 3})`, (state.independentClaims - 3) * fees.independent));
      if (state.claims > 20) items.push(item(`Total claims over 20 (${state.claims - 20})`, (state.claims - 20) * fees.claims));
      if (state.multipleDependent) items.push(item("Multiple dependent claim", fees.multiple));
      assumptions.push("Electronic filing assumed. The selected USPTO entity category must be independently eligible.");
    }
    exclusions.push("Non-electronic filing, DOCX, sequence-listing, application-size, extension and issue fees are excluded.");
  }

  if (jurisdiction.id === "EP") {
    items.push(item("Filing fee", 135));
    items.push(item("European search fee", 1595));
    items.push(item("Designation fee (all EPC states)", 720));
    items.push(item("Examination fee", 2010));
    assumptions.push("Direct EPC application; published fees effective 1 April 2026.");
    exclusions.push("Claims fees, extension, Euro-PCT reductions, validation and national translation costs are excluded.");
  }

  if (jurisdiction.id === "UK") {
    items.push(item("Online application fee paid at filing", 75));
    items.push(item("Request for search", 200));
    items.push(item("Request for substantive examination", 130));
    assumptions.push("Online application fee paid at filing is selected, not postal or late-payment pricing.");
    exclusions.push("Priority, excess-page, amendment, grant and PCT national-phase fees are excluded.");
  }

  if (jurisdiction.id === "KR") {
    items.push(item("Electronic patent application", 46000));
    items.push(item("Substantive examination basic fee", 166000));
    items.push(item(`Examination claim fee (${state.claims} claims)`, state.claims * 51000));
    assumptions.push("Electronic filing assumed; examination claim fee applies per patent claim.");
    exclusions.push("Paper filing page fee, priority claims, registration and annual fees are excluded.");
  }

  if (jurisdiction.id === "JP") {
    items.push(item("Patent application fee", 14000));
    items.push(item("Examination request basic fee", 138000));
    items.push(item(`Examination claim fee (${state.claims} claims)`, state.claims * 4000));
    assumptions.push("Regular domestic examination fee is selected.");
    exclusions.push("PCT national-stage search reductions, translation, grant and annual fees are excluded.");
  }

  if (jurisdiction.id === "CN") {
    items.push(item("Invention application fee", 900));
    items.push(item("Publication printing fee", 50));
    items.push(item("Substantive examination request", 2500));
    if (state.claims > 10) items.push(item(`Claims over 10 (${state.claims - 10})`, (state.claims - 10) * 150));
    if (state.pages > 30) {
      const firstBand = Math.min(state.pages, 300) - 30;
      if (firstBand > 0) items.push(item(`Pages 31 to ${Math.min(state.pages, 300)} (${firstBand})`, firstBand * 50));
      if (state.pages > 300) items.push(item(`Pages over 300 (${state.pages - 300})`, (state.pages - 300) * 100));
    }
    assumptions.push("Invention-patent fee table selected.");
    exclusions.push("Priority, restoration, re-examination, translation, grant and annual fees are excluded.");
  }

  if (jurisdiction.id === "AU") {
    if (state.route === "provisional") {
      items.push(item("Provisional application (preferred means)", 100));
      assumptions.push("Preferred-means / online filing assumed.");
    } else {
      items.push(item("Standard application (preferred means)", 400));
      items.push(item("Examination request", 550));
      if (state.claims > 20) {
        const bandOne = Math.min(state.claims, 30) - 20;
        if (bandOne > 0) items.push(item(`Claims 21 to 30 (${bandOne})`, bandOne * 125));
        if (state.claims > 30) items.push(item(`Claims over 30 (${state.claims - 30})`, (state.claims - 30) * 250));
      }
      assumptions.push("Preferred-means filing and examination requested after 1 October 2024.");
    }
    exclusions.push("Paper-filing premium, amendments, optional search/opinion, acceptance and renewal fees are excluded.");
  }

  if (jurisdiction.id === "PCT") {
    items.push(item("International filing fee (first 30 pages)", 1330));
    if (state.pages > 30) items.push(item(`Pages over 30 (${state.pages - 30})`, (state.pages - 30) * 15));
    if (state.pctReduction > 0) items.push(item("Eligible e-filing reduction", -state.pctReduction, "discount"));
    if (state.pctAddOn > 0) items.push(item("Confirmed receiving-office / ISA add-on", state.pctAddOn));
    assumptions.push("CHF Schedule-of-Fees amounts are used; selected e-filing reduction must be available through the receiving office.");
    exclusions.push("Receiving-office transmittal and ISA fees are excluded unless entered as a confirmed add-on.");
    exclusions.push("National-phase fees, translations, local agents and post-international-phase costs are excluded.");
  }

  return { items, assumptions, exclusions, unsupported };
}

function professionalItems() {
  const labels = { search: "Prior-art search", drafting: "Drafting / filing support", foreign: "Foreign associate support", other: "Translation / other support" };
  return Object.entries(state.professional).filter(([, amount]) => amount > 0).map(([key, amount]) => item(labels[key], amount, "professional"));
}

function scenarioFor(jurisdiction, entity) {
  const government = buildGovernment(jurisdiction, entity);
  const professional = professionalItems();
  const governmentLocal = government.items.reduce((sum, entry) => sum + entry.amount, 0);
  const governmentInr = toInr(governmentLocal, jurisdiction.currency);
  const professionalInr = professional.reduce((sum, entry) => sum + entry.amount, 0);
  const professionalLocal = fromInr(professionalInr, jurisdiction.currency);
  const totalLocal = governmentLocal + professionalLocal;
  const totalInr = governmentInr + professionalInr;
  return { jurisdiction, government, professional, governmentLocal, governmentInr, professionalInr, professionalLocal, totalLocal, totalInr };
}

function renderFeeRows(result) {
  const items = [...result.government.items, ...result.professional];
  if (!items.length) return '<p class="empty-state">No fee components are available for this scenario.</p>';
  return items.map((entry) => {
    const isProfessional = entry.type === "professional";
    const rendered = isProfessional ? money(entry.amount, "INR") : money(entry.amount, result.jurisdiction.currency);
    return `<div class="fee-row ${entry.type === "discount" ? "is-discount" : ""} ${isProfessional ? "is-professional" : ""}"><span>${entry.label}${isProfessional ? " (optional)" : ""}</span><span>${rendered}</span></div>`;
  }).join("");
}

function renderSources(jurisdiction) {
  return SOURCES[jurisdiction.id].map((source) => `<div><a href="${source.url}" target="_blank" rel="noreferrer">${source.label}</a><span>${source.note}</span></div>`).join("");
}

function renderResult() {
  const jurisdiction = jurisdictionById(state.jurisdiction);
  const result = scenarioFor(jurisdiction);
  const hasInr = Number.isFinite(result.totalInr);
  controls.resultTitle.textContent = jurisdiction.id === "PCT" ? "PCT international application" : `${jurisdiction.name} ${ROUTE_LABELS[state.route].toLowerCase()}`;
  controls.heroTotal.innerHTML = `<span>Scenario total</span><strong>${hasInr ? money(result.totalInr, "INR") : "INR conversion unavailable"}</strong><small>${money(result.totalLocal, jurisdiction.currency)} local total</small>`;
  controls.scopeStatement.textContent = `${ROUTE_LABELS[state.route]}. Includes published government components shown below, plus only the optional professional entries you add.`;
  controls.governmentTotal.textContent = money(result.governmentLocal, jurisdiction.currency);
  controls.professionalTotal.textContent = money(result.professionalInr, "INR");
  controls.localCurrency.textContent = jurisdiction.currency;
  controls.breakdown.innerHTML = renderFeeRows(result);
  controls.assumptions.innerHTML = result.government.assumptions.map((entry) => `<li>${entry}</li>`).join("");
  controls.exclusions.innerHTML = result.government.exclusions.map((entry) => `<li>${entry}</li>`).join("");
  controls.sourceList.innerHTML = renderSources(jurisdiction);
  controls.unsupportedNotice.hidden = !result.government.unsupported;
  controls.unsupportedNotice.textContent = result.government.unsupported;
  renderComparison();
}

function renderComparison() {
  controls.comparison.hidden = state.mode !== "compare";
  if (state.mode !== "compare") return;
  const cards = JURISDICTIONS.filter((jurisdiction) => ROUTE_SUPPORT[jurisdiction.id].includes(state.route)).map((jurisdiction) => {
    const comparisonEntity = jurisdiction.id === "US" ? "large" : jurisdiction.id === "IN" ? "indiaReduced" : "standard";
    const result = scenarioFor(jurisdiction, comparisonEntity);
    const total = Number.isFinite(result.totalInr) ? money(result.totalInr, "INR") : "INR n/a";
    return { jurisdiction, result, total };
  }).sort((a, b) => a.result.totalInr - b.result.totalInr);
  controls.comparisonGrid.innerHTML = cards.map(({ jurisdiction, result, total }) => `<article class="comparison-card"><span class="office">${jurisdiction.short}</span><strong>${total}</strong><p>${money(result.governmentLocal, jurisdiction.currency)} official fees. Optional professional costs: ${money(result.professionalInr, "INR")}.</p></article>`).join("");
}

function readControls() {
  state.jurisdiction = controls.jurisdictionSelect.value;
  state.route = controls.routeSelect.value;
  state.entity = controls.entitySelect.value;
  state.claims = min(controls.claimCount.value, 1);
  state.independentClaims = Math.min(state.claims, min(controls.independentClaimCount.value, 1));
  state.pages = min(controls.pageCount.value, 1);
  state.multipleDependent = controls.multipleDependent.checked;
  state.pctReduction = min(controls.pctReduction.value, 0);
  state.pctAddOn = min(controls.pctAddOn.value, 0);
  state.professional.search = min(controls.feeSearch.value, 0);
  state.professional.drafting = min(controls.feeDrafting.value, 0);
  state.professional.foreign = min(controls.feeForeign.value, 0);
  state.professional.other = min(controls.feeOther.value, 0);
}

function updateRateStatus() {
  controls.rateStatus.textContent = state.rateMeta.fallback ? "Using fallback FX rates. Refresh to retry live reference rates." : `Reference FX loaded from ${state.rateMeta.source}${state.rateMeta.date ? ` (${state.rateMeta.date})` : ""}.`;
}

async function fetchRates() {
  controls.refreshRatesBtn.disabled = true;
  try {
    const targets = ["INR", "USD", "GBP", "KRW", "JPY", "CNY", "AUD", "CHF"];
    const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=EUR&quotes=${targets.join(",")}`, { cache: "no-store" });
    if (!response.ok) throw new Error("FX response was not successful");
    const rows = await response.json();
    const rates = Object.fromEntries(rows.map((row) => [row.quote, row.rate]));
    if (!rates.INR) throw new Error("INR reference rate was not supplied");
    const next = { INR: 1, EUR: rates.INR };
    targets.slice(1).forEach((currency) => { if (rates[currency]) next[currency] = rates.INR / rates[currency]; });
    state.ratesToINR = { ...state.ratesToINR, ...next };
    state.rateMeta = { source: "Frankfurter reference rates", date: rows[0]?.date || null, fallback: false };
  } catch (error) {
    state.ratesToINR = { ...FALLBACK_RATES_TO_INR };
    state.rateMeta = { source: "Fallback reference rates", date: null, fallback: true };
    console.warn(error);
  } finally {
    controls.refreshRatesBtn.disabled = false;
    updateRateStatus();
    renderResult();
  }
}

function renderAll() {
  syncDynamicInputs();
  updateRateStatus();
  renderResult();
}

function resetScenario() {
  state.mode = "single";
  state.jurisdiction = "IN";
  state.route = "direct";
  state.entity = "indiaReduced";
  state.claims = 10; state.independentClaims = 3; state.pages = 30; state.multipleDependent = false;
  state.pctReduction = 0; state.pctAddOn = 0; state.professional = { search: 0, drafting: 0, foreign: 0, other: 0 };
  controls.scenarioForm.reset();
  controls.jurisdictionSelect.value = state.jurisdiction;
  controls.routeSelect.value = state.route;
  controls.claimCount.value = state.claims; controls.independentClaimCount.value = state.independentClaims; controls.pageCount.value = state.pages;
  document.querySelectorAll(".mode-option").forEach((button) => button.classList.toggle("is-active", button.dataset.mode === state.mode));
  renderAll();
}

function init() {
  ["jurisdictionSelect", "routeSelect", "entitySelect", "claimCount", "independentClaimCount", "pageCount", "multipleDependent", "pctReduction", "pctAddOn", "feeSearch", "feeDrafting", "feeForeign", "feeOther", "pctInputs", "multipleDependentField", "entityLabel", "entityHelp", "routeHelp", "rateStatus", "refreshRatesBtn", "resultTitle", "heroTotal", "scopeStatement", "governmentTotal", "professionalTotal", "localCurrency", "breakdown", "assumptions", "exclusions", "sourceList", "unsupportedNotice", "comparison", "comparisonGrid", "scenarioForm", "resetButton"].forEach((id) => { controls[id] = byId(id); });
  controls.scenarioForm.addEventListener("input", () => { readControls(); renderAll(); });
  controls.scenarioForm.addEventListener("change", () => { readControls(); renderAll(); });
  controls.refreshRatesBtn.addEventListener("click", fetchRates);
  controls.resetButton.addEventListener("click", resetScenario);
  document.querySelectorAll(".mode-option").forEach((button) => button.addEventListener("click", () => { state.mode = button.dataset.mode; document.querySelectorAll(".mode-option").forEach((item) => item.classList.toggle("is-active", item === button)); renderResult(); }));
  renderAll();
  fetchRates();
}

document.addEventListener("DOMContentLoaded", init);
