HITL AGENT-GUIDED TESTING (AGT) PAGE
1. OVERVIEW
This project is a self-contained, single-file HTML application that provides a user interface for manual software testing. It is designed to be generated and deployed locally by an AI agent. A human tester uses the interface to follow a checklist, record detailed feedback, and attach screenshots. The output is a structured JSON report that the agent can parse to perform automated debugging and remediation tasks.
2. FEATURES
* Dynamic Checklist Generation: The testing checklist is populated directly by the agent into the HTML file's script.
* Detailed Feedback Modal: Each checklist item has a pop-up modal for inputting:
   * Multi-line text notes.
   * A priority level ('low', 'medium', 'high', 'critical').
   * A "softlock" status for critical, progress-blocking bugs.
   * An optional screenshot upload (converted to a Base64 data URL).
* Session Persistence: All testing progress, including notes and statuses, is automatically saved to the browser's local storage. This prevents data loss if the page is accidentally closed or refreshed.
* Progress Tracking: The header displays a live counter of completed checklist items (e.g., '(3/5 Completed)').
* One-Click Report Generation: A single button generates the complete JSON report and automatically copies it to the user's clipboard for convenience.
* UI/UX Enhancements: Includes keyboard shortcuts ('Escape' to close modal) and auto-focus on input fields for an efficient workflow.
3. WORKFLOW FOR HUMAN TESTER
1. Open the File: Open the 'hitl_testing_page.html' file (provided by the agent) in a web browser.
2. Begin Testing: Review the checklist items. Your progress from any previous session will be loaded automatically.
3. Provide Feedback: Click on a checklist item to open the details panel.
   * Fill in any relevant notes, set a priority, and attach a screenshot if necessary.
   * If a bug prevents you from continuing, check the "Softlock" box and describe the issue.
   * Click "Save." The item's status indicator will update.
4. Complete the Checklist: Repeat the process for all items on the list.
5. Generate Report: Once finished, click the "Generate Report" button at the bottom.
6. Deliver to Agent: The JSON report is now copied to your clipboard. Paste this report into your conversation with the AI agent.
7. INSTRUCTIONS FOR AI AGENT
4.1. SETUP PROTOCOL
1. Save the Code: Write the complete source code of the partner 'index.html' file to the user's local machine, naming it 'hitl_testing_page.html'.
2. Populate the Checklist:
   * Parse the 'index.html' file's content.
   * Locate the JavaScript constant 'const checklistData = [...]'.
   * Dynamically replace the contents of this array with the specific, ordered testing checklist required for the current task. Each item must be an object with an 'id' and a 'title'.
3. Instruct the User: Inform the user of the file's location ('hitl_testing_page.html') and direct them to open it in a web browser to commence the testing procedure.
4.2. REPORT PROCESSING PROTOCOL
1. Receive the Report: The user will provide a JSON string copied from the testing page.
2. Parse the JSON: Deserialize the JSON string into a native data structure (e.g., an array of objects).
3. Analyze Test Items: Iterate through each object in the array. For each item, analyze the following fields to determine the required action:
   * 'status': 'pending', 'completed', or 'softlocked'. Prioritize action on non-pending items.
   * 'notes': General text feedback.
   * 'isSoftlocked': A boolean ('true'/'false'). 'true' indicates a critical, blocking bug.
   * 'softlockFeedback': High-priority text feedback specific to the blocking issue.
   * 'priority': Urgency of the issue ('low', 'medium', 'high', 'critical').
   * 'screenshot': Contains a Base64-encoded data URL string if an image was uploaded; otherwise, it is 'null'.
4. Action Plan and Image Handling:
   * Construct a prioritized debugging plan. The highest priority should be given to items where 'isSoftlocked' is 'true' or 'priority' is 'critical'.
   * To utilize a screenshot, decode the 'screenshot' Base64 string into binary data. This data can then be processed directly or saved to a temporary file for analysis.