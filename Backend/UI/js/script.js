// --- Cookie Functions ---
function setCookie(name, value, days = 1) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie() {
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();
    if (cookie) {
      return cookie.split("=")[0];
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// --- Login/User Functions ---
document
  .getElementById("loginForm")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission

    const username = document.getElementById("usernameInput").value;
    const password = document.getElementById("passwordInput").value;

    try {
      const response = await login(username, password);
      if (getCookie() != null) {
        return;
      }
      if (response.message === "Cookie is set on the browser") {
        setCookie(response.Token, response.Token);
        window.location.href = "main.html"; // Redirect to main page or any other page
      } else {
        alert("Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Error occurred during login:", error);
      alert("An error occurred during login. Please try again later.");
    }
  });

async function login(username, password) {
  const response = await fetch("http://localhost:8000/login", {
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

async function show_current_user() {
  const token = getCookie();
  const response = await fetch("http://localhost:8000/current_user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
  const response_data = await response.json();
  const currentUser = document.querySelector(".current-user");
  currentUser.textContent = `User: ${response_data.message}`;
}

// --- Main Student Page Functions ---
async function fetchAndDisplayEquipments() {
  try {
    const token = getCookie();
    const response = await fetch(
      "http://localhost:8000/show_all_equipments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch equipment data");
    }

    const data = await response.json();
    const equipmentList = data.message; 
    const tableBody = document.getElementById("equipmentTableBody");
    tableBody.innerHTML = ""; 

    equipmentList.forEach((item) => {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.textContent = item.equipment_name.toUpperCase();
      row.appendChild(nameCell);

      const buttonCell = document.createElement("td");
      const button = document.createElement("button");
      button.textContent = "Book";
      button.onclick = () => bookEquipment(item.equipment_name);
      buttonCell.appendChild(button);

      row.appendChild(buttonCell);
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching equipment data:", error);
    alert("Failed to fetch equipment data. Please try again later.");
  }
}

function bookEquipment(equipmentName) {
  window.location.href = "booking.html?equipment=" + equipmentName;
}

function trackRequest() {
  const token = getCookie();
  const requestIdInput = document.getElementById("requestIdInput");
  const requestId = requestIdInput.value;

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

  fetch("http://localhost:8000/check_status", {
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

async function showRequestsAll() {
  const token = getCookie();
  const requestData = {
    token: token,
  };

  try {
    const response = await fetch(
      "http://localhost:8000/show_requests_student",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch requests data");
    }

    const data = await response.json();
    const container = document.getElementById("requestInfo2");
    container.innerHTML = "";

    data.message.forEach((request) => {
      const requestDiv = document.createElement("div");
      requestDiv.classList.add("request-item"); // Uses .request-item class from CSS

      requestDiv.innerHTML = `
        <p><b>Request ID:</b> ${request.request_id}</p>
        <p><b>Slot ID:</b> ${request.slot_id}</p>
        <p><b>Equipment ID:</b> ${request.equipment_id}</p>
        <p><b>Project ID:</b> ${request.proj_id}</p>
        <p><b>Slot Time:</b> ${request.slot_time}</p>
      `;
      container.appendChild(requestDiv);
    });
  } catch (error) {
    console.error("Error fetching request data:", error);
    alert("Failed to fetch request data. Please try again later.");
  }
}

async function checkUser() {
  const token = getCookie();
  if (!token) {
    console.log("No token found - user needs to log in");
    return;
  }
  try {
    const response = await fetch("http://localhost:8000/is_member_of", {
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
  } catch (error) {
    console.error("Error occurred during user check:", error);
    console.log("Token validation failed - user may need to log in again");
  }
}

// --- Faculty/Staff Functions ---

function showPendingRequestsSuper() {
  const token = getCookie();
  fetch("http://localhost:8000/show_requests_supervisor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const container = document.getElementById("showPendingSuper");
      container.innerHTML = "";
      data.message.forEach((request) => {
        const requestDiv = document.createElement("div");
        requestDiv.classList.add("request-item");
        requestDiv.innerHTML = `
          <p><b>Request ID:</b> ${request.request_id}</p>
          <p><b>Slot ID:</b> ${request.slot_id}</p>
          <p><b>Equipment:</b> ${request.equipment_name}</p>
          <p><b>Slot Time:</b> ${request.slot_time}</p>
        `;

        const approveButton = document.createElement("button");
        approveButton.textContent = "Approve";
        approveButton.classList.add("btn-approve");
        approveButton.onclick = () => approveRequest(request.request_id);

        const rejectButton = document.createElement("button");
        rejectButton.textContent = "Reject";
        rejectButton.classList.add("btn-reject");
        rejectButton.onclick = () => rejectRequest(request.request_id);

        requestDiv.appendChild(approveButton);
        requestDiv.appendChild(rejectButton);
        container.appendChild(requestDiv);
      });
    });
}

function approveRequest(requestId) {
  const token = getCookie();
  const requestData = { token, request_id: requestId, decision: "approved" };
  fetch("http://localhost:8000/decide_by_super_visor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request approved successfully.");
      showPendingRequestsSuper();
    })
    .catch((error) => console.error(error));
}

function rejectRequest(requestId) {
  const token = getCookie();
  const requestData = { token, request_id: requestId, decision: "rejected" };
  fetch("http://localhost:8000/decide_by_super_visor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request rejected successfully.");
      showPendingRequestsSuper();
    })
    .catch((error) => console.error(error));
}

function showPendingRequestsIn() {
  const token = getCookie();
  fetch("http://localhost:8000/show_requests_faculty_incharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
    .then((response) => response.json())
    .then((data) => {
      const container = document.getElementById("showPendingIn");
      container.innerHTML = "";
      data.message.forEach((request) => {
        const requestDiv = document.createElement("div");
        requestDiv.classList.add("request-item");
        requestDiv.innerHTML = `
          <p><b>Request ID:</b> ${request.request_id}</p>
          <p><b>Slot ID:</b> ${request.slot_id}</p>
          <p><b>Equipment:</b> ${request.equipment_name}</p>
          <p><b>Slot Time:</b> ${request.slot_time}</p>
        `;
        
        const approveButton = document.createElement("button");
        approveButton.textContent = "Approve";
        approveButton.classList.add("btn-approve");
        approveButton.onclick = () => approveRequestIN(request.request_id);

        const rejectButton = document.createElement("button");
        rejectButton.textContent = "Reject";
        rejectButton.classList.add("btn-reject");
        rejectButton.onclick = () => rejectRequestIN(request.request_id);

        requestDiv.appendChild(approveButton);
        requestDiv.appendChild(rejectButton);
        container.appendChild(requestDiv);
      });
    });
}

function approveRequestIN(requestId) {
  const token = getCookie();
  const requestData = { token, request_id: requestId, decision: "approved" };
  fetch("http://localhost:8000/decide_by_faculty_incharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  })
    .then(() => {
      alert("Request approved successfully.");
      showPendingRequestsIn();
    });
}

function rejectRequestIN(requestId) {
  const token = getCookie();
  const requestData = { token, request_id: requestId, decision: "rejected" };
  fetch("http://localhost:8000/decide_by_faculty_incharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  })
    .then(() => {
      alert("Request rejected successfully.");
      showPendingRequestsIn();
    });
}

function showPendingRequestsStaff() {
  const token = getCookie();
  fetch("http://localhost:8000/show_requests_staff_incharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
    .then((response) => response.json())
    .then((data) => {
      const container = document.getElementById("showPendingStaff");
      container.innerHTML = "";
      data.message.forEach((request) => {
        const requestDiv = document.createElement("div");
        requestDiv.classList.add("request-item");
        requestDiv.innerHTML = `
          <p><b>Request ID:</b> ${request.request_id}</p>
          <p><b>Slot ID:</b> ${request.slot_id}</p>
          <p><b>Equipment:</b> ${request.equipment_name}</p>
          <p><b>Slot Time:</b> ${request.slot_time}</p>
        `;
        
        const approveButton = document.createElement("button");
        approveButton.textContent = "Approve";
        approveButton.classList.add("btn-approve");
        approveButton.onclick = () => approveRequestStaff(request.request_id);

        const rejectButton = document.createElement("button");
        rejectButton.textContent = "Reject";
        rejectButton.classList.add("btn-reject");
        rejectButton.onclick = () => rejectRequestStaff(request.request_id);

        requestDiv.appendChild(approveButton);
        requestDiv.appendChild(rejectButton);
        container.appendChild(requestDiv);
      });
    });
}

function approveRequestStaff(requestId) {
  const token = getCookie();
  const requestData = { token, request_id: requestId, decision: "approved" };
  fetch("http://localhost:8000/decide_by_staff_incharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  })
    .then(() => {
      alert("Request approved successfully.");
      showPendingRequestsStaff();
    });
}

function rejectRequestStaff(requestId) {
  const token = getCookie();
  const requestData = { token, request_id: requestId, decision: "rejected" };
  fetch("http://localhost:8000/decide_by_staff_incharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  })
    .then(() => {
      alert("Request rejected successfully.");
      showPendingRequestsStaff();
    });
}

async function handleAddSlot(event) {
  event.preventDefault();
  const responseDiv = document.getElementById("responseMessage");
  responseDiv.textContent = ""; 

  const equipmentId = document.getElementById("equipmentId").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const token = getCookie();

  if (!token) {
    responseDiv.textContent = "Error: No authentication token found.";
    return;
  }

  const slotData = { token, equipment_id: equipmentId, start_time: startTime, end_time: endTime };

  try {
    const response = await fetch("http://localhost:8000/insert_slot_staff_incharge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slotData),
    });
    const result = await response.json();

    if (response.ok) {
      responseDiv.textContent = result.message;
      event.target.form.reset();
    } else {
      responseDiv.textContent = `Failed: ${result.message}`;
    }
  } catch (error) {
    console.error("Submission failed:", error);
    responseDiv.textContent = "An error occurred. Unable to connect.";
  }
}

async function showMyProjects() {
  const token = getCookie();
  const container = document.getElementById("myProjectsContainer");
  container.innerHTML = "<p>Loading projects...</p>";

  if (!token) {
    container.innerHTML = "<p>Authentication error.</p>";
    return;
  }

  try {
    const response = await fetch("http://localhost:8000/faculty/my_projects", {
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

    let tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Funds Allocated</th>
            <th>Expiry Date</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.message.forEach(project => {
      const funds = project.status === 'approved' ? `$${project.money}` : 'Not Allocated';
      const expiry = project.status === 'approved' ? (project.expiry_date || 'N/A') : 'N/A';
      
      let statusClass = 'status-pending';
      if (project.status === 'approved') statusClass = 'status-approved';
      if (project.status === 'rejected') statusClass = 'status-rejected';

      const projectTypeDisplay = project.project_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

      tableHtml += `
        <tr>
          <td>${project.project_title}</td>
          <td>${projectTypeDisplay}</td>
          <td class="${statusClass}">${project.status}</td>
          <td>${funds}</td>
          <td>${expiry}</td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;

  } catch (error) {
    console.error("Error fetching projects:", error);
    container.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

// --- Project Modal Functions (Faculty) ---

async function openProjectModal() {
  const token = getCookie();
  if (!token) return;

  try {
    const response = await fetch("http://localhost:8000/departments", {
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

function closeProjectModal() {
  document.getElementById("addProjectModal").style.display = "none";
  document.getElementById("addProjectForm").reset();
  document.getElementById("departmentContainer").style.display = "none";
  document.getElementById("projectIdPreview").textContent = "";
  document.getElementById("project_id").value = "";
  document.getElementById("projectAddResult").textContent = "";
}

async function updateProjectId() {
  const token = getCookie();
  let facultyId = null;

  try {
    const response = await fetch("http://localhost:8000/current_user", {
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
  } else if (projectType === "sponsored_project" || projectType === "industrial_consultancy" ) {
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

function closeModalIfOutside(event) {
  if (event.target.id === "addProjectModal") {
    closeProjectModal();
  }
}

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
    const checkResponse = await fetch("http://localhost:8000/project_exists", {
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

    const addResponse = await fetch("http://localhost:8000/add_project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, project_id: projectId, project_title: projectTitle, project_type: projectType }),
    });

    const result = await addResponse.json();
    resultDiv.textContent = result.message;

    if (addResponse.ok) {
      resultDiv.style.color = "green";
      showMyProjects(); // Refresh the project list
      setTimeout(closeProjectModal, 1500); 
    } else {
      resultDiv.style.color = "red";
    }
  } catch (error) {
    resultDiv.textContent = `A client-side error occurred: ${error.message}`;
    resultDiv.style.color = "red";
  }
}