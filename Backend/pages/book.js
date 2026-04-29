let selectedProjectID = null; 
host='localhost'

// --- COOKIE & HELPER FUNCTIONS ---
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
          return parts[1]; 
      }
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function formatSlotTime(isoString) {
  if (!isoString) return "N/A";
  const startDate = new Date(isoString);
  const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  const dateStr = startDate.toLocaleDateString('en-US', dateOptions);
  const startStr = startDate.toLocaleTimeString('en-US', timeOptions);
  return `${dateStr} | ${startStr}`;
}

function getURLParameter(name) {
  return decodeURIComponent((new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(location.search) || [null, ""])[1].replace(/\+/g, "%20")) || null;
}

// --- FETCH PROJECTS ---
async function fetchAndDisplayProjects() {
  const token = getCookie();
  const container = document.getElementById("projectTable");
  if (!token) return;

  try {
    const response = await fetch("http://" + host + ":8000/show_projects_approved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    
    if(!response.ok) throw new Error("Failed");
    const data = await response.json();
    
    if (!data.message || data.message.length === 0) {
      container.innerHTML = "<p>No active projects found.</p>";
      return;
    }

    let tableHTML = `
      <table id="projectTable">
        <thead>
          <tr><th>Project ID</th><th>Title</th><th>Supervisor</th><th>Action</th></tr>
        </thead>
        <tbody>
    `;
    data.message.forEach((project) => {
      tableHTML += `
        <tr id="project-row-${project.project_id}">
          <td>${project.project_id}</td><td>${project.project_title}</td><td>${project.supervisor}</td>
          <td><button class="select-project-btn" onclick="selectProject('${project.project_id}')">Select</button></td>
        </tr>`;
    });
    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
  } catch (error) {
    console.error(error);
  }
}

function selectProject(projectID) {
  selectedProjectID = projectID;
  document.querySelectorAll("#projectTable tbody tr").forEach(row => row.classList.remove("selected-project"));
  const selectedRow = document.getElementById(`project-row-${projectID}`);
  if (selectedRow) selectedRow.classList.add("selected-project");
}

// --- FETCH REQUIREMENTS & QUESTIONS ---
async function fetchRequirements(token, equipmentId) {
    try {
        const response = await fetch("http://" + host + ":8000/get_equipment_requirements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token, ID: equipmentId })
        });
        const data = await response.json();
        return data.message; 
    } catch (e) {
        console.error("Error fetching requirements", e);
        return null;
    }
}

// --- MAIN LOGIC ---
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

  fetch("http://" + host + ":8000/get_ids_by_equipment_name", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  })
    .then(res => res.json())
    .then(data => {
      const message = data.message;
      table.innerHTML = ""; 

      if (!message || message.length === 0) {
          table.innerHTML = "<p>No items found.</p>";
          return;
      }

      message.forEach((element) => {
        const div = document.createElement("div");
        div.classList.add("book");
        const formId = `req-form-${element.equipment_id}`;
        
        div.innerHTML = `
        <h3>Equipment ID: ${element.equipment_id}</h3>
        <p>Location: ${element.location}</p>
        <button class="request-button" style="padding:8px 16px; background:#333; color:#fff; border:none; cursor:pointer;">Show Slots</button>
        
        <div id="${formId}" style="margin-top:15px; padding:10px; background:#f9f9f9; border-radius:5px; display:none;"></div>
        
        <div class="slots-container" style="margin-top:15px;"></div>
        `;
        table.appendChild(div);

        const button = div.querySelector("button");
        button.addEventListener("click", async () => {
          // 1. Fetch Requirements First
          const formContainer = document.getElementById(formId);
          const reqData = await fetchRequirements(token, element.equipment_id);
          
          // Build the Form HTML
          if (reqData) {
              let formHtml = "<h4>Usage Requirements</h4>";
              
              // Checkboxes for Features
              if (reqData.requirements.length > 0) {
                  reqData.requirements.forEach(req => {
                      if(req.type === 'fixed') {
                          formHtml += `
                            <div style="margin-bottom:5px;">
                                <input type="checkbox" class="req-checkbox" value="${req.name}" data-cost="${req.cost}">
                                <label> ${req.name} (Add-on Cost: ₹${req.cost})</label>
                            </div>`;
                      } else {
                          formHtml += `<p style="font-size:0.9em; color:#555;">Note: ${req.name} costs ₹${req.cost} per slot.</p>`;
                      }
                  });
              } else {
                  formHtml += "<p style='font-size:0.9em; color:#666;'>No special requirements.</p>";
              }

              // Text Inputs for Questions
              if (reqData.questions.length > 0) {
                  formHtml += "<h4 style='margin-top:15px;'>Additional Info <span style='color:red; font-size: 0.8em;'>*Mandatory</span></h4>";
                  reqData.questions.forEach(q => {
                      formHtml += `
                        <div style="margin-bottom:10px;">
                            <label style="display:block; font-weight:bold; font-size:0.9em;">${q}</label>
                            <input type="text" class="req-answer" data-question="${q}" style="width:95%; padding:5px; border:1px solid #ccc; border-radius:3px;">
                        </div>`;
                  });
              }
              
              // Changed ID to Class to prevent duplicate ID bugs
              formHtml += `
                  <h4 style='margin-top:15px;'>User Comments <span style='color:grey; font-size: 0.8em;'>(Optional)</span></h4>
                  <div style="margin-bottom:10px;">
                      <label style="display:block; font-weight:bold; font-size:0.9em;">Any special remarks?</label>
                      <textarea class="user-comment-input" rows="3" style="width:95%; padding:5px; border:1px solid #ccc; border-radius:3px;" placeholder="Optional..."></textarea>
                  </div>`;
              
              formContainer.innerHTML = formHtml;
              formContainer.style.display = "block";
          }

          // 2. Fetch Slots
          const slotRequest = { token: token, ID: element.equipment_id };
          fetch("http://" + host + ":8000/show_available_slots_equipment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(slotRequest),
          })
            .then(res => res.json())
            .then(slotData => {
              const slots = div.querySelector(".slots-container");
              slots.innerHTML = "";
              
              if (!slotData.message || slotData.message.length === 0) {
                  slots.innerHTML = "<p>No slots available.</p>";
                  return;
              }

              slotData.message.sort((a, b) => a.slot_id - b.slot_id);

              slotData.message.forEach((slot) => {
                const slotDiv = document.createElement("div");
                slotDiv.classList.add("slot");
                const displayTime = formatSlotTime(slot.slot_time);

                slotDiv.innerHTML = `
                    <p>Slot ID: ${slot.slot_id}</p>
                    <p><strong>Time:</strong> ${displayTime}</p>
                    <div style="margin-top: 10px;">
                        <label style="font-size: 0.9em; font-weight:bold;">Duration (Slots): </label>
                        <input type="number" class="slot-count" value="1" min="1" max="10" style="width:60px; padding:5px;">
                    </div>
                `;
                
                const slotButton = document.createElement("button");
                slotButton.className = "book-slot-btn";
                slotButton.textContent = "Book Slot(s)";
                slotDiv.appendChild(slotButton);
                slots.appendChild(slotDiv);

                // --- STRICT BOOKING VALIDATION HANDLER ---
                slotButton.addEventListener("click", () => {
                  if (!selectedProjectID) {
                    alert("Please select a project from the table above first.");
                    return;
                  }
                  
                  const count = parseInt(slotDiv.querySelector(".slot-count").value);
                  if (count < 1) { alert("Invalid duration"); return; }

                  // --- 1. Validate Checkboxes (Requirements) ---
                  const allCheckboxes = formContainer.querySelectorAll('.req-checkbox');
                  const selectedReqs = [];
                  allCheckboxes.forEach(cb => {
                      if (cb.checked) selectedReqs.push(cb.value);
                  });
                  
                  // RULE: If checkboxes exist, at least ONE must be checked
                  if (allCheckboxes.length > 0 && selectedReqs.length === 0) {
                      alert("Validation Error: Please select at least one usage requirement (Feature/Add-on) for this equipment.");
                      return;
                  }

                  // --- 2. Validate Answers (Extra Info) ---
                  const answers = {};
                  let missingAnswer = false;
                  formContainer.querySelectorAll('.req-answer').forEach(input => {
                      const val = input.value.trim();
                      if (val === "") missingAnswer = true;
                      answers[input.dataset.question] = val;
                  });

                  // RULE: Extra info is mandatory
                  if(missingAnswer) {
                      alert("Validation Error: Please fill out all mandatory 'Additional Info' fields.");
                      return;
                  }

                  // --- 3. Gather Optional Comment ---
                  const commentInput = formContainer.querySelector(".user-comment-input");
                  const userComment = commentInput ? commentInput.value.trim() : "";

                  // --- 4. Prepare Data Payload ---
                  const finalRequestData = JSON.stringify({
                      requirements: selectedReqs,
                      answers: answers
                  });

                  const payload = {
                    token: token,
                    slot_id: slot.slot_id,
                    project_id: selectedProjectID,
                    count: count,
                    request_data: finalRequestData, 
                    comment: userComment
                  };

                  console.log("Booking Payload:", payload);
                  
                  slotButton.textContent = "Booking...";
                  slotButton.disabled = true;
                  
                  fetch("http://" + host + ":8000/request_multiple_slots", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    })
                    .then(r => r.json())
                    .then(d => {
                      if (d.message === "success") {
                        alert("Booking Successful!");
                        window.location.href = "main.html";
                      } else {
                        alert("Failed: " + d.message);
                        slotButton.textContent = "Book Slot(s)";
                        slotButton.disabled = false;
                      }
                    })
                    .catch(err => {
                        console.error(err);
                        alert("Network error occurred.");
                        slotButton.textContent = "Book Slot(s)";
                        slotButton.disabled = false;
                    });
                });
              });
            });
        });
      });
    });
}