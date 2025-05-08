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

document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('.carousel-image');
  let current = 0;

  function showImage(idx) {
    images.forEach((img, i) => {
      img.classList.toggle('active', i === idx);
    });
  }

  document.getElementById('prevBtn').addEventListener('click', function() {
    current = (current - 1 + images.length) % images.length;
    showImage(current);
  });

  document.getElementById('nextBtn').addEventListener('click', function() {
    current = (current + 1) % images.length;
    showImage(current);
  });

  // Optional: Auto-advance every 4 seconds
  setInterval(() => {
    current = (current + 1) % images.length;
    showImage(current);
  }, 4000);

  showImage(current);
});