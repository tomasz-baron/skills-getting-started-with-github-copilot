document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants markup
        const participants = Array.isArray(details.participants) ? details.participants : [];
        let participantsHtml = "";

        if (participants.length > 0) {
          participantsHtml = `
            <div class="participants">
              <h5 class="participants-heading">Participants</h5>
              <ul class="participants-list"></ul>
            </div>
          `;
        } else {
          participantsHtml = `
            <div class="participants">
              <h5 class="participants-heading">Participants</h5>
              <p class="no-participants">No participants yet</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p class="availability"><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Populate participants list with delete buttons and attach handlers
        const participantsListEl = activityCard.querySelector('.participants-list');
        if (participantsListEl) {
          participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'participant-name';
            nameSpan.textContent = p;

            const delBtn = document.createElement('button');
            delBtn.className = 'participant-delete';
            delBtn.type = 'button';
            delBtn.title = 'Remove participant';
            delBtn.setAttribute('aria-label', `Remove ${p}`);
            delBtn.innerHTML = '&times;';

            delBtn.addEventListener('click', async () => {
              if (!confirm(`Remove ${p} from ${name}?`)) return;
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                  { method: 'DELETE' }
                );
                const result = await res.json();
                if (res.ok) {
                  // remove from DOM
                  li.remove();

                  // update local details array so availability is correct
                  const idx = details.participants.indexOf(p);
                  if (idx > -1) details.participants.splice(idx, 1);

                  // update availability text
                  const availabilityEl = activityCard.querySelector('.availability');
                  const newSpots = details.max_participants - details.participants.length;
                  if (availabilityEl) availabilityEl.innerHTML = `<strong>Availability:</strong> ${newSpots} spots left`;

                  // if list is now empty, replace with empty state
                  if (details.participants.length === 0) {
                    const parent = participantsListEl.parentElement;
                    const listNode = parent.querySelector('.participants-list');
                    if (listNode) listNode.remove();
                    const emptyP = document.createElement('p');
                    emptyP.className = 'no-participants';
                    emptyP.textContent = 'No participants yet';
                    parent.appendChild(emptyP);
                  }

                  // show a short success message
                  messageDiv.textContent = result.message || 'Participant removed';
                  messageDiv.className = 'success';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 3000);
                } else {
                  messageDiv.textContent = result.detail || 'Failed to remove participant';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                }
              } catch (err) {
                console.error('Error removing participant:', err);
                messageDiv.textContent = 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(delBtn);
            participantsListEl.appendChild(li);
          });
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities so the newly-signed-up participant appears immediately
        try {
          await fetchActivities();
        } catch (err) {
          console.error('Error refreshing activities after signup:', err);
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
