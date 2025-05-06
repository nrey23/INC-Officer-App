document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Load role counts
    const response = await fetch('/api/dashboard-counts');
    if (!response.ok) throw new Error("Failed to load role counts");
    
    const counts = await response.json();
    
    // Update the UI with counts
    const roles = ["Deacon", "Deaconess", "Choir", "Secretary", "Finance"];
    roles.forEach(role => {
      const element = document.getElementById(`${role.toLowerCase()}Count`);
      if (element) {
        element.textContent = counts[role] || 0;
      }
    });

    // Refresh counts every 30 seconds
    setInterval(async () => {
      try {
        const refreshResponse = await fetch('/api/dashboard-counts');
        if (refreshResponse.ok) {
          const refreshedCounts = await refreshResponse.json();
          roles.forEach(role => {
            const element = document.getElementById(`${role.toLowerCase()}Count`);
            if (element) {
              element.textContent = refreshedCounts[role] || 0;
            }
          });
        }
      } catch (refreshError) {
        console.log("Background refresh error:", refreshError);
      }
    }, 30000);

  } catch (error) {
    console.error("Dashboard error:", error);
    const errorBanner = document.getElementById("errorBanner");
    if (errorBanner) {
      errorBanner.textContent = "Error loading role counts: " + error.message;
      errorBanner.classList.remove("d-none");
    }
  }
});