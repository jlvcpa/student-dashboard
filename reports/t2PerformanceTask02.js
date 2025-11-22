/**
 * REPORT MODULE: T2 Performance Task 02
 * Handles all rendering, calculations, and HTML generation for the T2 Accounting Report.
 */
import { formatPHP, getFamilyName, getAccountId, getValidationIcon, renderFSInput, renderRubricHTML } from './sharedHelpers.js';

// ==========================================
// 1. MAIN RENDER FUNCTION (Exported)
// ==========================================

export function renderSpecificReport(data) {
    const info = data.studentInfo || {};
    const keyData = calculateWorksheetAnswersForReport(data);
    
    const now = data.timestamp ? new Date(data.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A";
    
    return `
        <header class="text-center mb-4 pb-4 border-b-4 border-indigo-600 p-4 print:bg-white print:text-black print:border-none">
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
            <strong>Note:</strong> This report shows your submitted answers versus the correct key generated for your specific dataset.
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

        <!-- Footer -->
        <div class="mt-8 pt-4 border-t border-gray-400">
            <div class="flex justify-between font-bold mb-1 text-black text-sm">
                <span class="text-left">FABM 1</span>
                <span class="text-right">Page 1 of 1</span> 
            </div>
            <div class="border border-black p-1 text-center text-xs text-black mx-auto w-2/3">
                <p class="font-bold m-0">4Cs: Christ-centeredness, Competence, Character, Compassion</p>
            </div>
        </div>
        
        <div class="text-center font-bold text-xl py-6 border-t-2 border-dashed border-gray-400 mt-8">*** END OF REPORT ***</div>
    `;
}

// ==========================================
// 2. ACCOUNTING LOGIC (Internal)
// ==========================================
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


// ==========================================
// 3. HTML PARTIAL GENERATORS (Internal)
// ==========================================

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

const getISHTML = (data, key) => {
    const inputs = data.fsInputs || { is: {} };
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
        const inputs = data.fsInputs || { sce: {} };
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
        const inputs = data.fsInputs || { bs: {} };
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
