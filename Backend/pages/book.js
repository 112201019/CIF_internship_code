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
      if (parts.length >= 2) { return parts[1]; }
    }
  }
  return null;
}

function formatSlotTime(isoString) {
  if (!isoString) return "N/A";
  const startDate = new Date(isoString);
  const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  return `${startDate.toLocaleDateString('en-US', dateOptions)} | ${startDate.toLocaleTimeString('en-US', timeOptions)}`;
}

function getURLParameter(name) {
  return decodeURIComponent((new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(location.search) || [null, ""])[1].replace(/\+/g, "%20")) || null;
}

// --- STEP 1: FETCH PROJECTS (CARD UI) ---
async function fetchAndDisplayProjects() {
  const token = getCookie();
  const container = document.getElementById("projectTable");
  if (!token) {
    alert("Session expired. Please login again.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("http://" + host + ":8000/show_projects_approved", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
    });
    
    if(!response.ok) throw new Error("Failed");
    const data = await response.json();
    
    if (!data.message || data.message.length === 0) {
      container.innerHTML = "<p style='color:#e74c3c; font-weight:bold;'>No active/approved projects found. You cannot book equipment without an active project.</p>";
      return;
    }

    container.innerHTML = ""; // Clear loading text
    data.message.forEach((project) => {
      const card = document.createElement('div');
      card.className = "project-card";
      card.id = `project-card-${project.project_id}`;
      card.onclick = () => selectProject(project.project_id);
      
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start;">
            <h4>${project.project_title}</h4>
            <svg class="check-icon" style="display:none; width:20px; height:20px; color:#27ae60;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <p><strong>ID:</strong> ${project.project_id}</p>
        <p><strong>Supervisor:</strong> ${project.supervisor}</p>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p style='color:red;'>Error loading projects.</p>";
  }
}

function selectProject(projectID) {
  selectedProjectID = projectID;
  document.querySelectorAll(".project-card").forEach(card => {
      card.classList.remove("selected-project");
      card.querySelector('.check-icon').style.display = 'none';
  });
  
  const selectedCard = document.getElementById(`project-card-${projectID}`);
  if (selectedCard) {
      selectedCard.classList.add("selected-project");
      selectedCard.querySelector('.check-icon').style.display = 'block';
  }
}

// --- FETCH REQUIREMENTS ---
async function fetchRequirements(token, equipmentId) {
    try {
        const response = await fetch("http://" + host + ":8000/get_equipment_requirements", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token, ID: equipmentId })
        });
        const data = await response.json();
        return data.message; 
    } catch (e) {
        console.error("Error fetching requirements", e);
        return null;
    }
}

// --- STEP 2 & 3: MAIN LOGIC ---
function trackRequest() {
  const token = getCookie();
  const equipmentName = getURLParameter("equipment");
  const mainContainer = document.getElementById("books");

  if (!token || !equipmentName) return;

  fetch("http://" + host + ":8000/get_ids_by_equipment_name", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token, name: equipmentName }),
  })
  .then(res => res.json())
  .then(data => {
    mainContainer.innerHTML = ""; 

    if (!data.message || data.message.length === 0) {
        mainContainer.innerHTML = "<div class='section-card'><p>No specific items found for this equipment.</p></div>";
        return;
    }

    data.message.forEach((element) => {
      const wrapper = document.createElement("div");
      wrapper.className = "equipment-wrapper";
      const formId = `req-form-${element.equipment_id}`;
      
      wrapper.innerHTML = `
        <div class="section-card" id="details-section-${element.equipment_id}" style="display:none;">
            <h3 class="section-title"><span>2</span> Equipment Requirements</h3>
            <div id="${formId}"></div>
        </div>

        <div class="section-card">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:15px;">
                <h3 class="section-title" style="margin:0; border:none; padding:0;"><span>3</span> Available Slots</h3>
                <div style="text-align:right;">
                    <strong style="color:#2c3e50;">ID: ${element.equipment_id}</strong><br>
                    <span style="font-size:12px; color:#7f8c8d;">Location: ${element.location}</span>
                </div>
            </div>
            
            <div class="slots-container grid-container">
                <button class="btn btn-primary show-slots-init-btn" style="grid-column: 1 / -1;">View Available Slots & Requirements</button>
            </div>
        </div>
      `;
      mainContainer.appendChild(wrapper);

      const initButton = wrapper.querySelector(".show-slots-init-btn");
      
      initButton.addEventListener("click", async () => {
        initButton.textContent = "Loading...";
        initButton.disabled = true;

        // 1. Fetch & Build Requirements Form
        const formContainer = document.getElementById(formId);
        const reqData = await fetchRequirements(token, element.equipment_id);
        
        if (reqData) {
            let formHtml = "";
            
            if (reqData.requirements.length > 0) {
                formHtml += `<h4 style="color:#2980b9; margin-bottom:10px;">Select Features</h4>`;
                reqData.requirements.forEach(req => {
                    if(req.type === 'fixed') {
                        formHtml += `
                          <div class="checkbox-group">
                              <input type="checkbox" class="req-checkbox" value="${req.name}" data-cost="${req.cost}">
                              <label style="margin:0; font-size:14px; font-weight:normal;"> ${req.name} <strong style="color:#27ae60;">(+₹${req.cost})</strong></label>
                          </div>`;
                    } else {
                        formHtml += `<p style="font-size:13px; color:#e67e22; background:#fff3e0; padding:8px; border-radius:4px;">Note: <strong>${req.name}</strong> adds ₹${req.cost} to the cost of EVERY slot booked.</p>`;
                    }
                });
            }

            if (reqData.questions.length > 0) {
                formHtml += `<h4 style="color:#2980b9; margin-top:20px; margin-bottom:10px;">Mandatory Details</h4>`;
                reqData.questions.forEach(q => {
                    formHtml += `
                      <div class="form-group">
                          <label>${q} <span style="color:red;">*</span></label>
                          <input type="text" class="form-control req-answer" data-question="${q}" required>
                      </div>`;
                });
            }
            
            formHtml += `
                <div class="form-group" style="margin-top:20px;">
                    <label>Additional Comments (Optional)</label>
                    <textarea class="form-control user-comment-input" rows="2" placeholder="Any special requests or notes..."></textarea>
                </div>`;
            
            formContainer.innerHTML = formHtml;
            document.getElementById(`details-section-${element.equipment_id}`).style.display = "block";
        }

        // 2. Fetch Slots
        fetch("http://" + host + ":8000/show_available_slots_equipment", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token, ID: element.equipment_id }),
        })
        .then(res => res.json())
        .then(slotData => {
          const slotsGrid = wrapper.querySelector(".slots-container");
          slotsGrid.innerHTML = "";
          
          if (!slotData.message || slotData.message.length === 0) {
              slotsGrid.innerHTML = "<p style='color:#777;'>No slots currently available.</p>";
              return;
          }

          slotData.message.sort((a, b) => a.slot_id - b.slot_id);

          slotData.message.forEach((slot) => {
            const slotCard = document.createElement("div");
            slotCard.className = "slot-card";
            const displayTime = formatSlotTime(slot.slot_time);

            slotCard.innerHTML = `
                <div>
                    <h4>${displayTime}</h4>
                    <p><strong>Slot ID:</strong> ${slot.slot_id}</p>
                    <div class="form-group" style="margin-top: 15px; margin-bottom:0;">
                        <label>Duration (Consecutive Slots)</label>
                        <input type="number" class="form-control slot-count" value="1" min="1" max="10">
                    </div>
                </div>
                <button class="btn btn-success book-slot-btn">Book Now</button>
            `;
            
            slotsGrid.appendChild(slotCard);

            // --- BOOKING LOGIC ---
            const slotButton = slotCard.querySelector(".book-slot-btn");
            slotButton.addEventListener("click", () => {
              
              if (!selectedProjectID) {
                alert("STEP 1 MISSING: Please select a project from the top list first.");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
              }
              
              const count = parseInt(slotCard.querySelector(".slot-count").value);
              if (count < 1) { alert("Invalid duration"); return; }

              // Validate Features
              const allCheckboxes = formContainer.querySelectorAll('.req-checkbox');
              const selectedReqs = [];
              allCheckboxes.forEach(cb => { if (cb.checked) selectedReqs.push(cb.value); });
              
              if (allCheckboxes.length > 0 && selectedReqs.length === 0) {
                  alert("Please select at least one usage requirement/feature for this equipment.");
                  document.getElementById(`details-section-${element.equipment_id}`).scrollIntoView({behavior: 'smooth'});
                  return;
              }

              // Validate Mandatory Info
              const answers = {};
              let missingAnswer = false;
              formContainer.querySelectorAll('.req-answer').forEach(input => {
                  const val = input.value.trim();
                  if (val === "") missingAnswer = true;
                  answers[input.dataset.question] = val;
              });

              if(missingAnswer) {
                  alert("Please fill out all mandatory fields in the Equipment Requirements section.");
                  return;
              }

              const commentInput = formContainer.querySelector(".user-comment-input");
              const userComment = commentInput ? commentInput.value.trim() : "";

              const payload = {
                token: token,
                slot_id: slot.slot_id,
                project_id: selectedProjectID,
                count: count,
                request_data: JSON.stringify({ requirements: selectedReqs, answers: answers }), 
                comment: userComment
              };

              slotButton.textContent = "Processing...";
              slotButton.classList.add("btn-disabled");
              slotButton.disabled = true;
              
              fetch("http://" + host + ":8000/request_multiple_slots", {
                  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
                })
                .then(r => r.json())
                .then(d => {
                  if (d.message === "success") {
                    alert("Booking Request Submitted Successfully!");
                    window.location.href = "main.html";
                  } else {
                    alert("Failed: " + d.message);
                    slotButton.textContent = "Book Now";
                    slotButton.classList.remove("btn-disabled");
                    slotButton.disabled = false;
                  }
                })
                .catch(err => {
                    alert("Network error occurred.");
                    slotButton.textContent = "Book Now";
                    slotButton.classList.remove("btn-disabled");
                    slotButton.disabled = false;
                });
            });
          });
        });
      });
    });
  });
}