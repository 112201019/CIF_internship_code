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
        const roleResponse = await fetch("http://localhost:8000/is_member_of", {
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
  // console.log(response_data)
  // alert(response_data.message)
  // <div class="current-user">show current user:-</div>
  // Write the current user to the page
  const currentUser = document.querySelector(".current-user");
  currentUser.textContent = `User: ${response_data.message}`;
}
async function fetchAndDisplayEquipments() {
  try {
    const token = getCookie("session_token"); // Use corrected cookie function
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
    const equipmentList = data.message; // Array of objects with `equipment_name`

    // Get the table body element
    const tableBody = document.getElementById("equipmentTableBody");
    tableBody.innerHTML = ""; // Clear any existing rows

    // Loop through the equipment objects and create rows
    equipmentList.forEach((item) => {
      const row = document.createElement("tr");

      // Equipment name cell
      const nameCell = document.createElement("td");
      nameCell.textContent = item.equipment_name.toUpperCase();
      row.appendChild(nameCell);

      // Book button cell
      const buttonCell = document.createElement("td");
      const button = document.createElement("button");
      button.textContent = "Book";
      
      // --- THIS IS THE IMPORTANT CHANGE ---
      button.className = "book-button"; // Use the CSS class
      // --- END OF CHANGE ---
      
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
  const requestData = {
    token: token,
  };

  fetch("http://localhost:8000/show_requests_supervisor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())

    .then((data) => {
      console.log(data);
      const container = document.getElementById("showPendingSuper");
      container.innerHTML = "";
      data.message.forEach((request) => {
        const requestDiv = document.createElement("div");
        requestDiv.classList.add("request-item");

        const requestIdPara = document.createElement("p");
        requestIdPara.textContent = `Request ID: ${request.request_id}`;

        const slotIdPara = document.createElement("p");
        slotIdPara.textContent = `Starting Slot ID: ${request.slot_id}`;

        const slotCountPara = document.createElement("p");
        slotCountPara.textContent = `Slot Count: ${request.slot_count}`;

        const equipmentIdPara = document.createElement("p");
        equipmentIdPara.textContent = `Equipment Name: ${request.equipment_name}`;

        const slotTimePara = document.createElement("p");
        slotTimePara.textContent = `Slot Time: ${request.slot_time}`;

        const SlotUnitTimePara = document.createElement("p");
        SlotUnitTimePara.textContent = `Slot Unit Time: ${request.unit_time}`;

        // --- NEW CODE: Add Comment Display ---
        const commentDiv = document.createElement("div");
        if (request.comment) {
            commentDiv.innerHTML = `<p style="color:#d35400; background:#fff3e0; padding:5px; border-left:3px solid #d35400;"><strong>User Comment:</strong> ${request.comment}</p>`;
        }
        // -------------------------------------
        // const requestDataPara = document.createElement("p");
        // requestDataPara.textContent = `Request Data: ${request.request_data}`;
        requestDiv.appendChild(requestIdPara);
        requestDiv.appendChild(equipmentIdPara);
        requestDiv.appendChild(slotIdPara);
        requestDiv.appendChild(slotTimePara);
        requestDiv.appendChild(slotCountPara);
        requestDiv.appendChild(SlotUnitTimePara);
        // Append the comment
        requestDiv.appendChild(commentDiv);
        // --- Handle the JSON Request Data ---
        // --- Handle the JSON Request Data ---
        // If request_data is a string, parse it. If it's already an object, use it directly.
        const details = typeof request.request_data === 'string' 
                        ? JSON.parse(request.request_data) 
                        : request.request_data;

        // 1. Process Requirements (List)
        if (details.requirements && details.requirements.length > 0) {
            const reqHeader = document.createElement("p");
            reqHeader.innerHTML = "<strong>Requirements:</strong>";
            const reqList = document.createElement("ul");
            
            details.requirements.forEach(req => {
                const li = document.createElement("li");
                li.textContent = req;
                reqList.appendChild(li);
            });
            
            requestDiv.appendChild(reqHeader);
            requestDiv.appendChild(reqList);
        }

        // 2. Process Extra Questions/Answers (Key-Value)
        if (details.answers && Object.keys(details.answers).length > 0) {
            const ansHeader = document.createElement("p");
            ansHeader.innerHTML = "<strong>Extra Details:</strong>";
            requestDiv.appendChild(ansHeader);

            // Loop through the object keys and values
            Object.entries(details.answers).forEach(([question, answer]) => {
                const qaDiv = document.createElement("div");
                qaDiv.style.marginLeft = "15px";
                qaDiv.style.marginBottom = "5px";
                qaDiv.innerHTML = `
                    <span style="color: #555;"></span> ${question} : <strong>${answer}</strong>
                `;
                requestDiv.appendChild(qaDiv);
            });
        }
        container.appendChild(requestDiv);


        // add two buttons to approve or reject the request
        const approveButton = document.createElement("button");
        approveButton.textContent = "Approve";
        approveButton.style = `
            padding: 8px 16px;
            background-color: green;
            color: #fff;
            border: none;
            cursor: pointer;
            margin-top: 10px;
            margin-right: 10px;
            margin-bottom: 10px;
          `;
        requestDiv.appendChild(approveButton);
        approveButton.addEventListener("click", () => {
          approveRequest(request.request_id, approveButton);
        });

        const rejectButton = document.createElement("button");
        rejectButton.textContent = "Reject";
        rejectButton.style = `
            padding: 8px 16px;
            background-color: red;
            color: #fff;
            border: none;
            cursor: pointer;
            margin-top: 10px;
          `;
        requestDiv.appendChild(rejectButton);
        rejectButton.addEventListener("click", () => {
          rejectRequest(request.request_id, rejectButton);
        });
      });
    });
}

// --- SUPERVISOR DECISIONS ---
function approveRequest(requestId, btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> Approving...`;
  btn.classList.add("btn-loading");
  btn.disabled = true;

  const token = getCookie();
  fetch("http://localhost:8000/decide_by_super_visor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, request_id: requestId, decision: "approved" }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request approved successfully.");
      showPendingRequestsSuper();
    })
    .catch((error) => {
      alert("An error occurred while approving the request.");
      console.error(error);
      btn.innerHTML = originalText;
      btn.classList.remove("btn-loading");
      btn.disabled = false;
    });
}

function rejectRequest(requestId, btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> Rejecting...`;
  btn.classList.add("btn-loading");
  btn.disabled = true;

  const token = getCookie();
  fetch("http://localhost:8000/decide_by_super_visor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, request_id: requestId, decision: "rejected" }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request rejected successfully.");
      showPendingRequestsSuper();
    })
    .catch((error) => {
      alert("An error occurred while rejecting the request.");
      console.error(error);
      btn.innerHTML = originalText;
      btn.classList.remove("btn-loading");
      btn.disabled = false;
    });
}

function showPendingRequestsIn() {
  const token = getCookie();
  const requestData = {
    token: token,
  };

  fetch("http://localhost:8000/show_requests_faculty_incharge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())

    .then((data) => {
      console.log(data);
      const container = document.getElementById("showPendingIn");
      container.innerHTML = "";
      data.message.forEach((request) => {
        const requestDiv = document.createElement("div");
        requestDiv.classList.add("request-item");

        const requestIdPara = document.createElement("p");
        requestIdPara.textContent = `Request ID: ${request.request_id}`;

        const slotIdPara = document.createElement("p");
        slotIdPara.textContent = `Starting Slot ID: ${request.slot_id}`;

        const slotCountPara = document.createElement("p");
        slotCountPara.textContent = `Slot Count: ${request.slot_count}`;

        const equipmentIdPara = document.createElement("p");
        equipmentIdPara.textContent = `Equipment Name: ${request.equipment_name}`;

        const slotTimePara = document.createElement("p");
        slotTimePara.textContent = `Slot Time: ${request.slot_time}`;

        const SlotUnitTimePara = document.createElement("p");
        SlotUnitTimePara.textContent = `Slot Unit Time: ${request.unit_time}`;
        // --- NEW CODE: Add Comment Display ---
        const commentDiv = document.createElement("div");
        if (request.comment) {
            commentDiv.innerHTML = `<p style="color:#d35400; background:#fff3e0; padding:5px; border-left:3px solid #d35400;"><strong>User Comment:</strong> ${request.comment}</p>`;
        }
        // -------------------------------------
        // const requestDataPara = document.createElement("p");
        // requestDataPara.textContent = `Request Data: ${request.request_data}`;
        requestDiv.appendChild(requestIdPara);
        requestDiv.appendChild(equipmentIdPara);
        requestDiv.appendChild(slotIdPara);
        requestDiv.appendChild(slotTimePara);
        requestDiv.appendChild(slotCountPara);
        requestDiv.appendChild(SlotUnitTimePara);
        // Append the comment
        requestDiv.appendChild(commentDiv);
        // --- Handle the JSON Request Data ---
        // If request_data is a string, parse it. If it's already an object, use it directly.
        const details = typeof request.request_data === 'string' 
                        ? JSON.parse(request.request_data) 
                        : request.request_data;

        // 1. Process Requirements (List)
        if (details.requirements && details.requirements.length > 0) {
            const reqHeader = document.createElement("p");
            reqHeader.innerHTML = "<strong>Requirements:</strong>";
            const reqList = document.createElement("ul");
            
            details.requirements.forEach(req => {
                const li = document.createElement("li");
                li.textContent = req;
                reqList.appendChild(li);
            });
            
            requestDiv.appendChild(reqHeader);
            requestDiv.appendChild(reqList);
        }

        // 2. Process Extra Questions/Answers (Key-Value)
        if (details.answers && Object.keys(details.answers).length > 0) {
            const ansHeader = document.createElement("p");
            ansHeader.innerHTML = "<strong>Extra Details:</strong>";
            requestDiv.appendChild(ansHeader);

            // Loop through the object keys and values
            Object.entries(details.answers).forEach(([question, answer]) => {
                const qaDiv = document.createElement("div");
                qaDiv.style.marginLeft = "15px";
                qaDiv.style.marginBottom = "5px";
                qaDiv.innerHTML = `
                    <span style="color: #555;"></span> ${question} : <strong>${answer}</strong>
                `;
                requestDiv.appendChild(qaDiv);
            });
        }
        container.appendChild(requestDiv);


        // add two buttons to approve or reject the request
        const approveButton = document.createElement("button");
        approveButton.textContent = "Approve";
        approveButton.style = `
            padding: 8px 16px;
            background-color: green;
            color: #fff;
            border: none;
            cursor: pointer;
            margin-top: 10px;
            margin-right: 10px;
            margin-bottom: 10px;
          `;
        requestDiv.appendChild(approveButton);
        approveButton.addEventListener("click", () => {
          approveRequestIN(request.request_id, approveButton);
        });

        const rejectButton = document.createElement("button");
        rejectButton.textContent = "Reject";
        rejectButton.style = `
            padding: 8px 16px;
            background-color: red;
            color: #fff;
            border: none;
            cursor: pointer;
            margin-top: 10px;
          `;
        requestDiv.appendChild(rejectButton);
        rejectButton.addEventListener("click", () => {
          rejectRequestIN(request.request_id, rejectButton);
        });
      });
    });
}

// --- FACULTY INCHARGE DECISIONS ---
function approveRequestIN(requestId, btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> Approving...`;
  btn.classList.add("btn-loading");
  btn.disabled = true;

  const token = getCookie();
  fetch("http://localhost:8000/decide_by_faculty_incharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, request_id: requestId, decision: "approved" }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request approved successfully.");
      showPendingRequestsIn();
    })
    .catch((error) => {
      alert("An error occurred while approving the request.");
      console.error(error);
      btn.innerHTML = originalText;
      btn.classList.remove("btn-loading");
      btn.disabled = false;
    });
}

function rejectRequestIN(requestId, btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> Rejecting...`;
  btn.classList.add("btn-loading");
  btn.disabled = true;

  const token = getCookie();
  fetch("http://localhost:8000/decide_by_faculty_incharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, request_id: requestId, decision: "rejected" }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request rejected successfully.");
      showPendingRequestsIn();
    })
    .catch((error) => {
      alert("An error occurred while rejecting the request.");
      console.error(error);
      btn.innerHTML = originalText;
      btn.classList.remove("btn-loading");
      btn.disabled = false;
    });
}
// Staff
function showPendingRequestsStaff() {
  const token = getCookie();
  const requestData = {
    token: token,
  };

  fetch("http://localhost:8000/show_requests_staff_incharge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())

    .then((data) => {
      console.log(data);
      const container = document.getElementById("showPendingStaff");
      container.innerHTML = "";
      data.message.forEach((request) => {
        const requestDiv = document.createElement("div");
        requestDiv.classList.add("request-item");

        const requestIdPara = document.createElement("p");
        requestIdPara.textContent = `Request ID: ${request.request_id}`;

        const slotIdPara = document.createElement("p");
        slotIdPara.textContent = `Starting Slot ID: ${request.slot_id}`;

        const slotCountPara = document.createElement("p");
        slotCountPara.textContent = `Slot Count: ${request.slot_count}`;

        const equipmentIdPara = document.createElement("p");
        equipmentIdPara.textContent = `Equipment Name: ${request.equipment_name}`;

        const slotTimePara = document.createElement("p");
        slotTimePara.textContent = `Slot Time: ${request.slot_time}`;

        const SlotUnitTimePara = document.createElement("p");
        SlotUnitTimePara.textContent = `Slot Unit Time: ${request.unit_time}`;

        // --- NEW CODE: Add Comment Display ---
        const commentDiv = document.createElement("div");
        if (request.comment) {
            commentDiv.innerHTML = `<p style="color:#d35400; background:#fff3e0; padding:5px; border-left:3px solid #d35400;"><strong>User Comment:</strong> ${request.comment}</p>`;
        }
        // -------------------------------------
        // const requestDataPara = document.createElement("p");
        // requestDataPara.textContent = `Request Data: ${request.request_data}`;
        requestDiv.appendChild(requestIdPara);
        requestDiv.appendChild(equipmentIdPara);
        requestDiv.appendChild(slotIdPara);
        requestDiv.appendChild(slotTimePara);
        requestDiv.appendChild(slotCountPara);
        requestDiv.appendChild(SlotUnitTimePara);
        // Append the comment
        requestDiv.appendChild(commentDiv);
        // --- Handle the JSON Request Data ---
        // If request_data is a string, parse it. If it's already an object, use it directly.
        const details = typeof request.request_data === 'string' 
                        ? JSON.parse(request.request_data) 
                        : request.request_data;

        // 1. Process Requirements (List)
        if (details.requirements && details.requirements.length > 0) {
            const reqHeader = document.createElement("p");
            reqHeader.innerHTML = "<strong>Requirements:</strong>";
            const reqList = document.createElement("ul");
            
            details.requirements.forEach(req => {
                const li = document.createElement("li");
                li.textContent = req;
                reqList.appendChild(li);
            });
            
            requestDiv.appendChild(reqHeader);
            requestDiv.appendChild(reqList);
        }

        // 2. Process Extra Questions/Answers (Key-Value)
        if (details.answers && Object.keys(details.answers).length > 0) {
            const ansHeader = document.createElement("p");
            ansHeader.innerHTML = "<strong>Extra Details:</strong>";
            requestDiv.appendChild(ansHeader);

            // Loop through the object keys and values
            Object.entries(details.answers).forEach(([question, answer]) => {
                const qaDiv = document.createElement("div");
                qaDiv.style.marginLeft = "15px";
                qaDiv.style.marginBottom = "5px";
                qaDiv.innerHTML = `
                    <span style="color: #555;"></span> ${question} : <strong>${answer}</strong>
                `;
                requestDiv.appendChild(qaDiv);
            });
        }
        container.appendChild(requestDiv);


        // add two buttons to approve or reject the request
        const approveButton = document.createElement("button");
        approveButton.textContent = "Approve";
        approveButton.style = `
            padding: 8px 16px;
            background-color: green;
            color: #fff;
            border: none;
            cursor: pointer;
            margin-top: 10px;
            margin-right: 10px;
            margin-bottom: 10px;
          `;
        requestDiv.appendChild(approveButton);
        approveButton.addEventListener("click", () => {
          approveRequestStaff(request.request_id, approveButton);
        });

        const rejectButton = document.createElement("button");
        rejectButton.textContent = "Reject";
        rejectButton.style = `
            padding: 8px 16px;
            background-color: red;
            color: #fff;
            border: none;
            cursor: pointer;
            margin-top: 10px;
          `;
        requestDiv.appendChild(rejectButton);
        rejectButton.addEventListener("click", () => {
          rejectRequestStaff(request.request_id, rejectButton);
        });
      });
    });
}

function approveRequestStaff(requestId, btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> Approving...`;
  btn.classList.add("btn-loading");
  btn.disabled = true;

  const token = getCookie();
  fetch("http://localhost:8000/decide_by_staff_incharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, request_id: requestId, decision: "approved" }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request approved successfully.");
      showPendingRequestsStaff();
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
  fetch("http://localhost:8000/decide_by_staff_incharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, request_id: requestId, decision: "rejected" }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request rejected successfully.");
      showPendingRequestsStaff();
    })
    .catch((error) => {
      alert("An error occurred while rejecting the request.");
      console.error(error);
      btn.innerHTML = originalText;
      btn.classList.remove("btn-loading");
      btn.disabled = false;
    });
}
// Show all requests of the current user
// Show all requests of the current user
async function showRequestsAll() {
  const token = getCookie("cif_token");
  if(!token) return;

  try {
    const response = await fetch("http://localhost:8000/show_requests_student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token }),
      }
    );
    const data = await response.json();
    const container = document.getElementById("requestInfo2");
    if(container) {
        container.innerHTML = "";
        data.message.forEach((request) => {
          const requestDiv = document.createElement("div");
          requestDiv.classList.add("request-item");
          
          // Use the formatter here
          const formattedTime = formatSlotTime(request.slot_time);

          requestDiv.innerHTML = `
            <p><strong>Request ID:</strong> ${request.request_id}</p>
            <p><strong>Equipment ID:</strong> ${request.equipment_id}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p style="font-size:0.9em; color:#666;">Project: ${request.proj_id}</p>
          `;
          container.appendChild(requestDiv);
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
    const response = await fetch("http://localhost:8000/insert_slot_staff_incharge", {
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
      event.target.form.reset();
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
// Add this entire function to the end of your script.js file
// In script.js

// REPLACE your existing addNewProject function with this one
// async function addNewProject(event) {
//   event.preventDefault();
//   const resultDiv = document.getElementById("projectAddResult");
//   resultDiv.textContent = "";

//   // Get values from the form (money is no longer needed)
//   const title = document.getElementById("project_title").value;
//   const projectType = document.getElementById("project_type").value;
//   const token = getCookie();

//   if (!token) {
//     resultDiv.textContent = "Authentication error. Please log in again.";
//     resultDiv.style.color = "red";
//     return;
//   }

//   try {
//     // Prepare the data payload for the API (no money field)
//     const projectData = {
//       token,
//       project_title: title,
//       project_type: projectType,
//     };

//     // Call the updated API endpoint
//     const response = await fetch("http://localhost:8000/add_project", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(projectData),
//     });

//     const result = await response.json();

//     // Display the result message to the user
//     resultDiv.textContent = result.message;
//     if (result.message.includes("An error occurred")) {
//       resultDiv.style.color = "red";
//     } else {
//       resultDiv.style.color = "green";
//       event.target.reset(); // Reset the form on success
//     }

//   } catch (error) {
//     console.error("Error adding project:", error);
//     resultDiv.textContent = `A client-side error occurred: ${error.message}`;
//     resultDiv.style.color = "red";
//   }
// }
// Paste this entire block at the end of your script.js file

// --- Logic for the new "Add Slot" form ---
// Add this new function to your script.js file
// Make sure to remove the old event listener block

// Add this entire function to the end of your script.js file

// In script.js, update the showMyProjects function

async function showMyProjects() {
  const token = getCookie();
  const container = document.getElementById("myProjectsContainer");
  container.innerHTML = "<p>Loading projects...</p>";

  if (!token) {
    container.innerHTML = "<p style='color: red;'>Authentication error. Please log in again.</p>";
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

    // Build the table to display project data
    let tableHtml = `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #333; padding: 8px;">Title</th>
            <th style="border: 1px solid #333; padding: 8px;">Type</th> <th style="border: 1px solid #333; padding: 8px;">Status</th>
            <th style="border: 1px solid #333; padding: 8px;">Funds Allocated</th>
            <th style="border: 1px solid #333; padding: 8px;">Expiry Date</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.message.forEach(project => {
      const funds = project.status === 'approved' ? `$${project.money}` : 'Not Allocated';
      const expiry = project.status === 'approved' ? (project.expiry_date || 'N/A') : 'N/A';

      let statusColor = 'orange'; // Pending
      if (project.status === 'approved') statusColor = 'green';
      if (project.status === 'rejected') statusColor = 'red';

      // Clean up the display of the project type name
      const projectTypeDisplay = project.project_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

      tableHtml += `
        <tr>
          <td style="border: 1px solid #333; padding: 8px;">${project.project_title}</td>
          <td style="border: 1px solid #333; padding: 8px;">${projectTypeDisplay}</td> <td style="border: 1px solid #333; padding: 8px; color: ${statusColor}; text-transform: capitalize;">
            <b>${project.status}</b>
          </td>
          <td style="border: 1px solid #333; padding: 8px;">${funds}</td>
          <td style="border: 1px solid #333; padding: 8px;">${expiry}</td>
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
function closeModalIfOutside(event) {
  if (event.target.id === "addProjectModal") {
    closeProjectModal();
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
    const res = await fetch("http://localhost:8000/get_ongoing_experiments", {
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
      
      div.innerHTML = `
        <div class="req-header" style="border-bottom: 1px solid #ccc; padding-bottom:5px; margin-bottom:5px;">
            <strong>Request ID: ${exp.request_id}</strong>
        </div>
        <p style="margin:5px 0;"><strong>Equipment:</strong> ${exp.equipment_name}</p>
        <p style="margin:5px 0;"><strong>Scheduled:</strong> ${exp.slot_time}</p>
        <p style="margin:5px 0;"><strong>Project ID:</strong> ${exp.proj_id}</p>
        
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
                onclick="finalizeAndBill(${exp.request_id}, '${exp.proj_id}')"
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
    const response = await fetch("http://localhost:8000/finalize_experiment", {
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
    const response = await fetch("http://localhost:8000/cancel_experiment", {
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
    const res = await fetch("http://localhost:8000/get_profile", {
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
        const res = await fetch("http://localhost:8000/update_profile", {
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