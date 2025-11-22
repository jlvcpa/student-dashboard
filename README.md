📊 SHS-ADC Student Dashboard

This is a single-page application (SPA) designed to serve as a Student Portal for SHS-ADC, allowing students to securely log in with their Student ID and view their historical performance across various activities and exams. The application features a modular Report Engine to easily accommodate new activity report formats without modifying the core dashboard logic.

✨ Features

Student Authentication: Secure login based on Student ID lookup via Firebase Firestore.

Auto-Population: Automatically retrieves and displays student details (Name, Section, CN) upon ID verification.

Modular Reporting (Strategy Pattern): Easily integrates new activity report layouts by adding a function to reportEngine.js.

Real-time Data Fetching: Fetches dynamic exam lists and results from the Firebase Firestore database.

PDF Generation: Allows students to download their specific result reports as a PDF.

Responsive Design: Optimized layout for both desktop and mobile viewing, powered by Tailwind CSS.

🛠️ Project Structure

The project maintains a minimal structure for easy deployment:

/ (root)
├── index.html          # Main application file (UI, Authentication, Core Logic, Firebase setup)
├── reportEngine.js     # Modular code containing all specific report rendering functions (layouts)
├── shs-adc-logo.png    # Placeholder for the school logo
└── README.md           # This documentation file


🚀 Setup and Deployment

Since this is a client-side application using standard HTML/JS Modules and remote Firebase SDKs, no server-side compilation is required.

1. Requirements

A configured Firebase Project for data storage (students and results_list collections are assumed).

A GitHub Repository for hosting (if using GitHub Pages).

2. Local Testing

Due to the use of ES Modules (import ... from './reportEngine.js'), you must run the application through a web server.

Place all files (index.html, reportEngine.js, etc.) in a local folder.

Use a simple local web server (e.g., Python's http.server or VS Code's Live Server extension).

Open index.html via http://localhost:8000/index.html.

3. Deploying to GitHub Pages

GitHub Pages is the easiest way to host this static application.

Push Code: Upload the entire project folder contents to your GitHub repository.

Access Settings: Navigate to your Repository Settings > Pages.

Source: Select "Deploy from a branch" and choose the main (or master) branch and the / (root) directory.

Save: GitHub will build and generate a public URL for your dashboard.

📐 Extending the Report Engine

The system is designed to handle dozens of unique reports by centralizing the layout logic in reportEngine.js.

Key Concept: The Report Registry

The reportEngine.js file contains a central object called renderers. When a student requests an exam result, the system checks the exam's collection name against the keys in this object to determine which function to run.

Steps to Add a New Activity Report (e.g., "Activity 101")

Step 1: Create the Renderer Function

Open reportEngine.js and add a new function (e.g., renderActivity101) within the Section 3: SPECIFIC REPORT LAYOUTS. This function should accept the Firebase data object for that student's result and return a complete HTML template string.

// --- LAYOUT D: NEW ACTIVITY 101 ---
function renderActivity101(data) {
    // Access data properties (e.g., data.quizScore, data.essayGrade)
    const studentName = data.studentInfo.fullName;
    
    return `
        <div class="p-8 bg-blue-50 rounded-lg shadow-inner">
            <h1 class="text-3xl font-bold text-blue-800">${studentName}'s Activity 101 Report</h1>
            <p class="mt-4 text-lg">Quiz Score: ${data.quizScore} / 10</p>
            <p class="text-md font-mono">Feedback: ${data.teacherFeedback}</p>
        </div>
    `;
}


Step 2: Register the Function in the Registry

Scroll to Section 1: REPORT REGISTRY in reportEngine.js and add the new function. The key must match a unique part of your Firebase Collection Name (e.g., if the collection is named results_Activity 101, use "Activity 101").

// ==========================================
// 1. REPORT REGISTRY (The Strategy Pattern)
// ==========================================
const renderers = {
    "T2 Performance Task 02": renderPerformanceTask02,
    "Summative Test 01": renderSummativeReport,
    "Activity 101": renderActivity101, // <--- Add your new key and function here!
};


By following this two-step process, you can manage all 100+ report layouts without touching the main index.html file.
