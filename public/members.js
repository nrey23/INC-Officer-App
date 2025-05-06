document.addEventListener("DOMContentLoaded", () => {
    // Initialize elements
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const logoutBtn = document.getElementById('logoutBtn');
    const memberList = document.getElementById('memberList');
    
    // Initialize members array
    let members = [];
  
    // Toggle sidebar
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
    });
  
    // Logout functionality
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('isLoggedIn');
      window.location.href = 'login.html';
    });
  
    // Format date for display
    function formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  
    // Load members from API
    async function loadMembers() {
      try {
        memberList.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border"></div> Loading members...</td></tr>';
        
        const response = await fetch('/api/members');
        if (!response.ok) throw new Error('Failed to load members');
        
        members = await response.json();
        applyFilters();
      } catch (error) {
        console.error('Error loading members:', error);
        memberList.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error loading members: ${error.message}</td></tr>`;
      }
    }
  
    // Render members to table
    function renderMembers(data) {
      memberList.innerHTML = data.map(member => `
        <tr>
          <td>${member.full_name}</td>
          <td>${member.gender || '-'}</td>
          <td>${formatDate(member.birthday)}</td>
          <td>${member.role}</td>
          <td>${member.contact_info || '-'}</td>
          <td><img src="https://api.qrserver.com/v1/create-qr-code/?data=${member.qr_code_data}&size=100x100" height="50" /></td>
        </tr>
      `).join('') || '<tr><td colspan="6" class="text-center">No members found</td></tr>';
    }
  
    // Apply all filters and sorting
    function applyFilters() {
      const roleFilter = document.getElementById('filterRole').value;
      const genderFilter = document.getElementById('filterGender').value;
      const monthFilter = document.getElementById('filterBirthMonth').value;
      const searchTerm = document.getElementById('searchName').value.toLowerCase();
      const sortOrder = document.getElementById('sortName').value;
  
      let filtered = [...members];
  
      // Apply filters
      if (roleFilter) {
        filtered = filtered.filter(m => m.role === roleFilter);
      }
  
      if (genderFilter) {
        filtered = filtered.filter(m => m.gender === genderFilter);
      }
  
      if (monthFilter) {
        filtered = filtered.filter(m => {
          if (!m.birthday) return false;
          const birthMonth = new Date(m.birthday).getMonth() + 1;
          return birthMonth == monthFilter;
        });
      }
  
      if (searchTerm) {
        filtered = filtered.filter(m => 
          m.full_name.toLowerCase().includes(searchTerm) || 
          (m.contact_info && m.contact_info.toLowerCase().includes(searchTerm))
        );
      }
  
      // Apply sorting
      filtered.sort((a, b) => {
        return sortOrder === 'asc' 
          ? a.full_name.localeCompare(b.full_name)
          : b.full_name.localeCompare(a.full_name);
      });
  
      renderMembers(filtered);
    }
  
    // Set up event listeners for filters
    document.getElementById('filterRole').addEventListener('change', applyFilters);
    document.getElementById('filterGender').addEventListener('change', applyFilters);
    document.getElementById('filterBirthMonth').addEventListener('change', applyFilters);
    document.getElementById('searchName').addEventListener('input', applyFilters);
    document.getElementById('sortName').addEventListener('change', applyFilters);
  
    // Initial load
    loadMembers();
  });