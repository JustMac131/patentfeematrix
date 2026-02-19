const JURISDICTIONS = [
  { id: "IN", name: "India", currency: "INR" },
  { id: "EP", name: "EP (European Patent Office)", currency: "EUR" },
  { id: "US", name: "United States", currency: "USD" },
  { id: "UK", name: "United Kingdom", currency: "GBP" },
  { id: "KR", name: "Korea", currency: "KRW" },
  { id: "JP", name: "Japan", currency: "JPY" },
  { id: "CN", name: "China", currency: "CNY" },
  { id: "PCT", name: "PCT / International", currency: "CHF" },
  { id: "AU", name: "Australia", currency: "AUD" },
];

const EP_VALIDATION_COUNTRIES = [
  { id: "fr", name: "France", defaultAmount: 0 },
  { id: "de", name: "Germany", defaultAmount: 0 },
  { id: "it", name: "Italy", defaultAmount: 0 },
  { id: "es", name: "Spain", defaultAmount: 0 },
  { id: "nl", name: "Netherlands", defaultAmount: 0 },
  { id: "gb", name: "United Kingdom", defaultAmount: 0 },
  { id: "ch", name: "Switzerland", defaultAmount: 0 },
];

const SOURCES = {
  IN: [
    {
      label: "India Patent Rules (First Schedule)",
      url: "https://ipindia.gov.in/writereaddata/Portal/ev/rules/patent-rules-2003-12-08-2024.pdf",
      asOf: "Official schedule (latest amendment PDF)",
    },
    {
      label: "English fee table rendering (reference)",
      url: "https://www.jpo.go.jp/e/system/laws/rule/guideline/document/index/fourth_schedule.pdf",
      asOf: "Used for fee-row verification",
    },
  ],
  EP: [
    {
      label: "EPO fee schedule",
      url: "https://www.epo.org/en/applying/fees",
      asOf: "Current schedule + announced 1 Apr 2026 values",
    },
  ],
  US: [
    {
      label: "USPTO current fee schedule",
      url: "https://www.uspto.gov/learning-and-resources/fees-and-payment/uspto-fee-schedule",
      asOf: "Current USPTO table values",
    },
  ],
  UK: [
    {
      label: "UK IPO patent fees",
      url: "https://www.gov.uk/government/publications/patent-forms-and-fees/patent-forms-and-fees",
      asOf: "Current UK IPO fee table",
    },
    {
      label: "UK IPO proposed fee changes",
      url: "https://www.gov.uk/government/consultations/patent-fees-proposal-to-increase-fees-in-april-2026",
      asOf: "Future update context",
    },
  ],
  KR: [
    {
      label: "KIPO service fees",
      url: "https://www.kipo.go.kr/en/HtmlApp?c=01080303&catmenu=m03_05_02",
      asOf: "Electronic filing and exam request fee rows",
    },
  ],
  JP: [
    {
      label: "JPO patent fees",
      url: "https://www.jpo.go.jp/e/system/process/tesuryo/hyoujyun_kaitei.html",
      asOf: "Current filing/exam formulas",
    },
  ],
  CN: [
    {
      label: "CNIPA patent fee standards",
      url: "https://english.cnipa.gov.cn/transfer/news/officialinformation/1117615.htm",
      asOf: "Published standards used for baseline",
    },
  ],
  AU: [
    {
      label: "IP Australia patent fees",
      url: "https://www.ipaustralia.gov.au/manage-my-ip/fees-and-payment/patent-fees",
      asOf: "Current published fee rows",
    },
  ],
  PCT: [
    {
      label: "WIPO PCT Applicant's Guide - Current PCT Fees",
      url: "https://www.wipo.int/pct/en/guide/fees.html",
      asOf: "International filing fee and page surcharge",
    },
  ],
};

const APPLICANT_MULTIPLIER = {
  startup: 0.9,
  individual: 0.95,
  sme: 1,
  company: 1.1,
};

const APPLICANT_LABEL = {
  startup: "Start-up",
  individual: "Individual",
  sme: "SME",
  company: "Company",
};

const APP_TYPE_LABEL = {
  provisional: "Provisional Drafting",
  complete: "Complete Drafting & Filing",
  foreign: "Foreign Filing (Direct/National)",
  pct: "PCT Filing (International / Follow-on)",
};

const FALLBACK_RATES_TO_INR = {
  INR: 1,
  USD: 83.2,
  EUR: 90.8,
  GBP: 106.3,
  KRW: 0.062,
  JPY: 0.56,
  CNY: 11.6,
  AUD: 54.6,
  CHF: 95.1,
};

const controls = {};
const state = {
  mode: "single",
  jurisdiction: "IN",
  applicantType: "startup",
  applicationType: "foreign",
  priorArtSearch: "yes",
  priorArtType: "quick",
  claimCount: 10,
  pageCount: 30,
  pctEfilingReduction: 0,
  pctManualAddOn: 0,
  professionalFees: {
    quick: 12000,
    extensive: 22000,
    provisional: 30000,
    complete: 70000,
    foreign: 50000,
    pct: 65000,
  },
  epValidation: {},
  ratesToINR: { ...FALLBACK_RATES_TO_INR },
  rateMeta: {
    source: "Fallback",
    date: null,
    fetchedAt: null,
    fallback: true,
  },
};

function byId(id) {
  return document.getElementById(id);
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampMin(value, minimum) {
  return Math.max(minimum, num(value, minimum));
}

function formatCurrency(value, currency) {
  const decimals = currency === "JPY" || currency === "KRW" ? 0 : 2;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: decimals,
  }).format(value);
}

function rateToINR(currency) {
  if (currency === "INR") {
    return 1;
  }
  return state.ratesToINR[currency] || null;
}

function convertToINR(amount, fromCurrency) {
  if (fromCurrency === "INR") {
    return amount;
  }
  const rate = rateToINR(fromCurrency);
  return rate ? amount * rate : Number.NaN;
}

function convertFromINR(amount, targetCurrency) {
  if (targetCurrency === "INR") {
    return amount;
  }
  const rate = rateToINR(targetCurrency);
  return rate ? amount / rate : Number.NaN;
}

function sumAmounts(items) {
  return items.reduce((acc, item) => acc + item.amount, 0);
}

function tierIndia(applicantType) {
  return applicantType === "company" ? "large" : "small";
}

function tierUS(applicantType) {
  if (applicantType === "company") return "large";
  if (applicantType === "sme") return "small";
  return "micro";
}

function isOnOrAfter(dateString) {
  const now = new Date();
  const threshold = new Date(`${dateString}T00:00:00`);
  return now >= threshold;
}

function buildEPValidationInputs() {
  const wrap = byId("epValidationWrap");
  wrap.innerHTML = "";
  EP_VALIDATION_COUNTRIES.forEach((country) => {
    state.epValidation[country.id] = {
      enabled: false,
      amount: country.defaultAmount,
    };

    const row = document.createElement("div");
    row.className = "validation-row";
    row.innerHTML = `
      <div class="top">
        <span>${country.name}</span>
        <input type="checkbox" data-ep-check="${country.id}" />
      </div>
      <label>
        Estimate (EUR)
        <input type="number" min="0" value="${country.defaultAmount}" data-ep-amount="${country.id}" />
      </label>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll("input[data-ep-check]").forEach((el) => {
    el.addEventListener("change", (event) => {
      const key = event.target.getAttribute("data-ep-check");
      state.epValidation[key].enabled = event.target.checked;
      render();
    });
  });

  wrap.querySelectorAll("input[data-ep-amount]").forEach((el) => {
    el.addEventListener("input", (event) => {
      const key = event.target.getAttribute("data-ep-amount");
      state.epValidation[key].amount = clampMin(event.target.value, 0);
      render();
    });
  });
}

function readControls() {
  state.mode = document.querySelector("input[name='viewMode']:checked").value;
  state.jurisdiction = controls.jurisdictionSelect.value;
  state.applicantType = controls.applicantType.value;
  state.applicationType = controls.applicationType.value;
  state.priorArtSearch = controls.priorArtSearch.value;
  state.priorArtType = controls.priorArtType.value;
  state.claimCount = clampMin(controls.claimCount.value, 1);
  state.pageCount = clampMin(controls.pageCount.value, 1);
  state.pctEfilingReduction = clampMin(controls.pctEfilingReduction.value, 0);
  state.pctManualAddOn = clampMin(controls.pctManualAddOn.value, 0);

  state.professionalFees.quick = clampMin(controls.feeQuick.value, 0);
  state.professionalFees.extensive = clampMin(controls.feeExtensive.value, 0);
  state.professionalFees.provisional = clampMin(controls.feeProvisional.value, 0);
  state.professionalFees.complete = clampMin(controls.feeComplete.value, 0);
  state.professionalFees.foreign = clampMin(controls.feeForeign.value, 0);
  state.professionalFees.pct = clampMin(controls.feePct.value, 0);
}

function syncVisibility() {
  const isAll = state.mode === "all";
  const isPct = state.applicationType === "pct";

  byId("jurisdictionField").style.display = isAll ? "none" : "block";
  controls.priorArtType.disabled = state.priorArtSearch === "no";

  document.querySelectorAll(".pct-only").forEach((block) => {
    block.style.display = isPct ? "block" : "none";
  });
}

function getProfessionalBreakdown(jurisdiction) {
  const applicantFactor = APPLICANT_MULTIPLIER[state.applicantType] || 1;
  const items = [];

  if (state.priorArtSearch === "yes") {
    if (state.priorArtType === "extensive") {
      items.push({
        label: "Extensive prior-art search",
        amountInr: state.professionalFees.extensive,
      });
    } else {
      items.push({
        label: "Quick prior-art search",
        amountInr: state.professionalFees.quick,
      });
    }
  }

  if (state.applicationType === "provisional") {
    items.push({
      label: "Provisional drafting professional fee",
      amountInr: state.professionalFees.provisional,
    });
  } else if (state.applicationType === "complete") {
    items.push({
      label: "Complete drafting & filing professional fee",
      amountInr: state.professionalFees.complete,
    });
  } else if (state.applicationType === "foreign") {
    items.push({
      label: "Foreign filing professional fee",
      amountInr: state.professionalFees.foreign,
    });
  } else if (state.applicationType === "pct") {
    items.push({
      label: "PCT filing professional fee",
      amountInr: state.professionalFees.pct,
    });
  }

  return items.map((item) => ({
    ...item,
    amountInr: Math.round(item.amountInr * applicantFactor),
    amountLocal: convertFromINR(
      Math.round(item.amountInr * applicantFactor),
      jurisdiction.currency
    ),
  }));
}

function getGovernmentBreakdown(jurisdiction) {
  const appType = state.applicationType;
  const claims = state.claimCount;
  const pages = state.pageCount;
  const items = [];
  const notes = [];
  let unsupportedReason = "";

  if (jurisdiction.id === "IN") {
    const tier = tierIndia(state.applicantType);
    const filing = tier === "small" ? 1600 : 8000;
    const exam = tier === "small" ? 4000 : 20000;

    if (appType === "provisional") {
      items.push({ label: "Patent filing fee (Form 1/2)", amount: filing });
    } else if (appType === "pct") {
      const transmittal = tier === "small" ? 3200 : 16000;
      items.push({
        label: "PCT transmittal fee (RO/IN)",
        amount: transmittal,
      });
      notes.push("WIPO international filing fee is shown in the PCT card (CHF).");
    } else {
      items.push({ label: "Patent filing fee (Form 1/2)", amount: filing });
      items.push({
        label: "Request for examination (Form 18)",
        amount: exam,
      });
    }
    notes.push(
      "Startup/individual/SME treated under the same fee tier in this model."
    );
  }

  if (jurisdiction.id === "US") {
    const tier = tierUS(state.applicantType);
    const provisional = { micro: 65, small: 130, large: 325 };
    const direct = {
      micro: { filing: 70, search: 154, exam: 176 },
      small: { filing: 70, search: 308, exam: 352 },
      large: { filing: 350, search: 770, exam: 880 },
    };
    const pctNational = {
      micro: { filing: 70, search: 154, exam: 176 },
      small: { filing: 140, search: 308, exam: 352 },
      large: { filing: 350, search: 770, exam: 880 },
    };

    if (appType === "provisional") {
      items.push({
        label: "Provisional application filing fee",
        amount: provisional[tier],
      });
    } else if (appType === "pct") {
      items.push({
        label: "PCT national stage basic filing fee",
        amount: pctNational[tier].filing,
      });
      items.push({
        label: "PCT national stage search fee",
        amount: pctNational[tier].search,
      });
      items.push({
        label: "PCT national stage examination fee",
        amount: pctNational[tier].exam,
      });
    } else {
      items.push({
        label: "Utility nonprovisional filing fee",
        amount: direct[tier].filing,
      });
      items.push({
        label: "Utility search fee",
        amount: direct[tier].search,
      });
      items.push({
        label: "Utility examination fee",
        amount: direct[tier].exam,
      });
    }
    notes.push(
      "Entity mapping assumption: start-up/individual = micro, SME = small, company = large."
    );
  }

  if (jurisdiction.id === "EP") {
    const epPostApr = isOnOrAfter("2026-04-01");
    const direct = epPostApr
      ? { filing: 135, search: 1595, designation: 720, exam: 2010 }
      : { filing: 135, search: 1520, designation: 685, exam: 1915 };

    if (appType === "provisional") {
      unsupportedReason = "EP has no provisional filing route.";
    } else {
      items.push({ label: "Filing fee", amount: direct.filing });
      items.push({ label: "Search fee", amount: direct.search });
      items.push({
        label: "Designation fee (all EPC states)",
        amount: direct.designation,
      });
      items.push({ label: "Examination fee", amount: direct.exam });

      if (appType === "pct") {
        notes.push(
          "Euro-PCT cases can vary if supplementary search is waived or reduced."
        );

        Object.entries(state.epValidation).forEach(([code, entry]) => {
          if (!entry.enabled || entry.amount <= 0) return;
          const name =
            EP_VALIDATION_COUNTRIES.find((country) => country.id === code)
              ?.name || code.toUpperCase();
          items.push({
            label: `Post-grant validation estimate (${name})`,
            amount: entry.amount,
          });
        });
        notes.push(
          "Validation rows are user-entered estimates and not official EPO fee-table values."
        );
      }
    }
  }

  if (jurisdiction.id === "UK") {
    const ukPostApr = isOnOrAfter("2026-04-01");
    const direct = ukPostApr
      ? { filing: 75, search: 200, exam: 130 }
      : { filing: 60, search: 150, exam: 100 };
    const pctNational = ukPostApr
      ? { entry: 30, search: 160, exam: 130 }
      : { entry: 30, search: 120, exam: 100 };

    if (appType === "provisional") {
      unsupportedReason = "UK has no standalone provisional patent filing route.";
    } else if (appType === "pct") {
      items.push({ label: "PCT national phase entry", amount: pctNational.entry });
      items.push({
        label: "Search (where no extra UK search needed)",
        amount: pctNational.search,
      });
      items.push({ label: "Substantive examination", amount: pctNational.exam });
    } else {
      items.push({ label: "Application fee", amount: direct.filing });
      items.push({ label: "Request for search", amount: direct.search });
      items.push({ label: "Request for examination", amount: direct.exam });
    }
    if (!ukPostApr) {
      notes.push("UK fees have a published proposal for increase from April 2026.");
    }
  }

  if (jurisdiction.id === "KR") {
    const filing = 46000;
    const examination = 166000 + claims * 51000;

    if (appType === "provisional") {
      unsupportedReason = "Korea does not use a standalone provisional patent route.";
    } else {
      items.push({ label: "Electronic filing fee", amount: filing });
      items.push({
        label: `Substantive examination fee (${claims} claims assumed)`,
        amount: examination,
      });
    }
    notes.push(
      "Korean surcharge is claim-based; modify claim count in inputs for scenario checks."
    );
  }

  if (jurisdiction.id === "JP") {
    const filing = 14000;
    const examination = 138000 + claims * 4000;

    if (appType === "provisional") {
      unsupportedReason = "Japan does not use a standalone provisional patent route.";
    } else {
      items.push({ label: "Patent filing fee", amount: filing });
      items.push({
        label: `Examination request fee (${claims} claims assumed)`,
        amount: examination,
      });
    }
    notes.push(
      "Japanese examination request fee depends on claim count in this model."
    );
  }

  if (jurisdiction.id === "CN") {
    const filing = 900;
    const printing = 50;
    const exam = 2500;
    const extraClaims = claims > 10 ? (claims - 10) * 150 : 0;
    const extraPages = pages > 30 ? (pages - 30) * 50 : 0;

    if (appType === "provisional") {
      unsupportedReason = "China does not use a standalone provisional patent route.";
    } else {
      items.push({ label: "Application fee", amount: filing });
      items.push({ label: "Publication printing fee", amount: printing });
      items.push({ label: "Substantive examination request", amount: exam });
      if (extraClaims > 0) {
        items.push({
          label: `Additional claims fee (${claims - 10} claims over 10)`,
          amount: extraClaims,
        });
      }
      if (extraPages > 0) {
        items.push({
          label: `Additional pages fee (${pages - 30} pages over 30)`,
          amount: extraPages,
        });
      }
    }
    notes.push("China values here are baseline invention-patent fee components.");
  }

  if (jurisdiction.id === "AU") {
    const provisional = 100;
    const standard = 400;
    const examination = 550;

    if (appType === "provisional") {
      items.push({ label: "Provisional filing fee", amount: provisional });
    } else {
      items.push({ label: "Standard patent filing fee", amount: standard });
      items.push({ label: "Examination request fee", amount: examination });
    }
  }

  if (jurisdiction.id === "PCT") {
    if (appType !== "pct") {
      unsupportedReason =
        "PCT card is applicable when 'PCT Filing' application type is selected.";
    } else {
      const baseFiling = 1330;
      const pageSurcharge = pages > 30 ? (pages - 30) * 15 : 0;
      const reduction = state.pctEfilingReduction;
      const manual = state.pctManualAddOn;

      items.push({
        label: "International filing fee (first 30 pages)",
        amount: baseFiling,
      });
      if (pageSurcharge > 0) {
        items.push({
          label: `Page surcharge (${pages - 30} pages over 30)`,
          amount: pageSurcharge,
        });
      }
      if (reduction > 0) {
        items.push({
          label: "e-filing reduction",
          amount: -reduction,
        });
      }
      if (manual > 0) {
        items.push({
          label: "Additional user-entered PCT fees",
          amount: manual,
        });
      }
      notes.push(
        "ISA search fees and receiving-office transmittal fees vary and can be added via manual add-on."
      );
    }
  }

  return {
    currency: jurisdiction.currency,
    items,
    notes,
    unsupportedReason,
    sources: SOURCES[jurisdiction.id] || [],
  };
}

function makeBreakdownHtml(items, currency, isProfessional = false) {
  if (!items.length) {
    return "<p class='small'>No line items.</p>";
  }

  const lines = items
    .map((item) => {
      if (isProfessional) {
        const local =
          Number.isFinite(item.amountLocal) && item.amountLocal >= 0
            ? formatCurrency(item.amountLocal, currency)
            : "Local n/a";
        return `<li>${item.label}: ${formatCurrency(
          item.amountInr,
          "INR"
        )} (${local})</li>`;
      }

      const inr = convertToINR(item.amount, currency);
      const inrText = Number.isFinite(inr)
        ? `(${formatCurrency(inr, "INR")})`
        : "(INR n/a)";
      return `<li>${item.label}: ${formatCurrency(item.amount, currency)} ${inrText}</li>`;
    })
    .join("");

  return `<ul class="breakdown">${lines}</ul>`;
}

function computeResultForJurisdiction(jurisdiction) {
  const government = getGovernmentBreakdown(jurisdiction);
  const professional = getProfessionalBreakdown(jurisdiction);

  const governmentLocal = sumAmounts(government.items);
  const governmentInr = convertToINR(governmentLocal, government.currency);
  const professionalInr = professional.reduce(
    (acc, item) => acc + item.amountInr,
    0
  );
  const professionalLocal = convertFromINR(professionalInr, government.currency);

  const totalLocal =
    Number.isFinite(professionalLocal) && !government.unsupportedReason
      ? governmentLocal + professionalLocal
      : Number.NaN;
  const totalInr =
    Number.isFinite(governmentInr) && !government.unsupportedReason
      ? governmentInr + professionalInr
      : Number.NaN;

  return {
    jurisdiction,
    government,
    professional,
    governmentLocal,
    governmentInr,
    professionalInr,
    professionalLocal,
    totalLocal,
    totalInr,
  };
}

function renderSummary(results) {
  const tbody = byId("summaryBody");
  const sortable = [...results].sort((a, b) => {
    if (!Number.isFinite(a.totalInr)) return 1;
    if (!Number.isFinite(b.totalInr)) return -1;
    return a.totalInr - b.totalInr;
  });

  tbody.innerHTML = sortable
    .map((result) => {
      const govText = result.government.unsupportedReason
        ? "N/A"
        : formatCurrency(result.governmentLocal, result.jurisdiction.currency);
      const inrText = Number.isFinite(result.totalInr)
        ? formatCurrency(result.totalInr, "INR")
        : "N/A";
      return `
        <tr>
          <td>${result.jurisdiction.name}</td>
          <td>${govText}</td>
          <td>${inrText}</td>
        </tr>
      `;
    })
    .join("");
}

function rateNote(currency) {
  if (currency === "INR") {
    return "Base currency is INR.";
  }
  const rate = rateToINR(currency);
  if (!rate) {
    return "INR conversion unavailable for this currency.";
  }
  return `1 ${currency} = ${rate.toFixed(4)} INR (${state.rateMeta.source}${
    state.rateMeta.date ? `, ${state.rateMeta.date}` : ""
  })`;
}

function renderCards(results) {
  const cards = byId("cards");
  cards.innerHTML = results
    .map((result) => {
      const { jurisdiction, government, professional } = result;
      const unsupported = government.unsupportedReason;
      const localTotalText = Number.isFinite(result.totalLocal)
        ? formatCurrency(result.totalLocal, jurisdiction.currency)
        : "N/A";
      const inrTotalText = Number.isFinite(result.totalInr)
        ? formatCurrency(result.totalInr, "INR")
        : "N/A";

      const sourceHtml = government.sources.length
        ? `<div class="notes"><strong>Sources:</strong><br/>${government.sources
            .map(
              (source) =>
                `<a href="${source.url}" target="_blank" rel="noopener">${source.label}</a> (${source.asOf})`
            )
            .join("<br/>")}</div>`
        : "";

      const extraNotes = government.notes.length
        ? `<div class="notes"><strong>Notes:</strong><br/>${government.notes.join(
            "<br/>"
          )}</div>`
        : "";

      return `
        <article class="card">
          <h3>${jurisdiction.name}</h3>
          <span class="chip">${APP_TYPE_LABEL[state.applicationType]}</span>

          ${
            unsupported
              ? `<p class="unsupported">${unsupported}</p>`
              : `<div class="totals">
                   <strong>Total (${jurisdiction.currency}): ${localTotalText}</strong>
                   <strong>Total (INR): ${inrTotalText}</strong>
                 </div>`
          }
          <p class="fx-note">${rateNote(jurisdiction.currency)}</p>

          <p class="section-head">Government Fees</p>
          ${makeBreakdownHtml(government.items, jurisdiction.currency, false)}

          <p class="section-head">Professional Fees</p>
          ${makeBreakdownHtml(professional, jurisdiction.currency, true)}

          ${extraNotes}
          ${sourceHtml}
        </article>
      `;
    })
    .join("");
}

function updateRateStatus() {
  const status = byId("rateStatus");
  const text = state.rateMeta.fallback
    ? `Using fallback rates (last refresh failed).`
    : `Live rates loaded from ${state.rateMeta.source}${
        state.rateMeta.date ? ` (${state.rateMeta.date})` : ""
      }.`;
  status.textContent = text;
}

async function fetchExchangeRates() {
  const refreshButton = byId("refreshRatesBtn");
  refreshButton.disabled = true;

  try {
    const targets = ["INR", "USD", "GBP", "KRW", "JPY", "CNY", "AUD", "CHF"];
    const endpoint = `https://api.frankfurter.app/latest?from=EUR&to=${targets.join(
      ","
    )}`;
    const response = await fetch(endpoint, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Rate API failed with status ${response.status}`);
    }

    const data = await response.json();
    const eurToInr = data?.rates?.INR;
    if (!eurToInr) {
      throw new Error("INR rate missing in response.");
    }

    const updated = { INR: 1, EUR: eurToInr };
    ["USD", "GBP", "KRW", "JPY", "CNY", "AUD", "CHF"].forEach((currency) => {
      const eurToCurrency = data.rates[currency];
      if (eurToCurrency) {
        updated[currency] = eurToInr / eurToCurrency;
      }
    });

    state.ratesToINR = { ...state.ratesToINR, ...updated };
    state.rateMeta = {
      source: "Frankfurter / ECB",
      date: data.date || null,
      fetchedAt: new Date().toISOString(),
      fallback: false,
    };
  } catch (error) {
    state.ratesToINR = { ...FALLBACK_RATES_TO_INR };
    state.rateMeta = {
      source: "Fallback static set",
      date: null,
      fetchedAt: new Date().toISOString(),
      fallback: true,
    };
    console.error(error);
  } finally {
    refreshButton.disabled = false;
    updateRateStatus();
    render();
  }
}

function bindControls() {
  [
    ...document.querySelectorAll("input[name='viewMode']"),
    controls.jurisdictionSelect,
    controls.applicantType,
    controls.applicationType,
    controls.priorArtSearch,
    controls.priorArtType,
    controls.claimCount,
    controls.pageCount,
    controls.pctEfilingReduction,
    controls.pctManualAddOn,
    controls.feeQuick,
    controls.feeExtensive,
    controls.feeProvisional,
    controls.feeComplete,
    controls.feeForeign,
    controls.feePct,
  ].forEach((el) => {
    el.addEventListener("input", () => {
      readControls();
      syncVisibility();
      render();
    });
    el.addEventListener("change", () => {
      readControls();
      syncVisibility();
      render();
    });
  });

  byId("refreshRatesBtn").addEventListener("click", () => {
    fetchExchangeRates();
  });
}

function render() {
  const activeJurisdictions =
    state.mode === "all"
      ? JURISDICTIONS
      : JURISDICTIONS.filter((jurisdiction) => jurisdiction.id === state.jurisdiction);

  const results = activeJurisdictions.map((jurisdiction) =>
    computeResultForJurisdiction(jurisdiction)
  );

  renderSummary(results);
  renderCards(results);
}

function init() {
  controls.jurisdictionSelect = byId("jurisdictionSelect");
  controls.applicantType = byId("applicantType");
  controls.applicationType = byId("applicationType");
  controls.priorArtSearch = byId("priorArtSearch");
  controls.priorArtType = byId("priorArtType");
  controls.claimCount = byId("claimCount");
  controls.pageCount = byId("pageCount");
  controls.pctEfilingReduction = byId("pctEfilingReduction");
  controls.pctManualAddOn = byId("pctManualAddOn");
  controls.feeQuick = byId("feeQuick");
  controls.feeExtensive = byId("feeExtensive");
  controls.feeProvisional = byId("feeProvisional");
  controls.feeComplete = byId("feeComplete");
  controls.feeForeign = byId("feeForeign");
  controls.feePct = byId("feePct");

  buildEPValidationInputs();
  readControls();
  syncVisibility();
  bindControls();
  updateRateStatus();
  render();
  fetchExchangeRates();
}

document.addEventListener("DOMContentLoaded", init);
