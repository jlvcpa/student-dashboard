/**
 * T2 Performance Task 01 Report Renderer
 * Replicates the exact layout, print styles, and logic of the source HTML.
 * Includes re-validation to display correct/incorrect marks (green checks/red crosses).
 */

export function renderSpecificReport(data, collectionName) {
    const { studentInfo, scores, ledgersStructure, userInputs, journalEntries, pctb, explanations } = data;
    // Current time for version string
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    // Format: YYYY-MM-DD HH:mm:ss
    const isoString = now.toISOString().replace('T', ' ').substring(0, 19);
    const version = `Version ${isoString} PST (Report Generated)`;

    // --- 1. RE-VALIDATION LOGIC TO GENERATE CLASS MAP ---
    const valMap = {}; // Stores 'input-success-check' or 'input-error-x' for each input ID
    const prMap = {};  // Stores 'pr-valid', 'pr-error', 'pr-checked' for PR boxes

    // Helper to get input value safely
    const getVal = (id) => (userInputs && userInputs[id] !== undefined) ? userInputs[id] : '';
    const getNum = (id) => {
        const v = getVal(id);
        return v === '' ? 0 : Number(v);
    };

    // Helper for Select Elements
    const getSelected = (id, val) => getVal(id) === val ? 'selected' : '';

    // --- RECONSTRUCT ANSWER DATA ---
    const requiredAccounts = [...new Set([...pctb.map(x=>x.name), ...journalEntries.flatMap(x=>x.titles)])].sort();
    
    // Account Totals & Transactions
    const accountTotals = {}; 
    requiredAccounts.forEach(a => accountTotals[a] = { dr:0, cr:0, begDr:0, begCr:0, hasBegDr:false, hasBegCr:false });
    const accountTransactions = {};
    requiredAccounts.forEach(a => accountTransactions[a] = []);
    const journalLinePostedStatus = {};

    // Map Beg Bals
    pctb.forEach(a => {
        if(accountTotals[a.name]) {
            if(a.side === 'Dr') { accountTotals[a.name].begDr = a.bal; accountTotals[a.name].hasBegDr = true; }
            else { accountTotals[a.name].begCr = a.bal; accountTotals[a.name].hasBegCr = true; }
        }
    });

    // Map Journal Entries
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

    // --- VALIDATE TASK 1 (LEDGERS) ---
    const currentYear = new Date().getFullYear();
    const transMonth = journalEntries.length > 0 ? journalEntries[0].month : "Jan";
    const expectedBegDate1 = `${transMonth} 01`;
    const expectedBegDate2 = `${transMonth} 1`;

    if (ledgersStructure) {
        ledgersStructure.forEach(l => {
            const id = l.id;
            const nameVal = getVal(`l_${id}_name`).trim();
            const accName = requiredAccounts.find(r => r.toLowerCase() === nameVal.toLowerCase());

            // Helper to set validation
            const setVal = (elmId, isValid) => {
                if(isValid) valMap[elmId] = 'input-success-check';
                else valMap[elmId] = 'input-error-x';
            };

            // Subtask B: Beg Bal Check (Row 0)
            const side = accName && pctb.find(p => p.name === accName) ? pctb.find(p => p.name === accName).side.toLowerCase() : (getVal(`l_${id}_dr_a_0`) ? 'dr' : 'cr'); // Guess side if name unknown
            
            // Check Year
            const yearVal = getNum(`l_${id}_${side}_year`);
            if(yearVal === currentYear) setVal(`l_${id}_${side}_year`, true);
            else if (getVal(`l_${id}_${side}_year`)) setVal(`l_${id}_${side}_year`, false);

            // Check Row 0 (Beg Bal)
            const d0 = getVal(`l_${id}_${side}_d_0`);
            const p0 = getVal(`l_${id}_${side}_p_0`);
            const pr0 = getVal(`l_${id}_${side}_pr_0`);
            const a0 = getNum(`l_${id}_${side}_a_0`);
            
            if (accName) {
                // Known account, validate strictly
                const pctbEntry = pctb.find(p => p.name === accName);
                if (pctbEntry && pctbEntry.side.toLowerCase() === side) {
                    if (d0 === expectedBegDate1 || d0 === expectedBegDate2) setVal(`l_${id}_${side}_d_0`, true); else if(d0) setVal(`l_${id}_${side}_d_0`, false);
                    if (p0.toUpperCase() === 'BB') setVal(`l_${id}_${side}_p_0`, true); else if(p0) setVal(`l_${id}_${side}_p_0`, false);
                    if (pr0 === '') setVal(`l_${id}_${side}_pr_0`, true); else if(pr0) setVal(`l_${id}_${side}_pr_0`, false);
                    if (Math.abs(a0 - pctbEntry.bal) < 1) setVal(`l_${id}_${side}_a_0`, true); else if(a0) setVal(`l_${id}_${side}_a_0`, false);
                }
            }

            // Subtask C: Transactions & Totals
            if (accName) {
                const expected = accountTotals[accName];
                const expectedTransList = accountTransactions[accName];

                // Totals
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

                // Rows
                const begBalSide = expected.hasBegDr ? 'dr' : (expected.hasBegCr ? 'cr' : 'none');
                const rowCount = l.rowCount || 4;

                for(let r=0; r < rowCount; r++) {
                    ['dr', 'cr'].forEach(s => {
                        if (begBalSide === s && r === 0) return; // Skip BB row
                        
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
                                const validFormats = [
                                    matchedTrans.day, parseInt(matchedTrans.day).toString(),
                                    `${matchedTrans.month} ${matchedTrans.day}`, `${matchedTrans.month} ${parseInt(matchedTrans.day)}`
                                ];
                                if(validFormats.includes(dVal)) setVal(`l_${id}_${s}_d_${r}`, true); else setVal(`l_${id}_${s}_d_${r}`, false);

                            } else {
                                // Wrong amount or extra entry
                                setVal(`l_${id}_${s}_a_${r}`, false);
                                if(getVal(`l_${id}_${s}_p_${r}`)) setVal(`l_${id}_${s}_p_${r}`, false);
                                if(getVal(`l_${id}_${s}_pr_${r}`)) setVal(`l_${id}_${s}_pr_${r}`, false);
                                if(getVal(`l_${id}_${s}_d_${r}`)) setVal(`l_${id}_${s}_d_${r}`, false);
                            }
                        }
                    });
                }
            } else if (nameVal) {
                setVal(`l_${id}_name`, false); // Incorrect name
            }
        });
    }

    // --- VALIDATE PR BOXES ---
    journalEntries.forEach(e => {
        ['0', '1'].forEach(sideIdx => {
            const key = `j_${e.id}_${sideIdx}`;
            const isChecked = userInputs[key] === true;
            const isPosted = journalLinePostedStatus[key];
            
            if (isChecked) {
                if (isPosted) prMap[key] = 'pr-valid pr-checked';
                else prMap[key] = 'pr-error pr-checked';
            } else {
                if (isPosted) prMap[key] = 'pr-error'; // Should have been checked
            }
        });
    });

    // --- VALIDATE TASK 2 (TRIAL BALANCE) ---
    const accountFinalBalances = {};
    requiredAccounts.forEach(acc => accountFinalBalances[acc] = 0);
    // Calc true balances
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
    
    // Totals
    let expectedTotalDr = 0;
    Object.values(accountFinalBalances).forEach(val => { if(val > 0) expectedTotalDr += val; });
    const expectedTotalCr = expectedTotalDr;

    const inTotalDr = getNum('tb_total_dr');
    const inTotalCr = getNum('tb_total_cr');

    if(Math.abs(inTotalDr - expectedTotalDr) < 2 && inTotalDr > 0) valMap['tb_total_dr'] = 'input-success-check'; else valMap['tb_total_dr'] = 'input-error-x';
    if(Math.abs(inTotalCr - expectedTotalCr) < 2 && inTotalCr > 0) valMap['tb_total_cr'] = 'input-success-check'; else valMap['tb_total_cr'] = 'input-error-x';

    // Rows
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


    // --- 2. HTML GENERATORS (Using valMap) ---
    const getClass = (id, baseClass) => {
        const validationClass = valMap[id] || '';
        return `${baseClass} ${validationClass}`;
    };

    const formatNumber = (n) => n ? Number(n).toLocaleString('en-US') : '';
    const formatMoney = (n) => 'P' + Number(n).toLocaleString('en-US');

    // --- CSS ---
    const styles = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        /* Adjusted body padding for full width on larger screens */
        .report-body { 
            font-family: 'Inter', sans-serif; 
            background-color: white; 
            padding: 0;
            color: black;
        }
        
        /* Ensure main container takes full width */
        .report-app {
            width: 100%;
            min-height: 100vh;
        }

        /* HIDE SPINNERS */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }

        /* Custom Input Styles */
        .table-input {
            width: 100%; padding: 4px; border: 1px solid #e2e8f0; border-radius: 2px;
            text-align: right; font-size: 0.8rem; background-color: #fff;
            color: black;
        }
        .text-input {
            width: 100%; padding: 4px; border: 1px solid #e2e8f0; border-radius: 2px;
            font-size: 0.8rem; background-color: #fff;
            color: black;
        }
        
        /* Disabled styles to show black text */
        input:disabled, select:disabled, textarea:disabled, .table-input:disabled, .text-input:disabled { 
            background-color: #ffffff; 
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            border-color: #e2e8f0;
            opacity: 1 !important;
            cursor: default;
        }
        
        /* Error Feedback Style */
        .input-error-x, .input-error-x:disabled {
            border-color: #dc2626 !important;
            background-color: #fef2f2 !important;
            box-shadow: 0 0 0 1px #ef4444 !important;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23dc2626'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 4px center;
            background-size: 14px;
            padding-right: 22px !important;
        }

        /* Success Feedback Style */
        .input-success-check, .input-success-check:disabled {
            border-color: #16a34a !important;
            background-color: #f0fdf4 !important;
            box-shadow: 0 0 0 1px #22c55e !important;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2316a34a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M5 13l4 4L19 7'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 4px center;
            background-size: 14px;
            padding-right: 22px !important;
        }
        
        /* HEADER & FOOTER COLORS */
        .header-bg { background-color: #0f172a; color: white; }
        .footer-bg { background-color: #334155; color: white; }
        
        /* Journal & Ledger Specifics */
        .journal-row td { vertical-align: top; padding: 4px 4px; border-bottom: 1px solid #f1f5f9; }
        .journal-row:last-child td { border-bottom: none; }
        
        .journal-line { height: 24px; display: flex; align-items: center; }
        
        .pr-box { 
            height: 16px; width: 16px; border: 1px solid #cbd5e1; 
            display: inline-flex; align-items: center; justify-content: center; background: white; user-select: none;
            border-radius: 2px; font-size: 10px; margin: 0 auto;
        }
        .pr-checked { color: #16a34a; font-weight: bold; border-color: #16a34a; background-color: #dcfce7; }
        .pr-checked::after { content: '✓'; }
        .pr-error { color: #dc2626; font-weight: bold; border-color: #dc2626; background-color: #fef2f2; }
        .pr-valid { background-color: #dcfce7; border-color: #16a34a; color: #16a34a; }
        .pr-valid::after { content: '✓'; }
        
        /* Layout & Scroll */
        .split-panel { height: auto; overflow: visible; } 
        
        /* Sticky Logic - Static for Report */
        .sticky-section-header {
            position: static;
            background-color: rgba(255, 255, 255, 0.98);
            padding: 12px 20px;
            border-bottom: 1px solid #e2e8f0;
            border-top: 1px solid #f1f5f9;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            margin-bottom: 1rem;
            display: flex; justify-content: space-between; align-items: center;
        }

        /* Ledger Form Styling */
        .ledger-form {
            background: white; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 1.5rem;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            break-inside: avoid;
        }
        .ledger-header {
            background-color: #eff6ff; padding: 15px; text-align: center; border-bottom: 1px solid #dbeafe;
            position: relative;
        }
        .ledger-title-input {
            background: white; border: 1px solid #bfdbfe; padding: 5px 10px;
            font-weight: 600; font-size: 1rem; text-align: center; width: 60%;
            border-radius: 4px; color: black;
        }
        .ledger-col-header {
            font-size: 0.7rem; font-weight: 700; color: #475569; text-transform: uppercase;
            background-color: #f8fafc; padding: 6px 4px; border-bottom: 1px solid #e2e8f0;
        }

        /* PCTB Tags */
        .pctb-tag {
            font-size: 0.75rem; border: 1px solid #e2e8f0; background-color: white;
            padding: 4px 8px; border-radius: 4px; display: inline-flex; gap: 4px;
            box-shadow: 0 1px 1px rgba(0,0,0,0.05); white-space: nowrap; margin-right: 4px; margin-bottom: 4px;
        }

        /* Print Styles */
        @media print {
            @page { margin: 0.25in; size: auto; }
            body { background-color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .printable-area { 
                border: none !important; box-shadow: none !important; 
                width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; 
            }
            .split-panel, .scroll-panel { 
                height: auto !important; overflow: visible !important; display: block !important; 
                max-height: none !important;
            }
            .sticky-section-header { 
                position: static !important; border: none !important; box-shadow: none !important; 
                background: none !important; padding: 10px 0 !important;
            }
            
            .table-input, .text-input { 
                border: none !important; border-bottom: 1px solid #ccc !important; 
                background: transparent !important; padding: 0 !important;
                color: black !important;
                background-image: none !important; /* No validation icons on print */
            }
            #task1-grid { display: block !important; }
            .explanation-box { display: block !important; border: 1px solid #ef4444; padding: 15px; margin-top: 30px; font-size: 0.85rem; page-break-inside: avoid; }
            
            /* Print Header Styling */
            #print-header { display: block !important; margin-bottom: 20px; text-align: center; }
            #screen-header { display: none !important; }
            #screen-footer { display: none !important; }

            /* Print Footer Styling */
            #print-footer { 
                display: flex !important; position: fixed; bottom: 0; left: 0; right: 0; 
                background: white; border-top: 2px solid black; padding-top: 5px; font-size: 10px;
                justify-content: space-between; align-items: center; z-index: 100;
            }
            body { padding-bottom: 40px; }
            
            .page-break { page-break-before: always; }
        }
        
        /* PADDING FOR DESKTOP/WIDE SCREENS */
        @media (min-width: 1280px) {
            .report-app { border: none; box-shadow: none; border-radius: 0; }
            .sticky-section-header { padding-left: 1.5rem; padding-right: 1.5rem; }
            .mx-4 { margin-left: 1.5rem !important; margin-right: 1.5rem !important; }
        }
    </style>
    `;

    const createLedgerHTML = (ledgerObj) => {
        const id = ledgerObj.id;
        const rowCount = ledgerObj.rowCount || 4;
        let drRows = "", crRows = "";
        
        const drYearId = `l_${id}_dr_year`;
        const crYearId = `l_${id}_cr_year`;

        drRows += `<div class="grid grid-cols-12 border-b border-gray-100 bg-gray-50 h-8 items-center"><div class="col-span-3 border-r px-1"><input type="number" disabled value="${getVal(drYearId)}" class="${getClass(drYearId, 'w-full text-center bg-transparent text-xs font-bold outline-none table-input')}"></div><div class="col-span-9"></div></div>`;
        crRows += `<div class="grid grid-cols-12 border-b border-gray-100 bg-gray-50 h-8 items-center"><div class="col-span-3 border-r px-1"><input type="number" disabled value="${getVal(crYearId)}" class="${getClass(crYearId, 'w-full text-center bg-transparent text-xs font-bold outline-none table-input')}"></div><div class="col-span-9"></div></div>`;

        for(let i=0; i<rowCount; i++) { 
            const ph = i === 0 ? "MMM dd" : "dd";
            
            const dDrId = `l_${id}_dr_d_${i}`;
            const pDrId = `l_${id}_dr_p_${i}`;
            const prDrId = `l_${id}_dr_pr_${i}`;
            const aDrId = `l_${id}_dr_a_${i}`;

            const dCrId = `l_${id}_cr_d_${i}`;
            const pCrId = `l_${id}_cr_p_${i}`;
            const prCrId = `l_${id}_cr_pr_${i}`;
            const aCrId = `l_${id}_cr_a_${i}`;

            drRows += `<div class="grid grid-cols-12 border-b border-gray-100 text-sm">
                <div class="col-span-3 border-r p-0"><input disabled value="${getVal(dDrId)}" class="${getClass(dDrId, 'w-full h-full p-1 text-right outline-none table-input')}" placeholder="${ph}"></div>
                <div class="col-span-5 border-r p-0"><input disabled value="${getVal(pDrId)}" class="${getClass(pDrId, 'w-full h-full p-1 outline-none table-input')}"></div>
                <div class="col-span-1 border-r p-0"><input disabled value="${getVal(prDrId)}" class="${getClass(prDrId, 'w-full h-full p-1 text-center outline-none table-input')}"></div>
                <div class="col-span-3 p-0"><input type="number" disabled value="${getVal(aDrId)}" class="${getClass(aDrId, 'w-full h-full p-1 text-right outline-none table-input')}"></div>
            </div>`;
            crRows += `<div class="grid grid-cols-12 border-b border-gray-100 text-sm">
                <div class="col-span-3 border-r p-0"><input disabled value="${getVal(dCrId)}" class="${getClass(dCrId, 'w-full h-full p-1 text-right outline-none table-input')}" placeholder="${ph}"></div>
                <div class="col-span-5 border-r p-0"><input disabled value="${getVal(pCrId)}" class="${getClass(pCrId, 'w-full h-full p-1 outline-none table-input')}"></div>
                <div class="col-span-1 border-r p-0"><input disabled value="${getVal(prCrId)}" class="${getClass(prCrId, 'w-full h-full p-1 text-center outline-none table-input')}"></div>
                <div class="col-span-3 p-0"><input type="number" disabled value="${getVal(aCrId)}" class="${getClass(aCrId, 'w-full h-full p-1 text-right outline-none table-input')}"></div>
            </div>`;
        }

        const nameId = `l_${id}_name`;
        const totalDrId = `l_${id}_total_dr`;
        const totalCrId = `l_${id}_total_cr`;
        const balId = `l_${id}_bal`;
        const balTypeId = `l_${id}_bal_type`;

        return `
        <div class="ledger-form break-inside-avoid">
            <div class="ledger-header relative flex justify-between items-center">
                <div class="w-6"></div> 
                <div class="flex flex-col items-center w-full">
                    <div class="text-[10px] font-bold text-blue-500 tracking-widest mb-1 uppercase">Account Title</div>
                    <input type="text" disabled value="${getVal(nameId)}" class="${getClass(nameId, 'ledger-title-input shadow-sm focus:ring-2 focus:ring-blue-300 outline-none')}">
                </div>
                <div class="w-6"></div>
            </div>
            <div class="grid grid-cols-2 divide-x divide-gray-200">
                <div>
                    <div class="grid grid-cols-12 ledger-col-header text-center border-b"><div class="col-span-3">Date</div><div class="col-span-5">Particulars</div><div class="col-span-1">PR</div><div class="col-span-3">Amount</div></div>
                    ${drRows}
                    <div class="grid grid-cols-12 border-t-2 border-gray-300 py-1 bg-gray-50"><div class="col-span-9 text-right text-xs font-bold pr-2 self-center text-gray-500">TOTAL</div><div class="col-span-3 px-1"><input type="number" disabled value="${getVal(totalDrId)}" class="${getClass(totalDrId, 'w-full bg-white border-b border-gray-400 text-right text-sm font-bold p-1 table-input')}"></div></div>
                </div>
                <div>
                    <div class="grid grid-cols-12 ledger-col-header text-center border-b"><div class="col-span-3">Date</div><div class="col-span-5">Particulars</div><div class="col-span-1">PR</div><div class="col-span-3">Amount</div></div>
                    ${crRows}
                    <div class="grid grid-cols-12 border-t-2 border-gray-300 py-1 bg-gray-50"><div class="col-span-9 text-right text-xs font-bold pr-2 self-center text-gray-500">TOTAL</div><div class="col-span-3 px-1"><input type="number" disabled value="${getVal(totalCrId)}" class="${getClass(totalCrId, 'w-full bg-white border-b border-gray-400 text-right text-sm font-bold p-1 table-input')}"></div></div>
                </div>
            </div>
            <div class="bg-gray-50 border-t border-gray-200 p-3">
                <div class="flex flex-col items-center justify-center">
                    <span class="text-[10px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Balance</span>
                    <div class="flex space-x-2">
                        <select disabled class="${getClass(balTypeId, 'border border-gray-300 rounded text-sm px-2 py-1 bg-white focus:outline-none focus:border-blue-500')}">
                            <option value="">-</option>
                            <option value="dr" ${getSelected(balTypeId, 'dr')}>Debit</option>
                            <option value="cr" ${getSelected(balTypeId, 'cr')}>Credit</option>
                        </select>
                        <input type="number" disabled value="${getVal(balId)}" class="${getClass(balId, 'border border-gray-300 rounded text-sm px-2 py-1 w-40 text-right font-bold focus:outline-none focus:border-blue-500 bg-white')}">
                    </div>
                </div>
            </div>
        </div>`;
    };

    return `
    ${styles}
    <div class="report-body p-4 md:p-8">
        <div class="report-app printable-area bg-white shadow-xl rounded-xl p-0 md:p-0 border border-gray-200 relative pb-20">
            
            <!-- Screen Header -->
            <header id="screen-header" class="text-center pb-4 border-b-4 border-indigo-600 header-bg p-4 rounded-t-xl no-print">
                <img src="./shs-adc-logo.png" alt="School Logo" class="mx-auto mb-2 h-20 w-auto" onerror="this.style.display='none'"/>
                <p class="text-sm mt-1">SY 2025-2026 | 2nd Semester</p>
                <h1 class="text-3xl md:text-4xl font-extrabold text-yellow-300">
                    T2 Performance Task 01
                </h1>
                <h2 id="company-name" class="text-xl md:text-2xl font-semibold text-gray-200 mt-1">${studentInfo.fullName.split(',')[0].trim()} Accounting</h2>
            </header>

            <!-- Print Header (Hidden on Screen) -->
            <div id="print-header" class="hidden">
                <div class="flex flex-col items-center justify-center mb-4">
                    <img src="./shs-adc-logo.png" alt="School Logo" class="h-16 w-auto mb-1" onerror="this.style.display='none'"/>
                    <div class="text-center font-serif text-blue-900 leading-tight">
                        <h3 class="font-bold text-sm uppercase">Sacred Heart School - Ateneo de Cebu</h3>
                        <h2 class="font-bold text-lg text-blue-800">Senior High School Department</h2>
                        <p class="text-sm mt-1">SY 2025-2026 | 2nd Semester</p>
                        <h1 class="text-2xl font-extrabold text-yellow-500 mt-2 uppercase">T2 Performance Task 01 Results</h1>
                    </div>
                </div>
                <!-- Student Info Strip -->
                <div class="border-t-4 border-blue-600 w-full pt-2 flex justify-between items-end font-mono text-sm font-bold text-black mb-6">
                    <div class="text-left">
                        <div>CN: <span id="print-cn">${studentInfo.classNumber || studentInfo.cn}</span></div>
                        <div>Name: <span id="print-name">${studentInfo.fullName}</span></div>
                    </div>
                    <div class="text-right">
                        <div>Section: <span id="print-section">${studentInfo.gradeSection || studentInfo.section}</span></div>
                        <div>Date: <span id="print-date">${dateStr}</span></div>
                    </div>
                </div>
            </div>
            
            <!-- Dynamic Content Area -->
            <div id="task-container" class="pb-4">
                
                <!-- Corrected Main Grid to maintain 60/40 Split (Task 1 / Task 2) -->
                <div class="grid grid-cols-1 lg:grid-cols-10 gap-4 p-4 xl:p-6">
                    <!-- Task 1 Column (6/10 width) -->
                    <div class="lg:col-span-6 min-h-[600px] flex flex-col">
                        <div class="h-full">
                            <div class="sticky-section-header" id="header-task1">
                                <h3 class="text-lg font-bold text-indigo-800 flex items-center gap-2">
                                    <span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm">Task 1</span>
                                    Posting to General Ledger
                                </h3>
                                <div class="flex items-center space-x-2 no-print">
                                    <span class="text-xs text-gray-800 font-bold">Attempts Used</span>
                                    <button class="px-4 py-2 bg-gray-500 text-white font-bold rounded cursor-not-allowed" disabled>Task 1 Completed</button>
                                </div>
                            </div>
                            
                            <div class="mx-4 mb-4" id="task1-instructions-panel">
                                <!-- Instructions (Updated) -->
                                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 text-sm">
                                    <h4 class="font-bold mb-2 text-gray-800">Instruction:</h4>
                                    <ul class="list-disc pl-5 space-y-1 text-gray-700">
                                        <li>Complete all required fields.</li>
                                        <li>Enter amounts without commas and decimal places.</li>
                                        <li>Round off centavos to the nearest peso.</li>
                                        <li>Format Dates carefully: Row 1 (Year):  YYYY. Row 2 (Beg. Bal): MMM dd. Row 3+ (Transactions): dd</li>
                                    </ul>
                                </div>

                                <!-- Rubric -->
                                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-xs">
                                    <div class="bg-indigo-50 p-3 flex justify-between items-center border-b border-indigo-100">
                                        <h4 class="font-bold text-indigo-900 uppercase tracking-wider">TASK 1: POSTING TO THE LEDGER</h4>
                                        <div class="font-mono text-sm text-indigo-900 font-bold">
                                            A = <span>${scores.t1a.current}/${scores.t1a.max || '-'} - ${scores.t1a.grade}</span> / 
                                            B = <span>${scores.t1b.current}/${scores.t1b.max || '-'} - ${scores.t1b.grade}</span> / 
                                            C = <span>${scores.t1c.current}/${scores.t1c.max || '-'} - ${scores.t1c.grade}</span>
                                        </div>
                                    </div>
                                    <div class="p-3 text-center bg-white text-gray-500 italic">Detailed rubric items hidden for print optimization.</div>
                                </div>
                            </div>

                            <!-- Task 1 Internal Grid -->
                            <div id="task1-grid" class="grid grid-cols-1 xl:grid-cols-10 gap-4 split-panel mb-4 relative mx-4">
                                <!-- Journal (4/10 width) -->
                                <div class="xl:col-span-4 bg-white shadow border border-gray-200 rounded-lg h-full overflow-hidden flex flex-col">
                                    <div class="bg-white border-b-2 border-indigo-100 p-3 flex justify-between items-center sticky top-0 z-10">
                                        <span class="font-bold text-indigo-900 text-lg">Source: General Journal</span>
                                        <span class="font-bold text-gray-500 text-sm">Page 1</span>
                                    </div>
                                    <div class="overflow-x-auto flex-1 bg-white">
                                        <table class="table-auto min-w-full text-sm border-collapse">
                                            <thead class="bg-gray-50 sticky top-0 z-10 text-xs uppercase text-gray-500 font-bold">
                                                <tr>
                                                    <th class="p-2 text-right border-b whitespace-nowrap min-w-max">Date</th>
                                                    <th class="p-2 text-left border-b w-full min-w-[200px]">Particulars</th>
                                                    <th class="p-2 text-center border-b min-w-[40px]">PR</th>
                                                    <th class="p-2 text-right border-b min-w-[80px]">Debit</th>
                                                    <th class="p-2 text-right border-b min-w-[80px]">Credit</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-gray-100">
                                                <tr>
                                                    <td class="align-top p-1 text-center font-bold text-gray-500 bg-gray-50 text-xs">${currentYear}</td>
                                                    <td colspan="4" class="bg-gray-50"></td>
                                                </tr>
                                                ${journalEntries.map((e, index) => `
                                                <tr class="hover:bg-blue-50/50 transition-colors group border-b-0">
                                                    <td class="text-xs text-gray-600 text-right pr-2 align-top pt-2 whitespace-nowrap">
                                                        ${index === 0 ? `<div class="text-[10px] font-bold text-gray-500 leading-tight mb-1">${e.month}</div><div>${e.day}</div>` : `<div>${e.day}</div>`}
                                                    </td>
                                                    <td class="align-top text-gray-800 whitespace-nowrap pt-2">${e.titles[0]}</td>
                                                    <td class="align-top text-center pt-2"><div class="pr-box ${prMap[`j_${e.id}_0`] || ''}"></div></td>
                                                    <td class="align-top text-right text-gray-700 whitespace-nowrap pt-2">${formatNumber(e.drs[0])}</td>
                                                    <td class="align-top pt-2"></td>
                                                </tr>
                                                <tr class="hover:bg-blue-50/50 transition-colors group border-b-0">
                                                    <td class="align-top"></td>
                                                    <td class="align-top text-gray-800 pl-8 whitespace-nowrap pt-1">${e.titles[1]}</td>
                                                    <td class="align-top text-center pt-1"><div class="pr-box ${prMap[`j_${e.id}_1`] || ''}"></div></td>
                                                    <td class="align-top pt-1"></td>
                                                    <td class="align-top text-right text-gray-700 whitespace-nowrap pt-1">${formatNumber(e.crs[1])}</td>
                                                </tr>
                                                <tr class="hover:bg-blue-50/50 transition-colors group border-b border-gray-100">
                                                    <td class="align-top"></td>
                                                    <td colspan="4" class="text-xs italic text-gray-400 pl-16 pb-2 pt-1">${e.desc}</td>
                                                </tr>`).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <!-- Ledgers (6/10 width) -->
                                <div class="xl:col-span-6 h-full overflow-hidden flex flex-col bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
                                    <div class="flex-none p-2 bg-white border-b">
                                        <div class="flex justify-between items-center pb-2">
                                            <h4 class="font-bold text-xs uppercase tracking-wide">Beginning Balances</h4>
                                        </div>
                                        <div class="flex flex-wrap gap-2 pt-1">
                                            ${pctb.map(a => `
                                                <div class="pctb-tag hover:border-blue-300 hover:shadow-md transition cursor-default">
                                                    <span class="font-bold text-gray-800">${a.name}</span>
                                                    <span class="text-gray-500">Beg: ${formatMoney(a.bal)} ${a.side}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <div class="flex-none p-2 bg-indigo-50 border-t border-b border-indigo-100 font-bold text-indigo-900 text-sm">General Ledger Forms</div>
                                    <div id="ledger-container" class="scroll-panel p-4 pb-20">
                                        ${ledgersStructure && ledgersStructure.map(l => createLedgerHTML(l)).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Task 2 Column (4/10 width) -->
                    <div class="lg:col-span-4 min-h-[600px] flex flex-col">
                        <div class="h-full">
                            <div class="sticky-section-header" id="header-task2">
                                <h3 class="text-lg font-bold text-indigo-800 flex items-center gap-2">
                                    <span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm">Task 2</span>
                                    Preparing the Trial Balance
                                </h3>
                                <div class="flex items-center space-x-2 no-print">
                                    <span class="text-xs text-gray-800 font-bold">Attempts Used</span>
                                    <button class="px-4 py-2 bg-gray-500 text-white font-bold rounded cursor-not-allowed" disabled>Task 2 Completed</button>
                                </div>
                            </div>

                            <div class="mx-4 mb-4" id="task2-instructions-panel">
                                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 text-sm">
                                    <h4 class="font-bold mb-2 text-gray-800">Task 2 Instruction:</h4>
                                    <ul class="list-disc pl-5 space-y-1 text-gray-700">
                                        <li>Prepare the Trial Balance based on the balances from the General Ledger.</li>
                                    </ul>
                                </div>
                                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-xs">
                                    <div class="bg-indigo-50 p-3 flex justify-between items-center border-b border-indigo-100">
                                        <h4 class="font-bold text-indigo-900 uppercase tracking-wider">TASK 2: PREPARING THE TRIAL BALANCE</h4>
                                        <div class="font-bold text-indigo-900 bg-white px-3 py-1 rounded border border-indigo-200 shadow-sm">
                                            Score: <span>${scores.t2.current}/${scores.t2.max || '-'}</span> <span class="mx-1 text-gray-300">|</span> Grade: <span class="text-red-600">${scores.t2.grade}</span>
                                        </div>
                                    </div>
                                    <div class="p-3 text-center bg-white text-gray-500 italic">Detailed rubric items hidden for print optimization.</div>
                                </div>
                            </div>

                            <div id="task2-wrapper" class="relative">
                                <div class="blur-content">
                                    <div class="p-6 bg-gray-50 rounded shadow-inner border border-gray-200">
                                        <div class="bg-white p-6 border rounded shadow-sm max-w-4xl mx-auto">
                                            <div class="text-center font-bold mb-6 text-gray-800">
                                                <div class="text-2xl uppercase tracking-wide border-b-2 border-transparent inline-block pb-1">${studentInfo.fullName.split(',')[0].trim()} Accounting</div>
                                                <div class="text-xl text-indigo-700 mt-1">Trial Balance</div>
                                                <div class="text-md text-gray-500 mt-1 font-medium">December 31, ${currentYear}</div>
                                            </div>
                                            
                                            <table class="w-full text-sm border-collapse border border-gray-300 shadow-sm">
                                                <thead>
                                                    <tr class="bg-indigo-600 text-white uppercase text-xs tracking-wider">
                                                        <th class="border border-indigo-700 p-3 w-1/2 text-left">Account Titles</th>
                                                        <th class="border border-indigo-700 p-3 w-1/4">Debit</th>
                                                        <th class="border border-indigo-700 p-3 w-1/4">Credit</th>
                                                    </tr>
                                                </thead>
                                                <tbody class="divide-y divide-gray-200">
                                                    ${tbInputKeys.map(key => {
                                                        const i = key.split('_')[2];
                                                        return `
                                                        <tr class="hover:bg-gray-50">
                                                            <td class="p-1 border bg-white"><input disabled value="${getVal(`tb_name_${i}`)}" class="${getClass(`tb_name_${i}`, 'text-input text-left font-medium')}"></td>
                                                            <td class="p-1 border bg-white"><input type="number" disabled value="${getVal(`tb_dr_${i}`)}" class="${getClass(`tb_dr_${i}`, 'table-input')}"></td>
                                                            <td class="p-1 border bg-white"><input type="number" disabled value="${getVal(`tb_cr_${i}`)}" class="${getClass(`tb_cr_${i}`, 'table-input')}"></td>
                                                        </tr>`;
                                                    }).join('')}
                                                    <tr class="font-bold bg-indigo-50 border-t-2 border-indigo-300">
                                                        <td class="text-right p-3 text-indigo-900 uppercase tracking-widest text-xs">Total:</td>
                                                        <td class="p-2 border border-indigo-200"><input type="number" disabled value="${getVal('tb_total_dr')}" class="${getClass('tb_total_dr', 'table-input font-bold text-indigo-700 bg-transparent border-none text-base')}"></td>
                                                        <td class="p-2 border border-indigo-200"><input type="number" disabled value="${getVal('tb_total_cr')}" class="${getClass('tb_total_cr', 'table-input font-bold text-indigo-700 bg-transparent border-none text-base')}"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Explanation / Error Summary Area -->
            <div id="error-summary-area" class="hidden print:block mx-4 mt-6">
                ${explanations && explanations.length > 0 
                    ? `<div class="explanation-box"><h4 class="font-bold text-red-700 text-sm mb-2 uppercase">Summary of Errors & Explanations:</h4><ul class="list-disc pl-4 space-y-1">${explanations.map(e=>`<li>${e}</li>`).join('')}</ul></div>`
                    : `<div class="explanation-box border-green-500 text-green-700 font-bold">Perfect Score! No errors found.</div>`
                }
            </div>

            <!-- Footer -->
            <footer id="screen-footer" class="mt-8 pt-4 border-t-4 border-indigo-600 footer-bg p-4 text-center no-print rounded-b-xl">
                <p class="text-sm text-gray-300">
                    <strong>[${version}]</strong>
                </p>
            </footer>

            <!-- Print Specific Footer -->
            <div id="print-footer" class="hidden w-full px-8">
                <div class="font-bold text-black text-xs w-1/4">FABM 1</div>
                <div class="border border-black px-4 py-1 text-center text-[10px] text-black w-1/2 font-bold uppercase">
                    4Cs: Christ-centeredness, Competence, Character, Compassion
                </div>
                <div class="text-right font-bold text-black text-xs w-1/4">Page 1 of 1</div>
            </div>
        </div>
    </div>
    `;
}
