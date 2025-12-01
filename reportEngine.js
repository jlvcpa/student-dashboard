/* * REPORT ENGINE MODULE
 * Handles the rendering logic for specific activity types.
 */

// --- CONFIGURATION & REGISTRY ---
// Add new report renderers here. The 'keyword' is what we look for in the collectionName.
const REPORT_STRATEGIES = [
    { keyword: "T2 Performance Task 01", renderer: renderPerformanceTask01 }, // NEW ADDITION
    { keyword: "T2 Performance Task 02", renderer: renderPerformanceTask02 },
    { keyword: "Summative Test 01", renderer: renderSummativeReport },
];

/**
 * Main Entry Point: Decides which report to render based on the collection name.
 * @param {Object} data - The student result data from Firestore
 * @param {String} collectionName - The name of the exam session
 * @param {HTMLElement} container - The DOM element to inject the report into
 */
export function renderReport(data, collectionName, container) {
    // 1. Find a matching strategy
    const strategy = REPORT_STRATEGIES.find(s => collectionName.includes(s.keyword));

    // 2. Execute strategy or fallback to generic
    if (strategy) {
        strategy.renderer(data, container, collectionName);
    } else {
        renderGenericReport(data, container, collectionName);
    }

    // 3. Initialize PDF Download functionality globally so the inline onclick works
    window.downloadCurrentPDF = function() {
        const element = document.getElementById('print-content');
        const studentName = data.studentInfo?.lastName || "Student";
        const cn = data.studentInfo?.classNumber || "00";
        
        // Get orientation from UI if available, default to portrait
        const orientationSelect = document.getElementById('pdf-orientation');
        const orientationVal = orientationSelect ? orientationSelect.value : 'portrait';
        
        let formatDimensions = [8.5, 13]; // Default Portrait (Long/Legal)
        let pdfOrientation = 'portrait';

        if (orientationVal === 'landscape') {
             formatDimensions = [13, 8.5]; 
             pdfOrientation = 'landscape';
        }

        const filename = `Result_${studentName}_${cn}.pdf`;
        const opt = {
            margin: 0.5,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: formatDimensions, orientation: pdfOrientation }
        };
        // Assumes html2pdf is loaded via CDN in the main HTML
        html2pdf().set(opt).from(element).save();
    };
}

// --- SPECIFIC RENDERERS ---

// --- NEW: RENDERER FOR T2 PERFORMANCE TASK 01 ---
function renderPerformanceTask01(data, container) {
    const info = data.studentInfo || {};
    const scores = data.scores || { t1a: {}, t1b: {}, t1c: {}, t2: {} };
    const inputs = data.userInputs || {};
    const ledgers = data.ledgersStructure || [];
    const journals = data.journalEntries || [];
    const pctb = data.pctb || [];
    const explanations = data.explanations || [];

    // Helper to get input value safely
    const val = (id) => inputs[id] || '';
    
    // Inject Custom CSS for this report specifically
    const styles = `
        <style>
            .pt01-ledger-form { background: white; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 1rem; page-break-inside: avoid; }
            .pt01-ledger-header { background-color: #eff6ff; padding: 8px; text-align: center; border-bottom: 1px solid #dbeafe; font-weight: bold; color: #1e3a8a; font-size: 0.8rem; }
            .pt01-ledger-col-header { font-size: 0.65rem; font-weight: 700; color: #475569; text-transform: uppercase; background-color: #f8fafc; padding: 4px; border-bottom: 1px solid #e2e8f0; }
            .pt01-input { width: 100%; background: transparent; border: none; font-size: 0.75rem; color: black; }
            .pt01-input-right { text-align: right; }
            .pt01-input-center { text-align: center; }
            .pt01-pr-box { height: 14px; width: 14px; border: 1px solid #cbd5e1; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; margin: 0 auto; }
            .pt01-pr-checked { color: #16a34a; font-weight: bold; background-color: #dcfce7; border-color: #16a34a; }
            .pt01-row { border-bottom: 1px solid #f1f5f9; }
            .pt01-rubric-mini { font-size: 0.7rem; border: 1px solid #e2e8f0; margin-bottom: 10px; border-radius: 4px; overflow: hidden; }
            .pt01-rubric-head { background: #f1f5f9; padding: 4px; font-weight: bold; }
            .pt01-rubric-row { display: flex; justify-content: space-between; padding: 4px; border-top: 1px solid #f1f5f9; }
        </style>
    `;

    // --- HTML GENERATORS ---

    const generateJournalRows = () => {
        return journals.map((e, index) => {
            const dateHTML = index === 0 
                ? `<div class="font-bold leading-tight">${e.month}</div><div>${e.day}</div>` 
                : `<div>${e.day}</div>`;
            
            const prDrClass = inputs[`j_${e.id}_0`] === true ? 'pt01-pr-box pt01-pr-checked' : 'pt01-pr-box';
            const prCrClass = inputs[`j_${e.id}_1`] === true ? 'pt01-pr-box pt01-pr-checked' : 'pt01-pr-box';
            const prDrContent = inputs[`j_${e.id}_0`] === true ? '✓' : '';
            const prCrContent = inputs[`j_${e.id}_1`] === true ? '✓' : '';

            return `
                <tr class="pt01-row">
                    <td class="p-1 align-top text-right text-xs text-gray-500 w-12 border-r">${dateHTML}</td>
                    <td class="p-1 align-top">
                        <div class="font-bold text-xs">${e.titles[0]}</div>
                        <div class="pl-4 text-xs">${e.titles[1]}</div>
                        <div class="pl-8 text-[10px] italic text-gray-400 mt-1">${e.desc}</div>
                    </td>
                    <td class="p-1 align-top text-center w-8 border-l border-r">
                        <div class="${prDrClass}">${prDrContent}</div>
                        <div class="${prCrClass} mt-1">${prCrContent}</div>
                    </td>
                    <td class="p-1 align-top text-right text-xs w-20 border-r">
                        <div>${formatNumber(e.drs[0])}</div>
                        <div>-</div>
                    </td>
                    <td class="p-1 align-top text-right text-xs w-20">
                        <div>-</div>
                        <div>${formatNumber(e.crs[1])}</div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const generateLedgerHTML = (ledger) => {
        const id = ledger.id;
        const name = inputs[`l_${id}_name`] || ledger.name;
        
        const renderRows = (side) => {
            let html = '';
            // Year Row
            html += `<div class="grid grid-cols-12 border-b border-gray-100 bg-gray-50 h-6 items-center text-[10px]">
                <div class="col-span-3 border-r px-1 text-center font-bold">${val(`l_${id}_${side}_year`)}</div><div class="col-span-9"></div>
            </div>`;
            
            // Data Rows
            const rowCount = ledger.rowCount || 4;
            for(let i=0; i<rowCount; i++) {
                html += `<div class="grid grid-cols-12 border-b border-gray-100 text-[10px] h-6 items-center">
                    <div class="col-span-3 border-r px-1 text-right">${val(`l_${id}_${side}_d_${i}`)}</div>
                    <div class="col-span-5 border-r px-1 truncate">${val(`l_${id}_${side}_p_${i}`)}</div>
                    <div class="col-span-1 border-r px-1 text-center">${val(`l_${id}_${side}_pr_${i}`)}</div>
                    <div class="col-span-3 px-1 text-right">${val(`l_${id}_${side}_a_${i}`)}</div>
                </div>`;
            }
            // Total Row
            html += `<div class="grid grid-cols-12 border-t border-gray-300 bg-gray-50 h-6 items-center text-[10px]">
                <div class="col-span-9 text-right font-bold pr-2 text-gray-500">TOTAL</div>
                <div class="col-span-3 px-1 text-right font-bold">${val(`l_${id}_total_${side}`)}</div>
            </div>`;
            return html;
        };

        return `
            <div class="pt01-ledger-form break-inside-avoid">
                <div class="pt01-ledger-header uppercase">${name || '[Untitled Account]'}</div>
                <div class="grid grid-cols-2 divide-x divide-gray-200">
                    <!-- Debit Side -->
                    <div>
                        <div class="grid grid-cols-12 pt01-ledger-col-header text-center"><div class="col-span-3">Date</div><div class="col-span-5">Part.</div><div class="col-span-1">PR</div><div class="col-span-3">Amt</div></div>
                        ${renderRows('dr')}
                    </div>
                    <!-- Credit Side -->
                    <div>
                        <div class="grid grid-cols-12 pt01-ledger-col-header text-center"><div class="col-span-3">Date</div><div class="col-span-5">Part.</div><div class="col-span-1">PR</div><div class="col-span-3">Amt</div></div>
                        ${renderRows('cr')}
                    </div>
                </div>
                <div class="bg-gray-50 border-t border-gray-200 p-1 flex justify-center items-center gap-2 text-xs font-bold">
                    <span class="text-gray-500 text-[10px] uppercase">Balance:</span>
                    <span class="uppercase text-blue-800">${val(`l_${id}_bal_type`) === 'dr' ? 'Debit' : (val(`l_${id}_bal_type`) === 'cr' ? 'Credit' : '-')}</span>
                    <span>${val(`l_${id}_bal`)}</span>
                </div>
            </div>
        `;
    };

    const generateTrialBalanceRows = () => {
        const requiredAccounts = data.scores.t2.max ? (data.scores.t2.max - 2) / 2 : 15; // Estimate rows
        let rows = '';
        // We use the count of inputs captured to determine rows, or fallback to the max possible
        for(let i=0; i<requiredAccounts; i++) {
            const name = val(`tb_name_${i}`);
            const dr = val(`tb_dr_${i}`);
            const cr = val(`tb_cr_${i}`);
            if(name || dr || cr) {
                rows += `
                <tr class="border-b border-gray-100 text-xs">
                    <td class="p-1 border-r">${name}</td>
                    <td class="p-1 border-r text-right">${dr ? formatNumber(dr) : '-'}</td>
                    <td class="p-1 text-right">${cr ? formatNumber(cr) : '-'}</td>
                </tr>`;
            }
        }
        return rows;
    };

    const companyName = info.fullName ? info.fullName.split(',')[0].trim() + " Accounting" : "Company Name";

    const html = `
        ${styles}
        <header class="text-center mb-4 pb-2 border-b-2 border-indigo-600">
            <img src="./shs-adc-logo.png" onerror="this.style.display='none'" alt="School Logo" class="mx-auto mb-2 h-16 w-auto"/>
            <h1 class="text-xl font-extrabold text-black uppercase">T2 Performance Task 01 Results</h1>
            <h2 class="text-lg font-bold text-gray-700">${companyName}</h2>
            <p class="text-xs text-gray-500">SY 2025-2026 | 2nd Semester</p>
        </header>

        <div class="flex justify-between border-b-2 border-gray-800 pb-1 mb-4 font-mono text-xs font-bold">
            <div>
                <div>CN: ${info.classNumber}</div>
                <div>Name: ${info.fullName}</div>
            </div>
            <div class="text-right">
                <div>Section: ${info.gradeSection || info.section}</div>
                <div>Date: ${new Date(data.timestamp).toLocaleDateString()}</div>
            </div>
        </div>

        <!-- SCORES SUMMARY -->
        <div class="mb-6 grid grid-cols-2 gap-4">
            <div class="pt01-rubric-mini">
                <div class="pt01-rubric-head text-center text-indigo-900">TASK 1: GENERAL LEDGER</div>
                <div class="pt01-rubric-row"><span>Setup (A)</span><span class="font-bold">${scores.t1a.current}/${scores.t1a.max} (${scores.t1a.grade})</span></div>
                <div class="pt01-rubric-row"><span>Beg. Bal (B)</span><span class="font-bold">${scores.t1b.current}/${scores.t1b.max} (${scores.t1b.grade})</span></div>
                <div class="pt01-rubric-row"><span>Posting (C)</span><span class="font-bold">${scores.t1c.current}/${scores.t1c.max} (${scores.t1c.grade})</span></div>
            </div>
            <div class="pt01-rubric-mini">
                <div class="pt01-rubric-head text-center text-indigo-900">TASK 2: TRIAL BALANCE</div>
                <div class="pt01-rubric-row"><span>Preparation</span><span class="font-bold">${scores.t2.current}/${scores.t2.max}</span></div>
                <div class="pt01-rubric-row"><span>Grade</span><span class="font-bold ${scores.t2.grade === 'A' ? 'text-green-600' : 'text-black'}">${scores.t2.grade || '-'}</span></div>
            </div>
        </div>

        <!-- ERROR SUMMARY (If Any) -->
        ${explanations.length > 0 ? `
            <div class="mb-6 border border-red-200 bg-red-50 p-3 rounded text-xs">
                <h4 class="font-bold text-red-700 mb-1">Feedback / Errors:</h4>
                <ul class="list-disc pl-4 space-y-1 text-red-800">
                    ${explanations.map(e => `<li>${e}</li>`).join('')}
                </ul>
            </div>
        ` : ''}

        <!-- MAIN GRID (60/40 Split Recreated) -->
        <div class="grid grid-cols-10 gap-4">
            
            <!-- LEFT COLUMN: JOURNAL & LEDGERS (Span 6) -->
            <div class="col-span-6">
                <!-- JOURNAL -->
                <div class="mb-6 border border-gray-300 rounded shadow-sm overflow-hidden">
                    <div class="bg-gray-100 p-2 font-bold text-xs text-center border-b">General Journal (Page 1)</div>
                    <table class="w-full text-xs">
                        <thead class="bg-gray-50 border-b">
                            <tr><th class="p-1 w-12">Date</th><th class="p-1 text-left">Particulars</th><th class="p-1 w-8">PR</th><th class="p-1 w-20">Debit</th><th class="p-1 w-20">Credit</th></tr>
                        </thead>
                        <tbody>${generateJournalRows()}</tbody>
                    </table>
                </div>

                <!-- LEDGERS -->
                <div class="bg-gray-50 p-2 border border-gray-300 rounded shadow-sm">
                    <div class="font-bold text-xs text-center mb-2 uppercase text-gray-600">General Ledgers</div>
                    ${ledgers.map(l => generateLedgerHTML(l)).join('')}
                </div>
            </div>

            <!-- RIGHT COLUMN: TRIAL BALANCE (Span 4) -->
            <div class="col-span-4">
                <div class="border border-gray-300 rounded shadow-sm overflow-hidden">
                    <div class="bg-indigo-50 p-4 text-center border-b">
                        <div class="font-bold text-sm uppercase">${companyName}</div>
                        <div class="font-bold text-indigo-800 text-xs">Trial Balance</div>
                        <div class="text-[10px] text-gray-500">December 31, ${new Date().getFullYear()}</div>
                    </div>
                    <table class="w-full text-xs">
                        <thead class="bg-indigo-600 text-white">
                            <tr>
                                <th class="p-2 text-left">Account</th>
                                <th class="p-2 text-right w-16">Dr</th>
                                <th class="p-2 text-right w-16">Cr</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            ${generateTrialBalanceRows()}
                            <tr class="bg-gray-100 font-bold border-t-2 border-gray-300">
                                <td class="p-2 text-right">TOTAL</td>
                                <td class="p-2 text-right">${val('tb_total_dr')}</td>
                                <td class="p-2 text-right">${val('tb_total_cr')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function renderPerformanceTask02(data, container) {
    const info = data.studentInfo || {};
    
    // Recalculate the "Key" based on the student's specific random seed
    const keyData = calculateWorksheetAnswersForReport(data);
    
    const now = data.timestamp ? new Date(data.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A";
    
    let html = `
        <header class="text-center mb-4 pb-4 border-b-4 border-indigo-600 header-bg p-4 print:bg-white print:text-black print:border-none">
            <img src="./shs-adc-logo.png" onerror="this.style.display='none'" alt="School Logo" class="mx-auto mb-2 h-20 w-auto"/>
            <p class="text-sm mt-1">SY 2025-2026 | 2nd Semester</p>
            <h1 class="text-3xl font-extrabold text-yellow-300 print:text-black">T2 Performance Task 02 Results</h1>
        </header>

        <div id="student-print-info" class="block mb-4 w-full">
            <div class="w-full mb-2 text-sm text-black font-bold font-mono border-b-2 border-black pb-2">
                <div class="flex justify-between items-center">
                    <span class="text-left">CN: ${info.classNumber}</span>
                    <span class="text-right">Section: ${info.gradeSection}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-left">Name: ${info.fullName}</span>
                    <span class="text-right">Date: ${now}</span>
                </div>
            </div>
        </div>

        <div class="mb-4 text-sm italic border p-2">
            <strong>Instruction:</strong><br>
            Complete all required fields. Amounts are rounded to nearest peso.
        </div>

        <!-- TASK 1 -->
        <div class="mb-8">
            <h3 class="text-xl font-bold text-indigo-800 mb-2">TASK 1: 10-Column Worksheet</h3>
            ${renderRubricHTML(1, data.task1Score)}
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <h4 class="font-bold text-blue-700">Adjustments Given:</h4>
                <ul class="list-disc list-inside text-sm">
                    ${data.adjustments.map(adj => `<li>${adj.desc}</li>`).join('')}
                </ul>
            </div>
            ${renderWorksheetHTML(data, keyData)}
        </div>

        <!-- TASK 2 -->
        <div class="mb-8">
            <h3 class="text-xl font-bold text-indigo-800 mb-2">TASK 2: Financial Statements</h3>
            ${renderRubricHTML(2, data.task2Score)}
            
            <div class="fs-flex-container">
                <div class="fs-flex-item">${getISHTML(data, keyData)}</div>
                <div class="fs-flex-item">${getSCEHTML(data, keyData)}</div>
                <div class="fs-flex-item">${getBSHTML(data, keyData)}</div>
            </div>
        </div>

        <div class="mt-8 pt-4 border-t border-gray-400">
            <div class="flex justify-between font-bold mb-1 text-black text-sm">
                <span class="text-left">FABM 1</span>
                <span class="text-right">Page 1 of 1</span> 
            </div>
            <div class="border border-black p-1 text-center text-xs text-black mx-auto w-2/3">
                <p class="font-bold m-0">4Cs: Christ-centeredness, Competence, Character, Compassion</p>
            </div>
        </div>
        
        <div class="text-center font-bold text-xl py-6 border-t-2 border-dashed border-gray-400 mt-8">*** END OF TASK ***</div>
    `;
    
    container.innerHTML = html;
}

function renderSummativeReport(data, container) {
    // Example placeholder for your future Summative Test layout
    container.innerHTML = `
        <div class="p-8 border-4 border-double border-black">
            <h1 class="text-2xl font-bold text-center">SUMMATIVE TEST RESULT</h1>
            <div class="mt-4">Score: ${data.score} / ${data.totalItems}</div>
            <!-- Add specific summative logic here -->
        </div>
    `;
}

function renderGenericReport(data, container) {
    container.innerHTML = `
        <h2 class="text-xl font-bold">Standard Report</h2>
        <p class="mb-4">Raw data visualization for ${data.studentInfo?.fullName || 'Student'}</p>
        <pre class="bg-gray-50 p-4 mt-4 overflow-auto text-xs border rounded shadow">${JSON.stringify(data, null, 2)}</pre>
    `;
}

// --- HELPER FUNCTIONS (Calculations & HTML Generation) ---

function calculateWorksheetAnswersForReport(data) {
    const familyName = getFamilyName(data.studentInfo);
    const CAPITAL_ACCOUNT = `${familyName}, Capital`;
    const WITHDRAWALS_ACCOUNT = `${familyName}, Withdrawals`;
    
    const accountMap = new Map();
    // Initial TB
    data.initialTB.filter(a => a.name !== 'Totals').forEach(acc => {
        accountMap.set(acc.name, { ...acc, ADJ_DR: 0, ADJ_CR: 0, ATB_DR: acc.TB_DR, ATB_CR: acc.TB_CR });
    });
    // New Accounts
    if(data.newAccounts) {
        data.newAccounts.forEach(newAcc => { 
            if (!accountMap.has(newAcc.name)) accountMap.set(newAcc.name, { ...newAcc, TB_DR: 0, TB_CR: 0, ADJ_DR: 0, ADJ_CR: 0, ATB_DR: 0, ATB_CR: 0 }); 
        });
    }
    
    // Fix specific FS types for logic
    const safeSetFS = (name, type, fs) => { if(accountMap.has(name)) { const a = accountMap.get(name); a.type = type; a.isFS = fs; }};
    safeSetFS('Accrued Service Revenue', 'asset', 'BS');
    safeSetFS('Salaries Payable', 'liability', 'BS');
    safeSetFS('Supplies Expense', 'expense', 'IS');
    safeSetFS('Rent Expense', 'expense', 'IS');
    safeSetFS('Depreciation Expense', 'expense', 'IS');
    safeSetFS(CAPITAL_ACCOUNT, 'equity', 'BS');
    safeSetFS(WITHDRAWALS_ACCOUNT, 'equity', 'BS');

    let totalADJ_DR = 0; let totalADJ_CR = 0;
    data.adjustments.forEach(adj => {
        const drAcc = accountMap.get(adj.dr); const crAcc = accountMap.get(adj.cr);
        if (drAcc) drAcc.ADJ_DR += adj.amount; if (crAcc) crAcc.ADJ_CR += adj.amount;
        totalADJ_DR += adj.amount; totalADJ_CR += adj.amount;
    });
    
    let totalTB_DR = data.initialTB.at(-1).TB_DR; let totalTB_CR = data.initialTB.at(-1).TB_CR; 
    let totalATB_DR = 0; let totalATB_CR = 0; let totalIS_DR = 0; let totalIS_CR = 0; let totalBS_DR = 0; let totalBS_CR = 0;
    const finalAccounts = [];
    const ALL_ACCOUNTS_ORDER = ['Cash', 'Accounts Receivable', 'Supplies', 'Prepaid Rent', 'Accrued Service Revenue', 'Equipment', 'Accumulated Depreciation-Equip.', 'Accounts Payable', 'Unearned Service Revenue', 'Salaries Payable', CAPITAL_ACCOUNT, WITHDRAWALS_ACCOUNT, 'Service Revenue', 'Salaries Expense', 'Utilities Expense', 'Supplies Expense', 'Rent Expense', 'Depreciation Expense'];
    
    ALL_ACCOUNTS_ORDER.forEach(name => {
        const acc = accountMap.get(name);
        if (acc) {
            const result = { ...acc };
            const ATB_DR_Net = result.TB_DR + result.ADJ_DR; const ATB_CR_Net = result.TB_CR + result.ADJ_CR;
            const balance = ATB_DR_Net - ATB_CR_Net;
            if (balance > 0) { result.ATB_DR = balance; result.ATB_CR = 0; } else if (balance < 0) { result.ATB_DR = 0; result.ATB_CR = Math.abs(balance); } else { result.ATB_DR = 0; result.ATB_CR = 0; }
            result.IS_DR = 0; result.IS_CR = 0; result.BS_DR = 0; result.BS_CR = 0;
            if (result.isFS === 'IS') { result.IS_DR = result.ATB_DR; result.IS_CR = result.ATB_CR; totalIS_DR += result.IS_DR; totalIS_CR += result.IS_CR; }
            else if (result.isFS === 'BS') { result.BS_DR = result.ATB_DR; result.BS_CR = result.ATB_CR; totalBS_DR += result.BS_DR; totalBS_CR += result.BS_CR; }
            totalATB_DR += result.ATB_DR; totalATB_CR += result.ATB_CR;
            finalAccounts.push(result);
        }
    });

    const netIncome = totalIS_CR - totalIS_DR;
    const IS_Final_DR = totalIS_DR + (netIncome > 0 ? netIncome : 0); const IS_Final_CR = totalIS_CR + (netIncome < 0 ? Math.abs(netIncome) : 0);
    const BS_Final_DR = totalBS_DR + (netIncome < 0 ? Math.abs(netIncome) : 0); const BS_Final_CR = totalBS_CR + (netIncome > 0 ? netIncome : 0);
    let startingCapital = accountMap.get(CAPITAL_ACCOUNT)?.ATB_CR || 0;
    let withdrawals = accountMap.get(WITHDRAWALS_ACCOUNT)?.ATB_DR || 0;
    let endingCapital = startingCapital + netIncome - withdrawals;
    const bsAccountsForFS = finalAccounts.filter(acc => acc.isFS === 'BS');
    const assets = bsAccountsForFS.filter(acc => acc.type === 'asset' || acc.type === 'contra-asset');
    const liabilities = bsAccountsForFS.filter(acc => acc.type === 'liability');
    let correctTotalAssetsNet = 0;
    assets.forEach(acc => { if (acc.type === 'asset') correctTotalAssetsNet += acc.ATB_DR; else if (acc.type === 'contra-asset') correctTotalAssetsNet -= acc.ATB_CR; });
    let totalLiab = 0; liabilities.forEach(acc => totalLiab += acc.ATB_CR);
    const correctTotalLiabilitiesAndEquityNet = totalLiab + endingCapital;

    return {
        netIncome, totalRevenue: totalIS_CR, totalExpenses: totalIS_DR, startingCapital, withdrawals, endingCapital,
        accounts: finalAccounts,
        TB_DR_Total: totalTB_DR, TB_CR_Total: totalTB_CR, ADJ_DR_Total: totalADJ_DR, ADJ_CR_Total: totalADJ_CR,
        ATB_DR_Total: totalATB_DR, ATB_CR_Total: totalATB_CR, IS_DR_Total: IS_Final_DR, IS_CR_Total: IS_Final_CR, BS_DR_Total: BS_Final_DR, BS_CR_Total: BS_Final_CR,
        BS_SUB_DR: totalBS_DR, BS_SUB_CR: totalBS_CR, IS_SUB_DR: totalIS_DR, IS_SUB_CR: totalIS_CR, 
        ATB_DR_SUB: totalATB_DR, ATB_CR_SUB: totalATB_CR, TB_DR_SUB: totalTB_DR, TB_CR_SUB: totalTB_CR, ADJ_DR_SUB: totalADJ_DR, ADJ_CR_SUB: totalADJ_CR,
        correctTotalAssetsNet, correctTotalLiabilitiesAndEquityNet, IS_accounts: finalAccounts.filter(acc => acc.isFS === 'IS'), Assets: assets, Liabilities: liabilities
    };
}

// HTML GENERATOR HELPERS
const getValidationIcon = (inputVal, correctVal) => {
    const val = Number(inputVal) || 0;
    const correct = Number(correctVal);
    const isCorrect = Math.abs(val - correct) < 0.01;
    return isCorrect ? '<span class="validation-icon text-green-600">✔</span>' : '<span class="validation-icon text-red-600">❌</span>';
};

const renderWorksheetHTML = (data, key) => {
    const inputs = data.worksheetInputs || {};
    let rowsHtml = '';
    const bgClass = 'bg-gray-100 text-gray-600'; 
    
    key.accounts.forEach((acc, i) => {
        const baseId = `wks_${i}_`;
        const isNewAccount = acc.TB_DR === 0 && acc.TB_CR === 0 && acc.name.indexOf('Capital') === -1;
        
        rowsHtml += `<tr class="${isNewAccount ? 'bg-yellow-50/50' : 'hover:bg-gray-50'}">
            <td class="p-2 border border-gray-300 text-left whitespace-nowrap ${isNewAccount ? 'font-semibold text-yellow-800' : ''}">${acc.name}</td>
            <td class="p-2 border border-gray-300 text-right">${formatPHP(acc.TB_DR)}</td><td class="p-2 border border-gray-300 text-right">${formatPHP(acc.TB_CR)}</td>
            ${['ADJ_DR','ADJ_CR','ATB_DR','ATB_CR','IS_DR','IS_CR','BS_DR','BS_CR'].map(f => {
                const inputVal = inputs[baseId + f];
                const correctVal = acc[f];
                return `<td class="p-0 border border-gray-300 relative val-container"><input type="text" class="table-input ${bgClass}" value="${inputVal || ''}" readonly>${getValidationIcon(inputVal, correctVal)}</td>`;
            }).join('')}</tr>`;
        
        if (acc.name === 'Depreciation Expense') {
             rowsHtml += `<tr class="font-bold bg-purple-100 text-purple-800 border-t-2 border-purple-500"><td class="p-2 border text-left">COLUMN TOTALS</td>
             ${['TB_DR','TB_CR','ADJ_DR','ADJ_CR','ATB_DR','ATB_CR','IS_DR','IS_CR','BS_DR','BS_CR'].map(f => {
                const map = {'TB_DR':'TB_DR_SUB','TB_CR':'TB_CR_SUB','ADJ_DR':'ADJ_DR_SUB','ADJ_CR':'ADJ_CR_SUB','ATB_DR':'ATB_DR_SUB','ATB_CR':'ATB_CR_SUB','IS_DR':'IS_SUB_DR','IS_CR':'IS_SUB_CR','BS_DR':'BS_SUB_DR','BS_CR':'BS_SUB_CR'};
                const correctVal = key[map[f]];
                const inputVal = inputs['wks_SUBTOTAL_' + f];
                return `<td class="p-0 border relative val-container"><input type="text" class="table-input ${bgClass}" value="${inputVal || ''}" readonly>${getValidationIcon(inputVal, correctVal)}</td>`;
             }).join('')}</tr>`;
        }
    });
    
    // Net Income Row
    rowsHtml += `<tr class="font-bold bg-green-50/50 text-green-700"><td class="p-2 border text-left">${key.netIncome > 0 ? 'Net Income' : 'Net Loss'}</td><td colspan="6"></td>${['IS_DR','IS_CR','BS_DR','BS_CR'].map(f => {
        let correctVal = 0;
        if(f==='IS_DR') correctVal = key.netIncome>0?key.netIncome:0;
        if(f==='IS_CR') correctVal = key.netIncome<0?Math.abs(key.netIncome):0;
        if(f==='BS_DR') correctVal = key.netIncome<0?Math.abs(key.netIncome):0;
        if(f==='BS_CR') correctVal = key.netIncome>0?key.netIncome:0;
        const inputVal = inputs['wks_NI_' + f];
        return `<td class="p-0 border relative val-container"><input type="text" class="table-input ${bgClass}" value="${inputVal || ''}" readonly>${getValidationIcon(inputVal, correctVal)}</td>`;
    }).join('')}</tr>`;
    
    // Final Totals
    rowsHtml += `<tr class="font-bold bg-indigo-50/50 border-t-2 border-indigo-700"><td class="p-2 border text-center">FINAL TOTALS</td>${['TB_DR','TB_CR','ADJ_DR','ADJ_CR','ATB_DR','ATB_CR','IS_DR','IS_CR','BS_DR','BS_CR'].map(f => {
         const correctVal = key[f + "_Total"];
         const inputVal = inputs['wks_FINAL_' + f];
         return `<td class="p-0 border relative val-container"><input type="text" class="table-input ${bgClass}" value="${inputVal || ''}" readonly>${getValidationIcon(inputVal, correctVal)}</td>`;
    }).join('')}</tr>`;

    return `<div class="overflow-x-auto">
        <div class="text-center font-bold mb-4 text-black" style="page-break-after: avoid;">
            <div class="uppercase tracking-wide text-lg">${getFamilyName(data.studentInfo)} Accounting Services</div>
            <div class="text-base">Worksheet</div>
            <div class="text-sm font-normal">December 31, 2024</div>
        </div>
        <table class="min-w-full text-xs border-collapse border border-gray-400">
        <thead><tr class="header-bg text-center"><th rowspan="2" class="p-2 border border-gray-300 w-[150px]">Account Titles</th><th colspan="2" class="p-2 border">Trial Balance</th><th colspan="2" class="p-2 border">Adjustments</th><th colspan="2" class="p-2 border">Adj. Trial Balance</th><th colspan="2" class="p-2 border">Income Statement</th><th colspan="2" class="p-2 border">Balance Sheet</th></tr><tr class="bg-indigo-100 text-indigo-900 text-center"><th class="p-1 border">Debit</th><th class="p-1 border">Credit</th><th class="p-1 border">Debit</th><th class="p-1 border">Credit</th><th class="p-1 border">Debit</th><th class="p-1 border">Credit</th><th class="p-1 border">Debit</th><th class="p-1 border">Credit</th><th class="p-1 border">Debit</th><th class="p-1 border">Credit</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
};

const renderFSInput = (inputs, type, id, correctVal, placeholder="Amount", label="") => {
    const inputVal = inputs[type][id];
    return `<div class="flex justify-between items-center text-sm ${label ? 'mb-1' : ''}">${label ? `<span class="text-gray-700 w-1/3 pr-2">${label}</span>` : ''}<div class="relative w-${label ? '2/3' : 'full'} val-container"><input type="text" class="fs-input bg-gray-100" placeholder="${placeholder}" value="${inputVal || ''}" readonly>${getValidationIcon(inputVal, correctVal)}</div></div>`;
};

const getISHTML = (data, key) => {
    const inputs = data.fsInputs;
    return `<div class="p-4 bg-white rounded shadow border border-green-200 print:border print:shadow-none h-full">
        <div class="text-center font-bold mb-4 text-black">
            <div class="uppercase text-sm">${getFamilyName(data.studentInfo)} Accounting Services</div>
            <div class="text-sm">Income Statement</div>
            <div class="text-xs font-normal italic">For the Year Ended December 31, 2024</div>
        </div>
        ${key.IS_accounts.filter(acc => acc.type === 'revenue').map(acc => renderFSInput(inputs, 'is', getAccountId(acc.name) + '_is_li', acc.ATB_CR, 'Amount', acc.name)).join('')}
        <div class="flex justify-between font-bold border-t pt-1"><label class="text-green-700 w-1/3">TOTAL REV:</label><div class="relative w-2/3 val-container"><input type="text" class="fs-input bg-gray-100" value="${inputs.is.is_total_revenue || ''}" readonly>${getValidationIcon(inputs.is.is_total_revenue, key.totalRevenue)}</div></div>
        <h5 class="font-bold text-red-700 mt-2">Expenses</h5>
        ${key.IS_accounts.filter(acc => acc.type === 'expense').map(acc => renderFSInput(inputs, 'is', getAccountId(acc.name) + '_is_li', acc.ATB_DR, 'Amount', acc.name)).join('')}
        <div class="flex justify-between font-bold border-t pt-1"><label class="text-red-700 w-1/3">TOTAL EXP:</label><div class="relative w-2/3 val-container"><input type="text" class="fs-input bg-gray-100" value="${inputs.is.is_total_expense || ''}" readonly>${getValidationIcon(inputs.is.is_total_expense, key.totalExpenses)}</div></div>
        <div class="flex justify-between font-extrabold border-t-2 border-indigo-500 pt-2 mt-2"><label class="text-indigo-800 w-1/3">${key.netIncome > 0 ? 'NET INCOME' : 'NET LOSS'}:</label><div class="relative w-2/3 val-container"><input type="text" class="fs-input bg-gray-100" value="${inputs.is.is_net_income || ''}" readonly>${getValidationIcon(inputs.is.is_net_income, Math.abs(key.netIncome))}</div></div></div>`;
};

const getSCEHTML = (data, key) => {
     const familyName = getFamilyName(data.studentInfo);
     const inputs = data.fsInputs;
     return `<div class="p-4 bg-white rounded shadow border border-purple-200 print:border print:shadow-none h-full">
        <div class="text-center font-bold mb-4 text-black">
            <div class="uppercase text-sm">${familyName} Accounting Services</div>
            <div class="text-sm">Statement of Changes in Equity</div>
            <div class="text-xs font-normal italic">For the Year Ended December 31, 2024</div>
        </div>
        ${renderFSInput(inputs, 'sce', 'sce_starting_capital', key.startingCapital, '', `${familyName}, Capital, Jan 1`)}
        ${renderFSInput(inputs, 'sce', 'sce_net_income', Math.abs(key.netIncome), '', 'Add/Less: Net Income/Loss')}
        ${renderFSInput(inputs, 'sce', 'sce_withdrawals', key.withdrawals, '', `Less: Withdrawals`)}
        <div class="flex justify-between font-extrabold border-t-2 border-indigo-500 pt-2 mt-2"><label class="text-indigo-800 w-1/3">Capital, Dec 31:</label><div class="relative w-2/3 val-container"><input type="text" class="fs-input bg-gray-100" value="${inputs.sce.sce_ending_capital || ''}" readonly>${getValidationIcon(inputs.sce.sce_ending_capital, key.endingCapital)}</div></div></div>`;
};

const getBSHTML = (data, key) => {
     const inputs = data.fsInputs;
     const familyName = getFamilyName(data.studentInfo);
     return `<div class="p-4 bg-white rounded shadow border border-red-200 print:border print:shadow-none h-full">
        <div class="text-center font-bold mb-4 text-black">
            <div class="uppercase text-sm">${familyName} Accounting Services</div>
            <div class="text-sm">Balance Sheet</div>
            <div class="text-xs font-normal italic">As of December 31, 2024</div>
        </div>
        <h5 class="font-bold text-blue-700">ASSETS</h5>
        ${key.Assets.map(acc => renderFSInput(inputs, 'bs', getAccountId(acc.name)+'_bs_li', (acc.type === 'contra-asset' ? acc.ATB_CR : acc.ATB_DR), '', acc.name)).join('')}
        <div class="flex justify-between font-bold border-t pt-1 mb-2"><label class="text-blue-800 w-1/3">TOTAL ASSETS:</label><div class="relative w-2/3 val-container"><input type="text" class="fs-input bg-gray-100" value="${inputs.bs.bs_total_assets || ''}" readonly>${getValidationIcon(inputs.bs.bs_total_assets, key.correctTotalAssetsNet)}</div></div>
        <h5 class="font-bold text-red-700">LIABILITIES & EQUITY</h5>
        ${key.Liabilities.map(acc => renderFSInput(inputs, 'bs', getAccountId(acc.name)+'_bs_li', acc.ATB_CR, '', acc.name)).join('')}
        ${renderFSInput(inputs, 'bs', 'bs_ending_capital_bs', key.endingCapital, '', `Capital, Dec 31`)}
        <div class="flex justify-between font-bold border-t pt-1"><label class="text-red-800 w-1/3">TOTAL L&E:</label><div class="relative w-2/3 val-container"><input type="text" class="fs-input bg-gray-100" value="${inputs.bs.bs_total_liab_equity || ''}" readonly>${getValidationIcon(inputs.bs.bs_total_liab_equity, key.correctTotalLiabilitiesAndEquityNet)}</div></div></div>`;
};

const renderRubricHTML = (taskNum, scoreData) => {
    let competency = taskNum === 1 
        ? "To create 10-column worksheet by accurately determining and applying necessary adjustments, then integrating these with unadjusted amounts to complete the worksheet with correct financial data." 
        : "To prepare the income statement, statement of changes in equity, and balance sheet by accurately transferring the adjusted figures from the 10-column worksheet into the prescribed financial statement formats.";
    
    let scoreInfo = '';
    if (scoreData) {
        scoreInfo = `<div class="text-right font-bold text-sm mb-1">Correct: ${scoreData.score}/${scoreData.total} | Grade: <span class="text-lg border px-1">${scoreData.grade}</span></div>`;
    }

    return `
        <div class="rubric-box p-4 rounded-lg border-2 border-indigo-300 shadow-md mb-6 print:border-black print:shadow-none">
            <div class="flex justify-between items-end mb-2 border-b-2 pb-1">
                <h4 class="font-extrabold text-indigo-700 text-lg print:text-black">TASK ${taskNum} RUBRIC</h4>
                ${scoreInfo}
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full text-xs border-collapse border border-gray-400">
                    <thead><tr class="header-bg text-center text-white print:bg-white print:text-black"><th class="p-2 border border-gray-300 w-1/5">Competency</th><th class="p-2 border border-gray-300 bg-green-600/90">Advanced (A)</th><th class="p-2 border border-gray-300 bg-blue-600/90">Proficient (P)</th><th class="p-2 border border-gray-300 bg-yellow-600/90">Developing (D)</th><th class="p-2 border border-gray-300 bg-red-600/90">Intervention Required (IR)</th></tr></thead>
                    <tbody><tr class="align-top"><td class="p-2 border border-gray-300 italic">${competency}</td><td class="p-2 border border-gray-300 text-green-800">Excellent performance. (95-100%)</td><td class="p-2 border border-gray-300 text-blue-800">Good performance. (85-94.9%)</td><td class="p-2 border border-gray-300 text-yellow-800">Acceptable performance. (75-84.9%)</td><td class="p-2 border border-gray-300 text-red-800">Unacceptable performance. (<75%)</td></tr></tbody>
                </table>
            </div>
        </div>`;
};

const getFamilyName = (info) => {
    if (!info || !info.fullName) return 'A';
    return info.fullName.split(',')[0].trim() || 'A'; 
};
const formatPHP = (num) => (typeof num !== 'number' || isNaN(num) || num === 0) ? '' : (Math.round(num * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatNumber = (num) => (typeof num !== 'number' || isNaN(num) || num === 0) ? '' : (Math.round(num * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const getAccountId = (name) => name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
