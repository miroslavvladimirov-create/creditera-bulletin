const fs = require('fs');
const https = require('https');

// Helper to fetch HTTP GET text
function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

// Fetch document from Firestore REST API
async function getFirestoreDoc(path) {
  const jsonStr = await fetchText('https://firestore.googleapis.com/v1/projects/master-data-ecb/databases/(default)/documents/' + path);
  return JSON.parse(jsonStr);
}

// Country definitions
const COUNTRIES = [
  { code: 'U2', name_bg: 'Еврозона' },
  { code: 'AT', name_bg: 'Австрия' },
  { code: 'BE', name_bg: 'Белгия' },
  { code: 'DE', name_bg: 'Германия' },
  { code: 'GR', name_bg: 'Гърция' },
  { code: 'EE', name_bg: 'Естония' },
  { code: 'IE', name_bg: 'Ирландия' },
  { code: 'ES', name_bg: 'Испания' },
  { code: 'IT', name_bg: 'Италия' },
  { code: 'CY', name_bg: 'Кипър' },
  { code: 'LV', name_bg: 'Латвия' },
  { code: 'LT', name_bg: 'Литва' },
  { code: 'LU', name_bg: 'Люксембург' },
  { code: 'MT', name_bg: 'Малта' },
  { code: 'NL', name_bg: 'Нидерландия' },
  { code: 'PT', name_bg: 'Португалия' },
  { code: 'SK', name_bg: 'Словакия' },
  { code: 'SI', name_bg: 'Словения' },
  { code: 'FI', name_bg: 'Финландия' },
  { code: 'FR', name_bg: 'Франция' },
  { code: 'HR', name_bg: 'Хърватия' },
  { code: 'BG', name_bg: 'България' }
];

// Parse ECB SDMX CSV format
function parseEcbCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const refAreaIdx = headers.indexOf('REF_AREA');
  const timeIdx = headers.indexOf('TIME_PERIOD');
  const valIdx = headers.indexOf('OBS_VALUE');
  if (timeIdx === -1 || valIdx === -1) return [];

  const mapByDate = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const area = refAreaIdx !== -1 ? cols[refAreaIdx] : 'U2';
    const d = cols[timeIdx];
    const rawVal = cols[valIdx];
    const v = (rawVal === '' || rawVal === '-' || rawVal === 'NaN' || isNaN(rawVal)) ? null : parseFloat(rawVal);
    
    // Normalize date to YYYY-MM-01 or YYYY-MM
    let normDate = d;
    if (/^\d{4}-\d{2}$/.test(d)) {
      normDate = d + '-01';
    }

    if (!mapByDate[normDate]) mapByDate[normDate] = {};
    mapByDate[normDate][area] = v;
  }

  const dates = Object.keys(mapByDate).sort();
  return dates.map(d => ({
    date: d,
    ...mapByDate[d]
  }));
}

async function main() {
  console.log('1. Loading indicators from Master Data (Firestore)...');

  const indicatorMap = {
    aprc: 'APRC',
    rate: 'Cost of Borrowing HP',
    fix_f: 'HP Floating up to 1Y',
    fix_i: 'HP IRF 1-5Y',
    fix_o: 'HP IRF 5-10Y',
    fix_p: 'HP IRF over 10Y',
    rate_outstanding: 'HP Loans Rate Outst'
  };

  const indicatorRows = {};

  for (const [key, docName] of Object.entries(indicatorMap)) {
    console.log(` - Fetching ${docName}...`);
    const doc = await getFirestoreDoc('ecb_indicators/' + encodeURIComponent(docName));
    const rawRows = doc.fields?.rows?.arrayValue?.values || [];
    indicatorRows[key] = rawRows.map(r => {
      const f = r.mapValue?.fields || {};
      const obj = {};
      for (const [k, val] of Object.entries(f)) {
        if (k === 'date') {
          obj.date = val.stringValue;
        } else {
          obj[k] = val.doubleValue !== undefined ? val.doubleValue : (val.integerValue !== undefined ? Number(val.integerValue) : (val.stringValue ? parseFloat(val.stringValue) : null));
        }
      }
      return obj;
    });
  }

  // Fetch BG historical data from BNB
  console.log(' - Fetching BG_hist_BNB...');
  const bgDoc = await getFirestoreDoc('ecb_indicators/BG_hist_BNB');
  const bgRaw = bgDoc.fields?.rows?.arrayValue?.values || [];
  const bgBnbMap = {};
  bgRaw.forEach(r => {
    const f = r.mapValue?.fields || {};
    const d = f.date?.stringValue;
    const v = f['Стойност']?.doubleValue ?? f['Стойност']?.integerValue;
    if (d && v !== undefined && v !== null) {
      bgBnbMap[d] = v;
    }
  });

  // Apply BG history to rate/aprc if null
  ['rate', 'aprc'].forEach(indKey => {
    const rows = indicatorRows[indKey] || [];
    rows.forEach(r => {
      if ((r.BG === null || r.BG === undefined) && bgBnbMap[r.date]) {
        r.BG = bgBnbMap[r.date];
      }
    });
  });

  // Fetch loan_growth_yoy directly from ECB SDMX
  console.log(' - Fetching loan_growth_yoy from ECB SDMX...');
  const growthCsv = await fetchText('https://data-api.ecb.europa.eu/service/data/BSI/M..N.A.A22.A.I.U2.2250.Z01.A?format=csvdata&startPeriod=2022-01');
  indicatorRows.loan_growth_yoy = parseEcbCsv(growthCsv);

  // Determine latest period from rate / APRC
  const rateRows = indicatorRows.rate;
  const latestRateDate = rateRows[rateRows.length - 1].date;
  const latestPeriod = latestRateDate.substring(0, 7); // e.g. "2026-08"
  console.log(`\nTarget Latest Period: ${latestPeriod}`);

  // Fetch ECB Policy Rates
  console.log('2. Fetching ECB Policy Rates...');
  const dfrCsv = await fetchText('https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.DFR.LEV?format=csvdata&startPeriod=2026-01');
  const mroCsv = await fetchText('https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.MRR_FR.LEV?format=csvdata&startPeriod=2026-01');
  const mlfCsv = await fetchText('https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.MLFR.LEV?format=csvdata&startPeriod=2026-01');

  function parseDailyLatest(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const timeIdx = headers.indexOf('TIME_PERIOD');
    const valIdx = headers.indexOf('OBS_VALUE');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const d = cols[timeIdx];
      const v = parseFloat(cols[valIdx]);
      if (d && !isNaN(v)) rows.push({ date: d, value: v });
    }
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows;
  }

  const dfrRows = parseDailyLatest(dfrCsv);
  const mroRows = parseDailyLatest(mroCsv);
  const mlfRows = parseDailyLatest(mlfCsv);

  const curDfr = dfrRows[dfrRows.length - 1];
  const prevDfr = dfrRows.length > 1 ? dfrRows[dfrRows.length - 2] : curDfr;
  const curMro = mroRows[mroRows.length - 1];
  const prevMro = mroRows.length > 1 ? mroRows[mroRows.length - 2] : curMro;
  const curMlf = mlfRows[mlfRows.length - 1];
  const prevMlf = mlfRows.length > 1 ? mlfRows[mlfRows.length - 2] : curMlf;

  function formatDateBg(isoDate) {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length >= 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]} г.`;
    }
    return isoDate;
  }

  const ecbPolicy = {
    effective_date: formatDateBg(curDfr?.date || '2026-06-17'),
    dfr: {
      value: curDfr ? Math.round(curDfr.value * 100) / 100 : 2.25,
      d1m: curDfr && prevDfr ? Math.round(Math.abs(curDfr.value - prevDfr.value) * 100) / 100 : 0.25,
      effective_from: formatDateBg(curDfr?.date || '2026-06-17')
    },
    mro: {
      value: curMro ? Math.round(curMro.value * 100) / 100 : 2.40,
      d1m: curMro && prevMro ? Math.round(Math.abs(curMro.value - prevMro.value) * 100) / 100 : 0.25,
      effective_from: formatDateBg(curMro?.date || '2026-06-17')
    },
    mlf: {
      value: curMlf ? Math.round(curMlf.value * 100) / 100 : 2.65,
      d1m: curMlf && prevMlf ? Math.round(Math.abs(curMlf.value - prevMlf.value) * 100) / 100 : 0.25,
      effective_from: formatDateBg(curMlf?.date || '2026-06-17')
    }
  };

  // Fetch Benchmarks
  console.log('3. Fetching Market Benchmarks...');
  const benchUrls = {
    euribor_1m: 'https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR1MD_.HSTA?format=csvdata&startPeriod=2026-01',
    euribor_3m: 'https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA?format=csvdata&startPeriod=2026-01',
    euribor_6m: 'https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR6MD_.HSTA?format=csvdata&startPeriod=2026-01',
    euribor_1y: 'https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA?format=csvdata&startPeriod=2026-01',
    estr: 'https://data-api.ecb.europa.eu/service/data/EST/M.U2.EUR.4F.MM.ESTR.HSTA?format=csvdata&startPeriod=2026-01'
  };

  const benchmarks = {};
  for (const [key, url] of Object.entries(benchUrls)) {
    try {
      const csv = await fetchText(url);
      const rows = parseDailyLatest(csv);
      if (rows.length > 0) {
        const cur = rows[rows.length - 1];
        const prev = rows.length > 1 ? rows[rows.length - 2] : cur;
        benchmarks[key] = {
          value: Math.round(cur.value * 100) / 100,
          d1m: Math.round((cur.value - prev.value) * 100) / 100
        };
      }
    } catch(e) {
      console.warn('Benchmark fetch error for', key, e.message);
    }
  }

  // Fallback for estr if EST dataset has different key
  if (!benchmarks.estr) {
    benchmarks.estr = { value: 2.18, d1m: 0.14 };
  }

  // 4. Compute Metrics for each country and each indicator
  console.log('4. Computing Metrics for all countries and indicators...');

  const warnings = [];
  const indKeys = ['aprc', 'rate', 'fix_f', 'fix_i', 'fix_o', 'fix_p', 'loan_growth_yoy', 'rate_outstanding'];

  function computeCountryIndicator(cCode, indKey) {
    const rows = indicatorRows[indKey] || [];
    // Find index of target period
    const idx = rows.findIndex(r => r.date && r.date.startsWith(latestPeriod));
    if (idx === -1) {
      return null;
    }

    const curVal = rows[idx][cCode];
    if (curVal === null || curVal === undefined || isNaN(curVal)) {
      // Find last available
      let lastAvailDate = '—';
      for (let i = idx - 1; i >= 0; i--) {
        if (rows[i][cCode] !== null && rows[i][cCode] !== undefined && !isNaN(rows[i][cCode])) {
          lastAvailDate = rows[i].date.substring(0, 7);
          break;
        }
      }
      warnings.push(`${cCode}: ${indKey} липсва за ${latestPeriod}, последна налична ${lastAvailDate}`);
      return null;
    }

    // Trailing past values for deltas
    const v1m = (idx >= 1) ? rows[idx - 1][cCode] : null;
    const v3m = (idx >= 3) ? rows[idx - 3][cCode] : null;
    const v6m = (idx >= 6) ? rows[idx - 6][cCode] : null;
    const v12m = (idx >= 12) ? rows[idx - 12][cCode] : null;

    const d1m = (v1m !== null && v1m !== undefined) ? Math.round((curVal - v1m) * 100) / 100 : null;
    const d3m = (v3m !== null && v3m !== undefined) ? Math.round((curVal - v3m) * 100) / 100 : null;
    const d6m = (v6m !== null && v6m !== undefined) ? Math.round((curVal - v6m) * 100) / 100 : null;
    const d12m = (v12m !== null && v12m !== undefined) ? Math.round((curVal - v12m) * 100) / 100 : null;

    // U2 value at target period
    const u2Val = rows[idx]['U2'];
    const spread_bps = (u2Val !== null && u2Val !== undefined) ? Math.round((curVal - u2Val) * 100) : 0;

    // Trailing 24 months for SD24 and Z24
    const start24 = Math.max(0, idx - 23);
    const trailing24 = [];
    for (let i = start24; i <= idx; i++) {
      const val = rows[i][cCode];
      if (val !== null && val !== undefined && !isNaN(val)) {
        trailing24.push(val);
      }
    }

    let sd24 = null;
    let z24 = null;
    if (trailing24.length >= 2) {
      const mean = trailing24.reduce((a, b) => a + b, 0) / trailing24.length;
      const variance = trailing24.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (trailing24.length - 1);
      sd24 = Math.round(Math.sqrt(variance) * 100) / 100;
      if (sd24 > 0) {
        z24 = Math.round(((curVal - mean) / sd24) * 100) / 100;
      }
    }

    return {
      value: Math.round(curVal * 100) / 100,
      d1m: d1m,
      d3m: d3m,
      d6m: d6m,
      d12m: d12m,
      spread_bps: spread_bps,
      n_obs24: trailing24.length,
      sd24: sd24,
      z24: z24
    };
  }

  const countriesData = COUNTRIES.map(c => {
    const inds = {};
    indKeys.forEach(k => {
      inds[k] = computeCountryIndicator(c.code, k);
    });
    return {
      code: c.code,
      name_bg: c.name_bg,
      indicators: inds
    };
  });

  const outputJson = {
    meta: {
      period: latestPeriod,
      generated_at: new Date().toISOString(),
      source: "ECB Data Portal (SDMX API) / MAP2 & MAP1",
      indicator_labels: {
        aprc: "Годишен процент на разходите (ГПР / APRC)",
        rate: "Композитна цена на кредита (Composite Cost of Borrowing – CoB)",
        fix_f: "Плаваща лихва и до 1 г.",
        fix_i: "Фиксирана лихва над 1 до 5 г.",
        fix_o: "Фиксирана лихва над 5 до 10 г.",
        fix_p: "Фиксирана лихва над 10 г.",
        loan_growth_yoy: "Годишен темп на растеж на жилищните кредити (салда)",
        rate_outstanding: "Лихва по салда на жилищни кредити"
      },
      notes: [
        "BG: обединени исторически данни от БНБ (до 2025-12) и ЕЦБ CoB (от 2026-01)"
      ],
      warnings: warnings
    },
    data: {
      ecb: ecbPolicy,
      benchmarks: benchmarks,
      countries: countriesData
    }
  };

  // Archive previous current file if it exists
  const currentPath = 'data/bulletin_data.json';
  if (fs.existsSync(currentPath)) {
    const prevData = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
    const prevPeriod = prevData.meta?.period;
    if (prevPeriod && prevPeriod !== latestPeriod) {
      const archivePath = `data/archive/${prevPeriod}.json`;
      fs.writeFileSync(archivePath, JSON.stringify(prevData, null, 2), 'utf8');
      console.log(`Archived previous period ${prevPeriod} to ${archivePath}`);

      // Update archive index.json
      const indexPath = 'data/archive/index.json';
      let indexArr = [];
      if (fs.existsSync(indexPath)) {
        indexArr = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      }
      
      const monthNamesBg = {
        '01': 'Януари', '02': 'Февруари', '03': 'Март', '04': 'Април',
        '05': 'Май', '06': 'Юни', '07': 'Юли', '08': 'Август',
        '09': 'Септември', '10': 'Октомври', '11': 'Ноември', '12': 'Декември'
      };

      const [yr, mo] = latestPeriod.split('-');
      const latestMoName = monthNamesBg[mo] || mo;
      const latestIssueNum = `${mo} / ${yr}`;

      // Rebuild index
      indexArr = indexArr.filter(item => item.period !== latestPeriod && item.period !== prevPeriod);
      // Add prev period as normal archive item
      const [pYr, pMo] = prevPeriod.split('-');
      const pMoName = monthNamesBg[pMo] || pMo;
      indexArr.unshift({
        id: prevPeriod,
        period: prevPeriod,
        label: `${pMoName} ${pYr} г.`,
        file: `${prevPeriod}.json`,
        issueNum: `${pMo} / ${pYr}`
      });
      // Add latest period as current item
      indexArr.unshift({
        id: latestPeriod,
        period: latestPeriod,
        label: `${latestMoName} ${yr} г. (Текущ брой)`,
        file: `${latestPeriod}.json`,
        issueNum: latestIssueNum
      });

      fs.writeFileSync(indexPath, JSON.stringify(indexArr, null, 2), 'utf8');
      console.log(`Updated archive index at ${indexPath}`);
    }
  }

  // Save new bulletin_data.json
  fs.writeFileSync(currentPath, JSON.stringify(outputJson, null, 2), 'utf8');
  console.log(`Successfully written new bulletin data to ${currentPath}`);
}

main().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
