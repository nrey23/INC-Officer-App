/**
 * Dashboard JavaScript Module
 * Handles the main dashboard functionality including:
 * - Displaying and auto-refreshing role counts
 * - Managing the image carousel
 */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Fetch initial role counts from the server
    const response = await fetch('/api/dashboard-counts');
    if (!response.ok) throw new Error("Failed to load role counts");
    
    const counts = await response.json();
    
    // Update the UI with counts for each role
    // Roles are displayed in a specific order: Deacon, Deaconess, Choir, Secretary, Finance
    const roles = ["Deacon", "Deaconess", "Choir", "Secretary", "Finance"];
    roles.forEach(role => {
      const element = document.getElementById(`${role.toLowerCase()}Count`);
      if (element) {
        element.textContent = counts[role] || 0;
      }
    });

    // Set up automatic refresh of role counts every 30 seconds
    // This ensures the dashboard stays up-to-date with any changes
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

    // Image Carousel Setup
    const images = document.querySelectorAll('.carousel-image');
    const dots = document.querySelectorAll('.dot');
    let current = 0;
    const total = images.length;

    /**
     * Updates the carousel display
     * Manages the positioning of images (center, left, right)
     * Updates the active dot indicator
     */
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

    // Set up dot navigation for manual carousel control
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        current = idx;
        updateCarousel();
      });
    });

    // Configure automatic carousel advancement every 4 seconds
    setInterval(() => {
      current = (current + 1) % total;
      updateCarousel();
    }, 4000);

    // Initialize carousel display
    updateCarousel();

  } catch (error) {
    // Error handling for dashboard initialization
    console.error("Dashboard error:", error);
    const errorBanner = document.getElementById("errorBanner");
    if (errorBanner) {
      errorBanner.textContent = "Error loading role counts: " + error.message;
      errorBanner.classList.remove("d-none");
    }
  }
});