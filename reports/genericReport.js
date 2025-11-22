/**
 * REPORT MODULE: Generic Report
 * Contains the fallback rendering logic.
 */

// This function needs the container element passed to it to set the content.
export function renderGenericReport(container, data, collectionName) {
    container.innerHTML = `
        <h2 class="text-xl font-bold">Report for ${data.studentInfo?.fullName || 'Student'}</h2>
        <p class="mb-4">Source: ${collectionName}</p>
        <pre class="bg-gray-50 p-4 mt-4 overflow-auto text-xs border rounded">${JSON.stringify(data, null, 2)}</pre>
    `;
}
