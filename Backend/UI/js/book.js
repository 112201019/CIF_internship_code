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

function getURLParameter(name) {
  return (
    decodeURIComponent(
      (new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(
        location.search
      ) || [null, ""])[1].replace(/\+/g, "%20")
    ) || null
  );
}

function trackRequest() {
  const token = getCookie();

  const requestData = {
    token: token,
    name: getURLParameter("equipment"),
  };
  console.log(JSON.stringify(requestData));

  fetch("http://localhost:8000/get_ids_by_equipment_name", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      const table = document.getElementById("books");
      const message = data.message;
      message.forEach((element) => {
        const div = document.createElement("div");
        div.classList.add("card"); // Use .card class
        div.innerHTML = `
          <h3>Equipment ID: ${element.equipment_id}</h3>
          <p>Location: ${element.location}</p>
          <button class="request-button">Show Slots</button>
          <div class="slots-container" style="display: none;"></div>
        `;
        table.appendChild(div);

        const button = div.querySelector("button");
        const slotsContainer = div.querySelector(".slots-container");
        
        button.addEventListener("click", () => {
          // Toggle visibility
          const isHidden = slotsContainer.style.display === "none";
          slotsContainer.style.display = isHidden ? "block" : "none";
          button.textContent = isHidden ? "Hide Slots" : "Show Slots";

          // Only fetch if it's the first time
          if (isHidden && slotsContainer.innerHTML === "") {
            fetchSlots(element.equipment_id, slotsContainer);
          }
        });
      });
    })
    .catch((error) => {
      alert("An error occurred while fetching equipment.");
      console.error(error);
    });
}

function fetchSlots(equipmentId, slotsContainer) {
  const token = getCookie();
  const requestData = {
    token: token,
    ID: equipmentId,
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
      slotsContainer.innerHTML = ""; // Clear previous
      
      if (message.length === 0) {
        slotsContainer.innerHTML = "<p>No available slots for this equipment.</p>";
        return;
      }

      message.forEach((slot) => {
        const slotDiv = document.createElement("div");
        slotDiv.classList.add("slot-item"); // Use .slot-item class
        slotDiv.innerHTML = `
          <p><b>Slot ID:</b> ${slot.slot_id}</p>
          <p><b>Slot Time:</b> ${slot.slot_time}</p>
        `;
        
        const input = document.createElement("input");
        input.placeholder = "Project ID";
        input.type = "text";
        input.classList.add("project-id-input"); // Add class for styling
        
        const slotButton = document.createElement("button");
        slotButton.textContent = "Book";
        
        slotDiv.appendChild(input);
        slotDiv.appendChild(slotButton);
        slotsContainer.appendChild(slotDiv);

        slotButton.addEventListener("click", () => {
          const project_id = input.value;
          if (!project_id) {
            alert("Please enter a Project ID.");
            return;
          }
          
          const bookRequestData = {
            token: token,
            slot_ID: slot.slot_id,
            project_ID: project_id,
          };

          fetch("http://localhost:8000/request_a_slot_for_project", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(bookRequestData),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.message === "success") {
                alert("Request sent successfully");
                window.location.href = "main.html";
              } else {
                alert("Failed to book slot. It may already be taken.");
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
      alert("An error occurred while fetching slots.");
      console.error(error);
    });
}