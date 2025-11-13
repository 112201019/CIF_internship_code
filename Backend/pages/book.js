let selectedProjectID = null;

// --- FIXED COOKIE FUNCTION ---
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
      const parts = cookie.split("=");
      if (parts.length >= 2) {
        return parts[1]; // Returns the Value (Token)
      }
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// --- ADD THE SAME HELPER AT THE TOP ---
function formatSlotTime(isoString) {
  if (!isoString) return "N/A";
  const startDate = new Date(isoString);

  const options = {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  };

  const startStr = startDate.toLocaleDateString('en-US', options);

  return `${startStr}`;
}

function getURLParameter(name) {
  return (
    decodeURIComponent(
      (new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(
        location.search
      ) || [null, ""])[1].replace(/\+/g, "%20")
    ) || null
  );
}

// --- FETCH PROJECTS ---
async function fetchAndDisplayProjects() {
  const token = getCookie();
  const container = document.getElementById("projectTable");

  if (!token) return;

  try {
    const response = await fetch("http://localhost:8000/show_projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) throw new Error("Failed to fetch projects");

    const data = await response.json();
    if (!data.message || data.message.length === 0) {
      container.innerHTML = "<p>You have no active projects available for booking.</p>";
      return;
    }

    let tableHTML = `
      <table id="projectTable">
        <thead>
          <tr>
            <th>Project ID</th>
            <th>Project Title</th>
            <th>Supervisor</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.message.forEach((project) => {
      tableHTML += `
        <tr id="project-row-${project.project_id}">
          <td>${project.project_id}</td>
          <td>${project.project_title}</td>
          <td>${project.supervisor}</td>
          <td>
            <button class="select-project-btn" onclick="selectProject('${project.project_id}')">
              Select
            </button>
          </td>
        </tr>
      `;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
  } catch (error) {
    console.error("Error fetching projects:", error);
  }
}

function selectProject(projectID) {
  selectedProjectID = projectID;
  const allRows = document.querySelectorAll("#projectTable tbody tr");
  allRows.forEach(row => row.classList.remove("selected-project"));
  const selectedRow = document.getElementById(`project-row-${projectID}`);
  if (selectedRow) selectedRow.classList.add("selected-project");
}

function trackRequest() {
  const token = getCookie();
  const equipmentName = getURLParameter("equipment");
  const table = document.getElementById("books");

  if (!token) return;
  if (!equipmentName) {
    table.innerHTML = "<p>Please select an equipment from the main page.</p>";
    return;
  }

  const requestData = { token: token, name: equipmentName };

  fetch("http://localhost:8000/get_ids_by_equipment_name", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      const message = data.message;

      // Clear the table first to prevent duplicates
      table.innerHTML = "";

      if (!message || message.length === 0) {
        table.innerHTML = "<p>No items found for this equipment type.</p>";
        return;
      }

      message.forEach((element) => {
        const div = document.createElement("div");
        div.classList.add("book");

        // NOTE: element.equipment_name might be undefined depending on backend response.
        // Usually backend returns 'equipment_id' and 'location'.
        div.innerHTML = `
          <h3>Equipment ID: ${element.equipment_id}</h3>
          <p>Location: ${element.location}</p>
          <button class="request-button" style="
            padding: 8px 16px;
            background-color: #333;
            color: #fff;
            border: none;
            cursor: pointer;
            margin-top: 10px;
          ">Show Slots</button>
          <div class="slots-container" style="margin-top:15px;"></div>
        `;

        table.appendChild(div);

        const button = div.querySelector("button");
        button.addEventListener("click", () => {
          const requestData = { token: token, ID: element.equipment_id };

          fetch("http://localhost:8000/show_available_slots_equipment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
          })
            .then((response) => response.json())
            .then((data) => {
              const message = data.message;
              const slots = div.querySelector(".slots-container");
              slots.innerHTML = "";

              if (!message || message.length === 0) {
                slots.innerHTML = "<p>No slots available.</p>";
                return;
              }

              // --- SORTING LOGIC ADDED HERE ---
              // Sorts the slots by slot_id in ascending order (smallest to largest)
              message.sort((a, b) => a.slot_id - b.slot_id);
              // --------------------------------

              message.forEach((slot) => {
                const slotDiv = document.createElement("div");
                slotDiv.classList.add("slot");

                const displayTime = formatSlotTime(slot.slot_time);

                slotDiv.innerHTML = `
                  <p>Slot ID: ${slot.slot_id}</p>
                  <p><strong>Time:</strong> ${displayTime}</p>
                  <div style="margin-top: 10px;">
                    <label style="font-size: 0.9em; font-weight: bold;">Duration (Slots): </label>
                    <input type="number" class="slot-count" value="1" min="1" max="10" 
                           style="width: 60px; padding: 5px; border-radius: 4px; border: 1px solid #ccc;">
                  </div>
                `;

                slots.appendChild(slotDiv);

                const slotButton = document.createElement("button");
                slotButton.classList.add("book-slot-btn");
                slotButton.textContent = "Book Slot(s)";
                slotDiv.appendChild(slotButton);

                slotButton.addEventListener("click", () => {
                  if (!selectedProjectID) {
                    alert("Please select a project from the table in Step 1 first.");
                    return;
                  }

                  const countInput = slotDiv.querySelector(".slot-count");
                  const count = parseInt(countInput.value);

                  if (count < 1) {
                    alert("Duration must be at least 1.");
                    return;
                  }

                  const requestData = {
                    token: token,
                    slot_id: slot.slot_id,
                    project_id: selectedProjectID,
                    count: count
                  };

                  console.log(JSON.stringify(requestData));

                  fetch("http://localhost:8000/request_multiple_slots", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestData),
                  })
                    .then((response) => response.json())
                    .then((data) => {
                      if (data.message === "success") {
                        alert("Request sent successfully for " + count + " slot(s).");
                        window.location.href = "main.html";
                      } else {
                        alert("Failed to book: " + data.message);
                      }
                    })
                    .catch((error) => {
                      console.error(error);
                      alert("An error occurred.");
                    });
                });
              });
            })
            .catch((error) => {
              console.error(error);
            });
        });
      });
    })
    .catch((error) => {
      console.error(error);
    });
}