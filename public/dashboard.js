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

    const images = document.querySelectorAll('.carousel-image');
    const dots = document.querySelectorAll('.dot');
    let current = 0;
    const total = images.length;

    function updateCarousel() {
      images.forEach((img, i) => {
        img.classList.remove('center', 'left', 'right');
        if (i === current) {
          img.classList.add('center');
        } else if (i === (current - 1 + total) % total) {
          img.classList.add('left');
        } else if (i === (current + 1) % total) {
          img.classList.add('right');
        }
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
      });
    }

    // Dot navigation
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        current = idx;
        updateCarousel();
      });
    });

    // Auto-advance every 4 seconds
    setInterval(() => {
      current = (current + 1) % total;
      updateCarousel();
    }, 4000);

    updateCarousel();

  } catch (error) {
    console.error("Dashboard error:", error);
    const errorBanner = document.getElementById("errorBanner");
    if (errorBanner) {
      errorBanner.textContent = "Error loading role counts: " + error.message;
      errorBanner.classList.remove("d-none");
    }
  }
});