/**
 * REPORT MODULE: Summative Test 01
 * Contains rendering logic for the simple Summative Test placeholder report.
 */

// We don't need imports for this simple version, but they would go here if needed.

export function renderSpecificReport(data) {
    return `
        <div class="p-10 text-center border-4 border-double border-black bg-white shadow-lg">
            <h1 class="text-4xl font-bold text-gray-800">T2 Summative Test Result</h1>
            <p class="text-xl mt-4 text-green-600 font-semibold">Score: ${data.totalScore || 0} / ${data.maxScore || 50}</p>
            <hr class="my-6 border-gray-300"/>
            <h3 class="font-bold text-lg text-gray-700 mb-2">Submitted Answers (Raw Data)</h3>
            <div class="text-left max-h-96 overflow-y-auto">
                <pre class="bg-gray-100 p-4 rounded text-sm">${JSON.stringify(data.answers, null, 2)}</pre>
            </div>
        </div>
    `;
}
