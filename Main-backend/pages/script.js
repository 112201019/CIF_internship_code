function setCookie(name, value, days = 1) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Function to get the value of a cookie
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

document
  .getElementById("loginForm")
  .addEventListener("submit", async function (event) {
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
  // console.log(response_data)
  // alert(response_data.message)
  // <div class="current-user">show current user:-</div>
  // Write the current user to the page
  const currentUser = document.querySelector(".current-user");
  currentUser.textContent = `User: ${response_data.message}`;
}
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
    const equipmentList = data.message; // Array of objects with `equipment_name`

    // Get the table body element
    const tableBody = document.getElementById("equipmentTableBody");
    tableBody.innerHTML = ""; // Clear any existing rows

    // Loop through the equipment objects and create rows
    equipmentList.forEach((item) => {
      const row = document.createElement("tr");

      // Equipment name cell
      const nameCell = document.createElement("td");
      nameCell.textContent = item.equipment_name.toUpperCase(); // Capitalize the name
      nameCell.style.border = "1px solid #333";
      nameCell.style.padding = "8px";
      nameCell.style.fontWeight = "bold"; // Bold the name
      row.appendChild(nameCell);

      // Book button cell
      const buttonCell = document.createElement("td");
      buttonCell.style.border = "1px solid #333";
      buttonCell.style.padding = "8px";

      const button = document.createElement("button");
      button.textContent = "Book";
      button.style.padding = "5px 10px";
      button.style.marginLeft = "10px"; // Add some spacing between name and button
      button.onclick = () => bookEquipment(item.equipment_name); // Replace with actual booking logic
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
        slotIdPara.textContent = `Slot ID: ${request.slot_id}`;

        const equipmentIdPara = document.createElement("p");
        equipmentIdPara.textContent = `Equipment Name: ${request.equipment_name}`;

        const slotTimePara = document.createElement("p");
        slotTimePara.textContent = `Slot Time: ${request.slot_time}`;

        requestDiv.appendChild(requestIdPara);
        requestDiv.appendChild(slotIdPara);
        requestDiv.appendChild(equipmentIdPara);
        requestDiv.appendChild(slotTimePara);

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
          approveRequest(request.request_id);
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
          rejectRequest(request.request_id);
        });
      });
    });
}

function approveRequest(requestId) {
  const token = getCookie();
  const requestData = {
    token: token,
    request_id: requestId,
    decision: "approved",
  };

  fetch("http://localhost:8000/decide_by_super_visor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request approved successfully.");
      showPendingRequestsSuper();
    })
    .catch((error) => {
      alert("An error occurred while approving the request.");
      console.error(error);
    });
}

function rejectRequest(requestId) {
  const token = getCookie();
  const requestData = {
    token: token,
    request_id: requestId,
    decision: "rejected",
  };

  fetch("http://localhost:8000/decide_by_super_visor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request rejected successfully.");
      showPendingRequestsSuper();
    })
    .catch((error) => {
      alert("An error occurred while approving the request.");
      console.error(error);
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
        slotIdPara.textContent = `Slot ID: ${request.slot_id}`;

        const equipmentIdPara = document.createElement("p");
        equipmentIdPara.textContent = `Equipment Name: ${request.equipment_name}`;

        const slotTimePara = document.createElement("p");
        slotTimePara.textContent = `Slot Time: ${request.slot_time}`;

        requestDiv.appendChild(requestIdPara);
        requestDiv.appendChild(slotIdPara);
        requestDiv.appendChild(equipmentIdPara);
        requestDiv.appendChild(slotTimePara);

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
          approveRequestIN(request.request_id);
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
          rejectRequestIN(request.request_id);
        });
      });
    });
}

function approveRequestIN(requestId) {
  const token = getCookie();
  const requestData = {
    token: token,
    request_id: requestId,
    decision: "approved",
  };

  fetch("http://localhost:8000/decide_by_faculty_incharge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request approved successfully.");
      showPendingRequestsIn();
    })
    .catch((error) => {
      alert("An error occurred while approving the request.");
      console.error(error);
    });
}

function rejectRequestIN(requestId) {
  const token = getCookie();
  const requestData = {
    token: token,
    request_id: requestId,
    decision: "rejected",
  };

  fetch("http://localhost:8000/decide_by_faculty_incharge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request rejected successfully.");
      showPendingRequestsIn();
    })
    .catch((error) => {
      alert("An error occurred while approving the request.");
      console.error(error);
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
        slotIdPara.textContent = `Slot ID: ${request.slot_id}`;

        const equipmentIdPara = document.createElement("p");
        equipmentIdPara.textContent = `Equipment Name: ${request.equipment_name}`;

        const slotTimePara = document.createElement("p");
        slotTimePara.textContent = `Slot Time: ${request.slot_time}`;

        requestDiv.appendChild(requestIdPara);
        requestDiv.appendChild(slotIdPara);
        requestDiv.appendChild(equipmentIdPara);
        requestDiv.appendChild(slotTimePara);

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
          approveRequestStaff(request.request_id);
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
          rejectRequestStaff(request.request_id);
        });
      });
    });
}

function approveRequestStaff(requestId) {
  const token = getCookie();
  const requestData = {
    token: token,
    request_id: requestId,
    decision: "approved",
  };

  fetch("http://localhost:8000/decide_by_staff_incharge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request approved successfully.");
      showPendingRequestsStaff();
    })
    .catch((error) => {
      alert("An error occurred while approving the request.");
      console.error(error);
    });
}

function rejectRequestStaff(requestId) {
  const token = getCookie();
  const requestData = {
    token: token,
    request_id: requestId,
    decision: "rejected",
  };

  fetch("http://localhost:8000/decide_by_staff_incharge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Request rejected successfully.");
      showPendingRequestsStaff();
    })
    .catch((error) => {
      alert("An error occurred while approving the request.");
      console.error(error);
    });
}

// Show all requests of the current user
// Show all requests of the current user
async function showRequestsAll() {
  const token = getCookie();
  const requestData = {
    token: token,
  };

  try {
    // Fetch data from the server
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

    // Get the container where the request information will be displayed
    const container = document.getElementById("requestInfo2");

    // Clear any existing content
    container.innerHTML = "";

    // Loop through each request item and create a div for it
    data.message.forEach((request) => {
      const requestDiv = document.createElement("div");
      requestDiv.classList.add("request-item");

      const requestIdPara = document.createElement("p");
      requestIdPara.textContent = `Request ID: ${request.request_id}`;

      const slotIdPara = document.createElement("p");
      slotIdPara.textContent = `Slot ID: ${request.slot_id}`;

      const equipmentIdPara = document.createElement("p");
      equipmentIdPara.textContent = `Equipment ID: ${request.equipment_id}`;

      const projIdPara = document.createElement("p");
      projIdPara.textContent = `Project ID: ${request.proj_id}`;

      const slotTimePara = document.createElement("p");
      slotTimePara.textContent = `Slot Time: ${request.slot_time}`;

      // Append all paragraphs to the requestDiv
      requestDiv.appendChild(requestIdPara);
      requestDiv.appendChild(slotIdPara);
      requestDiv.appendChild(equipmentIdPara);
      requestDiv.appendChild(projIdPara);
      requestDiv.appendChild(slotTimePara);

      // Append the requestDiv to the container
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