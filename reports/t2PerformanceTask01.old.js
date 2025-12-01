/**
 * T2 Performance Task 01 Report Renderer
 * Extracts print preview logic, styles, and layout from the original HTML.
 */

export function renderSpecificReport(data, collectionName) {
    const { studentInfo, scores, ledgersStructure, userInputs, journalEntries, pctb, explanations } = data;

    // Helper to safely get user input value by ID
    const getValue = (id) => (userInputs && userInputs[id] !== undefined) ? userInputs[id] : '';
    
    // Helper to check PR boxes (Journal)
    const getPRClass = (id) => {
        // We only show if checked. In a report, we assume checking marks "completed" or "valid" state visually.
        // If the original app stored validation state, we'd use it. Here we use the boolean saved.
        return (userInputs && userInputs[id] === true) ? "pr-checked" : "";
    };

    // Helper for Ledger Dropdown
    const getBalTypeSelected = (id, type) => {
        return getValue(id) === type ? 'selected' : '';
    };

    const formatNumber = (n) => n ? Number(n).toLocaleString('en-US') : '';
    const formatMoney = (n) => 'P' + Number(n).toLocaleString('en-US');

    // --- HTML GENERATION HELPERS ---

    const createLedgerHTML = (ledgerObj) => {
        const id = ledgerObj.id;
        const name = getValue(`l_${id}_name`); 
        const rowCount = ledgerObj.rowCount || 4;

        let drRows = "", crRows = "";

        // Year Row
        drRows += `<div class="grid grid-cols-12 border-b border-gray-100 bg-gray-50 h-8 items-center"><div class="col-span-3 border-r px-1"><input type="number" disabled value="${getValue(`l_${id}_dr_year`)}" class="w-full text-center bg-transparent text-xs font-bold outline-none table-input-report"></div><div class="col-span-9"></div></div>`;
        crRows += `<div class="grid grid-cols-12 border-b border-gray-100 bg-gray-50 h-8 items-center"><div class="col-span-3 border-r px-1"><input type="number" disabled value="${getValue(`l_${id}_cr_year`)}" class="w-full text-center bg-transparent text-xs font-bold outline-none table-input-report"></div><div class="col-span-9"></div></div>`;

        for(let i=0; i<rowCount; i++) { 
            drRows += `<div class="grid grid-cols-12 border-b border-gray-100 text-sm">
                <div class="col-span-3 border-r p-0"><input disabled value="${getValue(`l_${id}_dr_d_${i}`)}" class="w-full h-full p-1 text-right outline-none table-input-report"></div>
                <div class="col-span-5 border-r p-0"><input disabled value="${getValue(`l_${id}_dr_p_${i}`)}" class="w-full h-full p-1 outline-none table-input-report"></div>
                <div class="col-span-1 border-r p-0"><input disabled value="${getValue(`l_${id}_dr_pr_${i}`)}" class="w-full h-full p-1 text-center outline-none table-input-report"></div>
                <div class="col-span-3 p-0"><input type="number" disabled value="${getValue(`l_${id}_dr_a_${i}`)}" class="w-full h-full p-1 text-right outline-none table-input-report"></div>
            </div>`;
            crRows += `<div class="grid grid-cols-12 border-b border-gray-100 text-sm">
                <div class="col-span-3 border-r p-0"><input disabled value="${getValue(`l_${id}_cr_d_${i}`)}" class="w-full h-full p-1 text-right outline-none table-input-report"></div>
                <div class="col-span-5 border-r p-0"><input disabled value="${getValue(`l_${id}_cr_p_${i}`)}" class="w-full h-full p-1 outline-none table-input-report"></div>
                <div class="col-span-1 border-r p-0"><input disabled value="${getValue(`l_${id}_cr_pr_${i}`)}" class="w-full h-full p-1 text-center outline-none table-input-report"></div>
                <div class="col-span-3 p-0"><input type="number" disabled value="${getValue(`l_${id}_cr_a_${i}`)}" class="w-full h-full p-1 text-right outline-none table-input-report"></div>
            </div>`;
        }

        return `
        <div class="ledger-form break-inside-avoid mb-6">
            <div class="ledger-header relative flex justify-between items-center bg-blue-50 p-2 border-b border-blue-100">
                <div class="flex flex-col items-center w-full">
                    <div class="text-[10px] font-bold text-blue-500 tracking-widest mb-1 uppercase">Account Title</div>
                    <input type="text" disabled value="${name}" class="ledger-title-input shadow-sm outline-none text-center font-bold w-1/2 bg-white border border-blue-200 rounded p-1">
                </div>
            </div>
            <div class="grid grid-cols-2 divide-x divide-gray-200 border border-gray-200">
                <div>
                    <div class="grid grid-cols-12 ledger-col-header text-center border-b bg-gray-50 text-xs font-bold text-gray-500 py-1"><div class="col-span-3">Date</div><div class="col-span-5">Part</div><div class="col-span-1">PR</div><div class="col-span-3">Amount</div></div>
                    ${drRows}
                    <div class="grid grid-cols-12 border-t-2 border-gray-300 py-1 bg-gray-50"><div class="col-span-9 text-right text-xs font-bold pr-2 self-center text-gray-500">TOTAL</div><div class="col-span-3 px-1"><input disabled value="${getValue(`l_${id}_total_dr`)}" class="w-full bg-white border-b border-gray-400 text-right text-sm font-bold p-1 table-input-report"></div></div>
                </div>
                <div>
                    <div class="grid grid-cols-12 ledger-col-header text-center border-b bg-gray-50 text-xs font-bold text-gray-500 py-1"><div class="col-span-3">Date</div><div class="col-span-5">Part</div><div class="col-span-1">PR</div><div class="col-span-3">Amount</div></div>
                    ${crRows}
                    <div class="grid grid-cols-12 border-t-2 border-gray-300 py-1 bg-gray-50"><div class="col-span-9 text-right text-xs font-bold pr-2 self-center text-gray-500">TOTAL</div><div class="col-span-3 px-1"><input disabled value="${getValue(`l_${id}_total_cr`)}" class="w-full bg-white border-b border-gray-400 text-right text-sm font-bold p-1 table-input-report"></div></div>
                </div>
            </div>
            <div class="bg-gray-50 border border-t-0 border-gray-200 p-2">
                <div class="flex flex-col items-center justify-center">
                    <span class="text-[10px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Balance</span>
                    <div class="flex space-x-2">
                        <select disabled class="border border-gray-300 rounded text-sm px-2 py-1 bg-white">
                            <option value="">-</option>
                            <option value="dr" ${getBalTypeSelected(`l_${id}_bal_type`, 'dr')}>Debit</option>
                            <option value="cr" ${getBalTypeSelected(`l_${id}_bal_type`, 'cr')}>Credit</option>
                        </select>
                        <input disabled value="${getValue(`l_${id}_bal`)}" class="border border-gray-300 rounded text-sm px-2 py-1 w-40 text-right font-bold bg-white">
                    </div>
                </div>
            </div>
        </div>`;
    };

    // --- TRIAL BALANCE RECONSTRUCTION ---
    // We need to reconstruct the rows. The original app used 'state.requiredAccounts'.
    // Since we don't have that state directly, we infer it from user inputs (keys like 'tb_name_0', 'tb_name_1').
    // We scan keys starting with 'tb_name_' to find the count.
    
    let tbRowsHTML = '';
    const tbInputKeys = Object.keys(userInputs).filter(k => k.startsWith('tb_name_'));
    // Sort by index
    tbInputKeys.sort((a,b) => {
        const idxA = parseInt(a.split('_')[2]);
        const idxB = parseInt(b.split('_')[2]);
        return idxA - idxB;
    });

    tbInputKeys.forEach(key => {
        const i = key.split('_')[2]; // Extract index
        const name = getValue(`tb_name_${i}`);
        const dr = getValue(`tb_dr_${i}`);
        const cr = getValue(`tb_cr_${i}`);

        tbRowsHTML += `
        <tr class="border-b border-gray-200">
            <td class="p-1 border-r bg-white"><input disabled value="${name}" class="text-input w-full bg-transparent text-sm font-medium"></td>
            <td class="p-1 border-r bg-white"><input disabled value="${dr}" class="table-input-report w-full bg-transparent text-right text-sm"></td>
            <td class="p-1 border-r bg-white"><input disabled value="${cr}" class="table-input-report w-full bg-transparent text-right text-sm"></td>
        </tr>`;
    });

    // --- MAIN TEMPLATE ---
    return `
    <style>
        /* INJECTED STYLES FROM ORIGINAL HTML */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .report-wrapper { font-family: 'Inter', sans-serif; color: black; }
        
        /* Custom Report Inputs */
        .table-input-report { 
            border: none; border-bottom: 1px solid #eee; background: transparent; color: black; 
        }
        .text-input { border: none; background: transparent; color: black; }

        /* Validation Icons (Recreated for report view context if needed) */
        .input-error-x {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23dc2626'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'/%3E%3C/svg%3E");
            background-repeat: no-repeat; background-position: right 4px center; background-size: 14px;
        }
        .input-success-check {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2316a34a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M5 13l4 4L19 7'/%3E%3C/svg%3E");
            background-repeat: no-repeat; background-position: right 4px center; background-size: 14px;
        }

        /* Journal/Ledger Specifics */
        .journal-row td { vertical-align: top; padding: 4px; border-bottom: 1px solid #f1f5f9; }
        .journal-line { height: 24px; display: flex; align-items: center; }
        .pr-box { 
            height: 16px; width: 16px; border: 1px solid #cbd5e1; 
            display: inline-flex; align-items: center; justify-content: center; 
            font-size: 10px; margin: 0 auto;
        }
        .pr-checked { color: #16a34a; font-weight: bold; border-color: #16a34a; background-color: #dcfce7; }
        .pr-checked::after { content: '✓'; }
        
        /* PCTB Tags */
        .pctb-tag {
            font-size: 0.75rem; border: 1px solid #e2e8f0; background-color: white;
            padding: 4px 8px; border-radius: 4px; display: inline-flex; gap: 4px;
            box-shadow: 0 1px 1px rgba(0,0,0,0.05); white-space: nowrap; margin-right: 4px; margin-bottom: 4px;
        }
        
        /* Print Adjustments */
        @media print {
            .page-break { page-break-before: always; }
        }
    </style>

    <div class="report-wrapper p-4 max-w-7xl mx-auto">
        
        <!-- PRINT HEADER -->
        <div class="mb-8">
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
                    <div>CN: <span>${studentInfo.classNumber || studentInfo.cn}</span></div>
                    <div>Name: <span>${studentInfo.fullName}</span></div>
                </div>
                <div class="text-right">
                    <div>Section: <span>${studentInfo.gradeSection || studentInfo.section}</span></div>
                    <div>Date: <span>${new Date().toLocaleDateString()}</span></div>
                </div>
            </div>
        </div>

        <!-- SCORE SUMMARY -->
        <div class="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border border-gray-300 rounded p-4 bg-gray-50">
                <h4 class="font-bold text-lg text-indigo-900 border-b border-gray-300 mb-2">Task 1: General Ledger</h4>
                <div class="grid grid-cols-3 gap-2 text-center text-sm">
                    <div class="bg-white p-2 rounded border">
                        <div class="text-xs text-gray-500 uppercase">Setup (A)</div>
                        <div class="font-bold text-lg">${scores.t1a.current}/${scores.t1a.max}</div>
                        <div class="text-xs font-bold ${scores.t1a.grade === 'A' ? 'text-green-600' : 'text-gray-600'}">${scores.t1a.grade}</div>
                    </div>
                    <div class="bg-white p-2 rounded border">
                        <div class="text-xs text-gray-500 uppercase">Beg Bal (B)</div>
                        <div class="font-bold text-lg">${scores.t1b.current}/${scores.t1b.max}</div>
                        <div class="text-xs font-bold ${scores.t1b.grade === 'A' ? 'text-green-600' : 'text-gray-600'}">${scores.t1b.grade}</div>
                    </div>
                    <div class="bg-white p-2 rounded border">
                        <div class="text-xs text-gray-500 uppercase">Posting (C)</div>
                        <div class="font-bold text-lg">${scores.t1c.current}/${scores.t1c.max}</div>
                        <div class="text-xs font-bold ${scores.t1c.grade === 'A' ? 'text-green-600' : 'text-gray-600'}">${scores.t1c.grade}</div>
                    </div>
                </div>
            </div>
            <div class="border border-gray-300 rounded p-4 bg-gray-50">
                <h4 class="font-bold text-lg text-indigo-900 border-b border-gray-300 mb-2">Task 2: Trial Balance</h4>
                <div class="text-center bg-white p-2 rounded border">
                    <div class="text-xs text-gray-500 uppercase">Total Score</div>
                    <div class="font-bold text-2xl">${scores.t2.current}/${scores.t2.max}</div>
                    <div class="text-sm font-bold ${scores.t2.grade === 'A' ? 'text-green-600' : 'text-red-600'}">Grade: ${scores.t2.grade}</div>
                </div>
            </div>
        </div>

        <!-- EXPLANATIONS / ERRORS -->
        ${explanations && explanations.length > 0 ? `
        <div class="mb-8 p-4 border border-red-200 bg-red-50 rounded">
            <h4 class="font-bold text-red-700 text-sm mb-2 uppercase">Summary of Errors & Explanations:</h4>
            <ul class="list-disc pl-4 space-y-1 text-xs text-red-800">
                ${explanations.map(e => `<li>${e}</li>`).join('')}
            </ul>
        </div>` : `
        <div class="mb-8 p-4 border border-green-200 bg-green-50 rounded text-center text-green-800 font-bold">
            Perfect Score! No errors found.
        </div>`}

        <div class="border-t-2 border-dashed border-gray-300 my-6"></div>

        <!-- TASK 1 CONTENT (Journal & Ledgers) -->
        <h3 class="text-xl font-bold text-gray-800 mb-4 uppercase bg-gray-100 p-2">Detailed Response: Task 1</h3>
        
        <div class="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <!-- Journal -->
            <div class="lg:col-span-4">
                <div class="font-bold text-indigo-900 mb-2">General Journal</div>
                <div class="border border-gray-300 rounded overflow-hidden">
                    <table class="w-full text-xs">
                        <thead class="bg-gray-100 font-bold text-gray-600 border-b">
                            <tr>
                                <th class="p-2 text-right">Date</th>
                                <th class="p-2 text-left">Particulars</th>
                                <th class="p-2 text-center">PR</th>
                                <th class="p-2 text-right">Debit</th>
                                <th class="p-2 text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <!-- Year -->
                            <tr><td class="p-1 text-center font-bold bg-gray-50">${new Date().getFullYear()}</td><td colspan="4"></td></tr>
                            ${journalEntries.map((e, idx) => `
                            <tr>
                                <td class="p-1 text-right align-top text-gray-500">${idx===0 ? e.month : ''} <br> ${e.day}</td>
                                <td class="p-1 align-top font-medium">${e.titles[0]}</td>
                                <td class="p-1 text-center align-top"><div class="pr-box ${getPRClass(`j_${e.id}_0`)}"></div></td>
                                <td class="p-1 text-right align-top">${formatNumber(e.drs[0])}</td>
                                <td class="p-1"></td>
                            </tr>
                            <tr>
                                <td class="p-1"></td>
                                <td class="p-1 align-top pl-4">${e.titles[1]}</td>
                                <td class="p-1 text-center align-top"><div class="pr-box ${getPRClass(`j_${e.id}_1`)}"></div></td>
                                <td class="p-1"></td>
                                <td class="p-1 text-right align-top">${formatNumber(e.crs[1])}</td>
                            </tr>
                            <tr>
                                <td></td>
                                <td colspan="4" class="p-1 text-[10px] italic text-gray-400 pb-2">${e.desc}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Ledgers -->
            <div class="lg:col-span-6">
                <div class="font-bold text-indigo-900 mb-2 flex justify-between items-center">
                    <span>General Ledgers</span>
                    <span class="text-xs font-normal text-gray-500">Based on User Input</span>
                </div>
                
                <!-- Beg Bal Tags -->
                <div class="flex flex-wrap mb-4 bg-gray-50 p-2 rounded border">
                    <span class="text-xs font-bold mr-2 self-center">PCTB:</span>
                    ${pctb.map(a => `
                        <div class="pctb-tag">
                            <span class="font-bold text-gray-800">${a.name}</span>
                            <span class="text-gray-500">Beg: ${formatMoney(a.bal)} ${a.side}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Ledger Forms -->
                <div>
                    ${ledgersStructure.map(l => createLedgerHTML(l)).join('')}
                </div>
            </div>
        </div>

        <div class="page-break"></div>
        <div class="border-t-2 border-dashed border-gray-300 my-6"></div>

        <!-- TASK 2 CONTENT (Trial Balance) -->
        <h3 class="text-xl font-bold text-gray-800 mb-4 uppercase bg-gray-100 p-2">Detailed Response: Task 2</h3>
        
        <div class="max-w-4xl mx-auto border border-gray-300 shadow-lg p-8 bg-white">
            <div class="text-center font-bold mb-6 text-gray-800">
                <div class="text-2xl uppercase tracking-wide pb-1">${studentInfo.fullName.split(',')[0].trim()} Accounting</div>
                <div class="text-xl text-indigo-700 mt-1">Trial Balance</div>
                <div class="text-md text-gray-500 mt-1 font-medium">December 31, ${new Date().getFullYear()}</div>
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
                    ${tbRowsHTML}
                    <tr class="font-bold bg-indigo-50 border-t-2 border-indigo-300">
                        <td class="text-right p-3 text-indigo-900 uppercase tracking-widest text-xs">Total:</td>
                        <td class="p-2 border border-indigo-200 text-right font-bold text-indigo-700">${getValue('tb_total_dr') ? formatNumber(getValue('tb_total_dr')) : ''}</td>
                        <td class="p-2 border border-indigo-200 text-right font-bold text-indigo-700">${getValue('tb_total_cr') ? formatNumber(getValue('tb_total_cr')) : ''}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- PRINT FOOTER -->
        <div class="mt-8 w-full flex justify-between items-center border-t-2 border-black pt-2 text-xs font-bold font-mono print:flex hidden">
             <div>FABM 1</div>
             <div class="border border-black px-4 py-1 uppercase">4Cs: Christ-centeredness, Competence, Character, Compassion</div>
             <div>Page 1 of 1</div>
        </div>
    </div>
    `;
}
