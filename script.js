// Use the user's provided code and modify it
let baseSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNZpT2Gf8vpY5OibevC59cs1f97cEpstEZXih1vpb7Yft4Qcx4sgbpqMXX5tJ_2NyNwfD_9mRINKQb/pub?output=csv";

// Tree growth configuration - easy to modify
// IMPORTANT: The image URLs below are now updated to your provided filenames.
// Ensure these files are in the same directory as this script.
const TREE_STAGES = [
    { minScore: 450, image: "S__4636702_0.jpg", name: "ผลเต็มต้นแล้ว สุดยอด!" },
    { minScore: 400, image: "S__4636705_0.jpg", name: "เริ่มมีผลแล้ววว คุณเก่งมาก" },
    { minScore: 350, image: "S__4636706_0.jpg", name: "คุณดูแลต้นไม้ดีมากเลย" },
    { minScore: 300, image: "S__4636707_0.jpg", name: "ดอกเต็มต้นแล้ว รอผลได้เลยย" },
    { minScore: 250, image: "S__4636708.jpg", name: "ดอกไม้ของคุณสวยมากเลย" },
    { minScore: 200, image: "S__4636709_0.jpg", name: "โอ๊ะ มีดอกแล้ววว" },
    { minScore: 150, image: "S__4636710_0.jpg", name: "กำลังโตอย่างดีเลยนะ" },
    { minScore: 100, image: "S__4636712_0.jpg", name: "โตขึ้นมากเลยยย" },
    { minScore: 50, image: "S__4636713_0.jpg", name: "ต้นกล้าขึ้นแล้ว จะต้องโตขึ้นแน่นอน" },
    { minScore: 20, image: "S__4636715_0.jpg", name: "หว่านเมล็ดพันธ์ุ รอดูต้นไม้โตได้เลย" },
    { minScore: 0, image: "S__4636716_0.jpg", name: "คุณมีที่ดินแล้ว เพิ่มคะแนนเพี่อปลูกต้นไม้ของคุณ" }
];

async function fetchAndPopulateStudentDropdown() {
    const selectElement = document.getElementById("Student name");
    // Clear existing options, except for the placeholder
    selectElement.innerHTML = '<option value="">-- เลือกชื่อนักเรียน --</option>';

    try {
        const response = await fetch(baseSheetURL + "&t=" + new Date().getTime());
        const data = await response.text();
        const rows = data.split("\n").slice(1);
        const uniqueStudents = new Set();

        for (let row of rows) {
            const cols = row.split(",");
            if (cols.length > 1) {
                const studentName = cols[1]?.trim();
                if (studentName && studentName !== "Student name") {
                    uniqueStudents.add(studentName);
                }
            }
        }

        // Add unique student names to the dropdown
        uniqueStudents.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            selectElement.appendChild(option);
        });

    } catch (error) {
        console.error("Error fetching student names:", error);
        showMessageBox("ไม่สามารถดึงรายชื่อนักเรียนจาก Google Sheet ได้ กรุณาตรวจสอบลิงก์และลองใหม่อีกครั้ง");
    }
}

async function loadStudentData() {
    const student = document.getElementById("Student name").value;
    const refreshButton = document.querySelector('button');

    if (!student) {
        console.log("No student selected");
        // Use the user-provided image for the default state
        document.getElementById("tree").src = TREE_STAGES[TREE_STAGES.length - 1].image;
        document.getElementById("status").innerHTML = "";
        document.getElementById("score-display").innerHTML = "";
        return;
    }

    // Show loading state
    refreshButton.textContent = "🔄 Loading...";
    refreshButton.disabled = true;

    // Add cache busting parameter
    const sheetURL = baseSheetURL + "&t=" + new Date().getTime();

    try {
        console.log("Fetching data for student:", student);
        const response = await fetch(sheetURL);
        const data = await response.text();
        console.log("Raw data received:", data.substring(0, 200) + "..."); // Log first 200 chars

        const rows = data.split("\n").slice(1);
        let studentFound = false;

        for (let row of rows) {
            const cols = row.split(",");
            // Skip empty rows
            if (cols.length < 3) continue;

            const studentName = cols[1]?.trim(); // Student name is in column 2 (index 1)

            if (studentName === student) {
                const score = parseInt(cols[2]) || 0; // Score is in column 3 (index 2)
                const status = cols[3]?.trim().toLowerCase() || ""; // Status is in column 4 (index 3)
                console.log(`Found ${student}: Score=${score}, Status=${status}`);
                updateTree(score, status);
                studentFound = true;
                break;
            }
        }

        if (!studentFound) {
            console.log("Student not found in sheet data");
            // No need to show available students, the dropdown is now dynamic.
        }

    } catch (error) {
        console.error("Error loading student data:", error);
        showMessageBox("ไม่สามารถโหลดข้อมูลนักเรียนได้ กรุณาตรวจสอบลิงก์และลองใหม่อีกครั้ง");
    } finally {
        // Reset button state
        refreshButton.textContent = "🔄 Refresh Data";
        refreshButton.disabled = false;
    }
}

function updateTree(score, status) {
    // Find the appropriate tree stage
    const stage = TREE_STAGES.find(stage => score >= stage.minScore);
    const treeImg = stage ? stage.image : TREE_STAGES[TREE_STAGES.length - 1].image; // Use the last stage as fallback

    // Set the source of the image and ensure responsive classes are applied
    const treeImageElement = document.getElementById("tree");
    treeImageElement.src = treeImg;
    // Add classes for responsive sizing
    treeImageElement.className = "w-full h-full object-contain"; 

    // Add score and stage display
    const currentStage = TREE_STAGES.find(stage => score >= stage.minScore);
    const scoreDisplay = document.getElementById("score-display") || createScoreDisplay();
    scoreDisplay.innerHTML = `
        <div class="mt-2 text-lg font-bold text-gray-800">
            Score: ${score} - ${currentStage ? currentStage.name : 'Unknown Stage'}
        </div>
    `;

    // Update status icons with larger images and text
    const statusDiv = document.getElementById("status");
    statusDiv.innerHTML = "";
    const iconSize = 'h-16 w-16';

    // Updated with your new image filenames for status icons
    if (status.includes("storm")) {
        statusDiv.innerHTML += `
            <div class="flex items-center gap-2 p-2 bg-red-100 rounded-lg">
                <img src="S__4628506.jpg" alt="Storm" class="${iconSize}">
                <span class="text-red-700 font-semibold">เกิดพายุ!</span>
            </div>
        `;
    }
    if (status.includes("worm")) {
        statusDiv.innerHTML += `
            <div class="flex items-center gap-2 p-2 bg-yellow-100 rounded-lg">
                <img src="S__4628525.jpg" alt="Worm" class="${iconSize}">
                <span class="text-yellow-700 font-semibold">มีหนอน!</span>
            </div>
        `;
    }
    if (status.includes("sick")) {
        statusDiv.innerHTML += `
            <div class="flex items-center gap-2 p-2 bg-blue-100 rounded-lg">
                <img src="S__4628508.jpg" alt="Sick" class="${iconSize}">
                <span class="text-blue-700 font-semibold">ต้นไม้ป่วย!</span>
            </div>
        `;
    }
}

function createScoreDisplay() {
    const scoreDiv = document.createElement("div");
    scoreDiv.id = "score-display";
    const treeArea = document.getElementById("tree-area");
    treeArea.insertBefore(scoreDiv, document.getElementById("tree").nextSibling);
    return scoreDiv;
}

function toggleConfig() {
    const configPanel = document.getElementById("config-panel");
    if (configPanel.style.display === "none") {
        configPanel.style.display = "block";
        populateConfigPanel();
    } else {
        configPanel.style.display = "none";
    }
}

function populateConfigPanel() {
    // Set current sheet URL
    document.getElementById("sheet-url-input").value = baseSheetURL;

    // Create threshold inputs
    const thresholdContainer = document.getElementById("threshold-inputs");
    thresholdContainer.innerHTML = "";

    TREE_STAGES.forEach((stage, index) => {
        const div = document.createElement("div");
        div.style.margin = "5px 0";
        div.innerHTML = `
            <label class="text-sm text-gray-700">${stage.name}: </label>
            <input type="number" id="threshold-${index}" value="${stage.minScore}" class="w-20 px-2 py-1 rounded-md border text-center">
            <span class="text-gray-500">points</span>
        `;
        thresholdContainer.appendChild(div);
    });
}

function updateSheetURL() {
    const newURL = document.getElementById("sheet-url-input").value.trim();
    if (newURL) {
        // Update the global variable
        baseSheetURL = newURL;
        showMessageBox("URL ของ Google Sheet ถูกอัปเดตแล้ว กำลังโหลดข้อมูลใหม่...");
        // Fetch student names from the new URL
        fetchAndPopulateStudentDropdown();
    }
}

function updateThresholds() {
    TREE_STAGES.forEach((stage, index) => {
        const input = document.getElementById(`threshold-${index}`);
        if (input) {
            stage.minScore = parseInt(input.value) || 0;
        }
    });

    // Sort stages by minScore descending to maintain proper order
    TREE_STAGES.sort((a, b) => b.minScore - a.minScore);

    // Replace alert with a custom message box
    showMessageBox("Thresholds updated! Select a student to see the changes.");

    // Reload current student data if one is selected
    const selectedStudent = document.getElementById("Student name").value;
    if (selectedStudent) {
        loadStudentData();
    }
}

// Custom message box function to replace alert()
function showMessageBox(message) {
    const messageBox = document.createElement("div");
    messageBox.id = "message-box";
    messageBox.className = "fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4";
    messageBox.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
            <p class="text-gray-800 mb-6">${message}</p>
            <button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onclick="this.parentNode.parentNode.remove()">
                OK
            </button>
        </div>
    `;
    document.body.appendChild(messageBox);
}

// Call this function when the page loads to populate the dropdown
window.onload = fetchAndPopulateStudentDropdown;
