let selectedProjectID = null; // Global variable to store the selected project

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

// get the value of urk parameter ?equipment=something
function getURLParameter(name) {
  return (
    decodeURIComponent(
      (new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(
        location.search
      ) || [null, ""])[1].replace(/\+/g, "%20")
    ) || null
  );
}

// console.log(getURLParameter("equipment"));

// --- NEW FUNCTION TO FETCH PROJECTS ---
async function fetchAndDisplayProjects() {
  const token = getCookie();
  const container = document.getElementById("projectTable");

  try {
    const response = await fetch("http://localhost:8000/show_projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }

    const data = await response.json();
    if (!data.message || data.message.length === 0) {
      container.innerHTML = "<p>You have no active projects available for booking.</p>";
      return;
    }

    // Build the table
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
    container.innerHTML = "<p>Error loading your projects. Please try again.</p>";
  }
}

// --- NEW HELPER FUNCTION TO SELECT PROJECT ---
function selectProject(projectID) {
  // Store the selected ID globally
  selectedProjectID = projectID;
  
  // Remove highlighting from all rows
  const allRows = document.querySelectorAll("#projectTable tbody tr");
  allRows.forEach(row => {
    row.classList.remove("selected-project");
  });

  // Add highlighting to the clicked row
  const selectedRow = document.getElementById(`project-row-${projectID}`);
  if (selectedRow) {
    selectedRow.classList.add("selected-project");
  }

}


function trackRequest() {
  const token = getCookie();

  const requestData = {
    token: token,
    name: getURLParameter("equipment"),
  };
  console.log(JSON.stringify(requestData));

  // Fetch data from the server
  fetch("http://localhost:8000/get_ids_by_equipment_name", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      /*
    response format:{...}
    */
      const table = document.getElementById("books");
      const message = data.message;
      message.forEach((element) => {
        // add a div with the equipment id and location and a button to request with proper padding and styling
        const div = document.createElement("div");
        div.classList.add("book");
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
          <div id="slots" ></div>
        `;
        table.appendChild(div);

        // add event listener to the button
        const button = div.querySelector("button");
        button.addEventListener("click", () => {
          // send a request to the server to book the equipment
          const requestData = {
            token: token,
            ID: element.equipment_id,
          };
          fetch("http://localhost:8000/show_available_slots_equipment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
          })
            .then((response) => response.json())
            .then((data) => {
              const message = data.message;
              const slots = div.querySelector("#slots");
              slots.innerHTML = "";
              //  show Slot id and slot time and a button to book
              message.forEach((slot) => {
                const slotDiv = document.createElement("div");
                slotDiv.classList.add("slot");
                slotDiv.innerHTML = `
                    <p>Slot ID: ${slot.slot_id}</p>
                    <p>Slot Time: ${slot.slot_time}</p>`;

                // --- INPUT FIELD REMOVED ---
                // const input = document.createElement("input");
                // ...
                // slotDiv.appendChild(input);

                slots.appendChild(slotDiv);
                
                const slotButton = document.createElement("button");
                slotButton.classList.add("book-slot-btn"); // Use new CSS class
                slotButton.textContent = "Book This Slot";
                slotDiv.appendChild(slotButton);
                
                slotButton.addEventListener("click", () => {
                  
                  // --- MODIFIED LOGIC ---
                  // Check if a project was selected first
                  if (!selectedProjectID) {
                    alert("Please select a project from the table in Step 1 first.");
                    return;
                  }
                  
                  const project_id = selectedProjectID; // Use the stored project ID
                  // --- END MODIFICATION ---

                  const requestData = {
                    token: token,
                    slot_ID: slot.slot_id,
                    project_ID: project_id,
                  };

                  console.log(JSON.stringify(requestData));
                  fetch(
                    "http://localhost:8000/request_a_slot_for_project",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(requestData),
                    }
                  )
                    .then((response) => response.json())
                    .then((data) => {
                      if (data.message === "success") {
                        alert("Request sent successfully");
                        // REDIRECT TO THE MAIN PAGE
                        window.location.href = "main.html";
                      } else {
                        alert("Failed to book slot");
                      }
                    })
                    .catch((error) => {
                      alert("An error occurred while sending the request.");
                      console.error(error);
                    });
                });
              });
            })
            .catch((error) => {
              alert("An error occurred while sending the request.");
              console.error(error);
            });
        });
      });
    })
    .catch((error) => {
      alert("An error occurred while fetching request status.");
      console.error(error);
    });
}

trackRequest();