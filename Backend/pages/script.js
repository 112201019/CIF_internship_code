host='localhost'

function setCookie(name, value, days = 1) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// FIXED: Returns the VALUE of the first cookie found
function getCookie() {
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();
    if (cookie) {
      // split("=")[1] gets the VALUE (the token)
      // split("=")[0] gets the NAME (which was your bug)
      const parts = cookie.split("=");
      if (parts.length >= 2) {
          return parts[1]; // Return the token value
      }
    }
  }
  return null;
}
function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
// --- DATE FORMATTER HELPER ---
function formatSlotTime(isoString) {
  if (!isoString) return "N/A";
  const startDate = new Date(isoString);
  
  // Calculate End Time (Assuming 1 hour duration per slot)
  // If your slots are different (e.g., 30 mins), change 60 to 30
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 

  const options = { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  };
  
  const startStr = startDate.toLocaleDateString('en-US', options);
  const endStr = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return `${startStr} - ${endStr}`;
}
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission

    const username = document.getElementById("usernameInput").value;
    const password = document.getElementById("passwordInput").value;

    try {
      const response = await login(username, password); // 1. Call API, get new token

      if (response.message === "Cookie is set on the browser") {
        
        // --- Handle Cookie Management ---
        const oldToken = getCookie(); 
        if (oldToken) {
          deleteCookie(oldToken); 
        }
        setCookie(response.Token, response.Token); 

        // --- NEW REDIRECT LOGIC ---
        // Check the role *immediately* to decide where to go
        const roleResponse = await fetch("http://" + host + ":8000/is_member_of", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: response.Token }),
        });
        
        const roleData = await roleResponse.json();
        const role = roleData.message;

        // Redirect directly to the correct page
        if (role === "admin") {
            window.location.href = "admin_dashboard.html";
        } else if (role === "faculty") {
            window.location.href = "faculty.html";
        } else if (role === "staff") {
            window.location.href = "staff.html";
        } else {
            // Default to student dashboard
            window.location.href = "main.html"; 
        }
        
      } else {
        alert("Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Error occurred during login:", error);
      alert("An error occurred during login. Please try again later.");
    }
  });

async function login(username, password) {
  const response = await fetch("http://" + host + ":8000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
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

async function show_current_user() {
  const token = getCookie();
  const response = await fetch("http://" + host + ":8000/current_user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
  const response_data = await response.json();
  // console.log(response_data)
  // alert(response_data.message)
  // <div class="current-user">show current user:-</div>
  // Write the current user to the page
  const currentUser = document.querySelector(".current-user");
  currentUser.textContent = `User: ${response_data.message}`;
}
async function fetchAndDisplayEquipments() {
    const token = getCookie("session_token") || getCookie();
    if (!token) return;

    try {
        const response = await fetch("http://" + host + ":8000/show_all_equipments", {
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ token })
        });
        const data = await response.json();
        const tbody = document.getElementById("equipmentTableBody");
        
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!data.message || data.message.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:50px; color:#94a3b8; font-style:italic;">No equipment currently available.</td></tr>`;
            return;
        }

        data.message.forEach(eq => {
            const row = document.createElement("tr");
            
            // Add a subtle bottom border and a nice hover effect
            row.style.borderBottom = "1px solid #f1f5f9";
            row.style.transition = "background-color 0.2s";
            row.onmouseover = () => row.style.backgroundColor = "#f8fafc";
            row.onmouseout = () => row.style.backgroundColor = "transparent";

            // Increase padding to 22px top/bottom and 25px left/right
            row.innerHTML = `
                <td style="padding: 22px 25px; color: #334155; font-weight: 500; font-size: 15px;">
                    ${eq.equipment_name}
                </td>
                <td style="padding: 22px 25px; text-align: center;">
                    <button class="book-button" 
                            style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; width: 100%; transition: all 0.2s; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);"
                            onmouseover="this.style.backgroundColor='#059669'; this.style.transform='translateY(-1px)';" 
                            onmouseout="this.style.backgroundColor='#10b981'; this.style.transform='translateY(0)';"
                            onclick="window.location.href='booking.html?equipment=${encodeURIComponent(eq.equipment_name)}'">
                        Book Now
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error fetching equipment:", err);
        const tbody = document.getElementById("equipmentTableBody");
        if(tbody) tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:40px; color:#ef4444;">Failed to load equipment.</td></tr>`;
    }
}
// Placeholder function for booking logic
function bookEquipment(equipmentName) {
  //   go to the booking page
  window.location.href = "booking.html?equipment=" + equipmentName;
}

function trackRequest() {
  const token = getCookie();
  const requestIdInput = document.getElementById("requestIdInput");
  const requestId = requestIdInput.value;

  // Clear previous results
  document.getElementById("reqId").textContent = "";
  document.getElementById("reqDate").textContent = "";
  document.getElementById("reqApproved").textContent = "";

  if (!requestId) {
    alert("Please enter a Request ID.");
    return;
  }

  const requestData = {
    token: token,
    request_id: parseInt(requestId),
  };

  // Fetch data from the server
  fetch("http://" + host + ":8000/check_status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message === "ERROR") {
        const requestInfoDiv = document.getElementById("requestInfo");
        requestInfoDiv.classList.add("hidden");
        alert("Error fetching request status.");
      } else {
        const requestInfoDiv = document.getElementById("requestInfo");
        requestInfoDiv.classList.remove("hidden");
        // console.log(data.message[0].status);
        // Update the DOM with fetched data
        document.getElementById("reqId").textContent = requestId;
        document.getElementById("reqDate").textContent =
          new Date().toLocaleDateString();
        document.getElementById("reqApproved").textContent =
          data.message[0].status;
      }
    })
    .catch((error) => {
      alert("An error occurred while fetching request status.");
      console.error(error);
    });
}

// for supervisor show all pendng requests
// <div id="showPendingSuper"></div>
function showPendingRequestsSuper() {
  const token = getCookie();
  fetch("http://" + host + ":8000/show_requests_supervisor", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token }),
  })
  .then((response) => response.json())
  .then((data) => {
      const container = document.getElementById("showPendingSuper");
      if (!container) return;
      container.innerHTML = "";
      
      if (!data.message || data.message.length === 0) {
          container.innerHTML = "<p style='color:#777; font-style:italic;'>No pending requests.</p>";
          return;
      }

      data.message.forEach((request) => {
          const tile = document.createElement('div');
          tile.className = "request-item";
          // Flexbox ensures the button is pushed to the right side
          tile.style = "display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border-left: 4px solid #2980b9; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 10px; border-radius: 6px;";
          
          tile.innerHTML = `
              <div style="flex: 1;">
                  <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size:16px;">
                    ${request.student_name} <span style="font-size:13px; color:#7f8c8d; font-weight:normal;">(${request.student_id})</span>
                  </h4>
                  <p style="margin: 0; font-size: 14px; color: #555;">
                      <strong>Project ID:</strong> <span style="color:#2980b9;">${request.project_id}</span> &nbsp;|&nbsp; 
                      <strong>Equipment:</strong> ${request.equipment_name} <span style="color:#777;">(${request.equipment_id})</span>
                  </p>
              </div>
          `;
          
          const btnDiv = document.createElement('div');
          const viewBtn = document.createElement('button');
          viewBtn.className = "action-btn";
          viewBtn.style.background = "#34495e";
          viewBtn.style.padding = "8px 15px";
          viewBtn.style.fontSize = "13px";
          viewBtn.innerText = "More Info";
          viewBtn.onclick = () => openRequestModal(request, "supervisor"); 
          
          btnDiv.appendChild(viewBtn);
          tile.appendChild(btnDiv);
          container.appendChild(tile);
      });
  });
}

function showPendingRequestsIn() {
  const token = getCookie();
  fetch("http://" + host + ":8000/show_requests_faculty_incharge", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token }),
  })
  .then((response) => response.json())
  .then((data) => {
      const container = document.getElementById("showPendingIn");
      if (!container) return;
      container.innerHTML = "";
      
      if (!data.message || data.message.length === 0) {
          container.innerHTML = "<p style='color:#777; font-style:italic;'>No pending requests.</p>";
          return;
      }

      data.message.forEach((request) => {
          const tile = document.createElement('div');
          tile.className = "request-item";
          // Flexbox ensures the button is pushed to the right side
          tile.style = "display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border-left: 4px solid #16a085; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 10px; border-radius: 6px;";
          
          tile.innerHTML = `
              <div style="flex: 1;">
                  <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size:16px;">
                    ${request.student_name} <span style="font-size:13px; color:#7f8c8d; font-weight:normal;">(${request.student_id})</span>
                  </h4>
                  <p style="margin: 0; font-size: 14px; color: #555;">
                      <strong>Supervisor:</strong> <span style="color:#16a085;">${request.supervisor_name}</span> &nbsp;|&nbsp; 
                      <strong>Equipment:</strong> ${request.equipment_name} <span style="color:#777;">(${request.equipment_id})</span>
                  </p>
              </div>
          `;
          
          const btnDiv = document.createElement('div');
          const viewBtn = document.createElement('button');
          viewBtn.className = "action-btn";
          viewBtn.style.background = "#34495e";
          viewBtn.style.padding = "8px 15px";
          viewBtn.style.fontSize = "13px";
          viewBtn.innerText = "More Info";
          viewBtn.onclick = () => openRequestModal(request, "faculty"); 
          
          btnDiv.appendChild(viewBtn);
          tile.appendChild(btnDiv);
          container.appendChild(tile);
      });
  });
}

function approveRequest(requestId, btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = `Approving...`; btn.disabled = true;

  fetch("http://" + host + ":8000/decide_by_super_visor", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: getCookie(), request_id: requestId, decision: "approved" }),
  }).then(r => r.json()).then(data => {
      showPendingRequestsSuper();
      closeRequestModal(); 
  }).catch(e => { alert("Error"); btn.innerHTML = originalText; btn.disabled = false; });
}

function rejectRequest(requestId, btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = `Rejecting...`; btn.disabled = true;

  fetch("http://" + host + ":8000/decide_by_super_visor", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: getCookie(), request_id: requestId, decision: "rejected" }),
  }).then(r => r.json()).then(data => {
      showPendingRequestsSuper();
      closeRequestModal();
  }).catch(e => { alert("Error"); btn.innerHTML = originalText; btn.disabled = false; });
}

function openRequestModal(req, role) {
    const body = document.getElementById('requestModalBody');
    const actions = document.getElementById('requestModalActions');
    
    let details = {};
    try {
        details = typeof req.request_data === 'string' ? JSON.parse(req.request_data) : (req.request_data || {});
    } catch(e) { console.error("JSON parse error", e); }

    // Removed the fallback hacks because the backend now sends clean JOINed data!
    let html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #eee;">
            <div><strong style="color:#7f8c8d; font-size:12px; display:block;">REQUEST ID</strong> ${req.request_id}</div>
            <div><strong style="color:#7f8c8d; font-size:12px; display:block;">STUDENT</strong> ${req.student_name} (${req.student_id})</div>
            <div><strong style="color:#7f8c8d; font-size:12px; display:block;">DEPARTMENT</strong> ${req.department || 'N/A'}</div>
            <div><strong style="color:#7f8c8d; font-size:12px; display:block;">EMAIL</strong> <a href="mailto:${req.mail_id}" style="color:#3498db; text-decoration:none;">${req.mail_id || 'N/A'}</a></div>
            
            ${role === 'faculty' ? `<div><strong style="color:#7f8c8d; font-size:12px; display:block;">SUPERVISOR</strong> ${req.supervisor_name}</div>` : ''}
            
            <div><strong style="color:#7f8c8d; font-size:12px; display:block;">PROJECT ID</strong> ${req.project_id || 'N/A'}</div>
        </div>
        
        <h4 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-bottom: 15px; color:#2c3e50;">Booking Specifics</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
            <div><strong>Equipment:</strong> ${req.equipment_name} (${req.equipment_id})</div>
            <div><strong>Slot Time:</strong> ${req.slot_time}</div>
            <div><strong>Starting Slot ID:</strong> ${req.slot_id}</div>
            <div><strong>Slot Count:</strong> ${req.slot_count} (Unit: ${req.unit_time})</div>
        </div>
    `;

    if (details.requirements && details.requirements.length > 0) {
        html += `<h4 style="margin-bottom: 5px; color:#2c3e50;">Requirements</h4>
                 <ul style="margin-top:0; padding-left: 20px; margin-bottom: 15px;">
                    ${details.requirements.map(r => `<li>${r}</li>`).join('')}
                 </ul>`;
    }
    
    if (details.answers && Object.keys(details.answers).length > 0) {
        html += `<h4 style="margin-bottom: 5px; color:#2c3e50;">Additional Info</h4>
                 <ul style="margin-top:0; padding-left: 20px; margin-bottom: 15px;">
                    ${Object.entries(details.answers).map(([q, a]) => `<li><strong>${q}:</strong> ${a}</li>`).join('')}
                 </ul>`;
    }

    if (req.comment) {
        html += `<div style="background:#fff3e0; padding:15px; border-left: 4px solid #e67e22; margin-bottom: 15px; border-radius:0 4px 4px 0;">
                    <strong style="color:#d35400;">User Comment:</strong><br> ${req.comment}
                 </div>`;
    }

    body.innerHTML = html;

    // Inside your existing openRequestModal function...
    // Replace the bottom IF/ELSE statement with this:

    if (role === 'supervisor') {
        actions.innerHTML = `
            <button class="action-btn" style="flex: 1; background: #27ae60; padding:12px; font-size: 15px;" onclick="approveRequest(${req.request_id}, this)">Approve Request</button>
            <button class="action-btn" style="flex: 1; background: #e74c3c; padding:12px; font-size: 15px;" onclick="rejectRequest(${req.request_id}, this)">Reject Request</button>
        `;
    } else if (role === 'faculty') {
        actions.innerHTML = `
            <button class="action-btn" style="flex: 1; background: #27ae60; padding:12px; font-size: 15px;" onclick="approveRequestIN(${req.request_id}, this)">Approve Request</button>
            <button class="action-btn" style="flex: 1; background: #e74c3c; padding:12px; font-size: 15px;" onclick="rejectRequestIN(${req.request_id}, this)">Reject Request</button>
        `;
    } else if (role === 'staff') {
        // Staff-specific dynamic action buttons
        actions.innerHTML = `
            <button class="action-btn" style="flex: 1; background: #27ae60; padding:12px; font-size: 15px;" onclick="approveRequestStaff(${req.request_id}, this)">Approve Request</button>
            <button class="action-btn" style="flex: 1; background: #e74c3c; padding:12px; font-size: 15px;" onclick="rejectRequestStaff(${req.request_id}, this)">Reject Request</button>
        `;
    }
    
    document.getElementById('requestDetailsModal').style.display = 'block';
}

function closeRequestModal() {
    document.getElementById('requestDetailsModal').style.display = 'none';
}

// --- UPDATE EXISTING APPROVAL FUNCTIONS TO CLOSE MODAL ---

// --- FACULTY INCHARGE DECISIONS ---
function approveRequestIN(requestId, btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = `Approving...`; btn.disabled = true;

  fetch("http://" + host + ":8000/decide_by_faculty_incharge", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: getCookie(), request_id: requestId, decision: "approved" }),
  }).then(r => r.json()).then(data => {
      showPendingRequestsIn();
      closeRequestModal();
  }).catch(e => { alert("Error"); btn.innerHTML = originalText; btn.disabled = false; });
}

function rejectRequestIN(requestId, btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = `Rejecting...`; btn.disabled = true;

  fetch("http://" + host + ":8000/decide_by_faculty_incharge", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: getCookie(), request_id: requestId, decision: "rejected" }),
  }).then(r => r.json()).then(data => {
      showPendingRequestsIn();
      closeRequestModal();
  }).catch(e => { alert("Error"); btn.innerHTML = originalText; btn.disabled = false; });
}
// Staff
function showPendingRequestsStaff() {
  const token = getCookie();
  fetch("http://" + host + ":8000/show_requests_staff_incharge", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token }),
  })
  .then((response) => response.json())
  .then((data) => {
      const container = document.getElementById("showPendingStaff");
      if (!container) return;
      container.innerHTML = "";
      
      if (!data.message || data.message.length === 0) {
          container.innerHTML = "<p style='color:#777; font-style:italic;'>No pending requests.</p>";
          return;
      }

      data.message.forEach((request) => {
          const tile = document.createElement('div');
          tile.className = "request-item";
          // Purple border-left to match the Staff Theme
          tile.style = "display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border-left: 4px solid #8e44ad; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 10px; border-radius: 6px;";
          
          tile.innerHTML = `
              <div style="flex: 1;">
                  <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size:16px;">
                    ${request.student_name} <span style="font-size:13px; color:#7f8c8d; font-weight:normal;">(${request.student_id})</span>
                  </h4>
                  <p style="margin: 0; font-size: 14px; color: #555;">
                      <strong>Project ID:</strong> <span style="color:#8e44ad;">${request.project_id}</span> &nbsp;|&nbsp; 
                      <strong>Equipment:</strong> ${request.equipment_name} <span style="color:#777;">(${request.equipment_id})</span>
                  </p>
              </div>
          `;
          
          const btnDiv = document.createElement('div');
          const viewBtn = document.createElement('button');
          viewBtn.className = "action-btn";
          viewBtn.style.background = "#34495e";
          viewBtn.style.padding = "8px 15px";
          viewBtn.style.fontSize = "13px";
          viewBtn.innerText = "More Info";
          
          // CRITICAL: We pass the role 'staff' so the modal generates the correct Approve/Reject buttons
          viewBtn.onclick = () => openRequestModal(request, "staff"); 
          
          btnDiv.appendChild(viewBtn);
          tile.appendChild(btnDiv);
          container.appendChild(tile);
      });
  });
}

function approveRequestStaff(requestId, btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> Approving...`;
  btn.classList.add("btn-loading");
  btn.disabled = true;

  const token = getCookie();
  fetch("http://" + host + ":8000/decide_by_staff_incharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, request_id: requestId, decision: "approved" }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request approved successfully.");
      showPendingRequestsStaff();
      closeRequestModal();
    })
    .catch((error) => {
      alert("An error occurred while approving the request.");
      console.error(error);
      btn.innerHTML = originalText;
      btn.classList.remove("btn-loading");
      btn.disabled = false;
    });
}

function rejectRequestStaff(requestId, btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> Rejecting...`;
  btn.classList.add("btn-loading");
  btn.disabled = true;

  const token = getCookie();
  fetch("http://" + host + ":8000/decide_by_staff_incharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, request_id: requestId, decision: "rejected" }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request rejected successfully.");
      showPendingRequestsStaff();
      closeRequestModal();
    })
    .catch((error) => {
      alert("An error occurred while rejecting the request.");
      console.error(error);
      btn.innerHTML = originalText;
      btn.classList.remove("btn-loading");
      btn.disabled = false;
    });
}
async function showRequestsAll() {
  const token = getCookie("session_token") || getCookie();
  if(!token) return;

  try {
    const response = await fetch("http://" + host + ":8000/show_requests_student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token }),
      }
    );
    const data = await response.json();
    const container = document.getElementById("requestInfo2");
    
    if(container) {
        container.innerHTML = "";
        
        if (!data.message || data.message.length === 0) {
            container.innerHTML = "<p style='color:#777; font-style:italic;'>You have no booking requests.</p>";
            return;
        }

        data.message.forEach((request) => {
          const tile = document.createElement("div");
          tile.className = "request-item";
          
          let statusColor = "#f39c12"; // Orange for pending
          if(request.status === 'approved') statusColor = "#27ae60"; // Green
          if(request.status === 'rejected') statusColor = "#e74c3c"; // Red

          tile.style = `display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border-left: 4px solid ${statusColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 10px; border-radius: 6px;`;

          // Using JSON.stringify.replace to safely pass the object to the onclick handler
          const safeReqData = JSON.stringify(request).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

          tile.innerHTML = `
              <div style="flex: 1;">
                  <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size:16px;">
                    ${request.equipment_name} <span style="font-size:13px; color:#7f8c8d; font-weight:normal;">(${request.equipment_id})</span>
                  </h4>
                  <p style="margin: 0; font-size: 14px; color: #555;">
                      <strong>Project ID:</strong> <span style="color:#3498db;">${request.project_id}</span> &nbsp;|&nbsp; 
                      <strong>Date:</strong> ${formatSlotTime(request.slot_time)}
                  </p>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                  <span style="background:${statusColor}; color:white; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">${request.status || 'Pending'}</span>
                  <button class="action-btn" style="background:#34495e; padding:6px 12px; font-size:12px;" onclick="openStudentModal(${safeReqData})">More Info</button>
              </div>
          `;
          container.appendChild(tile);
        });
    }
  } catch (error) {
    console.error(error);
  }
}

async function checkUser() {
  const token = getCookie();
  if (!token) {
    console.log("No token found - user needs to log in");
    return;
  }

  //   const response = fetch("http://10.32.9.245:8000/is_member_of", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ token }),
  //   });

  //   const data = response.json();
  //   const message = data.message;
  //   console.log(message);
  try {
    const response = await fetch("http://" + host + ":8000/is_member_of", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    const message = data.message;
    console.log(message);
    if (message === "faculty") {
      window.location.href = "faculty.html";
    } else if (message === "staff") {
      window.location.href = "staff.html";
    }
    else if (message === "admin") {
      window.location.href = 'admin_dashboard.html';
    }
    // if (message === "student") {
    //     window.location.href = "student.html";
    // } else if (message === "faculty") {
    //     window.location.href = "faculty.html";
    // } else if (message === "admin") {
    //     window.location.href = "admin.html";
    // } else {
    //     window.location.href = "login.html";
    // }
  } catch (error) {
    console.error("Error occurred during user check:", error);
    // Don't show alert for token validation errors - just log it
    console.log("Token validation failed - user may need to log in again");
  }
}

async function handleAddSlot(event) {
  // 1. Prevent the form from submitting and reloading the page
  event.preventDefault();
  console.log("Reached here");

  const responseDiv = document.getElementById("responseMessage");
  responseDiv.textContent = ""; // Clear previous messages

  // 2. Get the values from the form inputs
  const equipmentId = document.getElementById("equipmentId").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;

  // --- NEW: Failsafe Validation Check ---
  if (!equipmentId || !startTime || !endTime) {
    responseDiv.textContent = "Error: Please fill out all fields.";
    responseDiv.style.color = "red";
    return;
  }

  // 3. IMPORTANT: We use your existing getCookie() function
  const token = getCookie();

  if (!token) {
    responseDiv.textContent =
      "Error: No authentication token found. Please log in again.";
    responseDiv.style.color = "red";
    return;
  }

  // 4. Prepare the data payload to send to the API
  const slotData = {
    token: token,
    equipment_id: equipmentId,
    start_time: startTime,
    end_time: endTime,
  };

  // 5. Send the data to your FastAPI endpoint
  try {
    const response = await fetch("http://" + host + ":8000/insert_slot_staff_incharge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slotData),
    });

    const result = await response.json();

    if (response.ok) {
      // Success! Display the success message
      responseDiv.textContent = result.message;
      responseDiv.style.color = "green";
      // We can access the form via the button's event object to reset it
      event.target.reset();
    } else {
      // Error! Display the error message
      responseDiv.textContent = `Failed: ${result.message}`;
      responseDiv.style.color = "red";
    }
  } catch (error) {
    // This catches network errors
    console.error("Submission failed:", error);
    responseDiv.textContent =
      "An error occurred. Unable to connect to the server.";
    responseDiv.style.color = "red";
  }
}

async function showMyProjects() {
  const token = getCookie();
  const container = document.getElementById("myProjectsContainer");
  container.innerHTML = "<p>Loading projects...</p>";

  if (!token) {
    container.innerHTML = "<p style='color: red;'>Authentication error. Please log in again.</p>";
    return;
  }

  try {
    const response = await fetch("http://" + host + ":8000/faculty/my_projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();

    if (!response.ok || !Array.isArray(data.message)) {
      throw new Error(data.message || "Failed to fetch project data.");
    }

    if (data.message.length === 0) {
      container.innerHTML = "<p>You have not submitted any projects yet.</p>";
      return;
    }

    // Build the table with the new Actions column
    let tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background-color: #f4f4f4;">
            <th style="border: 1px solid #ddd; padding: 10px;">Title</th>
            <th style="border: 1px solid #ddd; padding: 10px;">Type</th> 
            <th style="border: 1px solid #ddd; padding: 10px;">Status</th>
            <th style="border: 1px solid #ddd; padding: 10px;">Funds</th>
            <th style="border: 1px solid #ddd; padding: 10px;">Expiry Date</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.message.forEach(project => {
      const funds = project.status === 'approved' ? `₹${project.money}` : 'N/A';
      const expiry = project.status === 'approved' ? (project.expiry_date || 'N/A') : 'N/A';

      let statusColor = '#f39c12'; // Pending
      if (project.status === 'approved') statusColor = '#27ae60'; // Approved
      if (project.status === 'rejected') statusColor = '#e74c3c'; // Rejected

      const projectTypeDisplay = project.project_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

      // Only show the Request Funds button if the project is actually approved!
      let actionBtn = "";
      if (project.status === 'approved' || project.status === 'expired') {
          actionBtn = `<button onclick="openFundModal('${project.project_id}')" style="background-color:#3498db; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;">+ Request Funds</button>`;
      } else {
          actionBtn = `<span style="color:#aaa; font-size:12px; font-style:italic;">Unavailable</span>`;
      }

      tableHtml += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 10px;">${project.project_title}</td>
          <td style="border: 1px solid #ddd; padding: 10px;">${projectTypeDisplay}</td> 
          <td style="border: 1px solid #ddd; padding: 10px; color: ${statusColor}; text-transform: capitalize; font-weight: bold;">
            ${project.status}
          </td>
          <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">${funds}</td>
          <td style="border: 1px solid #ddd; padding: 10px;">${expiry}</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${actionBtn}</td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;

  } catch (error) {
    console.error("Error fetching projects:", error);
    container.innerHTML = `<p style='color: red;'>Error: ${error.message}</p>`;
  }
}


// --- PROJECT MODAL FUNCTIONS ---

/**
 * Opens the modal and fetches the department list from the server every time.
 */
async function openProjectModal() {
  const token = getCookie();
  if (!token) return;

  try {
    const response = await fetch("http://" + host + ":8000/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();

    if (Array.isArray(data.message)) {
      const deptDropdown = document.getElementById("department_id");
      deptDropdown.innerHTML = '<option value="" disabled selected>-- Select Department --</option>';
      data.message.forEach(dept => {
        const option = document.createElement("option");
        option.value = dept.department_id;
        option.textContent = dept.department_name;
        deptDropdown.appendChild(option);
      });
      document.getElementById("addProjectModal").style.display = "block";
    } else {
      alert("Could not load department list from the server.");
    }
  } catch (e) {
    alert("Error connecting to the server to get departments.");
  }
}

/**
 * Closes the project modal and resets the form.
 */
function closeProjectModal() {
  document.getElementById("addProjectModal").style.display = "none";
  document.getElementById("addProjectForm").reset();
  document.getElementById("departmentContainer").style.display = "none";
  document.getElementById("projectIdPreview").textContent = "";
  document.getElementById("project_id").value = "";
  document.getElementById("projectAddResult").textContent = "";
}

/**
 * Updates the Project ID field. Fetches the current user's ID every time it runs.
 */
async function updateProjectId() {
  const token = getCookie();
  let facultyId = null;

  // 1. Fetch the current user ID from the server
  try {
    const response = await fetch("http://" + host + ":8000/current_user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    if (data.message && data.message !== "NO CURRENT USER") {
      facultyId = data.message;
    } else {
      alert("Could not verify user. Please log in again.");
      return;
    }
  } catch (e) {
    alert("Error fetching user data from server.");
    return;
  }

  // 2. Generate the Project ID based on the fetched user ID
  const projectType = document.getElementById("project_type").value;
  const deptContainer = document.getElementById("departmentContainer");
  const projectIdInput = document.getElementById("project_id");

  let generatedId = "";
  projectIdInput.readOnly = true;
  projectIdInput.style.backgroundColor = "#e9ecef";

  if (projectType === "department_fund") {
    deptContainer.style.display = "block";
    const selectedDept = document.getElementById("department_id").value;
    if (selectedDept && facultyId) {
      generatedId = `${selectedDept}_${facultyId}`;
    }
  } else if (projectType === "cif_credit") {
    deptContainer.style.display = "none";
    if (facultyId) {
      generatedId = `cif_${facultyId}`;
    }
  } else if (projectType === "sponsored_project" || projectType === "industrial_consultancy") {
    deptContainer.style.display = "none";
    generatedId = "";
    projectIdInput.readOnly = false;
    projectIdInput.style.backgroundColor = "#fff";
  } else {
    deptContainer.style.display = "none";
  }

  projectIdInput.value = generatedId;
  document.getElementById("projectIdPreview").textContent = `Preview: ${generatedId}`;
}

/**
 * Closes the modal if the user clicks on the background overlay.
 */
// Ensure the background click closes BOTH modals
function closeModalIfOutside(event) {
  if (event.target.id === "addProjectModal") {
    closeProjectModal();
  }
  if (event.target.id === "requestDetailsModal") {
    closeRequestModal();
  }
}

/**
 * Handles the submission of the new project form.
 */
async function addNewProject(event) {
  event.preventDefault();
  const resultDiv = document.getElementById("projectAddResult");
  resultDiv.textContent = "Submitting...";
  resultDiv.style.color = "black";

  const token = getCookie();
  const projectId = document.getElementById("project_id").value.trim();
  const projectTitle = document.getElementById("project_title").value.trim();
  const projectType = document.getElementById("project_type").value;

  if (!projectId || !projectTitle || !projectType) {
    resultDiv.textContent = "All fields are required.";
    resultDiv.style.color = "red";
    return;
  }

  try {
    const checkResponse = await fetch("http://" + host + ":8000/project_exists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, project_id: projectId }),
    });
    const checkData = await checkResponse.json();

    if (checkData.exists) {
      resultDiv.textContent = `Error: Project with ID '${projectId}' already exists.`;
      resultDiv.style.color = "red";
      return;
    }

    const addResponse = await fetch("http://" + host + ":8000/add_project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, project_id: projectId, project_title: projectTitle, project_type: projectType }),
    });

    const result = await addResponse.json();
    resultDiv.textContent = result.message;

    if (addResponse.ok) {
      resultDiv.style.color = "green";
      showMyProjects(); // Refresh the project list on the main page
      setTimeout(closeProjectModal, 1500); // Close the modal after a short delay
    } else {
      resultDiv.style.color = "red";
    }
  } catch (error) {
    resultDiv.textContent = `A client-side error occurred: ${error.message}`;
    resultDiv.style.color = "red";
  }
}

async function loadOngoingExperiments() {
  const token = getCookie();
  if (!token) return;

  try {
    const res = await fetch("http://" + host + ":8000/get_ongoing_experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token }),
    });
    
    const data = await res.json();
    const container = document.getElementById("ongoingExperimentsList");
    container.innerHTML = "";

    if (!data.message || data.message.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#777;'>No ongoing experiments.</p>";
        return;
    }

    data.message.forEach(exp => {
      const div = document.createElement("div");
      div.className = "request-item";
      
      // FIX: Grab project_id securely
      const pId = exp.project_id || 'N/A';
      
      div.innerHTML = `
        <div class="req-header" style="border-bottom: 1px solid #ccc; padding-bottom:5px; margin-bottom:5px;">
            <strong>Request ID: ${exp.request_id}</strong>
        </div>
        <p style="margin:5px 0;"><strong>Equipment:</strong> ${exp.equipment_name}</p>
        <p style="margin:5px 0;"><strong>Scheduled:</strong> ${exp.slot_time}</p>
        <p style="margin:5px 0;"><strong>Project ID:</strong> ${pId}</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
        
        <div class="form-group">
          <label style="font-size:0.9em; font-weight:bold;">Extra Charges (if any):</label>
          <input type="number" id="extra_amt_${exp.request_id}" value="0" min="0" style="width:100%; padding:5px;">
        </div>
        
        <div class="form-group">
          <label style="font-size:0.9em; font-weight:bold;">Reason/Notes:</label>
          <input type="text" id="extra_reason_${exp.request_id}" placeholder="e.g. Broken Glassware" style="width:100%; padding:5px;">
        </div>
        
        <div style="display:flex; gap:10px; margin-top:10px;">
            <button class="btn btn-success" 
                onclick="finalizeAndBill(${exp.request_id}, '${pId}')"
                style="flex:1; background-color:#27ae60; color:white; padding:10px; border:none; cursor:pointer;">
              Complete
            </button>
            <button class="btn btn-danger" 
                onclick="cancelOngoingExperiment(${exp.request_id})"
                style="flex:1; background-color:#c0392b; color:white; padding:10px; border:none; cursor:pointer;">
              Cancel
            </button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading experiments:", error);
  }
}

async function finalizeAndBill(reqId, projId) {
  if (!confirm("Mark this experiment as completed? Any extra charges entered will be deducted now.")) {
      return;
  }

  const token = getCookie();
  const extraAmount = document.getElementById(`extra_amt_${reqId}`).value;
  const reason = document.getElementById(`extra_reason_${reqId}`).value;

  try {
    const response = await fetch("http://" + host + ":8000/finalize_experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
          token: token, 
          request_id: reqId, 
          project_id: projId,
          extra_charges: parseInt(extraAmount), 
          notes: reason 
      }),
    });
    
    const result = await response.json();
    alert(result.message);
    loadOngoingExperiments(); // Refresh list
    
  } catch (error) {
    console.error("Error finalizing:", error);
    alert("An error occurred.");
  }
}
async function cancelOngoingExperiment(reqId) {
  if (!confirm("Are you sure you want to CANCEL this experiment? This will refund the cost, free the slots, and mark the request as rejected.")) {
      return;
  }

  const token = getCookie();
  try {
    const response = await fetch("http://" + host + ":8000/cancel_experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
          token: token, 
          request_id: reqId
      }),
    });
    
    const result = await response.json();
    
    if (result.message.includes("ERROR")) {
        alert(result.message);
    } else {
        alert(result.message);
        loadOngoingExperiments(); // Refresh list to remove the cancelled item
    }
    
  } catch (error) {
    console.error("Error cancelling:", error);
    alert("An error occurred while connecting to the server.");
  }
}

async function openProfileModal() {
    const token = getCookie();
    
    // Fetch profile data
    const res = await fetch("http://" + host + ":8000/get_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
    });
    const data = await res.json();
    
    if (data.message !== "success") {
        alert(data.message);
        return;
    }
    
    const user = data.data;

    // Create modal dynamically
    const modalHtml = `
        <div id="profileModal" class="modal" style="display:block; position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%; background-color:rgba(0,0,0,0.5);">
            <div class="modal-content" style="background-color:#fff; margin:5% auto; padding:30px; border-radius:8px; width:90%; max-width:400px; position:relative; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <span onclick="document.getElementById('profileModal').remove()" style="position:absolute; right:20px; top:15px; font-size:24px; cursor:pointer;">&times;</span>
                <h2 style="margin-top:0; color:#2c3e50;">My Profile</h2>
                <p style="color:#666; font-size:13px; margin-bottom:20px;">For security reasons, you can only update your Email and Password.</p>
                <form id="profileForm" onsubmit="handleProfileUpdate(event)">
                    <div style="margin-bottom:15px;">
                        <label style="display:block; margin-bottom:5px; font-weight:600;">ID</label>
                        <input type="text" value="${user.id}" disabled style="width:100%; padding:10px; background:#e9ecef; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block; margin-bottom:5px; font-weight:600;">Name</label>
                        <input type="text" value="${user.name}" disabled style="width:100%; padding:10px; background:#e9ecef; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block; margin-bottom:5px; font-weight:600;">Department</label>
                        <input type="text" value="${user.department}" disabled style="width:100%; padding:10px; background:#e9ecef; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block; margin-bottom:5px; font-weight:600;">Email</label>
                        <input type="email" id="prof_email" value="${user.mail_id}" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom:25px;">
                        <label style="display:block; margin-bottom:5px; font-weight:600;">Password</label>
                        <input type="text" id="prof_pwd" value="${user.password}" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                    </div>
                    <button type="submit" style="width:100%; padding:12px; background:#3498db; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Update Profile</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> Updating...`;
    btn.classList.add("btn-loading");

    const token = getCookie();
    const mail_id = document.getElementById("prof_email").value;
    const password = document.getElementById("prof_pwd").value;

    try {
        const res = await fetch("http://" + host + ":8000/update_profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, mail_id, password })
        });
        const data = await res.json();
        alert(data.message);
        
        if (data.message.includes("successfully")) {
            document.getElementById('profileModal').remove();
        }
    } catch(err) {
        alert("Network Error: Could not update profile.");
    } finally {
        if(document.getElementById('profileModal')){
            btn.innerHTML = originalText;
            btn.classList.remove("btn-loading");
        }
    }
}

function openFundModal(projectId) {
    document.getElementById('fund_proj_id_display').textContent = projectId;
    document.getElementById('fund_proj_id').value = projectId;
    document.getElementById('fundRequestModal').style.display = 'block';
}

function closeFundModal() {
    document.getElementById('fundRequestModal').style.display = 'none';
    document.getElementById('fundRequestForm').reset();
    // --- NEW: Fully reset the button and message for the next time it opens ---
    const btn = document.querySelector('#fundRequestForm button[type="submit"]');
    if (btn) {
        btn.innerHTML = "Submit Request";
        btn.disabled = false;
    }
    const resDiv = document.getElementById('fundRequestResult');
    if (resDiv) {
        resDiv.textContent = "";
    }
}

async function submitFundRequest(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button');
    const resDiv = document.getElementById('fundRequestResult');
    
    btn.innerHTML = "Submitting..."; 
    btn.disabled = true;
    resDiv.textContent = "";

    // Safely parse amount. If left blank, send null to the backend.
    let parsedAmount = parseInt(document.getElementById('fund_amount').value);
    if (isNaN(parsedAmount)) parsedAmount = null;

    const payload = {
        token: getCookie(),
        project_id: document.getElementById('fund_proj_id').value,
        requested_amount: parsedAmount,
        reason: document.getElementById('fund_reason').value
    };
    try {
        const res = await fetch("http://" + host + ":8000/faculty/request_extra_fund", {
            method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
        });
        const data = await res.json();
        const resDiv = document.getElementById('fundRequestResult');
        
        resDiv.textContent = data.message;
        resDiv.style.color = data.message.includes("successfully") ? "green" : "red";
        if(data.message.includes("successfully")) setTimeout(closeFundModal, 1500);
    } catch(e) {
        document.getElementById('fundRequestResult').textContent = "Network Error";
    }
}

// --- AUTO-LOAD STAFF EQUIPMENT DROPDOWN ---
async function loadStaffEquipmentDropdown() {
    const token = getCookie();
    const dropdown = document.getElementById("equipmentId");
    
    // If we aren't on the staff page (or the dropdown doesn't exist), just ignore and return
    if (!token || !dropdown) return;

    try {
        const response = await fetch("http://" + host + ":8000/staff/my_equipment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token })
        });
        const result = await response.json();
        
        if (result.message === "success" && result.data.length > 0) {
            dropdown.innerHTML = '<option value="" disabled selected>-- Select Equipment --</option>';
            result.data.forEach(eq => {
                const option = document.createElement("option");
                option.value = eq.equipment_id; // Submits the exact ID to the database
                option.textContent = `${eq.equipment_name.toUpperCase()} (${eq.equipment_id})`; // Shows a clean readable name
                dropdown.appendChild(option);
            });
        } else {
            dropdown.innerHTML = '<option value="" disabled>No equipment assigned to you</option>';
        }
    } catch (error) {
        console.error("Error loading equipment for dropdown:", error);
        dropdown.innerHTML = '<option value="" disabled>Error connecting to server</option>';
    }
}

// ==========================================
// STAFF SIDEBAR ROUTER LOGIC
// ==========================================
function switchSectionStaff(button) {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    const section = button.getAttribute('data-section');
    const contentArea = document.getElementById('contentArea');

    if (section === 'staff_approvals') {
        contentArea.innerHTML = `
            <div class="form-container" style="max-width: 100%;">
                <h2 style="border-bottom-color: #8e44ad;">Staff Approvals</h2>
                <p class="note">Finalize equipment requests from students after faculty approval.</p>
                <button class="action-btn" style="background:#8e44ad; margin-bottom: 15px;" onclick="showPendingRequestsStaff()">Refresh Requests</button>
                <div id="showPendingStaff" class="request-list"></div>
            </div>
        `;
        if (typeof showPendingRequestsStaff === "function") showPendingRequestsStaff();
    } 
    else if (section === 'ongoing_experiments') {
        contentArea.innerHTML = `
            <div class="form-container" style="max-width: 100%;">
                <h2 style="border-bottom-color: #e67e22;">Ongoing Experiments</h2>
                <p class="note">Manage currently running experiments, finalize them, and add extra charges if needed.</p>
                <button class="action-btn" style="background:#e67e22; margin-bottom: 15px;" onclick="loadOngoingExperiments()">Refresh List</button>
                <div id="ongoingExperimentsList" class="request-list"></div>
            </div>
        `;
        if (typeof loadOngoingExperiments === "function") loadOngoingExperiments();
    }
    else if (section === 'manage_slots') {
        contentArea.innerHTML = `
            <div class="form-container" style="max-width: 100%;">
                <h2 style="border-bottom-color: #27ae60;">Manage Equipment Slots</h2>
                <p class="note">Add new availability slots for the equipment you are assigned to.</p>
                <form id="addSlotForm" onsubmit="handleAddSlot(event)">
                    <div class="form-group">
                        <label for="equipmentId">Select Equipment:</label>
                        <select id="equipmentId" required></select>
                    </div>
                    <div class="form-group">
                        <label for="startTime">Start Time:</label>
                        <input type="datetime-local" id="startTime" required>
                    </div>
                    <div class="form-group">
                        <label for="endTime">End Time:</label>
                        <input type="datetime-local" id="endTime" required>
                    </div>
                    <button type="submit" class="action-btn" style="width: 100%;">Add Slot(s)</button>
                </form>
                <div id="responseMessage" style="margin-top:15px; font-weight:bold; text-align:center;"></div>
            </div>
        `;
        if (typeof loadStaffEquipmentDropdown === "function") loadStaffEquipmentDropdown();
    }
}

// ==========================================
// STUDENT SIDEBAR ROUTER LOGIC
// ==========================================
function switchSectionStudent(button) {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    const section = button.getAttribute('data-section');
    const contentArea = document.getElementById('contentArea');

    if (section === 'my_requests') {
        contentArea.innerHTML = `
            <div class="form-container" style="max-width: 100%;">
                <h2 style="border-bottom-color: #3498db;">My Requests</h2>
                <p class="note">Track the multi-tier approval status of your equipment bookings.</p>
                <button class="action-btn" style="background:#3498db; margin-bottom: 15px;" onclick="showRequestsAll()">Refresh Requests</button>
                <div id="requestInfo2" class="request-list"></div>
            </div>
        `;
        if (typeof showRequestsAll === "function") showRequestsAll();
    } 
    else if (section === 'book_equipment') {
        contentArea.innerHTML = `
            <div class="form-container" style="max-width: 800px; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-radius: 10px;">
                <h2 style="border-bottom-color: #27ae60; padding-bottom: 15px; color: #2c3e50;">Choose Equipment</h2>
                <p class="note" style="margin-bottom: 25px; font-size: 15px;">Select an instrument below to view available slots and begin the booking process.</p>
                
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 15px; background: white;">
                        <thead>
                            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 20px 25px; text-align: left; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px;">Equipment Name</th>
                                <th style="padding: 20px 25px; text-align: center; width: 160px; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="equipmentTableBody">
                            <tr><td colspan="2" style="text-align:center; padding:50px; color:#94a3b8;">Loading available equipment...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        if (typeof fetchAndDisplayEquipments === "function") fetchAndDisplayEquipments();
    }
}

function openStudentModal(req) {
    const body = document.getElementById('requestModalBody');
    const actions = document.getElementById('requestModalActions');
    
    let details = {};
    try {
        details = typeof req.request_data === 'string' ? JSON.parse(req.request_data) : (req.request_data || {});
    } catch(e) { console.error("JSON parse error", e); }

    let statusColor = "#f39c12"; 
    if(req.status === 'approved') statusColor = "#27ae60"; 
    if(req.status === 'rejected') statusColor = "#e74c3c"; 

    let html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #eee;">
            <div><strong style="color:#7f8c8d; font-size:12px; display:block;">REQUEST ID</strong> ${req.request_id}</div>
            <div><strong style="color:#7f8c8d; font-size:12px; display:block;">STATUS</strong> <span style="text-transform:uppercase; font-weight:bold; color:${statusColor};">${req.status}</span></div>
            <div><strong style="color:#7f8c8d; font-size:12px; display:block;">PROJECT ID</strong> ${req.project_id || 'N/A'}</div>
            <div><strong style="color:#7f8c8d; font-size:12px; display:block;">EST. COST DEDUCTED</strong> ₹${req.cost || 0}</div>
        </div>
        
        <h4 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-bottom: 15px; color:#2c3e50;">Booking Specifics</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
            <div><strong>Equipment:</strong> ${req.equipment_name} (${req.equipment_id})</div>
            <div><strong>Slot Time:</strong> ${formatSlotTime(req.slot_time)}</div>
            <div><strong>Starting Slot ID:</strong> ${req.slot_id}</div>
            <div><strong>Slot Count:</strong> ${req.slot_count} (Unit: ${req.unit_time})</div>
        </div>
    `;

    if (details.requirements && details.requirements.length > 0) {
        html += `<h4 style="margin-bottom: 5px; color:#2c3e50;">Selected Requirements</h4>
                 <ul style="margin-top:0; padding-left: 20px; margin-bottom: 15px;">
                    ${details.requirements.map(r => `<li>${r}</li>`).join('')}
                 </ul>`;
    }
    
    if (details.answers && Object.keys(details.answers).length > 0) {
        html += `<h4 style="margin-bottom: 5px; color:#2c3e50;">Additional Info Provided</h4>
                 <ul style="margin-top:0; padding-left: 20px; margin-bottom: 15px;">
                    ${Object.entries(details.answers).map(([q, a]) => `<li><strong>${q}:</strong> ${a}</li>`).join('')}
                 </ul>`;
    }

    if (req.comment) {
        html += `<div style="background:#eaf2f8; padding:15px; border-left: 4px solid #3498db; margin-bottom: 15px; border-radius:0 4px 4px 0;">
                    <strong style="color:#2980b9;">Your Comment:</strong><br> ${req.comment}
                 </div>`;
    }

    body.innerHTML = html;
    
    // Hide the grey action footer entirely since students only view data
    actions.style.display = 'none';
    
    document.getElementById('requestDetailsModal').style.display = 'block';
}