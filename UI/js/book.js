/**
 * Gets a parameter from the URL query string.
 * e.g., ?equipment=COMPUTER
 */
function getURLParameter(name) {
  return (
    decodeURIComponent(
      (new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(
        location.search
      ) || [null, ""])[1].replace(/\+/g, "%20")
    ) || null
  );
}

/**
 * Main function for the booking page.
 * 1. Gets equipment name from URL.
 * 2. Fetches all equipment IDs for that name.
 * 3. Fetches all available slots for *each* of those IDs.
 * 4. Displays a single, consolidated list of slots.
 */
async function loadAndDisplayAllSlots() {
  const equipmentName = getURLParameter("equipment");
  const token = getCookie();
  const titleEl = document.getElementById("booking-page-title");
  const containerEl = document.getElementById("slot-list-container");

  if (!equipmentName) {
    titleEl.textContent = "Booking Error";
    containerEl.innerHTML = "<p>No equipment name specified in the URL.</p>";
    return;
  }

  titleEl.textContent = `Book: ${equipmentName.toUpperCase()}`;
  containerEl.innerHTML = "<p>Loading available slots...</p>";

  try {
    // 1. Get all equipment IDs for this equipment name
    const idResponse = await fetch("http://localhost:8000/get_ids_by_equipment_name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token, name: equipmentName }),
    });
    const idData = await idResponse.json();

    if (!idData.message || idData.message.length === 0) {
      containerEl.innerHTML = "<p>No equipment items found with this name.</p>";
      return;
    }

    // 2. Create a list of promises, one for each equipment ID's slot fetch
    const slotFetchPromises = idData.message.map(equipment => {
      return fetchSlotsForEquipment(token, equipment.equipment_id);
    });

    // 3. Wait for all slot fetches to complete
    const allSlotsArrays = await Promise.all(slotFetchPromises);

    // 4. Flatten the array of arrays into one single list of slots
    const allSlots = allSlotsArrays.flat(); // .flat() combines [[a,b], [c]] into [a,b,c]

    // 5. Display the consolidated list
    renderAllSlots(containerEl, allSlots);

  } catch (error) {
    console.error("Error loading slots:", error);
    containerEl.innerHTML = "<p>An error occurred while loading slots. Please try again.</p>";
  }
}

/**
 * Helper function to fetch slots for a *single* equipment ID.
 * It manually adds the `equipment_id` to each slot object.
 */
async function fetchSlotsForEquipment(token, equipmentId) {
  try {
    const response = await fetch("http://localhost:8000/show_available_slots_equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token, ID: equipmentId }),
    });

    if (!response.ok) {
      console.error(`Failed to fetch slots for ${equipmentId}`);
      return []; // Return empty array on failure so Promise.all doesn't fail
    }

    const data = await response.json();

    // Add the equipmentId to each slot object so we know which one it is
    return data.message.map(slot => ({
      ...slot, // { slot_id, slot_time }
      equipment_id: equipmentId // Add this
    }));
  } catch (error) {
    console.error(`Error in fetchSlotsForEquipment ${equipmentId}:`, error);
    return [];
  }
}

/**
 * Renders the final, consolidated list of slots to the page.
 */
function renderAllSlots(containerEl, slots) {
  containerEl.innerHTML = ""; // Clear "Loading..." text

  if (slots.length === 0) {
    containerEl.innerHTML = "<p>No available slots found for this equipment at this time.</p>";
    document.getElementById("booking-instructions").style.display = "none";
    return;
  }

  slots.forEach(slot => {
    const slotDiv = document.createElement("div");
    slotDiv.classList.add("slot-item"); // Use .slot-item class from CSS

    slotDiv.innerHTML = `
      <p style="margin: 0 0 10px 0; font-weight: 600; color: var(--text-primary);">
        ${slot.slot_time}
      </p>
      <p style="font-size: 0.9em; color: var(--text-secondary); margin-top: 0;">
        Specific Item: <strong>${slot.equipment_id}</strong> (Slot ID: ${slot.slot_id})
      </p>
    `;

    const input = document.createElement("input");
    input.placeholder = "Project ID";
    input.type = "text";
    input.style.marginTop = "5px";

    const slotButton = document.createElement("button");
    slotButton.textContent = "Book This Slot";
    slotButton.classList.add("btn-primary");
    slotButton.style.marginLeft = "10px";

    slotDiv.appendChild(input);
    slotDiv.appendChild(slotButton);
    containerEl.appendChild(slotDiv);

    // Add the booking logic to the button
    slotButton.addEventListener("click", () => {
      const projectId = input.value;
      if (!projectId) {
        alert("Please enter a Project ID.");
        return;
      }
      bookSlot(slot.slot_id, projectId);
    });
  });
}

/**
 * Handles the final booking request.
 */
async function bookSlot(slotId, projectId) {
  const token = getCookie();
  const requestData = {
    token: token,
    slot_ID: slotId,
    project_ID: projectId,
  };

  try {
    const response = await fetch("http://localhost:8000/request_a_slot_for_project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (data.message === "success") {
      alert("Request sent successfully! You will be redirected to the main page.");
      window.location.href = "main.html";
    } else {
      alert("Failed to book slot. It may have just been taken. Please refresh and try again.");
    }
  } catch (error) {
    alert("An error occurred while sending the request.");
    console.error(error);
  }
}