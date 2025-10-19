
function getCookie() {
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();
    // Check if the cookie is not empty
    if (cookie) {
      return cookie.split("=")[0];
    }
  }
  return null;
}
function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}



async function showSection(section) {
    try {
        const token = getCookie();
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`http://localhost:8000/show_all_${section}`, {
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
        console.log('Received data:', data); // Debug log

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
// New function to get item by index
function editItemByIndex(section, index) {
    const item = window.currentSectionData[index];
    // console.log('Editing item:', item); // Debug log
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
    document.querySelectorAll('.menu button').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
}

async function search() {
    const searchInput = document.getElementById('searchInput').value.trim();
    const currentSection = document.querySelector('.menu button.active')?.getAttribute('data-section');
    
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
        const response = await fetch('http://localhost:8000/admin/search', {
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
    const currentSection = document.querySelector('.menu button.active')?.getAttribute('data-section');
    if (!currentSection) {
        displayError('Please select a section first');
        return;
    }

    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = getAddForm(currentSection);
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
  const response = await fetch("http://localhost:8000/logout", {
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


// Add getAddForm function
function getAddForm(section) {
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
        ],
        equipment: [
            { id: 'equipment_id', label: 'Equipment ID', required: true },
            { id: 'equipment_name', label: 'Name', required: true },
            { id: 'location', label: 'Location', required: true },
            { id: 'staff_incharge_id', label: 'Staff In-charge', required: true },
            { id: 'faculty_incharge_id', label: 'Faculty In-charge', required: true }
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
                <input 
                    type="${field.type || 'text'}" 
                    id="${field.id}" 
                    name="${field.id}"
                    ${field.required ? 'required' : ''}
                >
            </div>
        `;
    });

    html += `
            <button type="submit">Add</button>
            <button type="button" onclick="cancelAdd()">Cancel</button>
        </form>
        </div>
    `;

    return html;
}

// Add handleAdd function
async function handleAdd(event, section) {
    event.preventDefault();
    const token = getCookie()
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    // Convert section to singular for matching form field IDs
    const singularSection = section.endsWith('s') ? section.slice(0, -1) : section;

    let requestBody;

    if (section === 'equipment') {
        requestBody = {
            token,
            user_type: section,
            equipment_id: data.equipment_id,
            equipment_name: data.equipment_name,
            location: data.location,
            staff_incharge_id: data.staff_incharge_id,
            faculty_incharge_id: data.faculty_incharge_id
        };
    } else {
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
    
    // console.log('Sending request:', requestBody);
    
    try {
        const response = await fetch('http://localhost:8000/admin/create_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        if (result.message === 'success') {
            showSuccessMessage('Added successfully');
            showSection(section);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        displayError(`Failed to add: ${error.message}`);
    }
}

// Add editItem function
async function editItem(section, item) {
    console.log('Editing item:', item); // Debug log
    console.log('Section:', section); // Debug log
    singularSection = section.endsWith('s') ? section.slice(0, -1) : section;
    const contentArea = document.getElementById('contentArea');
    const fields = {
        student: [
            {id: 'student_name', label: 'Name'},
            {id: 'super_visor_id', label: 'Supervisor ID'},
            {id: 'mail_id', label: 'Mail ID'},
            {id: 'department', label: 'Department'},
            {id: 'password', label: 'Password', type: 'password'}
        ],
        faculty: [
            {id: 'faculty_name', label: 'Name'},
            {id: 'mail_id', label: 'Mail ID'},
            {id: 'department', label: 'Department'},
            {id: 'password', label: 'Password', type: 'password'}
        ],
        staff: [
            {id: 'staff_name', label: 'Name'},
            {id: 'mail_id', label: 'Mail ID'},
            {id: 'department', label: 'Department'},
            {id: 'password', label: 'Password', type: 'password'}
        ],
        equipment: [
            {id: 'equipment_name', label: 'Name'},
            {id: 'location', label: 'Location'},
            {id: 'staff_incharge_id', label: 'Staff In-charge'},
            {id: 'faculty_incharge_id', label: 'Faculty In-charge'}
        ]
    };

    let html = `
        <div class="form-container">
            <h2>Edit ${section.charAt(0).toUpperCase() + section.slice(1)}</h2>
            <p class="note">* Leave fields empty to keep current values</p>
            <form id="editForm" onsubmit="handleEdit(event, '${section}', '${item[`${singularSection}_id`]}')">
    `;

    fields[section].forEach(field => {
        html += `
            <div class="form-group">
                <label for="${field.id}">${field.label}:</label>
                <input 
                    type="${field.type || 'text'}" 
                    id="${field.id}" 
                    name="${field.id}"
                    value="${item[field.id] || ''}"
                >
            </div>
        `;
    });

    html += `
            <button type="submit">Save Changes</button>
            <button type="button" onclick="cancelEdit()">Cancel</button>
        </form>
        </div>
    `;

    contentArea.innerHTML = html;
}

// Add handleEdit function
async function handleEdit(event, section, id) {
    event.preventDefault();
    if (!id) {
        displayError('Invalid ID');
        return;
    }

    const token = getCookie()
    const formData = new FormData(event.target);
    const updates = {};
    
    // Only include non-empty values
    for (let [key, value] of formData.entries()) {
        if (value.trim()) {
            updates[key] = value.trim();
        }
    }

    try {
        const response = await fetch('http://localhost:8000/admin/update_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token,
                user_type: section,
                user_id: id,
                updates: updates
            })
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


// Add utility functions
function showSuccessMessage(message) {
    const contentArea = document.getElementById('contentArea');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    contentArea.prepend(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

function cancelAdd() {
    const currentSection = document.querySelector('.menu button.active')?.getAttribute('data-section');
    if (currentSection) {
        showSection(currentSection);
    }
}
function cancelEdit() {
    const currentSection = document.querySelector('.menu button.active')?.getAttribute('data-section');
    if (currentSection) {
        showSection(currentSection);
    }
}

// // Update editItem function to make fields optional
// async function editItem(section, item) {
//     const contentArea = document.getElementById('contentArea');
//     const fields = {
//         student: [
//             {id: 'student_name', label: 'Name'},
//             {id: 'department', label: 'Department'},
//             {id: 'super_visor_id', label: 'Supervisor ID'}
//         ],
//         faculty: [
//             {id: 'faculty_name', label: 'Name'}        ],
//         staff: [
//             {id: 'staff_name', label: 'Name'}
//         ],
//         equipment: [
//             {id: 'equipment_name', label: 'Name'},
//             {id: 'location', label: 'Location'},
//             {id: 'staff_incharge', label: 'Staff In-charge'}
//         ]
//     };

//     let html = `
//         <div class="form-container">
//             <h2>Edit ${section.charAt(0).toUpperCase() + section.slice(1)}</h2>
//             <p class="note">* Leave fields empty to keep current values</p>
//             <form id="editForm" onsubmit="handleEdit(event, '${section}', '${item[`${section}_id`]}')">
//     `;

//     fields[section].forEach(field => {
//         html += `
//             <div class="form-group">
//                 <label for="${field.id}">${field.label}:</label>
//                 <input 
//                     type="${field.type || 'text'}" 
//                     id="${field.id}" 
//                     name="${field.id}"
//                     value="${item[field.id] || ''}"
//                 >
//             </div>
//         `;
//     });

//     html += `
//             <button type="submit">Save Changes</button>
//             <button type="button" onclick="cancelEdit()">Cancel</button>
//         </form>
//         </div>
//     `;

//     contentArea.innerHTML = html;
// }


// Update deleteItem function
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
        const response = await fetch('http://localhost:8000/admin/delete_user', {
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

// Add these functions to the end of admin.js

async function showProjectApprovals() {
    const token = getCookie();
    const contentArea = document.getElementById('contentArea');
    try {
        const response = await fetch('http://localhost:8000/admin/pending_projects', {
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
        const response = await fetch('http://localhost:8000/admin/approve_project', {
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
            showProjectApprovals(); // Refresh the list
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        displayError(`Failed to approve project: ${error.message}`);
    }
}

// Add this new function to the end of admin.js

async function handleRejection(projectId) {
    // Ask for confirmation before proceeding
    if (!confirm(`Are you sure you want to reject project ID: ${projectId}?`)) {
        return; // Stop if the user clicks "Cancel"
    }

    const token = getCookie();
    if (!token) {
        displayError("Authentication error. Please log in again.");
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/admin/reject_project', {
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
            showProjectApprovals(); // Refresh the list to remove the rejected project
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        displayError(`Failed to reject project: ${error.message}`);
    }
}

