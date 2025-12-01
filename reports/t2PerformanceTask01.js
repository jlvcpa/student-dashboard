/**
 * T2 Performance Task 01 Report Renderer
 * Replicates the exact layout, print styles, and structure of the source HTML.
 */

export function renderSpecificReport(data, collectionName) {
    const { studentInfo, scores, ledgersStructure, userInputs, journalEntries, pctb, explanations } = data;
    const version = `Version ${new Date().toISOString().replace('T', ' ').substring(0, 19)} PST (Report Generated)`;

    // --- HELPERS ---
    const getValue = (id) => (userInputs && userInputs[id] !== undefined) ? userInputs[id] : '';
    
    // Helper to determine PR box classes based on saved state
    const getPRClass = (id) => {
        const isChecked = userInputs && userInputs[id] === true;
        // In report view, we can just show the checkmark if it was checked.
        // If you want to show validation colors (green/red), we need to know if it was correct.
        // Since we don't have the live validation logic here, we'll mimic the "checked" state.
        return isChecked ? "pr-checked" : "";
    };

    // Helper for Select Elements
    const getSelected = (id, val) => getValue(id) === val ? 'selected' : '';

    const formatNumber = (n) => n ? Number(n).toLocaleString('en-US') : '';
    const formatMoney = (n) => 'P' + Number(n).toLocaleString('en-US');

    // --- 1. CSS & STYLES (Extracted from source HTML) ---
    const styles = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        /* Scoped wrapper to ensure styles apply correctly within the dashboard */
        .report-content-wrapper { 
            font-family: 'Inter', sans-serif; 
            background-color: white;
            color: black;
        }

        /* --- UTILITIES --- */
        .header-bg { background-color: #0f172a; color: white; }
        .footer-bg { background-color: #334155; color: white; }
        
        /* INPUT STYLES (Read-Only for Report) */
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
        /* Remove borders for cleaner print view if desired, or keep to match exact look */
        .table-input:disabled, .text-input:disabled, select:disabled { 
            background-color: #ffffff; 
            color: #000000 !important;
            border-color: #e2e8f0;
            opacity: 1 !important;
            cursor: default;
            -webkit-text-fill-color: #000000;
        }

        /* JOURNAL & LEDGER SPECIFICS */
        .pr-box { 
            height: 16px; width: 16px; border: 1px solid #cbd5e1; 
            display: inline-flex; align-items: center; justify-content: center; background: white;
            border-radius: 2px; font-size: 10px; margin: 0 auto;
        }
        .pr-checked { color: #16a34a; font-weight: bold; border-color: #16a34a; background-color: #dcfce7; }
        .pr-checked::after { content: '✓'; }

        /* LAYOUT & SCROLL */
        .split-panel { height: auto; overflow: visible; } /* Auto height for report view */
        
        /* HEADERS */
        .sticky-section-header {
            background-color: rgba(255, 255, 255, 0.98);
            padding: 12px 20px;
            border-bottom: 1px solid #e2e8f0;
            border-top: 1px solid #f1f5f9;
            margin-bottom: 1rem;
            display: flex; justify-content: space-between; align-items: center;
        }

        /* LEDGER FORM */
        .ledger-form {
            background: white; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 1.5rem;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            break-inside: avoid; /* Prevent print breaking */
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

        /* PCTB TAGS */
        .pctb-tag {
            font-size: 0.75rem; border: 1px solid #e2e8f0; background-color: white;
            padding: 4px 8px; border-radius: 4px; display: inline-flex; gap: 4px;
            box-shadow: 0 1px 1px rgba(0,0,0,0.05); white-space: nowrap; margin-right: 4px; margin-bottom: 4px;
        }

        /* EXPLANATION BOX */
        .explanation-box { border: 1px solid #ef4444; padding: 15px; margin-top: 30px; font-size: 0.85rem; page-break-inside: avoid; }

        /* PRINT MEDIA QUERY (Exact Match) */
        @media print {
            @page { margin: 0.25in; size: auto; }
            body { background-color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            
            /* Hide dashboard elements if they leak */
            nav, aside, .bg-gray-800.text-white.p-2 { display: none !important; }

            .report-content-wrapper { padding: 0 !important; }
            .printable-area { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
            
            .table-input, .text-input { 
                border: none !important; border-bottom: 1px solid #ccc !important; 
                background: transparent !important; padding: 0 !important;
                color: black !important;
            }
            
            /* Force visibility of headers/footers */
            #print-header { display: block !important; margin-bottom: 20px; text-align: center; }
            #screen-header { display: none !important; }
            #screen-footer { display: none !important; }
            
            #print-footer { 
                display: flex !important; position: fixed; bottom: 0; left: 0; right: 0; 
                background: white; border-top: 2px solid black; padding-top: 5px; font-size: 10px;
                justify-content: space-between; align-items: center; z-index: 100;
            }
            /* Add padding to body to prevent content overlap with fixed footer */
            body { padding-bottom: 40px; }
            
            .page-break { page-break-before: always; }
        }
    </style>
    `;

    // --- 2. HTML FRAGMENTS ---

    // Construct Journal Rows
    const journalRows = journalEntries.map((e, index) => {
        let dateHTML = index === 0 
            ? `<div class="text-[10px] font-bold text-gray-500 leading-tight mb-1">${e.month}</div><div>${e.day}</div>`
            : `<div>${e.day}</div>`;
        
        return `
        <!-- Debit Row -->
        <tr class="hover:bg-blue-50/50 transition-colors group border-b-0">
            <td class="text-xs text-gray-600 text-right pr-2 align-top pt-2 whitespace-nowrap">
                ${dateHTML}
            </td>
            <td class="align-top text-gray-800 whitespace-nowrap pt-2">
                ${e.titles[0]}
            </td>
            <td class="align-top text-center pt-2">
                <div class="pr-box ${getPRClass(`j_${e.id}_0`)}"></div>
            </td>
            <td class="align-top text-right text-gray-700 whitespace-nowrap pt-2">
                ${formatNumber(e.drs[0])}
            </td>
            <td class="align-top pt-2"></td>
        </tr>
        <!-- Credit Row -->
        <tr class="hover:bg-blue-50/50 transition-colors group border-b-0">
            <td class="align-top"></td>
            <td class="align-top text-gray-800 pl-8 whitespace-nowrap pt-1">
                ${e.titles[1]}
            </td>
            <td class="align-top text-center pt-1">
                <div class="pr-box ${getPRClass(`j_${e.id}_1`)}"></div>
            </td>
            <td class="align-top pt-1"></td>
            <td class="align-top text-right text-gray-700 whitespace-nowrap pt-1">
                ${formatNumber(e.crs[1])}
            </td>
        </tr>
        <!-- Description Row -->
        <tr class="hover:bg-blue-50/50 transition-colors group border-b border-gray-100">
            <td class="align-top"></td>
            <td colspan="4" class="text-xs italic text-gray-400 pl-16 pb-2 pt-1">
                ${e.desc}
            </td>
        </tr>`;
    }).join('');

    // Construct Ledger Forms
    const ledgerForms = ledgersStructure.map(l => {
        const id = l.id;
        const rowCount = l.rowCount || 4;
        let drRows = "", crRows = "";

        // Year Row
        drRows += `<div class="grid grid-cols-12 border-b border-gray-100 bg-gray-50 h-8 items-center"><div class="col-span-3 border-r px-1"><input type="number" disabled value="${getValue(`l_${id}_dr_year`)}" class="w-full text-center bg-transparent text-xs font-bold outline-none table-input"></div><div class="col-span-9"></div></div>`;
        crRows += `<div class="grid grid-cols-12 border-b border-gray-100 bg-gray-50 h-8 items-center"><div class="col-span-3 border-r px-1"><input type="number" disabled value="${getValue(`l_${id}_cr_year`)}" class="w-full text-center bg-transparent text-xs font-bold outline-none table-input"></div><div class="col-span-9"></div></div>`;

        for(let i=0; i<rowCount; i++) { 
            drRows += `<div class="grid grid-cols-12 border-b border-gray-100 text-sm">
                <div class="col-span-3 border-r p-0"><input disabled value="${getValue(`l_${id}_dr_d_${i}`)}" class="w-full h-full p-1 text-right outline-none table-input"></div>
                <div class="col-span-5 border-r p-0"><input disabled value="${getValue(`l_${id}_dr_p_${i}`)}" class="w-full h-full p-1 outline-none table-input"></div>
                <div class="col-span-1 border-r p-0"><input disabled value="${getValue(`l_${id}_dr_pr_${i}`)}" class="w-full h-full p-1 text-center outline-none table-input"></div>
                <div class="col-span-3 p-0"><input type="number" disabled value="${getValue(`l_${id}_dr_a_${i}`)}" class="w-full h-full p-1 text-right outline-none table-input"></div>
            </div>`;
            crRows += `<div class="grid grid-cols-12 border-b border-gray-100 text-sm">
                <div class="col-span-3 border-r p-0"><input disabled value="${getValue(`l_${id}_cr_d_${i}`)}" class="w-full h-full p-1 text-right outline-none table-input"></div>
                <div class="col-span-5 border-r p-0"><input disabled value="${getValue(`l_${id}_cr_p_${i}`)}" class="w-full h-full p-1 outline-none table-input"></div>
                <div class="col-span-1 border-r p-0"><input disabled value="${getValue(`l_${id}_cr_pr_${i}`)}" class="w-full h-full p-1 text-center outline-none table-input"></div>
                <div class="col-span-3 p-0"><input type="number" disabled value="${getValue(`l_${id}_cr_a_${i}`)}" class="w-full h-full p-1 text-right outline-none table-input"></div>
            </div>`;
        }

        return `
        <div class="ledger-form break-inside-avoid">
            <div class="ledger-header relative flex justify-between items-center">
                <div class="w-6"></div>
                <div class="flex flex-col items-center w-full">
                    <div class="text-[10px] font-bold text-blue-500 tracking-widest mb-1 uppercase">Account Title</div>
                    <input type="text" disabled value="${getValue(`l_${id}_name`)}" class="ledger-title-input shadow-sm outline-none text-center font-bold">
                </div>
                <div class="w-6"></div>
            </div>
            <div class="grid grid-cols-2 divide-x divide-gray-200">
                <div>
                    <div class="grid grid-cols-12 ledger-col-header text-center border-b"><div class="col-span-3">Date</div><div class="col-span-5">Particulars</div><div class="col-span-1">PR</div><div class="col-span-3">Amount</div></div>
                    ${drRows}
                    <div class="grid grid-cols-12 border-t-2 border-gray-300 py-1 bg-gray-50"><div class="col-span-9 text-right text-xs font-bold pr-2 self-center text-gray-500">TOTAL</div><div class="col-span-3 px-1"><input type="number" disabled value="${getValue(`l_${id}_total_dr`)}" class="w-full bg-white border-b border-gray-400 text-right text-sm font-bold p-1 table-input"></div></div>
                </div>
                <div>
                    <div class="grid grid-cols-12 ledger-col-header text-center border-b"><div class="col-span-3">Date</div><div class="col-span-5">Particulars</div><div class="col-span-1">PR</div><div class="col-span-3">Amount</div></div>
                    ${crRows}
                    <div class="grid grid-cols-12 border-t-2 border-gray-300 py-1 bg-gray-50"><div class="col-span-9 text-right text-xs font-bold pr-2 self-center text-gray-500">TOTAL</div><div class="col-span-3 px-1"><input type="number" disabled value="${getValue(`l_${id}_total_cr`)}" class="w-full bg-white border-b border-gray-400 text-right text-sm font-bold p-1 table-input"></div></div>
                </div>
            </div>
            <div class="bg-gray-50 border-t border-gray-200 p-3">
                <div class="flex flex-col items-center justify-center">
                    <span class="text-[10px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Balance</span>
                    <div class="flex space-x-2">
                        <select disabled class="border border-gray-300 rounded text-sm px-2 py-1 bg-white">
                            <option value="">-</option>
                            <option value="dr" ${getSelected(`l_${id}_bal_type`, 'dr')}>Debit</option>
                            <option value="cr" ${getSelected(`l_${id}_bal_type`, 'cr')}>Credit</option>
                        </select>
                        <input type="number" disabled value="${getValue(`l_${id}_bal`)}" class="border border-gray-300 rounded text-sm px-2 py-1 w-40 text-right font-bold bg-white">
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    // Construct Trial Balance Rows
    // We sort inputs by index to ensure order
    const tbInputKeys = Object.keys(userInputs).filter(k => k.startsWith('tb_name_')).sort((a,b) => {
        return parseInt(a.split('_')[2]) - parseInt(b.split('_')[2]);
    });
    
    const tbRows = tbInputKeys.map(key => {
        const i = key.split('_')[2];
        return `
        <tr class="hover:bg-gray-50">
            <td class="p-1 border bg-white"><input disabled value="${getValue(`tb_name_${i}`)}" class="text-input text-left font-medium"></td>
            <td class="p-1 border bg-white"><input type="number" disabled value="${getValue(`tb_dr_${i}`)}" class="table-input"></td>
            <td class="p-1 border bg-white"><input type="number" disabled value="${getValue(`tb_cr_${i}`)}" class="table-input"></td>
        </tr>`;
    }).join('');

    // --- 3. MAIN RENDER ---
    return `
    ${styles}
    <div class="report-content-wrapper p-4 md:p-8">
        
        <!-- Screen Header -->
        <header id="screen-header" class="text-center pb-4 border-b-4 border-indigo-600 header-bg p-4 rounded-t-xl no-print">
            <img src="./shs-adc-logo.png" alt="School Logo" class="mx-auto mb-2 h-20 w-auto" onerror="this.style.display='none'"/>
            <p class="text-sm mt-1">SY 2025-2026 | 2nd Semester</p>
            <h1 class="text-3xl md:text-4xl font-extrabold text-yellow-300">
                T2 Performance Task 01
            </h1>
            <h2 class="text-xl md:text-2xl font-semibold text-gray-200 mt-1">${studentInfo.fullName.split(',')[0].trim()} Accounting</h2>
        </header>

        <!-- Print Header -->
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
                    <div>CN: <span>${studentInfo.classNumber || studentInfo.cn}</span></div>
                    <div>Name: <span>${studentInfo.fullName}</span></div>
                </div>
                <div class="text-right">
                    <div>Section: <span>${studentInfo.gradeSection || studentInfo.section}</span></div>
                    <div>Date: <span>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                </div>
            </div>
        </div>

        <!-- Layout Body -->
        <div class="pb-4 pt-4">
            
            <!-- SCORES & SUMMARY SECTION (Added for Report Context) -->
            <div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded no-print">
                <h4 class="font-bold text-gray-700 border-b pb-2 mb-3">Result Summary</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div><span class="block text-xs text-gray-500">Task 1A</span><span class="font-bold">${scores.t1a.current}/${scores.t1a.max} (${scores.t1a.grade})</span></div>
                    <div><span class="block text-xs text-gray-500">Task 1B</span><span class="font-bold">${scores.t1b.current}/${scores.t1b.max} (${scores.t1b.grade})</span></div>
                    <div><span class="block text-xs text-gray-500">Task 1C</span><span class="font-bold">${scores.t1c.current}/${scores.t1c.max} (${scores.t1c.grade})</span></div>
                    <div><span class="block text-xs text-gray-500">Task 2</span><span class="font-bold">${scores.t2.current}/${scores.t2.max} (${scores.t2.grade})</span></div>
                </div>
            </div>

            <!-- MAIN GRID LAYOUT -->
            <div class="grid grid-cols-1 xl:grid-cols-10 gap-4 split-panel mb-4 relative">
                
                <!-- Task 1 Column (6/10 width - Note: Original HTML used xl:grid-cols-10 and col-spans) -->
                <!-- The prompt HTML had: Task 1 Journal (4/10) Ledgers (6/10). Task 2 was separate below. -->
                <!-- WAIT: The prompt's "COMBINING THEM INTO ONE PAGE" snippet put Task 1 in lg:col-span-6 and Task 2 in lg:col-span-4. -->
                <!-- I will follow that high-level layout. -->

                <!-- Task 1 (60%) -->
                <div class="xl:col-span-6 flex flex-col">
                    <div class="sticky-section-header">
                        <h3 class="text-lg font-bold text-indigo-800 flex items-center gap-2">
                            <span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm">Task 1</span>
                            Posting to General Ledger
                        </h3>
                    </div>

                    <!-- Inner Grid for Task 1: Journal vs Ledgers -->
                    <!-- In report view, we might stack them or keep side-by-side depending on space. 
                         The original HTML had nested grids. -->
                    <div class="grid grid-cols-1 md:grid-cols-10 gap-4">
                        <!-- Journal (40%) -->
                        <div class="md:col-span-4 bg-white shadow border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                            <div class="bg-white border-b-2 border-indigo-100 p-3 flex justify-between items-center">
                                <span class="font-bold text-indigo-900 text-lg">General Journal</span>
                                <span class="font-bold text-gray-500 text-sm">Page 1</span>
                            </div>
                            <div class="overflow-x-auto flex-1 bg-white">
                                <table class="table-auto min-w-full text-sm border-collapse">
                                    <thead class="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                                        <tr>
                                            <th class="p-2 text-right border-b whitespace-nowrap">Date</th>
                                            <th class="p-2 text-left border-b w-full">Particulars</th>
                                            <th class="p-2 text-center border-b">PR</th>
                                            <th class="p-2 text-right border-b">Debit</th>
                                            <th class="p-2 text-right border-b">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100">
                                        <tr>
                                            <td class="p-1 text-center font-bold text-gray-500 bg-gray-50 text-xs">${new Date().getFullYear()}</td>
                                            <td colspan="4" class="bg-gray-50"></td>
                                        </tr>
                                        ${journalRows}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Ledgers (60%) -->
                        <div class="md:col-span-6 flex flex-col bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
                            <div class="p-2 bg-white border-b">
                                <h4 class="font-bold text-xs uppercase tracking-wide mb-1">Beginning Balances</h4>
                                <div class="flex flex-wrap gap-2 pt-1">
                                    ${pctb.map(a => `
                                        <div class="pctb-tag">
                                            <span class="font-bold text-gray-800">${a.name}</span>
                                            <span class="text-gray-500">Beg: ${formatMoney(a.bal)} ${a.side}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="p-2 bg-indigo-50 border-t border-b border-indigo-100 font-bold text-indigo-900 text-sm">General Ledger Forms</div>
                            <div class="p-4 pb-20">
                                ${ledgerForms}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Task 2 (40%) -->
                <div class="xl:col-span-4 flex flex-col">
                    <div class="sticky-section-header">
                         <h3 class="text-lg font-bold text-indigo-800 flex items-center gap-2">
                            <span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm">Task 2</span>
                            Trial Balance
                        </h3>
                    </div>
                    
                    <div class="p-6 bg-gray-50 rounded shadow-inner border border-gray-200 h-full">
                        <div class="bg-white p-6 border rounded shadow-sm">
                            <div class="text-center font-bold mb-6 text-gray-800">
                                <div class="text-2xl uppercase tracking-wide border-b-2 border-transparent inline-block pb-1">${studentInfo.fullName.split(',')[0].trim()} Accounting</div>
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
                                    ${tbRows}
                                    <tr class="font-bold bg-indigo-50 border-t-2 border-indigo-300">
                                        <td class="text-right p-3 text-indigo-900 uppercase tracking-widest text-xs">Total:</td>
                                        <td class="p-2 border border-indigo-200"><input type="number" disabled value="${getValue('tb_total_dr')}" class="table-input font-bold text-indigo-700 bg-transparent border-none text-base"></td>
                                        <td class="p-2 border border-indigo-200"><input type="number" disabled value="${getValue('tb_total_cr')}" class="table-input font-bold text-indigo-700 bg-transparent border-none text-base"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- Explanation Area -->
        <div class="hidden print:block mx-4 mt-6">
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
    `;
}
