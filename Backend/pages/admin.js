// FIXED: Returns the VALUE of the first cookie found
host='localhost'

function getCookie() {
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();
    if (cookie) {
      const parts = cookie.split("=");
      if (parts.length >= 2) {
          return parts[1];
      }
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// NEW: Add the missing switchSection function
function switchSection(button) {
    activateButton(button);
    const section = button.getAttribute('data-section');
    
    const toolbar = document.getElementById('toolbar');
    if (section === 'project_approval') {
        if (toolbar) toolbar.style.display = 'none';
        showProjectApprovals();
    } 
    else if (section === 'fund_requests') {
        if (toolbar) toolbar.style.display = 'none';
        showFundRequests();
    }
    else if (section === 'department') {
        loadDepartmentsView();
    } else if (section === 'reports') {
        if (toolbar) toolbar.style.display = 'none';
        showReportsSection();
    } else {
        if (toolbar) toolbar.style.display = 'flex';
        showSection(section);
    }
}

async function showSection(section) {
    try {
        const token = getCookie();
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`http://${host}:8000/show_all_${section}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);

        if (data.message && Array.isArray(data.message)) {
            displayData(section, data.message);
        } else {
            displayError(`No ${section} data available`);
        }
    } catch (error) {
        console.error(`Error fetching ${section}:`, error);
        displayError(`Failed to load ${section}: ${error.message}`);
    }
}

function displayData(section, data) {
    const contentArea = document.getElementById('contentArea');
    let html = `
        <h2>${section.charAt(0).toUpperCase() + section.slice(1)} List</h2>
        <table class="data-table">
            <thead>
                <tr>
                    ${getHeaders(section)}
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (data.length === 0) {
        html += `
            <tr>
                <td colspan="${getColumnCount(section) + 1}" class="no-data">
                    No ${section} found
                </td>
            </tr>
        `;
    } else {
        data.forEach((item, index) => {
        html += `
            <tr>
                ${getRowData(section, item)}
                <td class="actions">
                    <button data-item-index="${index}" onclick="editItemByIndex('${section}', ${index})">
                        Edit
                    </button>
                    <button onclick="deleteItem('${section}', '${item[`${section}_id`]}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
    }

    html += '</tbody></table>';
    contentArea.innerHTML = html;
    window.currentSectionData = data
}

function editItemByIndex(section, index) {
    const item = window.currentSectionData[index];
    if (item) {
        editItem(section, item);
    } else {
        displayError('Item not found');
    }
}

function getHeaders(section) {
    const headers = {
        student: ['ID', 'Name', 'Supervisor','Mail ID', 'Department', 'Password'],
        faculty: ['ID', 'Name', 'Mail ID', 'Department', 'Password'],
        staff: ['ID', 'Name', 'Mail ID', 'Department', 'Password'],
        equipment: ['ID', 'Name', 'Location', 'Staff In-charge','Faculty In-charge']
    };

    return headers[section].map(header => `<th>${header}</th>`).join('');
}

function getColumnCount(section) {
    const counts = {
        student: 6,
        faculty: 5,
        staff: 5,
        equipment: 5
    };
    return counts[section];
}

function getRowData(section, item) {
    const NA = 'N/A';
    switch(section) {
        case 'student':
            return `
                <td>${item.student_id || NA}</td>
                <td>${item.student_name || NA}</td>
                <td>${item.super_visor_id || NA}</td>
                <td>${item.mail_id || NA}</td>
                <td>${item.department || NA}</td>
                <td>${item.password || NA}</td>
            `;
        case 'faculty':
            return `
                <td>${item.faculty_id || NA}</td>
                <td>${item.faculty_name || NA}</td>
                <td>${item.mail_id || NA}</td>
                <td>${item.department || NA}</td>
                <td>${item.password || NA}</td>
            `;
        case 'staff':
            return `
                <td>${item.staff_id || NA}</td>
                <td>${item.staff_name || NA}</td>
                <td>${item.mail_id || NA}</td>
                <td>${item.department || NA}</td>
                <td>${item.password || NA}</td>
            `;
        case 'equipment':
            return `
                <td>${item.equipment_id || NA}</td>
                <td>${item.equipment_name || NA}</td>
                <td>${item.location || NA}</td>
                <td>${item.staff_incharge_id || NA}</td>
                <td>${item.faculty_incharge_id || NA}</td>
            `;
        default:
            return '';
    }
}

function activateButton(button) {
    document.querySelectorAll('.menu button, .menu-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
}

async function search() {
    const searchInput = document.getElementById('searchInput').value.trim();
    const currentSection = document.querySelector('.menu button.active, .menu-btn.active')?.getAttribute('data-section');
    
    if (!currentSection) {
        displayError('Please select a section first');
        return;
    }

    if (!searchInput) {
        showSection(currentSection);
        return;
    }

    try {
        const token = getCookie();
        const response = await fetch('http://'+host+':8000/admin/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token,
                user_type: currentSection,
                query: searchInput
            })
        });

        const data = await response.json();
        if (data.message) {
            displayData(currentSection, data.message);
        }
    } catch (error) {
        console.error('Search error:', error);
        displayError('Search failed: ' + error.message);
    }
}

function showAddForm() {
    const currentSection = document.querySelector('.menu button.active, .menu-btn.active')?.getAttribute('data-section');
    
    // Don't allow adding on project approval page
    if (!currentSection || currentSection === 'project_approval') {
        displayError('Please select a section first (Students, Faculty, Staff, or Equipment)');
        return;
    }

    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = getAddForm(currentSection);
    
    // FIXED: Initialize pricing fields properly for equipment
    if (currentSection === 'equipment') {
        setTimeout(() => {
            togglePricingFields();
        }, 50);
    }
}

function displayError(message) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="error-message">
            ${message}
        </div>
    `;
}

function goToUserLogin() {
    window.location.href = 'login.html';
}

async function logout() {
  const token = getCookie();
  if (token == null) {
    console.log("no active session");
    return;
  }
  const response = await fetch("http://" + host + ":8000/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
  const response_data = await response.json();
  console.log(response_data);
  deleteCookie(token);
  alert(response_data.message);
  window.location.href = "login.html";
}

function getAddForm(section) {
    if (section === 'equipment') {
        return `
        <div class="form-container" style="max-width: 800px;">
            <h2>Add New Equipment</h2>
            <form id="addForm" onsubmit="handleAdd(event, 'equipment')">
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div class="form-group"><label>Equipment ID:</label> <input type="text" name="equipment_id" required></div>
                    <div class="form-group"><label>Name:</label> <input type="text" name="equipment_name" required></div>
                    <div class="form-group"><label>Location:</label> <input type="text" name="location" required></div>
                    <div class="form-group"><label>Slot Duration (Min):</label> <input type="number" name="unit_time" value="60" required></div>
                    <div class="form-group"><label>Staff ID:</label> <input type="text" name="staff_incharge_id" required></div>
                    <div class="form-group"><label>Faculty ID:</label> <input type="text" name="faculty_incharge_id" required></div>
                </div>

                <hr style="margin: 20px 0;">

                <div class="form-group">
                    <label>Pricing Model:</label>
                    <select id="pricing_type" onchange="togglePricingFields()" style="width:100%; padding:8px;">
                        <option value="time_based">Type 2: Time Based (Rate per Slot)</option>
                        <option value="feature_based">Type 1: Feature Based (Add-ons)</option>
                    </select>
                </div>

                <div id="requirements_container" style="background:#f9f9f9; padding:10px; border:1px solid #ddd; margin-bottom:15px;">
                    <h4>Cost Rules</h4>
                    <div id="req_rows"></div>
                    <button type="button" id="addReqBtn" onclick="addRequirementRow()" style="margin-top:10px; display:none;">+ Add Feature</button>
                </div>

                <div style="background:#f9f9f9; padding:10px; border:1px solid #ddd; margin-bottom:15px;">
                    <h4>Extra Questions</h4>
                    <div id="question_rows"></div>
                    <button type="button" onclick="addQuestionRow()" style="margin-top:10px;">+ Add Question</button>
                </div>

                <button type="submit">Create Equipment</button>
                <button type="button" onclick="cancelAdd()">Cancel</button>
            </form>
        </div>`;
    }

    const fields = {
        student: [
            { id: 'student_id', label: 'Student ID', required: true },
            { id: 'student_name', label: 'Name', required: true },
            { id: 'super_visor_id', label: 'Supervisor ID', required: true },
            { id: 'mail_id', label: 'Mail ID', required: true },
            { id: 'department', label: 'Department', required: true },
            { id: 'password', label: 'Password', type: 'password', required: true }
        ],
        faculty: [
            { id: 'faculty_id', label: 'Faculty ID', required: true },
            { id: 'faculty_name', label: 'Name', required: true },
            { id: 'mail_id', label: 'Mail ID', required: true },
            { id: 'department', label: 'Department', required: true },
            { id: 'password', label: 'Password', type: 'password', required: true }
        ],
        staff: [
            { id: 'staff_id', label: 'Staff ID', required: true },
            { id: 'staff_name', label: 'Name', required: true },
            { id: 'mail_id', label: 'Mail ID', required: true },
            { id: 'department', label: 'Department', required: true },
            { id: 'password', label: 'Password', type: 'password', required: true }
        ]
    };

    let html = `
        <div class="form-container">
            <h2>Add New ${section.charAt(0).toUpperCase() + section.slice(1)}</h2>
            <form id="addForm" onsubmit="handleAdd(event, '${section}')">
    `;

    fields[section].forEach(field => {
        html += `
            <div class="form-group">
                <label for="${field.id}">${field.label}:</label>
                <input type="${field.type || 'text'}" id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
            </div>`;
    });

    html += `<button type="submit">Add</button><button type="button" onclick="cancelAdd()">Cancel</button></form></div>`;
    return html;
}

async function handleAdd(event, section) {
    event.preventDefault();
    const token = getCookie();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    let requestBody;

    if (section === 'equipment') {
        const requirements = [];
        document.querySelectorAll('.req-row').forEach(row => {
            requirements.push({
                name: row.querySelector('.req-name').value,
                cost: parseInt(row.querySelector('.req-cost').value),
                type: row.querySelector('.req-type').value
            });
        });

        const questions = [];
        document.querySelectorAll('.q-text').forEach(input => {
            if(input.value.trim()) questions.push(input.value.trim());
        });

        requestBody = {
            token,
            user_type: 'equipment',
            equipment_id: data.equipment_id,
            equipment_name: data.equipment_name,
            location: data.location,
            staff_incharge_id: data.staff_incharge_id,
            faculty_incharge_id: data.faculty_incharge_id,
            unit_time: parseInt(data.unit_time || 60),
            requirements: requirements,
            questions: questions
        };
    } else {
        const singularSection = section.endsWith('s') ? section.slice(0, -1) : section;
        requestBody = {
            token,
            user_type: section,
            user_id: data[`${singularSection}_id`],
            name: data[`${singularSection}_name`],
            mail_id: data.mail_id,
            department: data.department,
            password: data.password,
            additional_info: {
                ...(section === 'student' && { supervisor_id: data.super_visor_id })
            }
        };
    }

    try {
        const response = await fetch('http://'+host+':8000/admin/create_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        if (result.message === 'success') {
            alert('Added successfully');
            showSection(section);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert(`Failed to add: ${error.message}`);
    }
}

async function editItem(section, item) {
    singularSection = section.endsWith('s') ? section.slice(0, -1) : section;
    const contentArea = document.getElementById('contentArea');
    
    // --- 1. DYNAMIC DATA FETCHING ---
    let departments = [];
    let staffList = [];
    let facultyList = [];
    let currentReqs = []; // NEW: To hold our pricing data

    const token = getCookie("session_token") || getCookie();

    if (['student', 'faculty', 'staff'].includes(section)) {
        try {
            const response = await fetch("http://" + host + ":8000/departments", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token })
            });
            const data = await response.json();
            if (data.message && Array.isArray(data.message)) departments = data.message;
        } catch (error) { console.error("Error fetching departments:", error); }
    }

    if (section === 'equipment') {
        try {
            // Fetch Staff
            const resStaff = await fetch("http://" + host + ":8000/show_all_staff", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token })
            });
            const dataStaff = await resStaff.json();
            if(dataStaff.message && Array.isArray(dataStaff.message)) staffList = dataStaff.message;

            // Fetch Faculty
            const resFac = await fetch("http://" + host + ":8000/show_all_faculty", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token })
            });
            const dataFac = await resFac.json();
            if(dataFac.message && Array.isArray(dataFac.message)) facultyList = dataFac.message;

            // NEW: Fetch Current Prices/Requirements
            const resReq = await fetch("http://" + host + ":8000/get_equipment_requirements", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ID: item.equipment_id })
            });
            const dataReq = await resReq.json();
            if(dataReq.message && dataReq.message.requirements) {
                currentReqs = dataReq.message.requirements;
            }
        } catch (error) {
            console.error("Error fetching equipment details:", error);
        }
    }
    // ------------------------------------------------

    const fields = {
        student: [
            {id: 'student_id', label: 'Student ID', readonly: true},
            {id: 'student_name', label: 'Name'},
            {id: 'super_visor_id', label: 'Supervisor ID'},
            {id: 'mail_id', label: 'Mail ID'},
            {id: 'department', label: 'Department'},
            {id: 'password', label: 'Password', type: 'password', readonly: true}
        ],
        faculty: [
            {id: 'faculty_id', label: 'Faculty ID', readonly: true},
            {id: 'faculty_name', label: 'Name'},
            {id: 'mail_id', label: 'Mail ID'},
            {id: 'department', label: 'Department'},
            {id: 'password', label: 'Password', type: 'password', readonly: true}
        ],
        staff: [
            {id: 'staff_id', label: 'Staff ID', readonly: true},
            {id: 'staff_name', label: 'Name'},
            {id: 'mail_id', label: 'Mail ID'},
            {id: 'department', label: 'Department'},
            {id: 'password', label: 'Password', type: 'password', readonly: true}
        ],
        equipment: [
            {id: 'equipment_id', label: 'Equipment ID', readonly: true},
            {id: 'equipment_name', label: 'Name'},
            {id: 'location', label: 'Location'},
            {id: 'staff_incharge_id', label: 'Staff In-charge'},
            {id: 'faculty_incharge_id', label: 'Faculty In-charge'}
        ]
    };

    let html = `
        <div class="form-container">
            <h2>Edit ${section.charAt(0).toUpperCase() + section.slice(1)}</h2>
            <p class="note">* Leave fields empty to keep current values. IDs and Passwords cannot be edited here.</p>
            <form id="editForm" onsubmit="handleEdit(event, '${section}', '${item[`${singularSection}_id`]}')">
    `;

    // --- 2. DYNAMIC FIELD RENDERER ---
    fields[section].forEach(field => {
        const isReadonly = field.readonly ? 'readonly' : '';
        const style = field.readonly ? 'background-color: #e9ecef; cursor: not-allowed; color: #6c757d; border: 1px solid #ccc;' : '';
        const nameAttr = field.readonly ? '' : `name="${field.id}"`;
        const value = (field.type === 'password' && field.readonly) ? '********' : (item[field.id] || '');

        html += `<div class="form-group"><label for="${field.id}">${field.label}:</label>`;

        if (field.id === 'department' && departments.length > 0) {
            html += `<select id="${field.id}" ${nameAttr} style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; font-size: 14px;">`;
            html += `<option value="">-- Keep Current (${value}) --</option>`; 
            departments.forEach(dept => {
                const isSelected = (value === dept.department_id || value === dept.department_name) ? 'selected' : '';
                html += `<option value="${dept.department_id}" ${isSelected}>${dept.department_name} (${dept.department_id})</option>`;
            });
            html += `</select>`;
        } 
        else if (field.id === 'staff_incharge_id' && staffList.length > 0) {
            html += `<select id="${field.id}" ${nameAttr} style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; font-size: 14px;">`;
            html += `<option value="">-- Keep Current (${value}) --</option>`; 
            staffList.forEach(s => {
                const isSelected = (value === s.staff_id) ? 'selected' : '';
                html += `<option value="${s.staff_id}" ${isSelected}>${s.staff_name} (${s.staff_id})</option>`;
            });
            html += `</select>`;
        }
        else if (field.id === 'faculty_incharge_id' && facultyList.length > 0) {
            html += `<select id="${field.id}" ${nameAttr} style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; font-size: 14px;">`;
            html += `<option value="">-- Keep Current (${value}) --</option>`; 
            facultyList.forEach(f => {
                const isSelected = (value === f.faculty_id) ? 'selected' : '';
                html += `<option value="${f.faculty_id}" ${isSelected}>${f.faculty_name} (${f.faculty_id})</option>`;
            });
            html += `</select>`;
        }
        else {
            html += `<input type="${field.type || 'text'}" id="${field.id}" ${nameAttr} value="${value}" ${isReadonly} style="${style}; width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; font-size: 14px; box-sizing: border-box;">`;
        }
        html += `</div>`;
    });

    // --- 3. PRICING RENDERER (NEW) ---
    if (section === 'equipment' && currentReqs.length > 0) {
        html += `<div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #eee;">
            <h3 style="margin-bottom: 15px; color: #2c3e50; font-size: 16px;">Update Equipment Pricing</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 15px;">Note: You can update the prices below, but cannot add or remove feature names in edit mode.</p>
        `;
        
        currentReqs.forEach(req => {
            let badgeColor = req.type === 'fixed' ? '#3498db' : '#e67e22';
            let safeName = req.name.replace(/"/g, '&quot;'); // Escape quotes just in case
            
            html += `
            <div style="display: flex; gap: 10px; margin-bottom: 12px; align-items: center;">
                <div style="flex: 2; position: relative;">
                    <input type="text" value="${safeName}" readonly style="width: 100%; background-color: #e9ecef; border: 1px solid #ccc; padding: 10px; border-radius: 4px; color: #555; cursor: not-allowed; font-weight: 500;">
                    <span style="position:absolute; right:10px; top:12px; font-size:10px; background:${badgeColor}; color:white; padding:2px 6px; border-radius:10px;">${req.type}</span>
                </div>
                <div style="display:flex; align-items: center; flex: 1;">
                    <span style="padding: 9px 12px; background: #eee; border: 1px solid #ccc; border-right: none; border-radius: 4px 0 0 4px; font-weight:bold;">₹</span>
                    <input type="number" name="cost_update_${safeName}" value="${req.cost}" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 0 4px 4px 0;">
                </div>
            </div>`;
        });
        html += `</div>`;
    }

    html += `
            <button type="submit" style="margin-right: 10px;">Save Changes</button>
            <button type="button" onclick="cancelEdit()" style="background: #6c757d;">Cancel</button>
        </form>
        </div>
    `;

    contentArea.innerHTML = html;
}

async function handleEdit(event, section, id) {
    event.preventDefault();
    if (!id) { displayError('Invalid ID'); return; }

    const token = getCookie("session_token") || getCookie();
    const formData = new FormData(event.target);
    const updates = {};
    const cost_updates = {}; // NEW: Hold our price updates
    
    for (let [key, value] of formData.entries()) {
        if (value.trim()) {
            // Identify if this is a standard update or a price update
            if (key.startsWith('cost_update_')) {
                const reqName = key.replace('cost_update_', '');
                cost_updates[reqName] = parseInt(value.trim());
            } else {
                updates[key] = value.trim();
            }
        }
    }

    try {
        const payload = {
            token,
            user_type: section,
            user_id: id,
            updates: updates,
            cost_updates: Object.keys(cost_updates).length > 0 ? cost_updates : null
        };

        const response = await fetch('http://'+host+':8000/admin/update_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.message === 'success') {
            showSuccessMessage('Updated successfully');
            showSection(section);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        displayError(`Failed to update: ${error.message}`);
    }
}

function showSuccessMessage(message) {
    const contentArea = document.getElementById('contentArea');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    contentArea.prepend(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

function cancelAdd() {
    const currentSection = document.querySelector('.menu button.active, .menu-btn.active')?.getAttribute('data-section');
    if (currentSection) {
        showSection(currentSection);
    }
}

function cancelEdit() {
    const currentSection = document.querySelector('.menu button.active, .menu-btn.active')?.getAttribute('data-section');
    if (currentSection) {
        showSection(currentSection);
    }
}

async function deleteItem(section, id) {
    if (!id) {
        displayError('Invalid ID');
        return;
    }

    if (!confirm(`Are you sure you want to delete this ${section}?`)) {
        return;
    }

    const token = getCookie()
    try {
        const response = await fetch('http://'+host+':8000/admin/delete_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token,
                user_type: section,
                user_id: id
            })
        });

        const result = await response.json();
        if (result.message === 'success') {
            showSuccessMessage('Deleted successfully');
            showSection(section);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        displayError(`Failed to delete: ${error.message}`);
    }
}

async function showProjectApprovals() {
    const token = getCookie();
    const contentArea = document.getElementById('contentArea');
    try {
        const response = await fetch('http://'+host+':8000/admin/pending_projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const data = await response.json();

        let html = `<h2>Pending Project Approvals</h2><table class="data-table"><thead><tr>
            <th>Project ID</th><th>Title</th><th>Faculty ID</th><th>Type</th><th>Actions</th>
        </tr></thead><tbody>`;

        if (data.message && data.message.length > 0) {
            data.message.forEach(proj => {
                html += `<tr>
                    <td>${proj.project_id}</td>
                    <td>${proj.project_title}</td>
                    <td>${proj.faculty_incharge_id}</td>
                    <td>${proj.project_type}</td>
                    <td class="actions">
    <button onclick="showApprovalForm('${proj.project_id}')">Approve</button>
    <button onclick="handleRejection('${proj.project_id}')" style="background-color: #f44336;">Reject</button>
</td>
                </tr>`;
            });
        } else {
            html += '<tr><td colspan="5">No pending projects found.</td></tr>';
        }
        html += '</tbody></table>';
        contentArea.innerHTML = html;
    } catch (error) {
        displayError('Failed to load pending projects.');
    }
}

function showApprovalForm(projectId) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="form-container">
            <h2>Approve Project: ${projectId}</h2>
            <form onsubmit="handleApproval(event, '${projectId}')">
                <div class="form-group">
                    <label for="allocated_money">Allocate Funds:</label>
                    <input type="number" id="allocated_money" required min="1">
                </div>
                <div class="form-group">
                    <label for="expiry_date">Expiry Date:</label>
                    <input type="date" id="expiry_date" required>
                </div>
                <button type="submit">Approve Project</button>
                <button type="button" onclick="showProjectApprovals()">Cancel</button>
            </form>
        </div>
    `;
}

async function handleApproval(event, projectId) {
    event.preventDefault();
    const token = getCookie();
    const allocated_money = document.getElementById('allocated_money').value;
    const expiry_date = document.getElementById('expiry_date').value;

    try {
        const response = await fetch('http://'+host+':8000/admin/approve_project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                project_id: projectId,
                allocated_money: parseInt(allocated_money),
                expiry_date: expiry_date
            })
        });
        const result = await response.json();
        if (result.message.includes("successfully")) {
            showSuccessMessage(result.message);
            showProjectApprovals();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        displayError(`Failed to approve project: ${error.message}`);
    }
}

async function handleRejection(projectId) {
    if (!confirm(`Are you sure you want to reject project ID: ${projectId}?`)) {
        return;
    }

    const token = getCookie();
    if (!token) {
        displayError("Authentication error. Please log in again.");
        return;
    }

    try {
        const response = await fetch('http://'+host+':8000/admin/reject_project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                project_id: projectId
            })
        });
        const result = await response.json();
        
        if (result.message.includes("successfully")) {
            showSuccessMessage(result.message);
            showProjectApprovals();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        displayError(`Failed to reject project: ${error.message}`);
    }
}

function togglePricingFields() {
    const typeSelect = document.getElementById('pricing_type');
    if (!typeSelect) {
        console.error('pricing_type select not found');
        return;
    }
    
    const type = typeSelect.value;
    const container = document.getElementById('req_rows');
    const btn = document.getElementById('addReqBtn');
    
    if (!container || !btn) {
        console.error('Required elements not found');
        return;
    }
    
    container.innerHTML = '';
    
    if (type === 'time_based') {
        btn.style.display = 'none';
        container.innerHTML = `
            <div class="req-row" style="display:flex; gap:5px; margin-bottom:5px;">
                <input type="text" class="req-name" value="Standard Hourly Rate" readonly style="flex:2; background:#eee;">
                <input type="number" class="req-cost" placeholder="Cost" required style="flex:1;">
                <input type="hidden" class="req-type" value="per_slot">
            </div>`;
    } else {
        btn.style.display = 'inline-block';
        addRequirementRow();
    }
}

function addRequirementRow() {
    const div = document.createElement('div');
    div.className = 'req-row';
    div.style = "display:flex; gap:5px; margin-bottom:5px;";
    div.innerHTML = `
        <input type="text" placeholder="Feature Name" class="req-name" required style="flex:2;">
        <input type="number" placeholder="Cost" class="req-cost" required style="flex:1;">
        <input type="hidden" class="req-type" value="fixed">
        <button type="button" onclick="this.parentElement.remove()" style="background:red; color:white; border:none;">X</button>
    `;
    document.getElementById('req_rows').appendChild(div);
}

function addQuestionRow() {
    const div = document.createElement('div');
    div.className = 'q-row';
    div.style = "display:flex; gap:5px; margin-bottom:5px;";
    div.innerHTML = `
        <input type="text" placeholder="Question Text" class="q-text" required style="flex:1;">
        <button type="button" onclick="this.parentElement.remove()" style="background:red; color:white; border:none;">X</button>
    `;
    document.getElementById('question_rows').appendChild(div);
}

async function showReportsSection() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `<p>Loading faculty list...</p>`;
    
    const token = getCookie();
    try {
        const response = await fetch("http://" + host + ":8000/show_all_faculty", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
        });
        const data = await response.json();
        
        let facultyOptions = '<option value="" disabled selected>-- Select Faculty --</option>';
        if (data.message && Array.isArray(data.message)) {
            data.message.forEach(f => {
                facultyOptions += `<option value="${f.faculty_id}">${f.faculty_name} (${f.faculty_id})</option>`;
            });
        }

        contentArea.innerHTML = `
            <div class="form-container" style="max-width: 600px;">
                <h2>Export Consolidated Invoice (PDF)</h2>
                <form id="reportForm" onsubmit="handleReportExport(event)">
                    <div class="form-group">
                        <label>Select Faculty:</label>
                        <select id="report_faculty_id" required>
                            ${facultyOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Billing Start Date:</label>
                        <input type="date" id="report_start_date" required>
                    </div>
                    <div class="form-group">
                        <label>Billing End Date:</label>
                        <input type="date" id="report_end_date" required>
                    </div>
                    <button type="submit" style="background-color: #3498db; width: 100%;">Download Invoice (PDF)</button>
                </form>
                <div id="reportMessage" style="margin-top:15px; font-weight:bold; text-align: center;"></div>
            </div>
        `;
    } catch (error) {
        contentArea.innerHTML = `<div class="error-message">Failed to load faculty: ${error.message}</div>`;
    }
}

// Helper to convert Numbers into Words for the Invoice
function convertNumberToWords(amount) {
    const words = [];
    words[0] = ''; words[1] = 'One'; words[2] = 'Two'; words[3] = 'Three'; words[4] = 'Four'; words[5] = 'Five'; words[6] = 'Six'; words[7] = 'Seven'; words[8] = 'Eight'; words[9] = 'Nine'; words[10] = 'Ten'; words[11] = 'Eleven'; words[12] = 'Twelve'; words[13] = 'Thirteen'; words[14] = 'Fourteen'; words[15] = 'Fifteen'; words[16] = 'Sixteen'; words[17] = 'Seventeen'; words[18] = 'Eighteen'; words[19] = 'Nineteen';
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (amount === 0) return 'Zero';
    let numStr = amount.toString();
    if (numStr.length > 9) return 'Overflow';
    
    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    
    let str = '';
    str += (n[1] != 0) ? (words[Number(n[1])] || tens[n[1][0]] + ' ' + words[n[1][1]]) + ' Crore ' : '';
    str += (n[2] != 0) ? (words[Number(n[2])] || tens[n[2][0]] + ' ' + words[n[2][1]]) + ' Lakh ' : '';
    str += (n[3] != 0) ? (words[Number(n[3])] || tens[n[3][0]] + ' ' + words[n[3][1]]) + ' Thousand ' : '';
    str += (n[4] != 0) ? (words[Number(n[4])] || tens[n[4][0]] + ' ' + words[n[4][1]]) + ' Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (words[Number(n[5])] || tens[n[5][0]] + ' ' + words[n[5][1]]) : '';
    
    return str.trim();
}

async function handleReportExport(event) {
    event.preventDefault();
    const msgDiv = document.getElementById("reportMessage");
    msgDiv.textContent = "Generating invoice...";
    msgDiv.style.color = "black";

    const token = getCookie();
    const facultySelect = document.getElementById("report_faculty_id");
    const faculty_id = facultySelect.value;
    // Extract name for the PDF label (remove the ID part in parentheses)
    const faculty_name = facultySelect.options[facultySelect.selectedIndex].text.split(' (')[0];
    
    const start_date = document.getElementById("report_start_date").value;
    const end_date = document.getElementById("report_end_date").value;

    try {
        const response = await fetch("http://" + host + ":8000/admin/export_report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, faculty_id, start_date, end_date })
        });
        const result = await response.json();

        if (result.message === "success") {
            const data = result.data;
            if (data.length === 0) {
                msgDiv.textContent = "No records found for the selected faculty and date range.";
                msgDiv.style.color = "red";
                return;
            }

            // --- INITIALIZE JSPDF ---
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            
            // Generate dynamic invoice number
            const today = new Date();
            const formattedToday = today.toLocaleDateString('en-GB'); // DD/MM/YYYY
            const invoiceNo = `CIF/${today.getFullYear()}/Q${Math.floor((today.getMonth() + 3) / 3)}/${faculty_name.split(' ')[0].toUpperCase()}/${Math.floor(Math.random() * 100)}`;

            // Calculate totals and group by Project
            let grandTotal = 0;
            const projectTotals = {};
            data.forEach(row => {
                const cost = parseFloat(row.total_charges) || 0;
                grandTotal += cost;
                const pTitle = row.project_title || 'Uncategorized';
                if (!projectTotals[pTitle]) projectTotals[pTitle] = 0;
                projectTotals[pTitle] += cost;
            });

            // ================= PAGE 1: SUMMARY INVOICE =================
            // Header Text
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("IIT PALAKKAD", pageWidth / 2, 20, { align: "center" });
            
            doc.setFontSize(12);
            doc.text("Consolidated Invoice for Analytical Services", pageWidth / 2, 28, { align: "center" });
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("Central Instrumentation Facility - Central Micro-Nano Fabrication Facility", pageWidth / 2, 34, { align: "center" });

            // Intro block
            doc.text("The invoice for the analytical charges of your samples in CIF-CMFF for the billing period has been", 14, 45);
            doc.text("generated. You are kindly requested to pay the charges.", 14, 51);

            // Left Block: Bill To
            doc.setFont("helvetica", "bold");
            doc.text("Bill to", 14, 65);
            doc.setFont("helvetica", "normal");
            doc.text(`Dr. ${faculty_name}`, 14, 72);
            doc.text("Faculty In-Charge", 14, 78);
            
            // Right Block: Invoice Info
            doc.setFont("helvetica", "bold");
            doc.text("Invoice No.", 140, 65);
            doc.setFont("helvetica", "normal");
            doc.text(invoiceNo, 140, 72);
            
            doc.setFont("helvetica", "bold");
            doc.text("Dated", 140, 82);
            doc.setFont("helvetica", "normal");
            doc.text(formattedToday, 140, 89);

            doc.setFont("helvetica", "bold");
            doc.text("Billing Period:", 14, 93);
            doc.setFont("helvetica", "normal");
            doc.text(`${new Date(start_date).toLocaleDateString('en-GB')} to ${new Date(end_date).toLocaleDateString('en-GB')}`, 14, 100);

            // Create Summary Table Data
            const summaryBody = Object.keys(projectTotals).map(proj => [
                proj,
                "Annexure A",
                `Rs. ${projectTotals[proj]}`
            ]);
            
            // Add Total Row
            summaryBody.push([{ content: 'Total', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } }, `Rs. ${grandTotal}`]);

            // Draw Summary Table
            doc.autoTable({
                startY: 105,
                head: [["Project Code used for service", "Billing Details", "Amount (INR)"]],
                body: summaryBody,
                theme: 'grid',
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
            });

            let finalY = doc.lastAutoTable.finalY + 15;

            // Amount in words
            doc.setFont("helvetica", "bold");
            doc.text(`Amount Chargeable in INR (in words): Rupees ${convertNumberToWords(grandTotal)} Only`, 14, finalY);

            // Footer Disclaimer
            finalY += 10;
            doc.setFont("helvetica", "normal");
            doc.text("The amount mentioned in the invoice shall be debited from the project account to the bank account", 14, finalY);
            doc.text("IIT PALAKKAD I-STEM towards the payment of analytical services.", 14, finalY + 6);

            // Signatures
            finalY += 35;
            doc.setFont("helvetica", "bold");
            doc.text("For Office ICSR", 14, finalY);
            doc.text("For Finance & Accounts", 140, finalY);

            // ================= PAGE 2: ANNEXURE A (Detailed Data) =================
            doc.addPage();
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Annexure A", pageWidth / 2, 20, { align: "center" });

            // Create Detailed Table Data
            const detailsBody = data.map((row, index) => {
                const dateStr = row.completion_time ? new Date(row.completion_time).toLocaleDateString('en-GB') : new Date(row.slot_time).toLocaleDateString('en-GB');
                return [
                    index + 1,
                    row.equipment_name,
                    row.request_id,
                    dateStr,
                    row.initial_cost,
                    row.extra_charges,
                    row.project_title,
                    row.total_charges
                ];
            });

            // Draw Detailed Table
            doc.autoTable({
                startY: 30,
                head: [["Sl. No", "Equipment", "Req. ID", "Date of Completion", "Initial Cost", "Extra Charges", "Project Code", "Total Cost"]],
                body: detailsBody,
                theme: 'grid',
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
                styles: { fontSize: 9 }
            });

            // Save PDF
            const cleanName = faculty_name.replace(/[^a-zA-Z0-9 ]/g, "");
            doc.save(`Dr. ${cleanName} Invoice ${start_date}_to_${end_date}.pdf`);

            msgDiv.textContent = "Invoice downloaded successfully!";
            msgDiv.style.color = "green";
        } else {
            msgDiv.textContent = "Failed: " + result.message;
            msgDiv.style.color = "red";
        }
    } catch (err) {
        msgDiv.textContent = "Error: " + err.message;
        msgDiv.style.color = "red";
    }
}
async function handleAddDepartment(event) {
    event.preventDefault();
    
    // Use your existing cookie function
    const token = getCookie("session_token") || getCookie(); 
    const deptId = document.getElementById("new_dept_id").value.trim().toUpperCase();
    const deptName = document.getElementById("new_dept_name").value.trim();
    const resultDiv = document.getElementById("addDeptResult");

    resultDiv.textContent = "Adding...";
    resultDiv.style.color = "black";

    try {
        const response = await fetch("http://" + host + ":8000/admin/add_department", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                token: token, 
                department_id: deptId, 
                department_name: deptName 
            })
        });

        const data = await response.json();
        resultDiv.textContent = data.message;

        if (data.message.includes("successfully")) {
            resultDiv.style.color = "green";
            event.target.reset(); // Clear the form
        } else {
            resultDiv.style.color = "red";
        }
    } catch (error) {
        console.error("Error:", error);
        resultDiv.textContent = "Network error. Could not connect to the server.";
        resultDiv.style.color = "red";
    }
}
// --- MANAGE DEPARTMENTS VIEW ---
async function loadDepartmentsView() {
    const contentArea = document.getElementById("contentArea");
    
    // 1. Build the UI Layout (Table on top, Add Form on bottom)
    contentArea.innerHTML = `
        <div style="display: flex; gap: 20px; flex-direction: column;">
            
            <div style="background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); padding: 20px;">
                <h2 style="margin-bottom: 15px; color: #2c3e50;">Current Departments</h2>
                <table class="data-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Department ID</th>
                            <th>Department Name</th>
                        </tr>
                    </thead>
                    <tbody id="deptTableBody">
                        <tr><td colspan="2" style="text-align:center; padding:20px;">Loading departments...</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="form-container" style="margin: 0; max-width: 100%; border-top: 4px solid #8e44ad;">
                <h3>Add New Department</h3>
                <p style="color:#666; font-size: 14px; margin-bottom: 15px;">Register a new academic or administrative department.</p>
                
                <form id="addDeptForm" onsubmit="handleAddDepartmentInline(event)" style="display: flex; gap: 15px; align-items: flex-end;">
                    <div class="form-group" style="flex: 1; margin-bottom: 0;">
                        <label>Department ID</label>
                        <input type="text" id="new_dept_id" required placeholder="e.g., CSE">
                    </div>
                    <div class="form-group" style="flex: 2; margin-bottom: 0;">
                        <label>Department Name</label>
                        <input type="text" id="new_dept_name" required placeholder="e.g. Computer Science">
                    </div>
                    <button type="submit" style="background:#8e44ad; color:white; padding:10px 25px; border:none; border-radius:4px; font-weight:bold; cursor:pointer; height: 40px;">
                        Add
                    </button>
                </form>
                <div id="addDeptResult" style="margin-top: 10px; font-weight:bold; font-size:0.9rem;"></div>
            </div>
            
        </div>
    `;

    // 2. Fetch the data from the server
    const token = getCookie("session_token") || getCookie();
    try {
        // Using the existing /departments endpoint you already use for the Faculty project modal
        const response = await fetch("http://" + host + ":8000/departments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token })
        });
        const data = await response.json();
        
        const tbody = document.getElementById("deptTableBody");
        tbody.innerHTML = ""; // Clear loading message
        
        if(data.message && data.message.length > 0) {
            data.message.forEach(dept => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${dept.department_id}</strong></td>
                        <td>${dept.department_name}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="2" class="no-data">No departments found.</td></tr>`;
        }
    } catch (error) {
        document.getElementById("deptTableBody").innerHTML = `<tr><td colspan="2" class="error-message">Error connecting to server.</td></tr>`;
    }
}

async function handleAddDepartmentInline(event) {
    event.preventDefault();
    
    const token = getCookie("session_token") || getCookie(); 
    const deptId = document.getElementById("new_dept_id").value.trim().toUpperCase();
    const deptName = document.getElementById("new_dept_name").value.trim();
    const resultDiv = document.getElementById("addDeptResult");
    const btn = event.target.querySelector('button');

    btn.innerHTML = "Adding...";
    btn.disabled = true;
    resultDiv.textContent = "";

    try {
        const response = await fetch("http://" + host + ":8000/admin/add_department", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token, department_id: deptId, department_name: deptName })
        });

        const data = await response.json();

        if (data.message.includes("successfully")) {
            resultDiv.style.color = "green";
            resultDiv.textContent = data.message;
            event.target.reset(); // Clear the inputs
            
            // MAGIC TRICK: Refresh the view instantly so the new department appears in the table!
            loadDepartmentsView(); 
            
        } else {
            resultDiv.style.color = "red";
            resultDiv.textContent = data.message;
        }
    } catch (error) {
        resultDiv.style.color = "red";
        resultDiv.textContent = "Network error. Could not connect to the server.";
    } finally {
        btn.innerHTML = "Add";
        btn.disabled = false;
    }
}

// ==========================================
// ADMIN EXTRA FUND APPROVAL SYSTEM
// ==========================================

async function showFundRequests() {
    const token = getCookie();
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `<p style="text-align:center; padding: 40px; color:#666;">Loading fund requests...</p>`;

    try {
        const response = await fetch('http://'+host+':8000/admin/pending_fund_requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const data = await response.json();

        let html = `<h2>Pending Project Renewals & Fund Requests</h2><table class="data-table"><thead><tr>
            <th>Req ID</th><th>Project ID</th><th>Title</th><th>Requested Amount</th><th>Reason</th><th>Actions</th>
        </tr></thead><tbody>`;

        if (data.message && data.message.length > 0) {
            data.message.forEach(req => {
                // --- NEW: Handle empty amounts visually ---
                const amtDisplay = req.requested_amount ? `₹${req.requested_amount}` : '<span style="color:#7f8c8d; font-style:italic;">Not Specified</span>';
                const safeAmount = req.requested_amount || ''; // Pass empty string to form if null
                
                html += `<tr>
                    <td><strong>#${req.req_id}</strong></td>
                    <td>${req.project_id}</td>
                    <td>${req.project_title}</td>
                    <td style="color: #27ae60; font-weight: bold; font-size: 1.1em;">${amtDisplay}</td>
                    <td style="max-width: 250px; word-wrap: break-word; font-size: 0.9em; color: #555;">${req.reason}</td>
                    <td class="actions">
                        <button onclick="showFundApprovalForm(${req.req_id}, '${req.project_id}', '${safeAmount}')" style="background-color: #27ae60;">Approve & Renew</button>
                        <button onclick="handleRejectFund(${req.req_id})" style="background-color: #e74c3c;">Reject</button>
                    </td>
                </tr>`;
            });
        } else {
            html += '<tr><td colspan="6" class="no-data">No pending fund requests found.</td></tr>';
        }
        html += '</tbody></table>';
        contentArea.innerHTML = html;
    } catch (error) {
        displayError('Failed to load fund requests.');
    }
}

function showFundApprovalForm(reqId, projectId, requestedAmount) {
    const contentArea = document.getElementById('contentArea');
    const displayRequested = requestedAmount ? `₹${requestedAmount}` : 'Not Specified';
    
    contentArea.innerHTML = `
        <div class="form-container" style="max-width: 500px; border-top: 4px solid #27ae60;">
            <h2>Renew Project: ${projectId}</h2>
            <p style="color: #444; margin-bottom: 20px; font-size: 1.1em;">Faculty requested: <strong style="color:#27ae60;">${displayRequested}</strong></p>
            
            <form onsubmit="handleApproveFund(event, ${reqId})">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="approved_amount" style="font-weight:bold;">Final Amount to Allocate (₹):</label>
                    <input type="number" id="approved_amount" value="${requestedAmount}" required min="0" style="width:100%; padding:10px; font-size:1.1em;">
                </div>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="new_expiry_date" style="font-weight:bold;">New Expiry Date:</label>
                    <input type="date" id="new_expiry_date" required style="width:100%; padding:10px; font-size:1.1em;">
                    <small style="color:#888; display:block; margin-top:5px;">This will officially revive the project if it was expired.</small>
                </div>
                
                <button type="submit" style="background-color: #27ae60; padding: 10px 20px; border:none; color:white; border-radius:4px; font-weight:bold; cursor:pointer;">Confirm Renewal</button>
                <button type="button" onclick="showFundRequests()" style="background-color: #95a5a6; padding: 10px 20px; border:none; color:white; border-radius:4px; font-weight:bold; cursor:pointer; margin-left:10px;">Cancel</button>
            </form>
        </div>
    `;
}

async function handleApproveFund(event, reqId) {
    event.preventDefault();
    const token = getCookie();
    const approvedAmount = document.getElementById('approved_amount').value;
    const newExpiryDate = document.getElementById('new_expiry_date').value; // Get the date
    const btn = event.target.querySelector('button[type="submit"]');

    btn.innerHTML = "Processing...";
    btn.disabled = true;

    try {
        const response = await fetch('http://'+host+':8000/admin/approve_extra_fund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token: token, 
                req_id: reqId, 
                approved_amount: parseInt(approvedAmount),
                new_expiry_date: newExpiryDate // Send the new date!
            })
        });
        const result = await response.json();

        if (result.message.includes("successfully")) {
            showSuccessMessage(result.message);
            showFundRequests(); 
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        displayError(`Failed to approve funds: ${error.message}`);
        btn.innerHTML = "Confirm Renewal";
        btn.disabled = false;
    }
}
async function handleRejectFund(reqId) {
    if (!confirm('Are you sure you want to REJECT this extra fund request?')) return;

    const token = getCookie();
    try {
        const response = await fetch('http://'+host+':8000/admin/reject_extra_fund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, req_id: reqId })
        });
        const result = await response.json();

        if (result.message.includes("successfully")) {
            showSuccessMessage("Fund request rejected.");
            showFundRequests();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        displayError(`Failed to reject funds: ${error.message}`);
    }
}