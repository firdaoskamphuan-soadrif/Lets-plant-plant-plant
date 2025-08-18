// Set the default Google Sheet URL
let baseSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNZpT2Gf8vpY5OibevC59cs1f97cEpstEZXih1vpb7Yft4Qcx4sgbpqMXX5tJ_2NyNwfD_9mRINKQb/pub?output=csv";

// Tree growth configuration with video filenames
const TREE_STAGES = [
    { minScore: 500, video: "552.mp4", name: "คะแนนสูงสุด! ต้นไม้เติบโตอย่างสมบูรณ์" },
    { minScore: 450, video: "551.mp4", name: "ผลเต็มต้นแล้ว สุดยอด!" },
    { minScore: 400, video: "550.mp4", name: "เริ่มมีผลแล้ววว คุณเก่งมาก" },
    { minScore: 350, video: "549.mp4", name: "คุณดูแลต้นไม้ดีมากเลย" },
    { minScore: 300, video: "548.mp4", name: "ดอกเต็มต้นแล้ว รอผลได้เลยย" },
    { minScore: 250, video: "547.mp4", name: "ดอกไม้ของคุณสวยมากเลย" },
    { minScore: 200, video: "546.mp4", name: "โอ๊ะ มีดอกแล้ววว" },
    { minScore: 150, video: "545.mp4", "name": "กำลังโตอย่างดีเลยนะ" },
    { minScore: 100, video: "544.mp4", name: "โตขึ้นมากเลยยย" },
    { minScore: 50, video: "543.mp4", name: "ต้นกล้าขึ้นแล้ว จะต้องโตขึ้นแน่นอน" },
    { minScore: 20, video: "542.mp4", name: "หว่านเมล็ดพันธ์ุ รอดูต้นไม้โตได้เลย" },
    { minScore: 0, video: "541.mp4", name: "คุณมีที่ดินแล้ว เพิ่มคะแนนเพี่อปลูกต้นไม้ของคุณ" }
];

async function fetchAndPopulateStudentDropdown() {
    const selectElement = document.getElementById("Student name");
    selectElement.innerHTML = '<option value="">-- กำลังโหลดชื่อนักเรียน... --</option>';

    const sheetURL = baseSheetURL + "&t=" + new Date().getTime();

    try {
        const response = await fetch(sheetURL);
        const data = await response.text();
        const rows = data.split("\n").slice(1);
        const studentNames = new Set();
        
        // Populate dropdown with names from the sheet
        rows.forEach(row => {
            const cols = row.split(",");
            // Ensure the column for student names exists and is not the header
            if (cols.length > 1 && cols[1]?.trim() && cols[1].trim() !== 'Student name') {
                studentNames.add(cols[1].trim());
            }
        });

        // Clear the loading message and add a default option
        selectElement.innerHTML = '<option value="">-- เลือกชื่อนักเรียน --</option>';
        
        // Add unique student names to the dropdown
        studentNames.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            selectElement.appendChild(option);
        });

    } catch (error) {
        console.error("Error populating dropdown:", error);
        showMessageBox("ไม่สามารถโหลดรายชื่อนักเรียนได้");
        selectElement.innerHTML = '<option value="">-- ไม่สามารถโหลดรายชื่อได้ --</option>';
    }
}

async function loadStudentData() {
    const selectElement = document.getElementById("Student name");
    const studentName = selectElement.value.trim();
    const loadingOverlay = document.getElementById("loading-overlay");

    if (!studentName) {
        showMessageBox("กรุณาเลือกชื่อนักเรียน");
        updateTree(0, "", ""); // Reset with no name
        document.getElementById("score-display").innerHTML = "";
        return;
    }

    // Show loading state
    loadingOverlay.classList.remove("hidden");
    selectElement.disabled = true;

    const sheetURL = baseSheetURL + "&t=" + new Date().getTime();

    try {
        const response = await fetch(sheetURL);
        const data = await response.text();

        const rows = data.split("\n").slice(1);
        let studentFound = false;

        for (let row of rows) {
            const cols = row.split(",");
            if (cols.length < 3) continue;

            const name = cols[1]?.trim() || "ไม่ทราบชื่อ";
            
            if (name === studentName) {
                const score = parseInt(cols[2]) || 0;
                const status = cols[3]?.trim().toLowerCase() || "";
                updateTree(score, status, name); // Pass the student's name
                studentFound = true;
                break;
            }
        }

        if (!studentFound) {
            showMessageBox("ไม่พบชื่อนักเรียนนี้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง");
            updateTree(0, "", ""); // Reset with no name
            document.getElementById("score-display").innerHTML = "";
        }

    } catch (error) {
        console.error("Error loading student data:", error);
        showMessageBox("ไม่สามารถโหลดข้อมูลนักเรียนได้ กรุณาตรวจสอบลิงก์และลองใหม่อีกครั้ง");
    } finally {
        // Hide loading state and re-enable dropdown
        loadingOverlay.classList.add("hidden");
        selectElement.disabled = false;
    }
}

function updateTree(score, status, name) {
    const stage = TREE_STAGES.find(stage => score >= stage.minScore);
    const treeVideoSrc = stage ? stage.video : TREE_STAGES[TREE_STAGES.length - 1].video;

    const videoElement = document.getElementById("tree");
    if (videoElement) {
        videoElement.src = treeVideoSrc;
        videoElement.load();
        videoElement.play().catch(error => {
            console.error("Video play failed:", error);
            // We use a custom message box instead of alert()
            showMessageBox("ไม่สามารถเล่นวิดีโอได้ กรุณาลองแตะที่หน้าจอเพื่อเริ่มเล่น");
        });
    }

    const currentStage = TREE_STAGES.find(stage => score >= stage.minScore);
    const scoreDisplay = document.getElementById("score-display") || createScoreDisplay();
    scoreDisplay.innerHTML = `
        <div class="mt-2 text-lg font-bold text-gray-800 animate-fade-in">
            ชื่อ: ${name || 'ไม่ทราบชื่อ'} <br>
            คะแนน: ${score} - ${currentStage ? currentStage.name : 'ไม่ทราบระยะ'}
        </div>
    `;

    const statusDiv = document.getElementById("status");
    statusDiv.innerHTML = "";
    const iconSize = 'h-16 w-16';

    if (status.includes("storm")) {
        statusDiv.innerHTML += `
            <div class="flex flex-col items-center gap-1 p-2 bg-red-100 rounded-lg animate-fade-in">
                <img src="S__4628506.jpg" alt="Storm" class="${iconSize}">
                <span class="text-xs text-red-700 font-semibold">พายุ!</span>
            </div>
        `;
    }
    if (status.includes("worm")) {
        statusDiv.innerHTML += `
            <div class="flex flex-col items-center gap-1 p-2 bg-yellow-100 rounded-lg animate-fade-in">
                <img src="S__4628525.jpg" alt="Worm" class="${iconSize}">
                <span class="text-xs text-yellow-700 font-semibold">หนอน!</span>
            </div>
        `;
    }
    if (status.includes("sick")) {
        statusDiv.innerHTML += `
            <div class="flex flex-col items-center gap-1 p-2 bg-blue-100 rounded-lg animate-fade-in">
                <img src="S__4628508.jpg" alt="Sick" class="${iconSize}">
                <span class="text-xs text-blue-700 font-semibold">ต้นไม้ป่วย!</span>
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

function updateSheetURL() {
    const selectElement = document.getElementById("sheet-url-select");
    const newURL = selectElement.value;

    if (newURL) {
        baseSheetURL = newURL;
        showMessageBox("URL ของ Google Sheet ถูกอัปเดตแล้ว กำลังโหลดข้อมูลใหม่...");
        fetchAndPopulateStudentDropdown(); // Fetch student names from the new URL
    }
}

function toggleConfig() {
    const configPanel = document.getElementById("config-panel");
    configPanel.classList.toggle("hidden");
    if (!configPanel.classList.contains("hidden")) {
        populateConfigPanel();
    }
}

function populateConfigPanel() {
    const thresholdContainer = document.getElementById("threshold-inputs");
    thresholdContainer.innerHTML = "";

    TREE_STAGES.forEach((stage, index) => {
        const div = document.createElement("div");
        div.style.margin = "5px 0";
        div.innerHTML = `
            <label class="text-sm text-gray-700">${stage.name}: </label>
            <input type="number" id="threshold-${index}" value="${stage.minScore}" class="w-20 px-2 py-1 rounded-md border text-center">
            <span class="text-gray-500">คะแนน</span>
        `;
        thresholdContainer.appendChild(div);
    });
}

function updateThresholds() {
    TREE_STAGES.forEach((stage, index) => {
        const input = document.getElementById(`threshold-${index}`);
        if (input) {
            stage.minScore = parseInt(input.value) || 0;
        }
    });

    TREE_STAGES.sort((a, b) => b.minScore - a.minScore);
    showMessageBox("Thresholds updated! Select a student to see the changes.");

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
                ตกลง
            </button>
        </div>
    `;
    document.body.appendChild(messageBox);
}

// Function to toggle background music
function toggleMusic() {
    const audio = document.getElementById("background-music");
    const toggleButton = document.getElementById("music-toggle");
    
    if (audio.paused) {
        audio.play().then(() => {
            toggleButton.textContent = "🎵 Music On";
        }).catch(error => {
            console.error("Autoplay failed:", error);
            showMessageBox("ไม่สามารถเล่นเพลงอัตโนมัติได้ กรุณาแตะปุ่มอีกครั้ง");
        });
    } else {
        audio.pause();
        toggleButton.textContent = "🔇 Music Off";
    }
}

// Function to handle background music
function initBackgroundMusic() {
    const audio = document.getElementById("background-music");
    audio.volume = 0.3; // Set volume to a comfortable level
}

// Call this function when the page loads to populate the dropdown and load initial data
window.onload = async function() {
    await fetchAndPopulateStudentDropdown();
    initBackgroundMusic();
    loadStudentData(); // Load data after the dropdown is populated
};
