/**
 * T2 Performance Task 01 Report Renderer
 * Revised to match the specific "Report View" layout (Vertical Stack, Card-based)
 * exactly as shown in the provided screenshots.
 */

export function renderSpecificReport(data, collectionName) {
    const { studentInfo, scores, ledgersStructure, userInputs, journalEntries, pctb, explanations } = data;
    
    // Current time for version string
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const isoString = now.toISOString().replace('T', ' ').substring(0, 19);
    const version = `Version ${isoString} PST (Report Generated)`;

    // --- 1. RE-VALIDATION LOGIC (Identical to previous version to ensure accuracy) ---
    const valMap = {}; 
    const prMap = {};

    const getVal = (id) => (userInputs && userInputs[id] !== undefined) ? userInputs[id] : '';
    const getNum = (id) => {
        const v = getVal(id);
        return v === '' ? 0 : Number(v);
    };
    const getSelected = (id, val) => getVal(id) === val ? 'selected' : '';

    // Reconstruct Answer Data
    const requiredAccounts = [...new Set([...pctb.map(x=>x.name), ...journalEntries.flatMap(x=>x.titles)])].sort();
    const accountTotals = {}; 
    requiredAccounts.forEach(a => accountTotals[a] = { dr:0, cr:0, begDr:0, begCr:0, hasBegDr:false, hasBegCr:false });
    const accountTransactions = {};
    requiredAccounts.forEach(a => accountTransactions[a] = []);
    const journalLinePostedStatus = {};

    pctb.forEach(a => {
        if(accountTotals[a.name]) {
            if(a.side === 'Dr') { accountTotals[a.name].begDr = a.bal; accountTotals[a.name].hasBegDr = true; }
            else { accountTotals[a.name].begCr = a.bal; accountTotals[a.name].hasBegCr = true; }
        }
    });

    journalEntries.forEach(e => {
        const drAcc = e.titles[0]; const crAcc = e.titles[1];
        if(accountTotals[drAcc]) accountTotals[drAcc].dr += e.drs[0];
        if(accountTotals[crAcc]) accountTotals[crAcc].cr += e.crs[1];

        const keyDr = `j_${e.id}_0`;
        const keyCr = `j_${e.id}_1`;
        journalLinePostedStatus[keyDr] = false;
        journalLinePostedStatus[keyCr] = false;

        if(accountTransactions[drAcc]) accountTransactions[drAcc].push({ amount: e.drs[0], side: 'dr', day: e.day, matched: false, key: keyDr, month: e.month });
        if(accountTransactions[crAcc]) accountTransactions[crAcc].push({ amount: e.crs[1], side: 'cr', day: e.day, matched: false, key: keyCr, month: e.month });
    });

    // Validate Ledgers
    const currentYear = new Date().getFullYear();
    const transMonth = journalEntries.length > 0 ? journalEntries[0].month : "Jan";
    const expectedBegDate1 = `${transMonth} 01`;
    const expectedBegDate2 = `${transMonth} 1`;

    if (ledgersStructure) {
        ledgersStructure.forEach(l => {
            const id = l.id;
            const nameVal = getVal(`l_${id}_name`).trim();
            const accName = requiredAccounts.find(r => r.toLowerCase() === nameVal.toLowerCase());

            const setVal = (elmId, isValid) => {
                if(isValid) valMap[elmId] = 'input-success-check';
                else valMap[elmId] = 'input-error-x';
            };

            const side = accName && pctb.find(p => p.name === accName) ? pctb.find(p => p.name === accName).side.toLowerCase() : (getVal(`l_${id}_dr_a_0`) ? 'dr' : 'cr');
            
            const yearVal = getNum(`l_${id}_${side}_year`);
            if(yearVal === currentYear) setVal(`l_${id}_${side}_year`, true);
            else if (getVal(`l_${id}_${side}_year`)) setVal(`l_${id}_${side}_year`, false);

            const d0 = getVal(`l_${id}_${side}_d_0`);
            const p0 = getVal(`l_${id}_${side}_p_0`);
            const pr0 = getVal(`l_${id}_${side}_pr_0`);
            const a0 = getNum(`l_${id}_${side}_a_0`);
            
            if (accName) {
                const pctbEntry = pctb.find(p => p.name === accName);
                if (pctbEntry && pctbEntry.side.toLowerCase() === side) {
                    if (d0 === expectedBegDate1 || d0 === expectedBegDate2) setVal(`l_${id}_${side}_d_0`, true); else if(d0) setVal(`l_${id}_${side}_d_0`, false);
                    if (p0.toUpperCase() === 'BB') setVal(`l_${id}_${side}_p_0`, true); else if(p0) setVal(`l_${id}_${side}_p_0`, false);
                    if (pr0 === '') setVal(`l_${id}_${side}_pr_0`, true); else if(pr0) setVal(`l_${id}_${side}_pr_0`, false);
                    if (Math.abs(a0 - pctbEntry.bal) < 1) setVal(`l_${id}_${side}_a_0`, true); else if(a0) setVal(`l_${id}_${side}_a_0`, false);
                }
            }

            if (accName) {
                const expected = accountTotals[accName];
                const expectedTransList = accountTransactions[accName];

                const totalDr = getNum(`l_${id}_total_dr`);
                const totalCr = getNum(`l_${id}_total_cr`);
                const bal = getNum(`l_${id}_bal`);
                const balType = getVal(`l_${id}_bal_type`);

                if (Math.abs(totalDr - (expected.dr + expected.begDr)) < 2) setVal(`l_${id}_total_dr`, true); else setVal(`l_${id}_total_dr`, false);
                if (Math.abs(totalCr - (expected.cr + expected.begCr)) < 2) setVal(`l_${id}_total_cr`, true); else setVal(`l_${id}_total_cr`, false);

                const net = (expected.begDr + expected.dr) - (expected.begCr + expected.cr);
                const expectedSide = net >= 0 ? 'dr' : 'cr';
                const absNet = Math.abs(net);

                if (Math.abs(bal - absNet) < 2 && balType === expectedSide) {
                    setVal(`l_${id}_bal`, true);
                    setVal(`l_${id}_bal_type`, true);
                } else {
                    if (Math.abs(bal - absNet) >= 2) setVal(`l_${id}_bal`, false);
                    if (balType !== expectedSide) setVal(`l_${id}_bal_type`, false);
                }

                const begBalSide = expected.hasBegDr ? 'dr' : (expected.hasBegCr ? 'cr' : 'none');
                const rowCount = l.rowCount || 4;

                for(let r=0; r < rowCount; r++) {
                    ['dr', 'cr'].forEach(s => {
                        if (begBalSide === s && r === 0) return;
                        const uAmt = getNum(`l_${id}_${s}_a_${r}`);
                        if (uAmt > 0) {
                            const matchIdx = expectedTransList.findIndex(et => et.side === s && !et.matched && Math.abs(et.amount - uAmt) < 1);
                            if (matchIdx > -1) {
                                const matchedTrans = expectedTransList[matchIdx];
                                matchedTrans.matched = true;
                                if(matchedTrans.key) journalLinePostedStatus[matchedTrans.key] = true;
                                setVal(`l_${id}_${s}_a_${r}`, true);
                                const pVal = getVal(`l_${id}_${s}_p_${r}`);
                                if(pVal.toUpperCase() === 'GJ') setVal(`l_${id}_${s}_p_${r}`, true); else setVal(`l_${id}_${s}_p_${r}`, false);
                                const prVal = getVal(`l_${id}_${s}_pr_${r}`);
                                if(prVal === '1') setVal(`l_${id}_${s}_pr_${r}`, true); else setVal(`l_${id}_${s}_pr_${r}`, false);
                                const dVal = getVal(`l_${id}_${s}_d_${r}`);
                                const validFormats = [matchedTrans.day, parseInt(matchedTrans.day).toString(), `${matchedTrans.month} ${matchedTrans.day}`, `${matchedTrans.month} ${parseInt(matchedTrans.day)}`];
                                if(validFormats.includes(dVal)) setVal(`l_${id}_${s}_d_${r}`, true); else setVal(`l_${id}_${s}_d_${r}`, false);
                            } else {
                                setVal(`l_${id}_${s}_a_${r}`, false);
                                if(getVal(`l_${id}_${s}_p_${r}`)) setVal(`l_${id}_${s}_p_${r}`, false);
                                if(getVal(`l_${id}_${s}_pr_${r}`)) setVal(`l_${id}_${s}_pr_${r}`, false);
                                if(getVal(`l_${id}_${s}_d_${r}`)) setVal(`l_${id}_${s}_d_${r}`, false);
                            }
                        }
                    });
                }
            } else if (nameVal) {
                setVal(`l_${id}_name`, false);
            }
        });
    }

    // Validate PR Boxes
    journalEntries.forEach(e => {
        ['0', '1'].forEach(sideIdx => {
            const key = `j_${e.id}_${sideIdx}`;
            const isChecked = userInputs[key] === true;
            const isPosted = journalLinePostedStatus[key];
            if (isChecked) {
                if (isPosted) prMap[key] = 'pr-valid pr-checked';
                else prMap[key] = 'pr-error pr-checked';
            } else {
                if (isPosted) prMap[key] = 'pr-error'; 
            }
        });
    });

    // Validate Trial Balance
    const accountFinalBalances = {};
    requiredAccounts.forEach(acc => accountFinalBalances[acc] = 0);
    pctb.forEach(item => {
        if (item.side === 'Dr') accountFinalBalances[item.name] += item.bal;
        else accountFinalBalances[item.name] -= item.bal;
    });
    journalEntries.forEach(e => {
        const drAcc = e.titles[0]; const crAcc = e.titles[1];
        if (accountFinalBalances[drAcc] !== undefined) accountFinalBalances[drAcc] += e.drs[0];
        if (accountFinalBalances[crAcc] !== undefined) accountFinalBalances[crAcc] -= e.crs[1];
    });

    const tbInputKeys = Object.keys(userInputs).filter(k => k.startsWith('tb_name_')).sort((a,b) => parseInt(a.split('_')[2]) - parseInt(b.split('_')[2]));
    
    let expectedTotalDr = 0;
    Object.values(accountFinalBalances).forEach(val => { if(val > 0) expectedTotalDr += val; });
    const expectedTotalCr = expectedTotalDr;

    const inTotalDr = getNum('tb_total_dr');
    const inTotalCr = getNum('tb_total_cr');

    if(Math.abs(inTotalDr - expectedTotalDr) < 2 && inTotalDr > 0) valMap['tb_total_dr'] = 'input-success-check'; else valMap['tb_total_dr'] = 'input-error-x';
    if(Math.abs(inTotalCr - expectedTotalCr) < 2 && inTotalCr > 0) valMap['tb_total_cr'] = 'input-success-check'; else valMap['tb_total_cr'] = 'input-error-x';

    tbInputKeys.forEach(key => {
        const i = key.split('_')[2];
        const nameVal = getVal(`tb_name_${i}`).trim();
        const drVal = getNum(`tb_dr_${i}`);
        const crVal = getNum(`tb_cr_${i}`);

        if (nameVal || drVal || crVal) {
            const matchedAccount = requiredAccounts.find(acc => acc.toLowerCase() === nameVal.toLowerCase());
            if (matchedAccount) {
                valMap[`tb_name_${i}`] = 'input-success-check';
                const finalBal = accountFinalBalances[matchedAccount];
                const isDr = finalBal >= 0;
                const absBal = Math.abs(finalBal);
                if (isDr) {
                    if (Math.abs(drVal - absBal) < 2 && crVal === 0) valMap[`tb_dr_${i}`] = 'input-success-check';
                    else {
                        valMap[`tb_dr_${i}`] = 'input-error-x';
                        if(crVal !== 0) valMap[`tb_cr_${i}`] = 'input-error-x';
                    }
                } else {
                    if (Math.abs(crVal - absBal) < 2 && drVal === 0) valMap[`tb_cr_${i}`] = 'input-success-check';
                    else {
                        valMap[`tb_cr_${i}`] = 'input-error-x';
                        if(drVal !== 0) valMap[`tb_dr_${i}`] = 'input-error-x';
                    }
                }
            } else {
                valMap[`tb_name_${i}`] = 'input-error-x';
                if(drVal) valMap[`tb_dr_${i}`] = 'input-error-x';
                if(crVal) valMap[`tb_cr_${i}`] = 'input-error-x';
            }
        }
    });

    // --- HTML HELPERS ---
    const getClass = (id, baseClass) => `${baseClass} ${valMap[id] || ''}`;
    const formatNumber = (n) => n ? Number(n).toLocaleString('en-US') : '';
    const formatMoney = (n) => 'P' + Number(n).toLocaleString('en-US');

    // --- CSS ---
    const styles = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .report-body { 
            font-family: 'Inter', sans-serif; 
            background-color: white; 
            color: #1f2937;
            font-size: 14px;
        }
        
        /* HEADER STYLES */
        .header-title { color: #F59E0B; font-weight: 800; font-size: 1.5rem; text-transform: uppercase; margin-top: 0.5rem; }
        .school-name { font-family: serif; color: #1E3A8A; font-weight: bold; text-transform: uppercase; }
        .dept-name { font-family: serif; color: #1E40AF; font-weight: bold; font-size: 1.1rem; }
        
        /* STUDENT STRIP */
        .student-strip { border-top: 4px solid #2563EB; display: flex; justify-content: space-between; align-items: flex-end; font-family: monospace; font-weight: bold; font-size: 0.85rem; padding-top: 0.5rem; margin-bottom: 2rem; }

        /* RUBRICS */
        .rubric-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; margin-bottom: 1rem; border: 1px solid #e5e7eb; }
        .rubric-header { color: white; font-weight: bold; text-align: center; }
        .rubric-cell { padding: 0.5rem; border: 1px solid #f3f4f6; text-align: center; vertical-align: middle; }
        .rubric-desc { text-align: left; background-color: #f9fafb; color: #374151; font-style: italic; padding: 0.75rem; }
        
        /* JOURNAL & LEDGER */
        .section-header { 
            background-color: #f3f4f6; 
            padding: 0.5rem; 
            font-weight: bold; 
            color: #1e3a8a; 
            display: flex; 
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .journal-table { width: 100%; font-size: 0.8rem; border-collapse: collapse; }
        .journal-th { text-align: left; color: #6b7280; font-weight: bold; padding: 0.5rem; border-bottom: 1px solid #e5e7eb; font-size: 0.7rem; text-transform: uppercase; }
        .journal-td { padding: 0.5rem; vertical-align: top; }
        
        .ledger-card { 
            border: 1px solid #e5e7eb; 
            border-radius: 0.5rem; 
            overflow: hidden; 
            margin-bottom: 1.5rem; 
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            break-inside: avoid;
        }
        .ledger-top { background-color: #eff6ff; padding: 1rem; border-bottom: 1px solid #dbeafe; display: flex; justify-content: center; }
        .ledger-title { background: white; border: 1px solid #bfdbfe; padding: 0.25rem 1rem; font-weight: 700; text-align: center; border-radius: 0.25rem; min-width: 50%; }
        
        /* INPUTS */
        .report-input { width: 100%; background: transparent; border: none; outline: none; color: black; }
        .report-input-r { text-align: right; }
        .report-input-c { text-align: center; }
        
        /* VALIDATION ICONS */
        .input-error-x {
            border-bottom: 1px solid #dc2626 !important; background-color: #fef2f2;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23dc2626'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'/%3E%3C/svg%3E");
            background-repeat: no-repeat; background-position: right 2px center; background-size: 12px;
        }
        .input-success-check {
            border-bottom: 1px solid #16a34a !important; background-color: #f0fdf4;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2316a34a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M5 13l4 4L19 7'/%3E%3C/svg%3E");
            background-repeat: no-repeat; background-position: right 2px center; background-size: 12px;
        }
        
        .pr-box { width: 14px; height: 14px; border: 1px solid #d1d5db; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; }
        .pr-checked { border-color: #16a34a; background-color: #dcfce7; color: #16a34a; font-weight: bold; }
        .pr-checked::after { content: '✓'; }
        .pr-error { border-color: #dc2626; background-color: #fef2f2; }

        /* TRIAL BALANCE */
        .tb-card { border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; margin-top: 1rem; padding: 1.5rem; }
        .tb-header { background-color: #4f46e5; color: white; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; padding: 0.75rem; }
        
        /* CHIPS */
        .pctb-chip { font-size: 0.7rem; border: 1px solid #e5e7eb; padding: 2px 6px; border-radius: 4px; background: white; margin-right: 4px; margin-bottom: 4px; display: inline-block; }

        /* PRINT */
        @media print {
            body { background-color: white; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
            .break-inside-avoid { break-inside: avoid; }
        }
    </style>
    `;

    // --- HTML GENERATORS ---

    const createLedgerRows = (ledgerObj) => {
        const id = ledgerObj.id;
        const rowCount = ledgerObj.rowCount || 4;
        let drRows = "", crRows = "";
        
        // Year Row
        drRows += `
        <div class="flex border-b border-gray-100 bg-gray-50 text-xs">
            <div class="w-1/4 border-r border-gray-100 p-1"><input disabled value="${getVal(`l_${id}_dr_year`)}" class="${getClass(`l_${id}_dr_year`, 'report-input report-input-c font-bold')}" placeholder="YYYY"></div>
            <div class="w-3/4"></div>
        </div>`;
        crRows += `
        <div class="flex border-b border-gray-100 bg-gray-50 text-xs">
            <div class="w-1/4 border-r border-gray-100 p-1"><input disabled value="${getVal(`l_${id}_cr_year`)}" class="${getClass(`l_${id}_cr_year`, 'report-input report-input-c font-bold')}" placeholder="YYYY"></div>
            <div class="w-3/4"></div>
        </div>`;

        for(let i=0; i<rowCount; i++) {
            drRows += `
            <div class="flex border-b border-gray-100 text-xs h-7 items-center">
                <div class="w-3/12 border-r border-gray-100 p-1"><input disabled value="${getVal(`l_${id}_dr_d_${i}`)}" class="${getClass(`l_${id}_dr_d_${i}`, 'report-input report-input-r')}"></div>
                <div class="w-5/12 border-r border-gray-100 p-1"><input disabled value="${getVal(`l_${id}_dr_p_${i}`)}" class="${getClass(`l_${id}_dr_p_${i}`, 'report-input')}"></div>
                <div class="w-1/12 border-r border-gray-100 p-1"><input disabled value="${getVal(`l_${id}_dr_pr_${i}`)}" class="${getClass(`l_${id}_dr_pr_${i}`, 'report-input report-input-c')}"></div>
                <div class="w-3/12 p-1"><input disabled value="${getVal(`l_${id}_dr_a_${i}`)}" class="${getClass(`l_${id}_dr_a_${i}`, 'report-input report-input-r')}"></div>
            </div>`;
            
            crRows += `
            <div class="flex border-b border-gray-100 text-xs h-7 items-center">
                <div class="w-3/12 border-r border-gray-100 p-1"><input disabled value="${getVal(`l_${id}_cr_d_${i}`)}" class="${getClass(`l_${id}_cr_d_${i}`, 'report-input report-input-r')}"></div>
                <div class="w-5/12 border-r border-gray-100 p-1"><input disabled value="${getVal(`l_${id}_cr_p_${i}`)}" class="${getClass(`l_${id}_cr_p_${i}`, 'report-input')}"></div>
                <div class="w-1/12 border-r border-gray-100 p-1"><input disabled value="${getVal(`l_${id}_cr_pr_${i}`)}" class="${getClass(`l_${id}_cr_pr_${i}`, 'report-input report-input-c')}"></div>
                <div class="w-3/12 p-1"><input disabled value="${getVal(`l_${id}_cr_a_${i}`)}" class="${getClass(`l_${id}_cr_a_${i}`, 'report-input report-input-r')}"></div>
            </div>`;
        }
        return { drRows, crRows };
    };

    const createLedgerCard = (l) => {
        const { drRows, crRows } = createLedgerRows(l);
        return `
        <div class="ledger-card">
            <div class="ledger-top relative">
                <div class="absolute top-2 right-2 text-red-300 opacity-50"><i class="fas fa-trash"></i></div>
                <div class="text-center w-full">
                    <div class="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-1">Account Title</div>
                    <input disabled value="${getVal(`l_${l.id}_name`)}" class="${getClass(`l_${l.id}_name`, 'bg-white border border-blue-200 rounded px-4 py-1 font-bold text-center w-3/4 outline-none')}">
                </div>
            </div>
            
            <!-- Grid for Dr/Cr -->
            <div class="flex flex-col md:flex-row border-t border-gray-200">
                <div class="w-full md:w-1/2 border-r border-gray-200">
                    <div class="flex bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase py-1 text-center">
                        <div class="w-3/12">Date</div><div class="w-5/12">Particulars</div><div class="w-1/12">PR</div><div class="w-3/12">Amount</div>
                    </div>
                    ${drRows}
                    <div class="flex border-t-2 border-gray-300 bg-gray-50 py-1 text-xs">
                        <div class="w-9/12 text-right pr-2 font-bold text-gray-500 self-center">TOTAL</div>
                        <div class="w-3/12 px-1"><input disabled value="${getVal(`l_${l.id}_total_dr`)}" class="${getClass(`l_${l.id}_total_dr`, 'report-input report-input-r font-bold border-b border-gray-300')}"></div>
                    </div>
                </div>
                <div class="w-full md:w-1/2">
                    <div class="flex bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase py-1 text-center">
                        <div class="w-3/12">Date</div><div class="w-5/12">Particulars</div><div class="w-1/12">PR</div><div class="w-3/12">Amount</div>
                    </div>
                    ${crRows}
                    <div class="flex border-t-2 border-gray-300 bg-gray-50 py-1 text-xs">
                        <div class="w-9/12 text-right pr-2 font-bold text-gray-500 self-center">TOTAL</div>
                        <div class="w-3/12 px-1"><input disabled value="${getVal(`l_${l.id}_total_cr`)}" class="${getClass(`l_${l.id}_total_cr`, 'report-input report-input-r font-bold border-b border-gray-300')}"></div>
                    </div>
                </div>
            </div>
            
            <!-- Balance Bottom -->
            <div class="bg-gray-50 border-t border-gray-200 p-2 flex justify-center items-center gap-2">
                <div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mr-2">Balance</div>
                <select disabled class="${getClass(`l_${l.id}_bal_type`, 'bg-white border border-gray-300 rounded text-xs py-1 px-2')}">
                    <option value="">-</option>
                    <option value="dr" ${getSelected(`l_${l.id}_bal_type`, 'dr')}>Debit</option>
                    <option value="cr" ${getSelected(`l_${l.id}_bal_type`, 'cr')}>Credit</option>
                </select>
                <input disabled value="${getVal(`l_${l.id}_bal`)}" class="${getClass(`l_${l.id}_bal`, 'bg-white border border-gray-300 rounded text-xs py-1 px-2 w-32 text-right font-bold')}">
            </div>
        </div>`;
    };

    return `
    ${styles}
    <div class="report-body p-6 max-w-5xl mx-auto bg-white">
        
        <!-- MAIN HEADER -->
        <div class="text-center mb-6">
            <img src="./shs-adc-logo.png" alt="Logo" class="h-16 mx-auto mb-2" onerror="this.style.display='none'">
            <div class="school-name">Sacred Heart School - Ateneo de Cebu</div>
            <div class="dept-name">Senior High School Department</div>
            <div class="text-blue-600 text-sm font-bold mt-1">SY 2025-2026 | 2nd Semester</div>
            <div class="header-title">T2 PERFORMANCE TASK 01 RESULTS</div>
        </div>

        <!-- STUDENT INFO -->
        <div class="student-strip">
            <div>
                <div>CN: ${studentInfo.classNumber || studentInfo.cn}</div>
                <div>Name: ${studentInfo.fullName.toUpperCase()}</div>
            </div>
            <div class="text-right">
                <div>Section: ${studentInfo.gradeSection || studentInfo.section}</div>
                <div>Date: ${dateStr}</div>
            </div>
        </div>

        <!-- TASK 1 HEADER -->
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-2">
                <span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-bold">Task 1</span>
                <span class="text-lg font-bold text-indigo-900">Posting to General Ledger</span>
            </div>
            <div class="text-sm font-bold text-gray-600 flex items-center gap-2">
                Attempts: 3/3 <span class="bg-gray-500 text-white px-2 py-1 rounded text-xs">Attempts Used</span>
            </div>
        </div>

        <!-- INSTRUCTIONS BOX -->
        <div class="border border-gray-200 rounded p-4 mb-4 text-sm bg-white">
            <div class="font-bold mb-2">Instruction:</div>
            <ul class="list-disc pl-5 space-y-1 text-gray-700">
                <li>Complete all required fields.</li>
                <li>Enter amounts without commas and decimal places.</li>
                <li>Round off centavos to the nearest peso.</li>
                <li>Format Dates carefully: Row 1 (Year): YYYY. Row 2 (Beg. Bal): MMM dd. Row 3+ (Transactions): dd</li>
                <li>Validate each task to unlock the next one.</li>
            </ul>
        </div>

        <!-- RUBRIC TASK 1 -->
        <div class="mb-6">
            <div class="bg-indigo-50 px-2 py-1 flex justify-between items-center border border-indigo-100 border-b-0 text-xs font-bold text-indigo-900">
                <span>TASK 1: POSTING TO THE LEDGER</span>
                <span class="font-mono">A = ${scores.t1a.current}/${scores.t1a.max} - ${scores.t1a.grade} / B = ${scores.t1b.current}/${scores.t1b.max} - ${scores.t1b.grade} / C = ${scores.t1c.current}/${scores.t1c.max} - ${scores.t1c.grade}</span>
            </div>
            <table class="rubric-table">
                <thead>
                    <tr>
                        <th class="rubric-header bg-gray-900 p-2 w-1/5">Competency</th>
                        <th class="rubric-header bg-green-600 p-2 w-1/5">Advanced (A)</th>
                        <th class="rubric-header bg-blue-600 p-2 w-1/5">Proficient (P)</th>
                        <th class="rubric-header bg-yellow-600 p-2 w-1/5">Developing (D)</th>
                        <th class="rubric-header bg-red-600 p-2 w-1/5">Intervention Required (IR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="rubric-desc"><div class="text-[10px]">Task A - To create and setup the General Ledger (T-Accounts).</div></td>
                        <td class="rubric-cell bg-green-50 text-green-800">Excellent performance. (95-100%)</td>
                        <td class="rubric-cell bg-blue-50 text-blue-800">Good performance. (85-94.9%)</td>
                        <td class="rubric-cell bg-yellow-50 text-yellow-800">Acceptable performance. (75-84.9%)</td>
                        <td class="rubric-cell bg-red-50 text-red-800">Unacceptable performance. (<75%)</td>
                    </tr>
                    <tr>
                        <td class="rubric-desc"><div class="text-[10px]">Task B - To accurately input the beginning balances of the General Ledger.</div></td>
                        <td class="rubric-cell bg-green-50 text-green-800">Excellent performance. (95-100%)</td>
                        <td class="rubric-cell bg-blue-50 text-blue-800">Good performance. (85-94.9%)</td>
                        <td class="rubric-cell bg-yellow-50 text-yellow-800">Acceptable performance. (75-84.9%)</td>
                        <td class="rubric-cell bg-red-50 text-red-800">Unacceptable performance. (<75%)</td>
                    </tr>
                    <tr>
                        <td class="rubric-desc"><div class="text-[10px]">Task C - To apply the process of posting journal entries.</div></td>
                        <td class="rubric-cell bg-green-50 text-green-800">Excellent performance. (95-100%)</td>
                        <td class="rubric-cell bg-blue-50 text-blue-800">Good performance. (85-94.9%)</td>
                        <td class="rubric-cell bg-yellow-50 text-yellow-800">Acceptable performance. (75-84.9%)</td>
                        <td class="rubric-cell bg-red-50 text-red-800">Unacceptable performance. (<75%)</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- JOURNAL SECTION -->
        <div class="mb-8 border border-gray-300 rounded overflow-hidden">
            <div class="section-header">
                <span class="text-lg">Source: General Journal</span>
                <span class="text-sm text-gray-500">Page 1</span>
            </div>
            <table class="journal-table">
                <thead>
                    <tr>
                        <th class="journal-th text-right w-1/12">DATE</th>
                        <th class="journal-th w-5/12">PARTICULARS</th>
                        <th class="journal-th text-center w-1/12">PR</th>
                        <th class="journal-th text-right w-2/12">DEBIT</th>
                        <th class="journal-th text-right w-2/12">CREDIT</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <tr>
                        <td class="p-2 text-center font-bold text-gray-500 text-xs bg-gray-50">${currentYear}</td>
                        <td colspan="4"></td>
                    </tr>
                    ${journalEntries.map((e, idx) => `
                    <tr>
                        <td class="journal-td text-right text-gray-500 whitespace-nowrap">
                            ${idx===0 ? `<div class="font-bold text-[10px]">${e.month}</div>` : ''}
                            <div>${e.day}</div>
                        </td>
                        <td class="journal-td font-medium text-gray-800">${e.titles[0]}</td>
                        <td class="journal-td text-center"><div class="pr-box ${prMap[`j_${e.id}_0`] || ''}"></div></td>
                        <td class="journal-td text-right">${formatNumber(e.drs[0])}</td>
                        <td class="journal-td"></td>
                    </tr>
                    <tr>
                        <td class="journal-td"></td>
                        <td class="journal-td pl-8 text-gray-800">${e.titles[1]}</td>
                        <td class="journal-td text-center"><div class="pr-box ${prMap[`j_${e.id}_1`] || ''}"></div></td>
                        <td class="journal-td"></td>
                        <td class="journal-td text-right">${formatNumber(e.crs[1])}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td colspan="4" class="px-2 pb-3 text-[10px] text-gray-400 italic">${e.desc}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="page-break"></div>

        <!-- BEGINNING BALANCES -->
        <div class="mb-4">
            <h4 class="font-bold text-sm uppercase mb-2">Beginning Balances</h4>
            <div>
                ${pctb.map(a => `<span class="pctb-chip"><span class="font-bold">${a.name}</span> <span class="text-gray-500">Beg: ${formatMoney(a.bal)} ${a.side}</span></span>`).join('')}
            </div>
        </div>

        <!-- LEDGER FORMS -->
        <div class="mb-8">
            <h4 class="font-bold text-indigo-900 text-sm bg-indigo-50 p-2 mb-2 border border-indigo-100">General Ledger Forms</h4>
            <div>
                ${ledgersStructure.map(l => createLedgerCard(l)).join('')}
            </div>
        </div>

        <div class="page-break"></div>

        <!-- TASK 2 HEADER -->
        <div class="flex justify-between items-center mb-4 mt-4">
            <div class="flex items-center gap-2">
                <span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-bold">Task 2</span>
                <span class="text-lg font-bold text-indigo-900">Preparing the Trial Balance</span>
            </div>
            <div class="text-sm font-bold text-gray-600 flex items-center gap-2">
                Attempts: 3/3 <span class="bg-gray-500 text-white px-2 py-1 rounded text-xs">Attempts Used</span>
            </div>
        </div>

        <!-- TASK 2 INSTRUCTIONS -->
        <div class="border border-gray-200 rounded p-4 mb-4 text-sm bg-white">
            <div class="font-bold mb-2">Instruction:</div>
            <ul class="list-disc pl-5 space-y-1 text-gray-700">
                <li>Prepare the Trial Balance based on the balances from the General Ledger.</li>
            </ul>
        </div>

        <!-- TASK 2 RUBRIC -->
        <div class="mb-6">
            <div class="bg-indigo-50 px-2 py-1 flex justify-between items-center border border-indigo-100 border-b-0 text-xs font-bold text-indigo-900">
                <span>TASK 2: PREPARING THE TRIAL BALANCE</span>
                <span class="font-mono">Score: ${scores.t2.current}/${scores.t2.max} | Grade: <span class="text-red-600">${scores.t2.grade}</span></span>
            </div>
            <table class="rubric-table">
                <thead>
                    <tr>
                        <th class="rubric-header bg-gray-900 p-2 w-1/5">Competency</th>
                        <th class="rubric-header bg-green-600 p-2 w-1/5">Advanced (A)</th>
                        <th class="rubric-header bg-blue-600 p-2 w-1/5">Proficient (P)</th>
                        <th class="rubric-header bg-yellow-600 p-2 w-1/5">Developing (D)</th>
                        <th class="rubric-header bg-red-600 p-2 w-1/5">Intervention Required (IR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="rubric-desc"><div class="text-[10px]">To accurately prepare a Trial Balance.</div></td>
                        <td class="rubric-cell bg-green-50 text-green-800">Excellent performance. (95-100%)</td>
                        <td class="rubric-cell bg-blue-50 text-blue-800">Good performance. (85-94.9%)</td>
                        <td class="rubric-cell bg-yellow-50 text-yellow-800">Acceptable performance. (75-84.9%)</td>
                        <td class="rubric-cell bg-red-50 text-red-800">Unacceptable performance. (<75%)</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- TRIAL BALANCE CARD -->
        <div class="p-4 bg-gray-50 border border-gray-200 rounded">
            <div class="bg-white shadow-sm border border-gray-200 p-6 max-w-4xl mx-auto">
                <div class="text-center font-bold mb-6 text-gray-800">
                    <div class="text-2xl uppercase tracking-wide border-b-2 border-transparent inline-block pb-1">${studentInfo.fullName.split(',')[0].trim()} ACCOUNTING</div>
                    <div class="text-xl text-indigo-700 mt-1">Trial Balance</div>
                    <div class="text-md text-gray-500 mt-1 font-medium">December 31, ${currentYear}</div>
                </div>
                
                <table class="w-full text-sm border-collapse border border-gray-200">
                    <thead>
                        <tr class="bg-indigo-600 text-white uppercase text-xs tracking-wider">
                            <th class="p-3 w-1/2 text-left border-r border-indigo-500">Account Titles</th>
                            <th class="p-3 w-1/4 text-center border-r border-indigo-500">Debit</th>
                            <th class="p-3 w-1/4 text-center">Credit</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${tbInputKeys.map(key => {
                            const i = key.split('_')[2];
                            return `
                            <tr>
                                <td class="p-1 border-r border-gray-200"><input disabled value="${getVal(`tb_name_${i}`)}" class="${getClass(`tb_name_${i}`, 'report-input font-medium')}"></td>
                                <td class="p-1 border-r border-gray-200"><input disabled value="${getVal(`tb_dr_${i}`)}" class="${getClass(`tb_dr_${i}`, 'report-input report-input-r')}"></td>
                                <td class="p-1"><input disabled value="${getVal(`tb_cr_${i}`)}" class="${getClass(`tb_cr_${i}`, 'report-input report-input-r')}"></td>
                            </tr>`;
                        }).join('')}
                        <tr class="bg-indigo-50 font-bold border-t-2 border-indigo-300">
                            <td class="p-2 text-right text-indigo-900 uppercase text-xs border-r border-indigo-200 tracking-widest">Total:</td>
                            <td class="p-2 border-r border-indigo-200"><input disabled value="${getVal('tb_total_dr')}" class="${getClass('tb_total_dr', 'report-input report-input-r font-bold text-indigo-700')}"></td>
                            <td class="p-2"><input disabled value="${getVal('tb_total_cr')}" class="${getClass('tb_total_cr', 'report-input report-input-r font-bold text-indigo-700')}"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ERROR SUMMARY -->
        ${explanations && explanations.length > 0 ? `
        <div class="mt-8 p-4 border border-red-200 bg-red-50 rounded">
            <h4 class="font-bold text-red-700 text-sm mb-2 uppercase">Summary of Errors & Explanations:</h4>
            <ul class="list-disc pl-4 space-y-1 text-xs text-red-800">
                ${explanations.map(e => `<li>${e}</li>`).join('')}
            </ul>
        </div>` : ''}

        <!-- FOOTER -->
        <div class="mt-8 pt-4 border-t-4 border-indigo-600 text-center">
            <p class="text-[10px] text-gray-400 font-mono">[${version}]</p>
        </div>
        <div class="mt-2 w-full flex justify-between items-center text-[10px] font-bold font-mono">
             <div>FABM 1</div>
             <div>4Cs: Christ-centeredness, Competence, Character, Compassion</div>
             <div>Page 1 of 1</div>
        </div>
    </div>
    `;
}
