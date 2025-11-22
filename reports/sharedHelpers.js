/**
 * SHARED HELPER FUNCTIONS
 * Utilities used by multiple report modules for formatting, validation, and common HTML elements.
 */

export const formatPHP = (num) => (typeof num !== 'number' || isNaN(num) || num === 0) ? '' : (Math.round(num * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const getFamilyName = (info) => {
    if (!info || !info.fullName) return 'Student';
    return info.fullName.split(',')[0].trim() || 'Student'; 
};

export const getAccountId = (name) => name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

export const getValidationIcon = (inputVal, correctVal) => {
    const val = Number(inputVal) || 0;
    const correct = Number(correctVal);
    // Allow a small margin of error for float calculations
    const isCorrect = Math.abs(val - correct) < 0.01;
    return isCorrect ? '<span class="validation-icon text-green-600">✔</span>' : '<span class="validation-icon text-red-600">❌</span>';
};

export const renderFSInput = (inputs, type, id, correctVal, placeholder="Amount", label="") => {
    const inputVal = inputs[type] ? inputs[type][id] : '';
    return `<div class="flex justify-between items-center text-sm ${label ? 'mb-1' : ''}">${label ? `<span class="text-gray-700 w-1/3 pr-2">${label}</span>` : ''}<div class="relative w-${label ? '2/3' : 'full'} val-container"><input type="text" class="fs-input bg-gray-100" placeholder="${placeholder}" value="${inputVal || ''}" readonly>${getValidationIcon(inputVal, correctVal)}</div></div>`;
};

export const renderRubricHTML = (taskNum, scoreData) => {
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
