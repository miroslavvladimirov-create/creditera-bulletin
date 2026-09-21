// ==========================================================================
// АКПБ / CreditERA - Месечен Ипотечен Бюлетин (9 страници A4)
// ==========================================================================

// Constants
const COMPILER_NAME = 'гл. ас. д-р Мирослав Владимиров';
const COMPILER_TITLE = 'зам.-председател на УС на АКПБ';
const COMPILER_EMAIL = 'mvladimirov@creditera.bg';

// Selectors
const dropZone = document.getElementById('dropZone');
const excelFileInput = document.getElementById('excelFile');
const btnExportPDF = document.getElementById('btnExportPDF');
const btnExportBothPDF = document.getElementById('btnExportBothPDF');
const fileStatus = document.getElementById('fileStatus');
const fileNameSpan = document.getElementById('fileName');
const dataSourceBadge = document.getElementById('dataSourceBadge');
const dataSourceText = document.getElementById('dataSourceText');

// Inputs
const inputNum = document.getElementById('bulletinNum');
const inputMonth = document.getElementById('bulletinMonth');
const inputAuthor = document.getElementById('bulletinAuthor');
const inputText = document.getElementById('summaryText');
const btnClearDraft = document.getElementById('btnClearDraft');
const draftStatusBadge = document.getElementById('draftStatusBadge');

// Preview Header Outputs
const lblDocNums = document.querySelectorAll('.lblDocNum');
const lblDocMonths = document.querySelectorAll('.lblDocMonth');
const lblSummaryText = document.getElementById('lblSummaryText');
const compilerLine = document.getElementById('compilerLine');
const brandDisclaimer = document.getElementById('brandDisclaimer');
const overflowWarnings = document.getElementById('overflowWarnings');
const overflowList = document.getElementById('overflowList');

// Sliders
const sliderTableFont = document.getElementById('sliderTableFont');
const sliderChartHeight = document.getElementById('sliderChartHeight');
const sliderSpacing = document.getElementById('sliderSpacing');
const lblTableFont = document.getElementById('lblTableFont');
const lblChartHeight = document.getElementById('lblChartHeight');
const lblSpacing = document.getElementById('lblSpacing');

// Country codes to Bulgarian names mapping
const countryNames = {
    'U2': 'Еврозона', 'AT': 'Австрия', 'BE': 'Белгия', 'DE': 'Германия', 'GR': 'Гърция',
    'EE': 'Естония', 'IE': 'Ирландия', 'ES': 'Испания', 'IT': 'Италия', 'CY': 'Кипър',
    'LV': 'Латвия', 'LT': 'Литва', 'LU': 'Люксембург', 'MT': 'Малта', 'NL': 'Нидерландия',
    'PT': 'Португалия', 'SK': 'Словакия', 'SI': 'Словения', 'FI': 'Финландия', 'FR': 'Франция',
    'HR': 'Хърватия', 'BG': 'България'
};

const monthNamesBG = [
    'януари', 'февруари', 'март', 'април', 'май', 'юни',
    'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'
];

// Sequence of 7 indicator pages (Pages 3 to 9)
const INDICATOR_SEQUENCE = [
    {
        key: 'rate',
        pageNum: 3,
        defaultCommentary: 'Средната цена на новите жилищни кредити (Cost of Borrowing) отразява реално договорените лихвени проценти по всички видове новоотпуснати ипотечни заеми за домакинства.'
    },
    {
        key: 'fix_f',
        pageNum: 4,
        defaultCommentary: 'Лихвени проценти по нови жилищни кредити с плаваща лихва или първоначално фиксиран период до 1 година. В България този сегмент формира преобладаващата част от пазара.'
    },
    {
        key: 'fix_i',
        pageNum: 5,
        defaultCommentary: 'Лихвени проценти по нови жилищни заеми с първоначално фиксиране между 1 и 5 години, предоставящи средносрочна сигурност на месечната вноска.'
    },
    {
        key: 'fix_o',
        pageNum: 6,
        defaultCommentary: 'Лихвени проценти по нови жилищни кредити с първоначален период на фиксиране между 5 и 10 години.'
    },
    {
        key: 'fix_p',
        pageNum: 7,
        defaultCommentary: 'Дългосрочно фиксирани лихвени проценти за период над 10 години, типични за пазари като Франция, Германия, Белгия и Нидерландия.'
    },
    {
        key: 'loan_growth_yoy',
        pageNum: 8,
        defaultCommentary: 'Годишен темп на прираст на общата наличност (салда) по жилищни кредити за домакинства, коригиран за прекласификации и трансакции (BSI статистика).'
    },
    {
        key: 'rate_outstanding',
        pageNum: 9,
        defaultCommentary: 'Среднопретеглен лихвен процент по цялата съществуваща наличност (салда) от жилищни заеми, отразяващ реалната тежест върху обслужваните от домакинствата кредити.'
    }
];

// Global data & state
let lastLoadedJson = null;
let currentMeta = null;
let currentBrand = 'akpb';
let indicatorCharts = {};
let saveDraftTimeout = null;
let editedCells = {}; // Key: `${countryCode}_${indicatorKey}_${colKey}`

// Utilities
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatPeriodToMonthYear(periodStr) {
    if (!periodStr) return '';
    const parts = periodStr.toString().split('-');
    if (parts.length >= 2) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
            return `${monthNamesBG[monthIdx]} ${year} г.`;
        }
    }
    return periodStr;
}

function formatPeriodToMonthYearCaps(periodStr) {
    if (!periodStr) return '';
    const parts = periodStr.toString().split('-');
    if (parts.length >= 2) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
            return `${monthNamesBG[monthIdx].toUpperCase()} ${year}`;
        }
    }
    return periodStr.toUpperCase();
}

function formatPeriodToLastDay(periodStr) {
    if (!periodStr) return '';
    const parts = periodStr.toString().split('-');
    if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const lastDay = new Date(year, month, 0).getDate();
        const padMonth = String(month).padStart(2, '0');
        return `Данни към ${lastDay}.${padMonth}.${year} г.`;
    }
    return `Данни към ${periodStr}`;
}

function formatDelta(d1m) {
    if (d1m === null || d1m === undefined) {
        return { text: '► 0.00 п.п.', cssClass: 'delta-flat' };
    }
    const num = parseFloat(d1m);
    if (Math.abs(num) < 0.001) {
        return { text: '► 0.00 п.п.', cssClass: 'delta-flat' };
    }
    if (num > 0) {
        return { text: `▲ +${num.toFixed(2)} п.п.`, cssClass: 'delta-up' };
    }
    return { text: `▼ ${num.toFixed(2)} п.п.`, cssClass: 'delta-down' };
}

function formatWarningEditorial(warningStr, refPeriod) {
    const refMonthYear = formatPeriodToMonthYear(refPeriod);
    const parts = warningStr.split(':');
    if (parts.length < 2) return warningStr;
    const code = parts[0].trim();
    const rest = parts[1].trim();
    const cName = countryNames[code] || code;

    if (rest.includes('последна налична')) {
        const afterLast = rest.split('последна налична')[1].trim();
        if (afterLast === '—' || !afterLast) {
            return `${cName}: липсват данни за ${refMonthYear}`;
        }
        const lastFormatted = formatPeriodToMonthYear(afterLast);
        return `${cName}: липсват данни за ${refMonthYear}, последна налична стойност ${lastFormatted}`;
    }
    return `${cName}: липсват данни за ${refMonthYear}`;
}

// ==========================================================================
// Main Document Renderer
// ==========================================================================
function renderBulletinDocument(jsonData, isRestoringDraft = false) {
    if (!jsonData || !jsonData.data) {
        console.error('Invalid jsonData supplied to renderBulletinDocument');
        return;
    }

    lastLoadedJson = jsonData;
    currentMeta = jsonData.meta || {};

    // 1. Metadata update
    if (currentMeta.period && !isRestoringDraft) {
        const formattedMY = formatPeriodToMonthYear(currentMeta.period);
        if (inputMonth) inputMonth.value = formattedMY;
        lblDocMonths.forEach(el => el.innerText = formattedMY);
    }

    // 2. Render Page 1 (Cover Page)
    renderCoverPage(jsonData);

    // 3. Render Page 2 (Market Overview & Benchmarks)
    renderPage2(jsonData);

    // 4. Render Pages 3 to 9 (7 Indicators)
    INDICATOR_SEQUENCE.forEach(indCfg => {
        renderIndicatorPage(indCfg, jsonData);
    });

    // 5. Render Page 9 Compiler & Disclaimer
    renderCompilerAndDisclaimer();

    // 6. Update brand visuals on all 9 pages
    updateBrandVisuals();

    // 7. Check overflow across all 9 pages
    requestAnimationFrame(() => {
        checkPagesOverflow();
    });

    if (window.lucide) {
        lucide.createIcons();
    }
}

// --------------------------------------------------------------------------
// Page 1: Cover Page
// --------------------------------------------------------------------------
function renderCoverPage(jsonData) {
    const b = (typeof BRANDS !== 'undefined' && BRANDS[currentBrand]) ? BRANDS[currentBrand] : null;
    const periodStr = jsonData.meta?.period || '';
    const formattedMY = formatPeriodToMonthYear(periodStr);
    const formattedMYCaps = formatPeriodToMonthYearCaps(periodStr);
    const lastDateStr = formatPeriodToLastDay(periodStr);

    // 1. Top row
    const coverDocDateCaps = document.getElementById('coverDocDateCaps');
    if (coverDocDateCaps) coverDocDateCaps.innerText = formattedMYCaps;

    // 2. Titles & Subtitles
    const coverMainTitle = document.getElementById('coverMainTitle');
    if (coverMainTitle && b?.coverTitle) coverMainTitle.innerHTML = b.coverTitle;

    const coverSubtitle = document.getElementById('coverSubtitle');
    if (coverSubtitle && b?.coverSubtitle) coverSubtitle.innerText = b.coverSubtitle;

    // 3. 3 Key Indicators for BG
    const countries = jsonData.data?.countries || [];
    const bg = countries.find(c => c.code === 'BG') || {};
    const bgRate = bg.indicators?.rate?.value;
    const bgSpread = bg.indicators?.rate?.spread_bps;
    const bgGrowth = bg.indicators?.loan_growth_yoy?.value;

    const kpiRateEl = document.getElementById('coverKpiRate');
    if (kpiRateEl) {
        kpiRateEl.innerText = (bgRate !== null && bgRate !== undefined) ? `${bgRate.toFixed(2)} %` : 'н/д';
    }

    const kpiSpreadEl = document.getElementById('coverKpiSpread');
    if (kpiSpreadEl) {
        if (bgSpread !== null && bgSpread !== undefined) {
            const sVal = Math.round(Number(bgSpread));
            kpiSpreadEl.innerText = `${sVal > 0 ? '+' : ''}${sVal} б.т.`;
        } else {
            kpiSpreadEl.innerText = 'н/д';
        }
    }

    const kpiGrowthEl = document.getElementById('coverKpiGrowth');
    if (kpiGrowthEl) {
        if (bgGrowth !== null && bgGrowth !== undefined) {
            const gVal = Number(bgGrowth);
            kpiGrowthEl.innerText = `${gVal > 0 ? '+' : ''}${gVal.toFixed(2)} %`;
        } else {
            kpiGrowthEl.innerText = 'н/д';
        }
    }

    // Period subtitles on cover KPI
    document.querySelectorAll('.lblKpiPeriodSub').forEach(el => {
        el.innerText = `данни за ${formattedMY}`;
    });

    // 4. Bottom row
    const coverDataDate = document.getElementById('coverDataDate');
    if (coverDataDate) coverDataDate.innerText = lastDateStr;

    const coverContactText = document.getElementById('coverContactText');
    if (coverContactText && b?.coverContact) coverContactText.innerText = b.coverContact;
}

// --------------------------------------------------------------------------
// Page 2: Overview, ECB Cards, Benchmark Cards
// --------------------------------------------------------------------------
function renderPage2(jsonData) {
    const ecb = jsonData.data?.ecb || {};
    const benchmarks = jsonData.data?.benchmarks || {};

    // 1. ECB Policy Rates (3 cards)
    const ecbMapping = [
        { id: 'ecb-dfr', data: ecb.dfr },
        { id: 'ecb-mro', data: ecb.mro },
        { id: 'ecb-mlf', data: ecb.mlf }
    ];

    ecbMapping.forEach(item => {
        const valEl = document.getElementById(`${item.id}-val`);
        const deltaEl = document.getElementById(`${item.id}-delta`);
        if (valEl) {
            valEl.innerText = item.data?.value !== null && item.data?.value !== undefined ? `${item.data.value.toFixed(2)} %` : 'н/д';
        }
        if (deltaEl) {
            const dObj = formatDelta(item.data?.d1m);
            deltaEl.innerText = dObj.text;
            deltaEl.className = `kpi-delta ${dObj.cssClass}`;
        }
    });

    // 2. Benchmarks (5 cards)
    const benchMapping = [
        { id: 'bench-e1m', data: benchmarks.euribor_1m },
        { id: 'bench-e3m', data: benchmarks.euribor_3m },
        { id: 'bench-e6m', data: benchmarks.euribor_6m },
        { id: 'bench-e1y', data: benchmarks.euribor_1y },
        { id: 'bench-estr', data: benchmarks.estr }
    ];

    benchMapping.forEach(item => {
        const valEl = document.getElementById(`${item.id}-val`);
        const deltaEl = document.getElementById(`${item.id}-delta`);
        if (valEl) {
            valEl.innerText = item.data?.value !== null && item.data?.value !== undefined ? `${item.data.value.toFixed(2)} %` : 'н/д';
        }
        if (deltaEl) {
            const dObj = formatDelta(item.data?.d1m);
            deltaEl.innerText = dObj.text;
            deltaEl.className = `kpi-delta ${dObj.cssClass}`;
        }
    });

    // 3. Market overview text from textarea if set
    if (lblSummaryText && inputText && !lblSummaryText.innerText.trim()) {
        lblSummaryText.innerText = inputText.value;
    }
}

// --------------------------------------------------------------------------
// Indicator Page Renderer (Pages 3 to 9)
// --------------------------------------------------------------------------
function renderIndicatorPage(indCfg, jsonData) {
    const indKey = indCfg.key;
    const pageNum = indCfg.pageNum;
    const isGrowth = (indKey === 'loan_growth_yoy');
    const indLabels = jsonData.meta?.indicator_labels || {};
    const indTitle = indLabels[indKey] || indKey;

    // 1. Update Title & Commentary
    const titleEl = document.getElementById(`title-${indKey}`);
    if (titleEl) titleEl.innerText = indTitle;

    const commEl = document.getElementById(`commentary-${indKey}`);
    if (commEl && !commEl.innerText.trim()) {
        commEl.innerText = indCfg.defaultCommentary;
    }

    // 2. Populate 22-row Table
    const tbody = document.getElementById(`tbody-${indKey}`);
    if (!tbody) return;
    tbody.innerHTML = '';

    const countries = jsonData.data?.countries || [];
    let hasLowVolume = false;
    let bgHistorySource = null;

    countries.forEach(c => {
        const code = c.code;
        const name = c.name_bg || countryNames[code] || code;
        const indData = c.indicators?.[indKey] || {};
        const val = indData.value;
        const d1m = indData.d1m;
        const d3m = indData.d3m;
        const d6m = indData.d6m;
        const d12m = indData.d12m;
        const flag = indData.flag;

        if (flag === 'low_volume') {
            hasLowVolume = true;
        }
        if (code === 'BG' && indData.history_source) {
            bgHistorySource = indData.history_source;
        }

        const tr = document.createElement('tr');
        if (code === 'BG' || code === 'U2') {
            tr.className = 'highlight-row';
        }

        // Col 1: Country Name (with BG* on Page 3)
        const tdCountry = document.createElement('td');
        const isBgWithStar = (indKey === 'rate' && code === 'BG' && bgHistorySource);
        const codeDisplay = isBgWithStar ? 'BG*' : code;
        tdCountry.innerHTML = `<strong>${escapeHTML(name)}</strong><span style="font-size: 7px; color: #64748b; margin-left: 3px;">${codeDisplay}</span>`;
        tr.appendChild(tdCountry);

        // Col 2: Value
        const tdVal = document.createElement('td');
        tdVal.contentEditable = true;
        tdVal.dataset.country = code;
        tdVal.dataset.indicator = indKey;
        tdVal.dataset.col = 'value';

        if (val === null || val === undefined) {
            tdVal.innerText = 'н/д';
            tdVal.style.color = '#94a3b8';
        } else {
            const formattedVal = `${val.toFixed(2)} %`;
            if (flag === 'low_volume') {
                tdVal.innerHTML = `<span class="cell-low-volume">${formattedVal}*</span>`;
            } else {
                tdVal.innerText = formattedVal;
            }
        }
        attachCellEditHandler(tdVal, indData, 'value');
        tr.appendChild(tdVal);

        // Cols 3-6: Deltas (d1m, d3m, d6m, d12m)
        const deltas = [
            { key: 'd1m', val: d1m },
            { key: 'd3m', val: d3m },
            { key: 'd6m', val: d6m },
            { key: 'd12m', val: d12m }
        ];

        deltas.forEach(d => {
            const tdD = document.createElement('td');
            tdD.contentEditable = true;
            tdD.dataset.country = code;
            tdD.dataset.indicator = indKey;
            tdD.dataset.col = d.key;

            if (d.val === null || d.val === undefined) {
                tdD.innerText = 'н/д';
                tdD.style.color = '#94a3b8';
            } else {
                const num = parseFloat(d.val);
                if (Math.abs(num) < 0.001) {
                    tdD.innerText = '0.00 п.п.';
                    tdD.className = 'delta-flat';
                } else if (num > 0) {
                    tdD.innerText = `+${num.toFixed(2)} п.п.`;
                    tdD.className = 'delta-up';
                } else {
                    tdD.innerText = `${num.toFixed(2)} п.п.`;
                    tdD.className = 'delta-down';
                }
            }
            attachCellEditHandler(tdD, indData, d.key);
            tr.appendChild(tdD);
        });

        // Cols 7-9 on Page 3 (rate): Spread (б.т.), sd24, z24
        if (indKey === 'rate') {
            // Col 7: spread_bps (integer in б.т.)
            const tdSpread = document.createElement('td');
            tdSpread.contentEditable = true;
            tdSpread.dataset.country = code;
            tdSpread.dataset.indicator = indKey;
            tdSpread.dataset.col = 'spread_bps';

            if (indData.spread_bps === null || indData.spread_bps === undefined) {
                tdSpread.innerText = 'н/д';
                tdSpread.style.color = '#94a3b8';
            } else {
                const spreadVal = Math.round(Number(indData.spread_bps));
                tdSpread.innerText = `${spreadVal > 0 ? '+' : ''}${spreadVal} б.т.`;
            }
            attachCellEditHandler(tdSpread, indData, 'spread_bps');
            tr.appendChild(tdSpread);

            // Col 8: sd24 (2 decimals)
            const tdSd = document.createElement('td');
            tdSd.contentEditable = true;
            tdSd.dataset.country = code;
            tdSd.dataset.indicator = indKey;
            tdSd.dataset.col = 'sd24';

            if (indData.sd24 === null || indData.sd24 === undefined) {
                tdSd.innerText = 'н/д';
                tdSd.style.color = '#94a3b8';
            } else {
                tdSd.innerText = Number(indData.sd24).toFixed(2);
            }
            attachCellEditHandler(tdSd, indData, 'sd24');
            tr.appendChild(tdSd);

            // Col 9: z24 (2 decimals)
            const tdZ = document.createElement('td');
            tdZ.contentEditable = true;
            tdZ.dataset.country = code;
            tdZ.dataset.indicator = indKey;
            tdZ.dataset.col = 'z24';

            if (indData.z24 === null || indData.z24 === undefined) {
                tdZ.innerText = 'н/д';
                tdZ.style.color = '#94a3b8';
            } else {
                const zVal = Number(indData.z24);
                tdZ.innerText = `${zVal > 0 ? '+' : ''}${zVal.toFixed(2)}`;
            }
            attachCellEditHandler(tdZ, indData, 'z24');
            tr.appendChild(tdZ);
        }

        tbody.appendChild(tr);
    });

    // 3. Render / Update Chart.js Bar Chart
    renderIndicatorChart(indKey, countries, isGrowth);

    // 4. Notes and Warnings
    const warningsContainer = document.getElementById(`warnings-${indKey}`);
    const footnoteEl = document.getElementById(`footnote-${indKey}`);
    const rawWarnings = jsonData.meta?.warnings || [];
    const relevantWarnings = rawWarnings.filter(w => w.includes(`: ${indKey} липсва`));

    if (warningsContainer) {
        if (relevantWarnings.length > 0) {
            warningsContainer.innerHTML = relevantWarnings
                .map(w => formatWarningEditorial(w, jsonData.meta?.period))
                .join('<br>');
            warningsContainer.style.display = 'block';
        } else {
            warningsContainer.innerHTML = '';
            warningsContainer.style.display = 'none';
        }
    }

    if (footnoteEl) {
        if (indKey === 'rate' && bgHistorySource) {
            footnoteEl.innerText = `* BG: ${bgHistorySource}.`;
            footnoteEl.style.display = 'block';
        } else if (hasLowVolume) {
            footnoteEl.innerText = '* Сегменти с ограничен обем на нов бизнес могат да показват нетипични стойности.';
            footnoteEl.style.display = 'block';
        } else {
            footnoteEl.style.display = 'none';
        }
    }
}

// --------------------------------------------------------------------------
// Indicator Chart (Chart.js)
// --------------------------------------------------------------------------
function renderIndicatorChart(indKey, countries, isGrowth = false) {
    const canvas = document.getElementById(`chart-${indKey}`);
    if (!canvas) return;

    if (indicatorCharts[indKey]) {
        indicatorCharts[indKey].destroy();
        delete indicatorCharts[indKey];
    }

    const b = (typeof BRANDS !== 'undefined' && BRANDS[currentBrand]) ? BRANDS[currentBrand] : null;
    const primaryColor = b?.palette?.primary || '#0B2545';
    const accentColor = b?.palette?.accent || '#EEB902';
    const bgBarColor = accentColor; // Brand accent for BG (Gold for AKPB, Green for CreditERA)
    const u2BarColor = b?.palette?.primaryLight || '#314575'; // Brand primary light for Eurozone

    const labels = countries.map(c => c.code);
    const dataValues = countries.map(c => {
        const v = c.indicators?.[indKey]?.value;
        return (v !== null && v !== undefined) ? v : null;
    });

    const backgroundColors = countries.map(c => {
        if (c.code === 'BG') return bgBarColor;
        if (c.code === 'U2') return u2BarColor;
        return primaryColor;
    });

    const ctx = canvas.getContext('2d');
    indicatorCharts[indKey] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors,
                borderRadius: 2,
                barPercentage: 0.8,
                categoryPercentage: 0.85
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.raw;
                            if (val === null) return 'Липсват данни';
                            return `${val.toFixed(2)} %`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 8, family: 'Inter, sans-serif', weight: '600' },
                        color: (ctx) => {
                            const label = ctx.tick?.label;
                            if (label === 'BG') return accentColor;
                            return '#64748b';
                        }
                    }
                },
                y: {
                    grid: { color: 'rgba(226, 232, 240, 0.8)' },
                    ticks: {
                        font: { size: 7.5, family: 'Inter, sans-serif' },
                        color: '#64748b',
                        callback: (v) => `${v}%`
                    }
                }
            }
        }
    });
}

// --------------------------------------------------------------------------
// Cell Edit Handler (Inline Editing & Draft Sync)
// --------------------------------------------------------------------------
function attachCellEditHandler(tdEl, dataObj, propKey) {
    tdEl.addEventListener('blur', (e) => {
        const text = e.target.innerText.trim();
        const country = tdEl.dataset.country;
        const indKey = tdEl.dataset.indicator;
        const col = tdEl.dataset.col;

        let parsedVal = null;
        if (text !== 'н/д' && text !== '--' && text !== '') {
            const cleanStr = text.replace(/,/g, '.').replace(/%/g, '').replace(/п\.п\./g, '').replace(/б\.т\./g, '').replace(/\*/g, '').trim();
            const num = parseFloat(cleanStr);
            if (!isNaN(num)) parsedVal = num;
        }

        dataObj[propKey] = parsedVal;
        const editKey = `${country}_${indKey}_${col}`;
        editedCells[editKey] = parsedVal;

        // Re-render chart if value was edited
        if (propKey === 'value' && lastLoadedJson?.data?.countries) {
            renderIndicatorChart(indKey, lastLoadedJson.data.countries, indKey === 'loan_growth_yoy');
        }

        debounceSaveDraft();
    });
}

// --------------------------------------------------------------------------
// Page 9: Compiler & Disclaimer
// --------------------------------------------------------------------------
function renderCompilerAndDisclaimer() {
    const b = (typeof BRANDS !== 'undefined' && BRANDS[currentBrand]) ? BRANDS[currentBrand] : null;

    if (compilerLine && b?.compiler) {
        const c = b.compiler;
        const titleStr = c.title ? ` • ${c.title}` : '';
        const emailStr = c.email ? ` • <a href="mailto:${c.email}" style="color: inherit;">${c.email}</a>` : '';
        compilerLine.innerHTML = `<strong>Съставител:</strong> ${escapeHTML(c.name)}${titleStr}${emailStr}`;
    }

    if (brandDisclaimer && b?.disclaimer) {
        brandDisclaimer.innerText = b.disclaimer;
    }
}

// --------------------------------------------------------------------------
// Brand Visuals (Logos, Document Titles, Mini Headers, Colors)
// --------------------------------------------------------------------------
function updateBrandVisuals() {
    const b = (typeof BRANDS !== 'undefined' && BRANDS[currentBrand]) ? BRANDS[currentBrand] : null;
    if (!b) return;

    // Apply data-brand to body
    document.body.setAttribute('data-brand', currentBrand);

    // 1. Cover Page Logo, Titles, Contacts
    const coverLogo = document.getElementById('coverLogo');
    if (coverLogo) coverLogo.innerHTML = b.coverLogoHtml || b.logoHtml;

    const coverMainTitle = document.getElementById('coverMainTitle');
    if (coverMainTitle && b.coverTitle) coverMainTitle.innerHTML = b.coverTitle;

    const coverSubtitle = document.getElementById('coverSubtitle');
    if (coverSubtitle && b.coverSubtitle) coverSubtitle.innerText = b.coverSubtitle;

    const coverContactText = document.getElementById('coverContactText');
    if (coverContactText && b.coverContact) coverContactText.innerText = b.coverContact;

    // 2. Pages 2 to 9 Mini Headers & Footers
    for (let p = 2; p <= 9; p++) {
        const miniLogo = document.getElementById(`brandMiniLogoP${p}`);
        if (miniLogo) miniLogo.innerHTML = b.miniLogoHtml || b.logoHtml;

        const miniFooter = document.getElementById(`brandFooterP${p}`);
        if (miniFooter) {
            miniFooter.innerText = b.footerMini || b.footerTextPage1;
        }
    }

    // Mini doc titles across pages 2 to 9
    document.querySelectorAll('.brandDocTitleMini').forEach(el => {
        el.innerText = b.docTitle;
    });

    // Slogans in footers
    document.querySelectorAll('.brand-footer-slogan').forEach(el => {
        el.innerText = b.slogan || '';
    });

    // 3. Page 9 Compiler & Disclaimer
    renderCompilerAndDisclaimer();

    // 4. Update brand buttons state
    document.querySelectorAll('.brand-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.brand === currentBrand);
    });
}

function setBrand(brandId, saveToDraft = true, updateCharts = true) {
    currentBrand = brandId;
    updateBrandVisuals();

    if (updateCharts && lastLoadedJson?.data?.countries) {
        INDICATOR_SEQUENCE.forEach(indCfg => {
            renderIndicatorChart(indCfg.key, lastLoadedJson.data.countries, indCfg.key === 'loan_growth_yoy');
        });
    }

    if (saveToDraft) debounceSaveDraft();
}

// --------------------------------------------------------------------------
// Overflow Detection (Red border & sidebar indicator)
// --------------------------------------------------------------------------
function checkPagesOverflow() {
    const pages = document.querySelectorAll('.pdf-page');
    const overflowingPages = [];

    pages.forEach((page, idx) => {
        const pageNum = idx + 1;
        // Check if content exceeds 297mm height
        const isOverflowing = (page.scrollHeight > page.clientHeight + 2);

        page.classList.toggle('page-overflow', isOverflowing);
        if (isOverflowing) {
            overflowingPages.push(pageNum);
        }
    });

    if (overflowWarnings && overflowList) {
        if (overflowingPages.length > 0) {
            overflowWarnings.classList.remove('hidden');
            overflowList.innerHTML = overflowingPages
                .map(num => `<span>• Стр. ${num} прелива (намалете шрифта или графиката)</span>`)
                .join('');
        } else {
            overflowWarnings.classList.add('hidden');
            overflowList.innerHTML = '';
        }
    }

    return overflowingPages;
}
window.checkPagesOverflow = checkPagesOverflow;

// ==========================================================================
// Draft Persistence (localStorage)
// ==========================================================================
function getDraftStorageKey() {
    const period = (currentMeta && currentMeta.period) ? currentMeta.period : 'manual';
    return `akpb_draft_v2_${period}`;
}

function saveDraft() {
    const key = getDraftStorageKey();

    // 7 Indicator commentaries
    const commentaries = {};
    INDICATOR_SEQUENCE.forEach(indCfg => {
        const el = document.getElementById(`commentary-${indCfg.key}`);
        if (el) commentaries[indCfg.key] = el.innerHTML;
    });

    const coverTocList = document.getElementById('coverTocList');

    const draftData = {
        savedAt: new Date().toISOString(),
        brand: currentBrand,
        inputNum: inputNum ? inputNum.value : '',
        inputMonth: inputMonth ? inputMonth.value : '',
        inputAuthor: inputAuthor ? inputAuthor.value : '',
        coverTocHtml: coverTocList ? coverTocList.innerHTML : '',
        summaryText: inputText ? inputText.value : '',
        lblSummaryHtml: lblSummaryText ? lblSummaryText.innerHTML : '',
        commentaries: commentaries,
        sliderTableFont: sliderTableFont ? sliderTableFont.value : null,
        sliderChartHeight: sliderChartHeight ? sliderChartHeight.value : null,
        sliderSpacing: sliderSpacing ? sliderSpacing.value : null,
        editedCells: editedCells
    };

    try {
        localStorage.setItem(key, JSON.stringify(draftData));
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (draftStatusBadge) {
            draftStatusBadge.innerText = `Чернова запазена ${timeStr}`;
            draftStatusBadge.style.color = '#10b981';
        }
    } catch (e) {
        console.warn('Failed to save draft:', e);
    }
}

function debounceSaveDraft() {
    if (saveDraftTimeout) clearTimeout(saveDraftTimeout);
    saveDraftTimeout = setTimeout(() => {
        saveDraft();
    }, 400);
}

function restoreDraft(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return false;

    try {
        const draft = JSON.parse(raw);
        if (!draft) return false;

        // 1. Brand
        if (draft.brand) {
            setBrand(draft.brand, false, false);
        }

        // 2. Metadata inputs
        if (draft.inputNum && inputNum) {
            inputNum.value = draft.inputNum;
            lblDocNums.forEach(el => el.innerText = draft.inputNum);
        }
        if (draft.inputMonth && inputMonth) {
            inputMonth.value = draft.inputMonth;
            lblDocMonths.forEach(el => el.innerText = draft.inputMonth);
        }
        if (draft.inputAuthor && inputAuthor) inputAuthor.value = draft.inputAuthor;

        // 3. Cover TOC
        const coverTocList = document.getElementById('coverTocList');
        if (draft.coverTocHtml && coverTocList) {
            coverTocList.innerHTML = draft.coverTocHtml;
        }

        // 4. Summary on Page 2
        if (draft.summaryText && inputText) inputText.value = draft.summaryText;
        if (draft.lblSummaryHtml && lblSummaryText) lblSummaryText.innerHTML = draft.lblSummaryHtml;

        // 5. Indicator commentaries
        if (draft.commentaries) {
            Object.keys(draft.commentaries).forEach(indKey => {
                const el = document.getElementById(`commentary-${indKey}`);
                if (el) el.innerHTML = draft.commentaries[indKey];
            });
        }

        // 6. Sliders
        const docWrapper = document.getElementById('bulletinDocument');
        if (draft.sliderTableFont && sliderTableFont) {
            sliderTableFont.value = draft.sliderTableFont;
            if (lblTableFont) lblTableFont.innerText = `${parseFloat(draft.sliderTableFont).toFixed(1)}px`;
            if (docWrapper) docWrapper.style.setProperty('--table-font-size', `${draft.sliderTableFont}px`);
        }
        if (draft.sliderChartHeight && sliderChartHeight) {
            sliderChartHeight.value = draft.sliderChartHeight;
            if (lblChartHeight) lblChartHeight.innerText = `${draft.sliderChartHeight}px`;
            if (docWrapper) docWrapper.style.setProperty('--chart-height', `${draft.sliderChartHeight}px`);
        }
        if (draft.sliderSpacing && sliderSpacing) {
            sliderSpacing.value = draft.sliderSpacing;
            if (lblSpacing) lblSpacing.innerText = `${draft.sliderSpacing}px`;
            if (docWrapper) docWrapper.style.setProperty('--section-spacing', `${draft.sliderSpacing}px`);
        }

        // 7. Edited cells
        if (draft.editedCells) {
            editedCells = { ...draft.editedCells };
            Object.keys(editedCells).forEach(cellKey => {
                const [cCode, iKey, colKey] = cellKey.split('_');
                const targetTd = document.querySelector(`td[data-country="${cCode}"][data-indicator="${iKey}"][data-col="${colKey}"]`);
                if (targetTd) {
                    const editedVal = editedCells[cellKey];
                    if (editedVal === null) {
                        targetTd.innerText = 'н/д';
                        targetTd.style.color = '#94a3b8';
                    } else if (colKey === 'value') {
                        targetTd.innerText = `${editedVal.toFixed(2)} %`;
                    } else if (colKey === 'spread_bps') {
                        targetTd.innerText = `${editedVal > 0 ? '+' : ''}${Math.round(editedVal)} б.т.`;
                    } else if (colKey === 'sd24' || colKey === 'z24') {
                        targetTd.innerText = `${editedVal > 0 && colKey === 'z24' ? '+' : ''}${editedVal.toFixed(2)}`;
                    } else {
                        targetTd.innerText = (editedVal > 0 ? `+${editedVal.toFixed(2)}` : editedVal.toFixed(2)) + ' п.п.';
                    }
                }
            });
        }

        if (draft.savedAt && draftStatusBadge) {
            const d = new Date(draft.savedAt);
            const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            draftStatusBadge.innerText = `Чернова запазена ${timeStr}`;
            draftStatusBadge.style.color = '#10b981';
        }

        checkPagesOverflow();
        return true;
    } catch (e) {
        console.warn('Failed to restore draft:', e);
        return false;
    }
}

// ==========================================================================
// Event Listeners & PDF Generation
// ==========================================================================
function setupEventListeners() {
    // Brand buttons
    document.querySelectorAll('.brand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setBrand(btn.dataset.brand);
        });
    });

    // Metadata inputs
    if (inputNum) {
        inputNum.addEventListener('input', (e) => {
            lblDocNums.forEach(el => el.innerText = e.target.value);
            debounceSaveDraft();
        });
    }

    if (inputMonth) {
        inputMonth.addEventListener('input', (e) => {
            lblDocMonths.forEach(el => el.innerText = e.target.value);
            debounceSaveDraft();
        });
    }

    // Cover TOC inline edit
    const coverTocList = document.getElementById('coverTocList');
    if (coverTocList) {
        coverTocList.addEventListener('blur', () => {
            debounceSaveDraft();
            checkPagesOverflow();
        });
    }

    if (inputText) {
        inputText.addEventListener('input', (e) => {
            if (lblSummaryText) lblSummaryText.innerText = e.target.value;
            debounceSaveDraft();
            checkPagesOverflow();
        });
    }

    if (lblSummaryText) {
        lblSummaryText.addEventListener('blur', (e) => {
            if (inputText) inputText.value = e.target.innerText;
            debounceSaveDraft();
            checkPagesOverflow();
        });
    }

    // Commentaries inline edit
    INDICATOR_SEQUENCE.forEach(indCfg => {
        const commEl = document.getElementById(`commentary-${indCfg.key}`);
        if (commEl) {
            commEl.addEventListener('blur', () => {
                debounceSaveDraft();
                checkPagesOverflow();
            });
        }
    });

    // Sliders
    const docWrapper = document.getElementById('bulletinDocument');
    if (sliderTableFont) {
        sliderTableFont.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value).toFixed(1);
            if (lblTableFont) lblTableFont.innerText = `${val}px`;
            if (docWrapper) docWrapper.style.setProperty('--table-font-size', `${val}px`);
            debounceSaveDraft();
            checkPagesOverflow();
        });
    }

    if (sliderChartHeight) {
        sliderChartHeight.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (lblChartHeight) lblChartHeight.innerText = `${val}px`;
            if (docWrapper) docWrapper.style.setProperty('--chart-height', `${val}px`);
            debounceSaveDraft();
            checkPagesOverflow();
        });
    }

    if (sliderSpacing) {
        sliderSpacing.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (lblSpacing) lblSpacing.innerText = `${val}px`;
            if (docWrapper) docWrapper.style.setProperty('--section-spacing', `${val}px`);
            debounceSaveDraft();
            checkPagesOverflow();
        });
    }

    // Clear draft
    if (btnClearDraft) {
        btnClearDraft.addEventListener('click', () => {
            if (confirm('Сигурни ли сте, че искате да изчистите текущата чернова?')) {
                const key = getDraftStorageKey();
                localStorage.removeItem(key);
                if (draftStatusBadge) {
                    draftStatusBadge.innerText = 'Няма чернова';
                    draftStatusBadge.style.color = 'var(--color-gold)';
                }
                editedCells = {};
                if (lastLoadedJson) {
                    renderBulletinDocument(lastLoadedJson);
                }
            }
        });
    }

    // Drag and drop / File upload
    if (dropZone && excelFileInput) {
        dropZone.addEventListener('click', () => excelFileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                handleUploadedFile(e.dataTransfer.files[0]);
            }
        });
        excelFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleUploadedFile(e.target.files[0]);
            }
        });
    }

    // PDF buttons
    if (btnExportPDF) {
        btnExportPDF.addEventListener('click', () => generatePDF());
    }

    if (btnExportBothPDF) {
        btnExportBothPDF.addEventListener('click', () => generateBothPDFs());
    }

    // Window resize triggers overflow check
    window.addEventListener('resize', () => {
        checkPagesOverflow();
    });
}

function handleUploadedFile(file) {
    if (file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (fileStatus) fileStatus.classList.remove('hidden');
                if (fileNameSpan) fileNameSpan.innerText = file.name;
                if (dataSourceText) dataSourceText.innerText = `Източник: ${file.name}`;
                renderBulletinDocument(parsed);
                restoreDraft(getDraftStorageKey());
            } catch (err) {
                alert('Невалиден JSON файл.');
            }
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm')) {
        if (dataSourceText) {
            dataSourceText.innerHTML = `Източник: ${file.name} <span style="color: #f59e0b; font-weight: 700;">(Legacy - само Стр. 3)</span>`;
        }
        alert('Забележка: Зареждането от Excel поддържа само показател rate (Стр. 3). Препоръчва се използването на bulletin_data.json за всички 9 страници.');
    }
}

// --------------------------------------------------------------------------
// PDF Export (Guarantees exactly 9 A4 pages without blank/trailing pages)
// --------------------------------------------------------------------------
async function generatePDF(brandOverride) {
    const targetBrand = brandOverride || currentBrand;
    const b = (typeof BRANDS !== 'undefined' && BRANDS[targetBrand]) ? BRANDS[targetBrand] : { pdfPrefix: 'АКПБ_Бюлетин' };
    const monthName = (inputMonth ? inputMonth.value : 'Бюлетин').replace(/\s+/g, '_');
    const pages = Array.from(document.querySelectorAll('.pdf-page'));

    if (pages.length === 0) {
        alert('Няма заредени страници за експорт.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        });

        for (let i = 0; i < pages.length; i++) {
            const pageEl = pages[i];
            const origShadow = pageEl.style.boxShadow;
            pageEl.style.boxShadow = 'none';

            const canvas = await html2canvas(pageEl, {
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true,
                windowWidth: 794,
                windowHeight: 1123
            });

            pageEl.style.boxShadow = origShadow;

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            if (i > 0) {
                pdf.addPage('a4', 'portrait');
            }
            pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        }

        pdf.save(`${b.pdfPrefix}_${monthName}.pdf`);
    } catch (err) {
        console.error('PDF Generation error:', err);
        alert('Грешка при генерирането на PDF.');
        throw err;
    }
}

async function generateBothPDFs() {
    const initialBrand = currentBrand;
    if (btnExportBothPDF) btnExportBothPDF.disabled = true;

    try {
        // 1. Export AKPB
        setBrand('akpb', false, true);
        await new Promise(r => setTimeout(r, 400));
        await generatePDF('akpb');
        await new Promise(r => setTimeout(r, 800));

        // 2. Export CreditERA
        setBrand('creditera', false, true);
        await new Promise(r => setTimeout(r, 400));
        await generatePDF('creditera');
        await new Promise(r => setTimeout(r, 800));
    } catch (err) {
        console.error('Error generating both PDFs:', err);
    } finally {
        setBrand(initialBrand, false, true);
        if (btnExportBothPDF) btnExportBothPDF.disabled = false;
    }
}

// ==========================================================================
// Initialization
// ==========================================================================
function initApp() {
    setupEventListeners();
    updateBrandVisuals();

    // Auto-fetch bulletin_data.json
    fetch('./data/bulletin_data.json')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(jsonData => {
            if (dataSourceText) {
                const period = jsonData.meta?.period ? ` (${formatPeriodToMonthYear(jsonData.meta.period)})` : '';
                dataSourceText.innerText = `Източник: bulletin_data.json${period}`;
            }
            renderBulletinDocument(jsonData);
            restoreDraft(getDraftStorageKey());
        })
        .catch(err => {
            console.warn('Could not auto-load ./data/bulletin_data.json:', err);
        });
}

// Start application
document.addEventListener('DOMContentLoaded', initApp);
