// Constants
const COMPILER_NAME = 'гл. ас. д-р Мирослав Владимиров';
const COMPILER_TITLE = 'зам.-председател на УС на АКПБ';
const COMPILER_EMAIL = 'mvladimirov@creditera.bg';

// Selectors
const dropZone = document.getElementById('dropZone');
const excelFileInput = document.getElementById('excelFile');
const btnGeneratePDF = document.getElementById('btnExportPDF') || document.getElementById('btnGeneratePDF');
const fileStatus = document.getElementById('fileStatus');
const fileNameSpan = document.getElementById('fileName');
const dataSourceBadge = document.getElementById('dataSourceBadge');
const dataSourceText = document.getElementById('dataSourceText');

// Inputs
const inputNum = document.getElementById('bulletinNum');
const inputMonth = document.getElementById('bulletinMonth');
const inputAuthor = document.getElementById('bulletinAuthor');
const inputText = document.getElementById('summaryText');
const inputTrends = document.getElementById('summaryTrends');
const btnAddHeader = document.getElementById('btnAddHeader');
const btnAddIndicator = document.getElementById('btnAddIndicator');

// Preview Outputs
const lblDocNums = document.querySelectorAll('.lblDocNum');
const lblDocMonths = document.querySelectorAll('.lblDocMonth');
const lblSummaryText = document.getElementById('lblSummaryText');
const lblTrendsList = document.getElementById('lblTrendsList');
const chartsContainer = document.getElementById('chartsContainer');
const tableNotes = document.getElementById('tableNotes');
const compilerLine = document.getElementById('compilerLine');
const btnClearDraft = document.getElementById('btnClearDraft');
const draftStatusBadge = document.getElementById('draftStatusBadge');

// Stat Outputs (Mortgage KPI Cards)
const statAvgBGN = document.getElementById('statAvgBGN'); // Лихва България (BG)
const statMinBGN = document.getElementById('statMinBGN'); // Лихва Еврозона (U2)
const statAvgEUR = document.getElementById('statAvgEUR'); // Спред спрямо U2
const statMinEUR = document.getElementById('statMinEUR'); // Най-висока лихва

// Chart global instance
let ratesCharts = [];

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

// Known metric registry for on-demand addition
const KNOWN_INDICATOR_METRICS = {
    'Корелация 24М': {
        name: 'Корелация 24М',
        key: 'corr24',
        isStat: true,
        description: 'Корелация с Еврозоната (U2) за 24М',
        showChart: false
    },
    'Beta спрямо U2': {
        name: 'Beta спрямо U2',
        key: 'beta24',
        isStat: true,
        description: 'Чувствителност спрямо лихвата на U2 за 24М',
        showChart: false
    }
};

// Canonical Indicator Definitions (Initial default: 7 indicators + 2 headers)
const JSON_INDICATORS = [
    { id: 'ind_hdr_1', type: 'header', name: 'ОСНОВНИ ЛИХВЕНИ ПРОЦЕНТИ', description: '', showChart: false },
    { id: 'ind_rate', type: 'indicator', name: 'Текуща лихва', key: 'rate', unit: '%', isRate: true, description: 'Среден процент за нови жилищни кредити', showChart: true },
    { id: 'ind_d1m', type: 'indicator', name: 'Изменение 1М', key: 'd1m', isChange: true, description: 'Промяна спрямо предходния месец (п.п.)', showChart: false },
    { id: 'ind_d3m', type: 'indicator', name: 'Изменение 3М', key: 'd3m', isChange: true, description: 'Промяна за 3 месеца (п.п.)', showChart: false },
    { id: 'ind_d12m', type: 'indicator', name: 'Изменение 12М', key: 'd12m', isChange: true, description: 'Промяна за 1 година (п.п.)', showChart: false },
    { id: 'ind_hdr_2', type: 'header', name: 'РИСКОВИ МЕТРИКИ И СПРЕДОВЕ', description: '', showChart: false },
    { id: 'ind_spread', type: 'indicator', name: 'Спред спрямо U2 (bps)', key: 'spread_bps', isSpread: true, description: 'Разлика спрямо средното за Еврозоната', showChart: true },
    { id: 'ind_sd24', type: 'indicator', name: 'Станд. отклонение 24М', key: 'sd24', isStat: true, description: 'Волатилност за последните 24 месеца', showChart: false },
    { id: 'ind_z24', type: 'indicator', name: 'Z-Score 24М', key: 'z24', isStat: true, description: 'Стандартизирано отклонение от средното за 24М', showChart: false }
];

// Global data state
let parsedData = [];
let parsedIndicators = [];
let currentMeta = null;
let currentEcb = null;
let currentEuribor = null;
let lastLoadedJson = null;
let selectedSection = null;
let saveDraftTimeout = null;

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function escapeHTML(str) {
    if (!str) return '';
    return str
        .toString()
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

function formatDateBG(dateStr) {
    if (!dateStr) return 'н/д';
    const parts = dateStr.toString().split('-');
    if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]} г.`;
    }
    return dateStr;
}

// --- Draft Persistence (localStorage) ---
function getDraftStorageKey() {
    const period = (currentMeta && currentMeta.period) ? currentMeta.period : 'manual';
    return `akpb_draft_${period}`;
}

function saveDraft() {
    const key = getDraftStorageKey();
    
    // Extract page 1 and page 2 section ordering and margins
    const page1Sections = Array.from(document.querySelectorAll('#page1Sortable > .pdf-section')).map(sec => ({
        id: sec.id,
        marginTop: sec.style.marginTop || ''
    }));
    const page2Sections = Array.from(document.querySelectorAll('#page2Sortable > .pdf-section')).map(sec => ({
        id: sec.id,
        marginTop: sec.style.marginTop || ''
    }));

    // Extract _edited per country code
    const editedCells = {};
    parsedData.forEach(item => {
        if (item._edited && Object.keys(item._edited).length > 0) {
            editedCells[item.Code] = { ...item._edited };
        }
    });

    const sliderTableFont = document.getElementById('sliderTableFont');
    const sliderChartHeight = document.getElementById('sliderChartHeight');
    const sliderSpacing = document.getElementById('sliderSpacing');

    const draftData = {
        savedAt: new Date().toISOString(),
        inputNum: inputNum ? inputNum.value : '',
        inputMonth: inputMonth ? inputMonth.value : '',
        inputAuthor: inputAuthor ? inputAuthor.value : '',
        summaryText: inputText ? inputText.value : '',
        summaryTrends: inputTrends ? inputTrends.value : '',
        lblSummaryHtml: lblSummaryText ? lblSummaryText.innerHTML : '',
        lblTrendsHtml: lblTrendsList ? lblTrendsList.innerHTML : '',
        tableNotesHtml: tableNotes ? tableNotes.innerHTML : '',
        compilerLineHtml: compilerLine ? compilerLine.innerHTML : '',
        sliderTableFont: sliderTableFont ? sliderTableFont.value : null,
        sliderChartHeight: sliderChartHeight ? sliderChartHeight.value : null,
        sliderSpacing: sliderSpacing ? sliderSpacing.value : null,
        page1Sections: page1Sections,
        page2Sections: page2Sections,
        parsedIndicators: parsedIndicators,
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
        console.warn('Failed to save draft to localStorage:', e);
    }
}

function debounceSaveDraft() {
    if (saveDraftTimeout) clearTimeout(saveDraftTimeout);
    saveDraftTimeout = setTimeout(() => {
        saveDraft();
    }, 500);
}

function restoreDraft(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return false;

    try {
        const draft = JSON.parse(raw);
        if (!draft) return false;

        // 1. Text and contenteditable fields
        if (draft.inputNum && inputNum) {
            inputNum.value = draft.inputNum;
            lblDocNums.forEach(el => el.innerText = draft.inputNum);
        }
        if (draft.inputMonth && inputMonth) {
            inputMonth.value = draft.inputMonth;
            lblDocMonths.forEach(el => el.innerText = draft.inputMonth);
        }
        if (draft.inputAuthor && inputAuthor) inputAuthor.value = draft.inputAuthor;
        if (draft.summaryText && inputText) inputText.value = draft.summaryText;
        if (draft.summaryTrends && inputTrends) inputTrends.value = draft.summaryTrends;
        
        if (draft.lblSummaryHtml && lblSummaryText) lblSummaryText.innerHTML = draft.lblSummaryHtml;
        if (draft.lblTrendsHtml && lblTrendsList) lblTrendsList.innerHTML = draft.lblTrendsHtml;
        if (draft.tableNotesHtml && tableNotes) tableNotes.innerHTML = draft.tableNotesHtml;
        if (draft.compilerLineHtml && compilerLine) compilerLine.innerHTML = draft.compilerLineHtml;

        // 2. Sliders & CSS variables
        const docWrapper = document.getElementById('bulletinDocument');
        const sliderTableFont = document.getElementById('sliderTableFont');
        if (draft.sliderTableFont && sliderTableFont) {
            sliderTableFont.value = draft.sliderTableFont;
            const lbl = document.getElementById('lblTableFont');
            if (lbl) lbl.innerText = `${parseFloat(draft.sliderTableFont).toFixed(1)}px`;
            if (docWrapper) docWrapper.style.setProperty('--table-font-size', `${draft.sliderTableFont}px`);
        }
        const sliderChartHeight = document.getElementById('sliderChartHeight');
        if (draft.sliderChartHeight && sliderChartHeight) {
            sliderChartHeight.value = draft.sliderChartHeight;
            const lbl = document.getElementById('lblChartHeight');
            if (lbl) lbl.innerText = `${draft.sliderChartHeight}px`;
            if (docWrapper) docWrapper.style.setProperty('--chart-height', `${draft.sliderChartHeight}px`);
        }
        const sliderSpacing = document.getElementById('sliderSpacing');
        if (draft.sliderSpacing && sliderSpacing) {
            sliderSpacing.value = draft.sliderSpacing;
            const lbl = document.getElementById('lblSpacing');
            if (lbl) lbl.innerText = `${draft.sliderSpacing}px`;
            if (docWrapper) docWrapper.style.setProperty('--section-spacing', `${draft.sliderSpacing}px`);
        }

        // 3. Section order & margins
        if (draft.page1Sections && draft.page1Sections.length > 0) {
            const p1 = document.getElementById('page1Sortable');
            if (p1) {
                draft.page1Sections.forEach(s => {
                    const el = document.getElementById(s.id);
                    if (el && el.parentElement === p1) {
                        p1.appendChild(el);
                        if (s.marginTop) el.style.marginTop = s.marginTop;
                    }
                });
            }
        }
        if (draft.page2Sections && draft.page2Sections.length > 0) {
            const p2 = document.getElementById('page2Sortable');
            if (p2) {
                draft.page2Sections.forEach(s => {
                    const el = document.getElementById(s.id);
                    if (el && el.parentElement === p2) {
                        p2.appendChild(el);
                        if (s.marginTop) el.style.marginTop = s.marginTop;
                    }
                });
            }
        }

        // 4. Indicators structure
        if (draft.parsedIndicators && Array.isArray(draft.parsedIndicators)) {
            parsedIndicators = draft.parsedIndicators;
        }

        // Ensure newly/custom indicators are in parsedData
        parsedIndicators.forEach(ind => {
            if (ind.type === 'indicator') {
                const known = KNOWN_INDICATOR_METRICS[ind.name];
                parsedData.forEach(item => {
                    if (item[ind.name] === undefined) {
                        if (known && item._raw && item._raw[known.key] !== undefined) {
                            item[ind.name] = item._raw[known.key];
                        } else {
                            item[ind.name] = null;
                        }
                    }
                });
            }
        });

        // 5. Apply only _edited cells
        if (draft.editedCells) {
            parsedData.forEach(item => {
                const countryEdits = draft.editedCells[item.Code];
                if (countryEdits) {
                    item._edited = { ...countryEdits };
                    Object.keys(countryEdits).forEach(indName => {
                        item[indName] = countryEdits[indName];
                    });
                }
            });
        }

        renderTable();
        updateStatsAndCharts();

        if (draft.savedAt && draftStatusBadge) {
            const d = new Date(draft.savedAt);
            const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            draftStatusBadge.innerText = `Чернова запазена ${timeStr}`;
            draftStatusBadge.style.color = '#10b981';
        }

        return true;
    } catch (e) {
        console.warn('Failed to restore draft:', e);
        return false;
    }
}

// Init Application
function initApp() {
    setupEventListeners();
    updateLivePreview();
    renderCompilerLine();
    setupSectionSelection();

    // Auto-fetch bulletin_data.json
    fetch('./data/bulletin_data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(jsonData => {
            console.log('Successfully loaded bulletin_data.json');
            loadBulletinJSON(jsonData, 'data/bulletin_data.json');
        })
        .catch(err => {
            console.warn('Could not auto-load ./data/bulletin_data.json, using fallback mock data:', err);
            loadFallbackData();
        });
}

function loadFallbackData() {
    parsedData = [
        { Code: 'U2', Name: 'Еврозона', 'Текуща лихва': 3.54, 'Изменение 1М': 0.03, 'Изменение 3М': 0.10, 'Изменение 12М': 0.26, 'Спред спрямо U2 (bps)': 0.0, 'Станд. отклонение 24М': 0.13, 'Z-Score 24М': 1.17, 'Корелация 24М': 1.0, 'Beta спрямо U2': 1.0 },
        { Code: 'DE', Name: 'Германия', 'Текуща лихва': 3.93, 'Изменение 1М': -0.02, 'Изменение 3М': 0.09, 'Изменение 12М': 0.25, 'Спред спрямо U2 (bps)': 39.0, 'Станд. отклонение 24М': 0.11, 'Z-Score 24М': 1.78, 'Корелация 24М': 0.68, 'Beta спрямо U2': 0.70 },
        { Code: 'BG', Name: 'България', 'Текуща лихва': 2.43, 'Изменение 1М': 0.02, 'Изменение 3М': -0.02, 'Изменение 12М': -0.02, 'Спред спрямо U2 (bps)': -111.0, 'Станд. отклонение 24М': 0.04, 'Z-Score 24М': -1.21, 'Корелация 24М': -0.11, 'Beta спрямо U2': -0.03, _history_source: 'БНБ (до 2025-12) + ЕЦБ CoB (от 2026-01)' }
    ];
    parsedIndicators = JSON_INDICATORS.map(ind => ({ ...ind }));
    if (dataSourceText) {
        dataSourceText.innerText = 'Демо режим (демо данни)';
    }
    renderTable();
    updateStatsAndCharts();
}

function loadBulletinJSON(jsonData, sourceLabel = 'bulletin_data.json') {
    if (!jsonData || !jsonData.data) {
        alert('Невалиден формат на bulletin_data.json.');
        return;
    }

    currentMeta = jsonData.meta || {};
    currentEcb = jsonData.data.ecb || {};
    currentEuribor = jsonData.data.euribor || {};

    // 1. Period metadata (populates ONLY inputMonth and .lblDocMonth, inputNum remains untouched)
    if (currentMeta.period) {
        const formattedMonthYear = formatPeriodToMonthYear(currentMeta.period);
        inputMonth.value = formattedMonthYear;
        lblDocMonths.forEach(el => el.innerText = formattedMonthYear);
    }

    // 2. Update sidebar source badge
    if (dataSourceText) {
        const periodText = currentMeta.period ? ` (${formatPeriodToMonthYear(currentMeta.period)})` : '';
        dataSourceText.innerText = `Източник: ${sourceLabel}${periodText}`;
    }

    // 3. Populate ECB KPI cards (#ecb-rates-row)
    const ecbRow = document.getElementById('ecb-rates-row');
    if (ecbRow) {
        const cards = ecbRow.querySelectorAll('.pdf-stat-card');
        if (cards.length >= 3) {
            const dfrVal = currentEcb.dfr !== null && currentEcb.dfr !== undefined ? `${currentEcb.dfr.toFixed(2)} %` : 'н/д';
            const mroVal = currentEcb.mro !== null && currentEcb.mro !== undefined ? `${currentEcb.mro.toFixed(2)} %` : 'н/д';
            const mlfVal = currentEcb.mlf !== null && currentEcb.mlf !== undefined ? `${currentEcb.mlf.toFixed(2)} %` : 'н/д';
            
            cards[0].querySelector('.stat-val').innerText = dfrVal;
            cards[1].querySelector('.stat-val').innerText = mroVal;
            cards[2].querySelector('.stat-val').innerText = mlfVal;
        }
    }

    // 4. Populate EURIBOR KPI cards (#euribor-rates-row)
    const euriborRow = document.getElementById('euribor-rates-row');
    if (euriborRow) {
        const cards = euriborRow.querySelectorAll('.pdf-stat-card');
        if (cards.length >= 4) {
            const m1Val = currentEuribor.m1 !== null && currentEuribor.m1 !== undefined ? `${currentEuribor.m1.toFixed(2)} %` : 'н/д';
            const m3Val = currentEuribor.m3 !== null && currentEuribor.m3 !== undefined ? `${currentEuribor.m3.toFixed(2)} %` : 'н/д';
            const m6Val = currentEuribor.m6 !== null && currentEuribor.m6 !== undefined ? `${currentEuribor.m6.toFixed(2)} %` : 'н/д';
            const m12Val = currentEuribor.m12 !== null && currentEuribor.m12 !== undefined ? `${currentEuribor.m12.toFixed(2)} %` : 'н/д';

            cards[0].querySelector('.stat-val').innerText = m1Val;
            cards[1].querySelector('.stat-val').innerText = m3Val;
            cards[2].querySelector('.stat-val').innerText = m6Val;
            cards[3].querySelector('.stat-val').innerText = m12Val;
        }
    }

    // 5. Build parsedData from countries array
    const rawCountries = jsonData.data.countries || [];
    parsedData = rawCountries.map(c => {
        return {
            Code: c.code,
            Name: c.name_bg || countryNames[c.code] || c.code,
            'Текуща лихва': c.rate,
            'Изменение 1М': c.d1m,
            'Изменение 3М': c.d3m,
            'Изменение 12М': c.d12m,
            'Спред спрямо U2 (bps)': c.spread_bps,
            'Станд. отклонение 24М': c.sd24,
            'Z-Score 24М': c.z24,
            'Корелация 24М': c.corr24,
            'Beta спрямо U2': c.beta24,
            _n_obs24: c.n_obs24,
            _history_source: c.history_source,
            _raw: c
        };
    });

    parsedIndicators = JSON_INDICATORS.map(ind => ({ ...ind }));

    // 6. Render table, stats and charts
    renderTable();
    updateStatsAndCharts();
    renderTableNotes(jsonData);

    // 7. Check and restore draft if exists for this period
    const draftKey = getDraftStorageKey();
    if (localStorage.getItem(draftKey)) {
        restoreDraft(draftKey);
    }
}

function renderTableNotes(jsonData) {
    if (!tableNotes) return;

    const meta = jsonData.meta || {};
    const ecb = jsonData.data.ecb || {};
    const euribor = jsonData.data.euribor || {};

    const formattedPeriod = formatPeriodToMonthYear(meta.period);
    const ecbDate = formatDateBG(ecb.as_of);
    const euriborPeriod = formatPeriodToMonthYear(euribor.as_of);

    const ecbDfr = ecb.dfr !== null && ecb.dfr !== undefined ? `${ecb.dfr.toFixed(2)}%` : 'н/д';
    const ecbMro = ecb.mro !== null && ecb.mro !== undefined ? `${ecb.mro.toFixed(2)}%` : 'н/д';
    const ecbMlf = ecb.mlf !== null && ecb.mlf !== undefined ? `${ecb.mlf.toFixed(2)}%` : 'н/д';

    let notesHtml = `
        <div style="font-weight: 600; color: #475569; margin-bottom: 2px;">Източници и методологични бележки:</div>
        <div>• <strong>Ипотечни лихви (Cost of Borrowing):</strong> Среднопретеглени лихвени проценти по нови жилищни кредити за домакинства за <strong>${escapeHTML(formattedPeriod)}</strong>. Източник: ЕЦБ (SDMX Data Portal) и национални централни банки.</div>
        <div>• <strong>Основни лихвени проценти на ЕЦБ:</strong> Към <strong>${escapeHTML(ecbDate)}</strong> (Депозитно улеснение: ${ecbDfr}, Основно рефинансиране: ${ecbMro}, Пределно кредитно: ${ecbMlf}).</div>
        <div>• <strong>Пазарни лихви (EURIBOR):</strong> Средномесечни нива за <strong>${escapeHTML(euriborPeriod)}</strong>.</div>
    `;

    // Notes for BG or others
    if (meta.notes && meta.notes.length > 0) {
        meta.notes.forEach(note => {
            notesHtml += `<div>• <strong>(*)</strong> ${escapeHTML(note)}</div>`;
        });
    } else {
        const bgObj = (jsonData.data.countries || []).find(c => c.code === 'BG');
        if (bgObj && bgObj.history_source) {
            notesHtml += `<div>• <strong>(*) България (BG):</strong> ${escapeHTML(bgObj.history_source)}</div>`;
        }
    }

    // Warnings note if any
    if (meta.warnings && meta.warnings.length > 0) {
        notesHtml += `<div style="color: #94a3b8;">• <em>Статистически метрики (24М):</em> За държави с по-малко от 18 наблюдения в 24-месечния прозорец (${meta.warnings.join(', ')}) стойностите не се изчисляват (н/д).</div>`;
    }

    tableNotes.innerHTML = notesHtml;
}

function renderCompilerLine() {
    if (!compilerLine) return;
    compilerLine.innerHTML = `Съставител: ${escapeHTML(COMPILER_NAME)}, ${escapeHTML(COMPILER_TITLE)} · <a href="mailto:${escapeHTML(COMPILER_EMAIL)}" style="color: inherit; text-decoration: underline;">${escapeHTML(COMPILER_EMAIL)}</a>`;
}

function setupSectionSelection() {
    const sections = document.querySelectorAll('.pdf-section');
    sections.forEach(sec => {
        sec.addEventListener('click', (e) => {
            e.stopPropagation();
            if (selectedSection) {
                selectedSection.classList.remove('selected-section');
            }
            selectedSection = sec;
            selectedSection.classList.add('selected-section');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.pdf-section') && !e.target.closest('#layoutControlsCard')) {
            if (selectedSection) {
                selectedSection.classList.remove('selected-section');
                selectedSection = null;
            }
        }
    });
}

function moveSelectedSection(direction) {
    if (!selectedSection) return;
    const parent = selectedSection.parentElement;
    if (direction === -1 && selectedSection.previousElementSibling) {
        parent.insertBefore(selectedSection, selectedSection.previousElementSibling);
        debounceSaveDraft();
    } else if (direction === 1 && selectedSection.nextElementSibling) {
        parent.insertBefore(selectedSection.nextElementSibling, selectedSection);
        debounceSaveDraft();
    }
}

function adjustSelectedSpacing(amount) {
    if (!selectedSection) return;
    let currentMargin = parseInt(window.getComputedStyle(selectedSection).marginTop) || 0;
    let newMargin = currentMargin + amount;
    if (newMargin < 0) newMargin = 0;
    selectedSection.style.marginTop = newMargin + 'px';
    debounceSaveDraft();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Setup Events
function setupEventListeners() {
    if (inputNum) {
        inputNum.addEventListener('input', () => {
            updateLivePreview();
            debounceSaveDraft();
        });
    }
    if (inputMonth) {
        inputMonth.addEventListener('input', () => {
            updateLivePreview();
            debounceSaveDraft();
        });
    }
    if (inputAuthor) {
        inputAuthor.addEventListener('input', debounceSaveDraft);
    }
    if (inputText) {
        inputText.addEventListener('input', () => {
            updateLivePreview();
            debounceSaveDraft();
        });
    }
    if (inputTrends) {
        inputTrends.addEventListener('input', () => {
            updateLivePreview();
            debounceSaveDraft();
        });
    }

    if (lblSummaryText) {
        lblSummaryText.addEventListener('input', debounceSaveDraft);
        lblSummaryText.addEventListener('blur', (e) => {
            if (inputText) inputText.value = e.target.innerText;
            debounceSaveDraft();
        });
    }

    if (lblTrendsList) {
        lblTrendsList.addEventListener('input', debounceSaveDraft);
        lblTrendsList.addEventListener('blur', debounceSaveDraft);
    }

    if (tableNotes) {
        tableNotes.addEventListener('input', debounceSaveDraft);
        tableNotes.addEventListener('blur', debounceSaveDraft);
    }

    if (compilerLine) {
        compilerLine.addEventListener('input', debounceSaveDraft);
        compilerLine.addEventListener('blur', debounceSaveDraft);
    }

    // Clear draft button
    if (btnClearDraft) {
        btnClearDraft.addEventListener('click', () => {
            const key = getDraftStorageKey();
            if (confirm('Сигурни ли сте, че искате да изчистите запазената чернова за този период?')) {
                localStorage.removeItem(key);
                location.reload();
            }
        });
    }

    window.addEventListener('dragover', (e) => {
        if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            document.body.classList.add('drag-over');
        }
    });

    window.addEventListener('dragleave', (e) => {
        if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            document.body.classList.remove('drag-over');
        }
    });

    window.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            document.body.classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processUploadedFile(e.dataTransfer.files[0]);
            }
        }
    });

    // Layout Controls Setup
    const btnMoveUp = document.getElementById('btnMoveUp');
    const btnMoveDown = document.getElementById('btnMoveDown');
    const btnAddSpace = document.getElementById('btnAddSpace');
    const btnRemoveSpace = document.getElementById('btnRemoveSpace');

    if (btnMoveUp) btnMoveUp.addEventListener('click', () => moveSelectedSection(-1));
    if (btnMoveDown) btnMoveDown.addEventListener('click', () => moveSelectedSection(1));
    if (btnAddSpace) btnAddSpace.addEventListener('click', () => adjustSelectedSpacing(5));
    if (btnRemoveSpace) btnRemoveSpace.addEventListener('click', () => adjustSelectedSpacing(-5));

    // Add new indicator button
    if (btnAddIndicator) {
        btnAddIndicator.addEventListener('click', () => {
            const availableKnown = Object.keys(KNOWN_INDICATOR_METRICS).filter(name => 
                !parsedIndicators.some(ind => ind.name === name)
            );
            let promptMsg = 'Въведете име на новия показател (индикатор):';
            if (availableKnown.length > 0) {
                promptMsg += `\n\nНалични метрики: ${availableKnown.join(', ')}`;
            }
            const indName = prompt(promptMsg, availableKnown[0] || '');
            if (indName && indName.trim() !== '') {
                const cleanName = indName.trim();
                const known = KNOWN_INDICATOR_METRICS[cleanName];
                const newObj = {
                    id: generateId(),
                    type: 'indicator',
                    name: cleanName,
                    description: known ? known.description : '',
                    showChart: false
                };
                parsedIndicators.push(newObj);
                
                parsedData.forEach(item => {
                    if (item[cleanName] === undefined) {
                        if (known && item._raw && item._raw[known.key] !== undefined) {
                            item[cleanName] = item._raw[known.key];
                        } else {
                            item[cleanName] = null;
                        }
                    }
                });
                renderTable();
                updateStatsAndCharts();
                debounceSaveDraft();
            }
        });
    }

    if (btnAddHeader) {
        btnAddHeader.addEventListener('click', () => {
            const hdrName = prompt('Въведете заглавие (разделител):');
            if (hdrName && hdrName.trim() !== '') {
                parsedIndicators.push({
                    id: generateId(),
                    type: 'header',
                    name: hdrName.trim(),
                    description: '',
                    showChart: false
                });
                renderTable();
                debounceSaveDraft();
            }
        });
    }

    // File Drag and Drop
    if (dropZone && excelFileInput) {
        dropZone.addEventListener('click', () => excelFileInput.click());
        excelFileInput.addEventListener('change', handleFileInputChange);
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--color-gold)';
            dropZone.style.background = 'rgba(255, 255, 255, 0.08)';
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            dropZone.style.background = 'rgba(255, 255, 255, 0.03)';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            dropZone.style.background = 'rgba(255, 255, 255, 0.03)';
            if (e.dataTransfer.files.length > 0) {
                processUploadedFile(e.dataTransfer.files[0]);
            }
        });
    }

    // Page Layout Calibration Sliders
    const sliderTableFont = document.getElementById('sliderTableFont');
    const sliderChartHeight = document.getElementById('sliderChartHeight');
    const sliderSpacing = document.getElementById('sliderSpacing');
    const docWrapper = document.getElementById('bulletinDocument');

    if (sliderTableFont) {
        sliderTableFont.addEventListener('input', () => {
            const val = sliderTableFont.value;
            const lbl = document.getElementById('lblTableFont');
            if (lbl) lbl.innerText = `${parseFloat(val).toFixed(1)}px`;
            if (docWrapper) docWrapper.style.setProperty('--table-font-size', `${val}px`);
            debounceSaveDraft();
        });
    }

    if (sliderChartHeight) {
        sliderChartHeight.addEventListener('input', () => {
            const val = sliderChartHeight.value;
            const lbl = document.getElementById('lblChartHeight');
            if (lbl) lbl.innerText = `${val}px`;
            if (docWrapper) docWrapper.style.setProperty('--chart-height', `${val}px`);
            if (ratesCharts && ratesCharts.length) {
                ratesCharts.forEach(c => c.resize());
            }
            debounceSaveDraft();
        });
    }

    if (sliderSpacing) {
        sliderSpacing.addEventListener('input', () => {
            const val = sliderSpacing.value;
            const lbl = document.getElementById('lblSpacing');
            if (lbl) lbl.innerText = `${val}px`;
            if (docWrapper) docWrapper.style.setProperty('--section-spacing', `${val}px`);
            debounceSaveDraft();
        });
    }

    // PDF generation
    if (btnGeneratePDF) {
        btnGeneratePDF.addEventListener('click', generatePDF);
    }
}

function handleFileInputChange() {
    const file = excelFileInput.files[0];
    if (!file) return;
    processUploadedFile(file);
}

function processUploadedFile(file) {
    if (!file) return;

    fileNameSpan.innerText = file.name;
    fileStatus.classList.remove('hidden');

    const fileNameLower = file.name.toLowerCase();

    if (fileNameLower.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const json = JSON.parse(e.target.result);
                loadBulletinJSON(json, file.name);
            } catch (err) {
                console.error(err);
                alert('Грешка при разчитането на JSON файла.');
            }
        };
        reader.readAsText(file);
    } else {
        processExcel(file);
    }
}

// Update live preview metadata texts
function updateLivePreview() {
    lblDocNums.forEach(el => el.innerText = inputNum.value);
    lblDocMonths.forEach(el => el.innerText = inputMonth.value);
    
    if (document.activeElement !== lblSummaryText) {
        const paragraphs = inputText.value.split('\n').filter(p => p.trim() !== '');
        lblSummaryText.innerHTML = paragraphs.map(p => `<p>${escapeHTML(p)}</p>`).join('');
    }

    const trends = inputTrends.value.split('\n').filter(t => t.trim() !== '');
    lblTrendsList.innerHTML = trends.map(t => {
        let cleanText = t.replace(/^[•\-\*\s]+/, '');
        return `<li>${escapeHTML(cleanText)}</li>`;
    }).join('');
}

// Excel Parsing Logic (Backward compatibility)
function processExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const targetSheetName = workbook.SheetNames.find(name => 
                name.toLowerCase().trim() === 'analysis' || 
                name.toLowerCase().trim() === 'analisys'
            );
            
            if (!targetSheetName) {
                alert('Не беше намерен лист с име "Analysis" или "Analisys" в качения файл.');
                return;
            }

            const worksheet = workbook.Sheets[targetSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            let headerRowIndex = rows.findIndex(r => r && r[0] && r[0].toString().trim() === 'Показател');
            if (headerRowIndex === -1) {
                headerRowIndex = 3;
            }

            const headers = rows[headerRowIndex];
            if (!headers || headers.length <= 1) {
                alert('Грешка при разчитане на заглавния ред на таблицата.');
                return;
            }

            // Extract Date in B1
            if (rows[0] && rows[0][1]) {
                const rawDateStr = rows[0][1].toString();
                const dateParts = rawDateStr.split('.');
                if (dateParts.length === 3) {
                    const monthIdx = parseInt(dateParts[1], 10) - 1;
                    if (monthIdx >= 0 && monthIdx < 12) {
                        inputMonth.value = `${monthNamesBG[monthIdx]} ${dateParts[2]} г.`;
                        updateLivePreview();
                    }
                }
            }

            const newParsedData = [];
            const newIndicators = [];

            for (let r = headerRowIndex + 1; r < rows.length; r++) {
                const row = rows[r];
                if (row && row[0]) {
                    newIndicators.push({
                        id: generateId(),
                        type: 'indicator',
                        name: row[0].toString().trim(),
                        description: '',
                        showChart: false
                    });
                }
            }
            
            if (newIndicators[0]) newIndicators[0].showChart = true;

            for (let colIdx = 1; colIdx < headers.length; colIdx++) {
                const countryCode = headers[colIdx];
                if (!countryCode) continue;

                const countryDataObj = {
                    Code: countryCode,
                    Name: countryNames[countryCode] || countryCode
                };

                for (let r = headerRowIndex + 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (row && row[0]) {
                        const indName = row[0].toString().trim();
                        countryDataObj[indName] = parseExcelNumber(row[colIdx]);
                    }
                }

                newParsedData.push(countryDataObj);
            }

            if (newParsedData.length === 0) {
                alert('Не бяха намерени валидни данни за държави.');
                return;
            }

            parsedData = newParsedData;
            parsedIndicators = newIndicators;
            
            if (dataSourceText) {
                dataSourceText.innerText = `Източник: ${file.name} (лист Analysis)`;
            }

            renderTable();
            updateStatsAndCharts();
        } catch (error) {
            console.error(error);
            alert('Грешка при разчитането на Excel файла.');
        }
    };
    reader.readAsArrayBuffer(file);
}

function parseExcelNumber(value) {
    if (value === undefined || value === null || value === '' || value === 'н/д') return null;
    if (typeof value === 'number') return value;
    const cleanStr = value.toString().replace(/,/g, '.').replace(/%/g, '').trim();
    const num = parseFloat(cleanStr);
    return isNaN(num) ? null : num;
}

// Render dynamic, editable table
function renderTable() {
    const tableHeaders = document.getElementById('tableHeaders');
    const tableBody = document.getElementById('tableBody');
    
    tableHeaders.innerHTML = '';
    tableBody.innerHTML = '';

    if (parsedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="100" class="no-data">Няма качени данни.</td></tr>`;
        return;
    }

    // 1. Render Headers
    const thName = document.createElement('th');
    thName.innerText = 'Показател';
    thName.style.fontSize = '8px';
    thName.style.padding = '4px 6px';
    tableHeaders.appendChild(thName);

    parsedData.forEach(item => {
        const th = document.createElement('th');
        const codeDisplay = item.Code === 'BG' && item._history_source ? 'BG*' : item.Code;
        th.innerText = codeDisplay;
        th.style.fontSize = '8px';
        th.style.padding = '4px 2px';
        th.style.textAlign = 'center';
        
        if (item.Code === 'BG') th.style.backgroundColor = '#d1fae5';
        if (item.Code === 'U2') th.style.backgroundColor = '#dbeafe';
        
        tableHeaders.appendChild(th);
    });

    // 2. Render Rows
    parsedIndicators.forEach((indObj) => {
        const tr = document.createElement('tr');
        
        if (indObj.type === 'header') {
            tr.className = 'header-row';
            const th = document.createElement('th');
            th.colSpan = parsedData.length + 1;
            th.innerHTML = `
                <span class="indicator-text" contenteditable="true">${escapeHTML(indObj.name)}</span>
                <button class="delete-row-btn no-print" title="Изтрий заглавие" style="position: absolute; right: 2px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #ef4444; cursor: pointer; font-size: 10px; display: none;">×</button>
            `;
            
            const textSpan = th.querySelector('.indicator-text');
            textSpan.addEventListener('blur', (e) => {
                indObj.name = e.target.innerText.trim();
                debounceSaveDraft();
            });
            
            const delBtn = th.querySelector('.delete-row-btn');
            delBtn.addEventListener('click', () => {
                if (confirm(`Сигурни ли сте, че искате да изтриете заглавието "${indObj.name}"?`)) {
                    parsedIndicators = parsedIndicators.filter(i => i.id !== indObj.id);
                    renderTable();
                    debounceSaveDraft();
                }
            });
            
            tr.appendChild(th);
            tableBody.appendChild(tr);
            return;
        }

        // --- NORMAL INDICATOR ROW ---
        const tdName = document.createElement('td');
        tdName.style.fontWeight = 'bold';
        tdName.style.fontSize = '8px';
        tdName.style.padding = '4px 6px';
        tdName.style.position = 'relative';
        tdName.style.minWidth = '140px';
        
        tdName.innerHTML = `
            <div class="indicator-text" contenteditable="true">${escapeHTML(indObj.name)}</div>
            <div class="indicator-desc" contenteditable="true">${escapeHTML(indObj.description || '')}</div>
            <button class="chart-toggle-btn no-print ${indObj.showChart ? 'active' : ''}" title="Вкл/Изкл Графика" data-id="${indObj.id}">
                <i data-lucide="${indObj.showChart ? 'bar-chart-2' : 'bar-chart'}"></i>
            </button>
            <button class="delete-row-btn no-print" title="Изтрий показател" style="position: absolute; right: 2px; top: 10px; background: none; border: none; color: #ef4444; cursor: pointer; font-size: 10px; display: none;">×</button>
        `;

        // Name editing
        const textSpan = tdName.querySelector('.indicator-text');
        textSpan.addEventListener('blur', (e) => {
            const newName = e.target.innerText.trim();
            if (newName && newName !== indObj.name) {
                parsedData.forEach(item => {
                    item[newName] = item[indObj.name];
                    delete item[indObj.name];
                    if (item._edited && item._edited[indObj.name] !== undefined) {
                        item._edited[newName] = item._edited[indObj.name];
                        delete item._edited[indObj.name];
                    }
                });
                indObj.name = newName;
                renderTable();
                updateStatsAndCharts();
                debounceSaveDraft();
            }
        });

        // Description editing
        const descSpan = tdName.querySelector('.indicator-desc');
        descSpan.addEventListener('blur', (e) => {
            indObj.description = e.target.innerText.trim();
            debounceSaveDraft();
        });

        // Chart toggle
        const chartToggleBtn = tdName.querySelector('.chart-toggle-btn');
        chartToggleBtn.addEventListener('click', () => {
            indObj.showChart = !indObj.showChart;
            renderTable();
            updateStatsAndCharts();
            debounceSaveDraft();
        });

        // Delete indicator
        const delBtn = tdName.querySelector('.delete-row-btn');
        delBtn.addEventListener('click', () => {
            if (confirm(`Сигурни ли сте, че искате да изтриете показател "${indObj.name}"?`)) {
                parsedIndicators = parsedIndicators.filter(i => i.id !== indObj.id);
                parsedData.forEach(item => {
                    delete item[indObj.name];
                    if (item._edited) {
                        delete item._edited[indObj.name];
                    }
                });
                renderTable();
                updateStatsAndCharts();
                debounceSaveDraft();
            }
        });

        tdName.addEventListener('mouseenter', () => {
            if (delBtn) delBtn.style.display = 'inline-block';
        });
        tdName.addEventListener('mouseleave', () => {
            if (delBtn) delBtn.style.display = 'none';
        });

        tr.appendChild(tdName);
        
        // Render values for each country
        parsedData.forEach(item => {
            const td = document.createElement('td');
            td.style.fontSize = '8px';
            td.style.padding = '4px 2px';
            td.style.textAlign = 'center';
            td.contentEditable = true;
            
            const isBG = item.Code === 'BG';
            const isU2 = item.Code === 'U2';
            if (isBG) td.style.backgroundColor = '#fef3c7';
            if (isU2) td.style.backgroundColor = '#eff6ff';

            const val = item[indObj.name];
            
            if (val === null || val === undefined) {
                td.innerText = 'н/д';
                td.style.color = '#94a3b8';
            } else {
                if (indObj.name.includes('лихва') || indObj.name.includes('Лихва')) {
                    td.innerText = `${val.toFixed(2)}%`;
                } else if (indObj.name.includes('Изменение') || indObj.name.includes('промяна')) {
                    td.innerHTML = formatChange(val);
                } else if (indObj.name.includes('Спред')) {
                    td.innerText = `${val.toFixed(0)} bps`;
                } else {
                    td.innerText = val.toFixed(2);
                }
            }

            td.addEventListener('blur', (e) => {
                const editedText = e.target.innerText.trim();
                let editedVal = null;
                if (editedText !== 'н/д' && editedText !== '--' && editedText !== '') {
                    editedVal = parseExcelNumber(editedText);
                }
                item[indObj.name] = editedVal;
                
                if (!item._edited) item._edited = {};
                item._edited[indObj.name] = editedVal;
                
                if (editedVal === null) {
                    e.target.innerText = 'н/д';
                    e.target.style.color = '#94a3b8';
                } else {
                    e.target.style.color = '';
                    if (indObj.name.includes('лихва') || indObj.name.includes('Лихва')) {
                        e.target.innerText = `${editedVal.toFixed(2)}%`;
                    } else if (indObj.name.includes('Изменение') || indObj.name.includes('промяна')) {
                        e.target.innerHTML = formatChange(editedVal);
                    } else if (indObj.name.includes('Спред')) {
                        e.target.innerText = `${editedVal.toFixed(0)} bps`;
                    } else {
                        e.target.innerText = editedVal.toFixed(2);
                    }
                }

                updateStatsAndCharts();
                debounceSaveDraft();
            });

            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    if (window.lucide) {
        lucide.createIcons();
    }
}

function formatChange(val) {
    if (val === undefined || val === null) return 'н/д';
    const formatted = val.toFixed(2);
    if (val > 0) return `+${formatted}`;
    if (val < 0) return `${formatted}`;
    return `${formatted}`;
}

// Update statistics and charts
function updateStatsAndCharts() {
    const firstIndObj = parsedIndicators.find(i => i.type === 'indicator');
    if (!firstIndObj) {
        renderCharts(parsedData);
        return;
    }
    const rateIndName = firstIndObj.name;
    const bgRow = parsedData.find(item => item.Code === 'BG');
    const bgRate = bgRow ? bgRow[rateIndName] : null;
    
    statAvgBGN.innerText = (bgRate !== null && bgRate !== undefined) ? `${bgRate.toFixed(2)} %` : 'н/д';

    const u2Row = parsedData.find(item => item.Code === 'U2');
    const u2Rate = u2Row ? u2Row[rateIndName] : null;
    statMinBGN.innerText = (u2Rate !== null && u2Rate !== undefined) ? `${u2Rate.toFixed(2)} %` : 'н/д';

    const spreadIndObj = parsedIndicators.find(i => i.type === 'indicator' && (i.name.includes('Спред') || i.name.includes('спред')));
    let bgSpread = null;
    if (bgRow && spreadIndObj && bgRow[spreadIndObj.name] !== null && bgRow[spreadIndObj.name] !== undefined) {
        bgSpread = bgRow[spreadIndObj.name];
    } else if (bgRate !== null && u2Rate !== null) {
        bgSpread = (bgRate - u2Rate) * 100;
    }

    if (bgSpread !== null && bgSpread !== undefined) {
        const sign = bgSpread > 0 ? '+' : '';
        statAvgEUR.innerText = `${sign}${bgSpread.toFixed(0)} bps`;
    } else {
        statAvgEUR.innerText = 'н/д';
    }

    // "Най-висока лихва" = max(countries[].rate) with ONLY U2 excluded
    const allExceptU2 = parsedData.filter(item => item.Code !== 'U2' && item[rateIndName] !== null && item[rateIndName] !== undefined);
    if (allExceptU2.length > 0) {
        let maxItem = allExceptU2[0];
        for (let i = 1; i < allExceptU2.length; i++) {
            if (allExceptU2[i][rateIndName] > maxItem[rateIndName]) {
                maxItem = allExceptU2[i];
            }
        }
        statMinEUR.innerText = `${maxItem[rateIndName].toFixed(2)} % (${maxItem.Code})`;
    } else {
        statMinEUR.innerText = 'н/д';
    }

    renderCharts(parsedData);
}

// Render dynamic multiple charts
function renderCharts(data) {
    ratesCharts.forEach(c => c.destroy());
    ratesCharts = [];
    chartsContainer.innerHTML = '';
    
    const chartIndicators = parsedIndicators.filter(i => i.type === 'indicator' && i.showChart);
    
    if (chartIndicators.length === 0) {
        chartsContainer.innerHTML = '<p style="font-size: 10px; color: #6b7280; text-align: center;">Няма избрани графики.</p>';
        return;
    }

    chartIndicators.forEach(indObj => {
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-container';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.height = 'var(--chart-height, 140px)';
        wrapper.style.marginBottom = '12px';
        
        const title = document.createElement('h3');
        title.style.fontSize = '8.5px';
        title.style.fontFamily = 'Montserrat';
        title.style.color = '#0b2545';
        title.style.marginBottom = '2px';
        title.style.textAlign = 'center';
        title.innerText = `${indObj.name.toUpperCase()} ${indObj.name.includes('лихва') ? '(%)' : ''}`;
        
        const canvasWrapper = document.createElement('div');
        canvasWrapper.style.flex = '1';
        canvasWrapper.style.position = 'relative';
        canvasWrapper.style.minHeight = '0';

        const canvas = document.createElement('canvas');
        canvasWrapper.appendChild(canvas);
        wrapper.appendChild(title);
        wrapper.appendChild(canvasWrapper);
        chartsContainer.appendChild(wrapper);

        const ctx = canvas.getContext('2d');
        const labels = data.map(item => item.Code);
        
        // Pass null values directly so Chart.js handles gaps properly without skewing with 0
        const datasetValues = data.map(item => (item[indObj.name] !== undefined ? item[indObj.name] : null));

        const backgroundColors = data.map(item => {
            if (item.Code === 'BG') return '#10b981';
            if (item.Code === 'U2') return '#3b82f6';
            return '#0b2545';
        });

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: indObj.name,
                    data: datasetValues,
                    backgroundColor: backgroundColors,
                    borderRadius: 3,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                const fullCountryName = data[index].Name;
                                const val = context.raw;
                                if (val === null || val === undefined) return `${fullCountryName}: н/д`;
                                return `${fullCountryName}: ${typeof val === 'number' ? val.toFixed(2) : val}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { font: { family: 'Inter', size: 8 } },
                        grid: { color: '#f3f4f6' }
                    },
                    x: {
                        ticks: { font: { family: 'Montserrat', size: 8, weight: '700' } },
                        grid: { display: false }
                    }
                }
            }
        });
        
        ratesCharts.push(chart);
    });
}

// Generate PDF
function generatePDF() {
    const element = document.getElementById('bulletinDocument');
    const monthName = inputMonth.value.replace(/\s+/g, '_');
    
    const opt = {
        margin: 0,
        filename: `АКПБ_Бюлетин_${monthName}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
            letterRendering: true,
            windowWidth: 794,
            windowHeight: 1123
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        },
        pagebreak: { mode: 'css', after: '.page-break-after' }
    };

    element.style.boxShadow = 'none';

    html2pdf().from(element).set(opt).save().then(() => {
        element.style.boxShadow = 'var(--shadow-lg)';
    }).catch(err => {
        console.error(err);
        alert('Грешка при генерирането на PDF.');
        element.style.boxShadow = 'var(--shadow-lg)';
    });
}
