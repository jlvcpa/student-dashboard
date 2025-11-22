/**
 * REPORT ENGINE DISPATCHER
 * This module is the main entry point (renderReport). It uses dynamic imports
 * to load the specific report rendering module only when it is needed,
 * improving performance for a large number of reports.
 */

// 1. REPORT REGISTRY (Maps collection key to the module file path)
const reportMap = {
    "T2 Performance Task 02": "./reports/T2PerformanceTask02.js",
    "Summative Test 01": "./reports/SummativeTest01.js",
    // To add a new report (e.g., Activity 03), add its path here:
    // "Activity 03": "./reports/Activity03.js",
};

/**
 * Main Entry Point: Finds the correct renderer and executes it.
 * @param {HTMLElement} container - The DOM element to inject HTML into
 * @param {Object} data - The student result data from Firebase
 * @param {String} collectionName - The name of the collection (used to pick the layout)
 */
export async function renderReport(container, data, collectionName) {
    // 1. Find the matching file path
    const rendererKey = Object.keys(reportMap).find(key => collectionName.includes(key));
    
    // Fallback to generic report module path
    const modulePath = rendererKey ? reportMap[rendererKey] : "./reports/genericReport.js";

    try {
        // 2. Dynamically import the required module (Lazy Loading)
        const reportModule = await import(modulePath);
        
        // 3. Execute the appropriate rendering function
        if (reportModule.renderSpecificReport) {
            const htmlContent = reportModule.renderSpecificReport(data, collectionName);
            container.innerHTML = htmlContent;
        } else if (reportModule.renderGenericReport) {
            // Fallback for the generic report logic
            reportModule.renderGenericReport(container, data, collectionName);
        }

    } catch (error) {
        console.error("Error loading or rendering report module:", error);
        // Fallback message if dynamic import fails
        container.innerHTML = `
            <div class="text-center p-10 bg-red-100 text-red-700 rounded-lg">
                <h2 class="text-xl font-bold">Error Loading Report</h2>
                <p>Could not load the report module for "${collectionName}". Check console for details.</p>
            </div>
        `;
    }
}
