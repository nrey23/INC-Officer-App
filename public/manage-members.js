/**
 * Member Management JavaScript Module
 * Handles all member-related operations including:
 * - Adding new members
 * - Editing existing members
 * - Deleting members
 * - Filtering and searching members
 * - Displaying member information in a table
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM element references
  const form = document.getElementById("addMemberForm");
  const memberList = document.getElementById("memberList");
  const filterRole = document.getElementById("filterRole");
  const searchName = document.getElementById("searchName");
  const editModal = new bootstrap.Modal(document.getElementById("editModal"));
  const deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
  let memberToDelete = null;
  const editForm = document.getElementById("editMemberForm");
  let allMembers = [];

  /**
   * Displays a temporary alert message
   * @param {string} message - The message to display
   * @param {string} type - Alert type (success, danger, etc.)
   */
  function showAlert(message, type = 'danger') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.getElementById('alertContainer').appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
  }

  /**
   * Sanitizes user input by removing HTML tags and trimming whitespace
   * @param {string} text - Input text to sanitize
   * @returns {string} Sanitized text
   */
  function sanitizeInput(text) {
    return text.trim().replace(/<[^>]*>/g, "");
  }

  /**
   * Escapes HTML special characters to prevent XSS attacks
   * @param {string} unsafe - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(unsafe) {
    return unsafe?.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;") || '';
  }

  /**
   * Formats a date string for display in the UI
   * @param {string} dateString - Date string to format
   * @returns {string} Formatted date string
   */
  function formatDateForDisplay(dateString) {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  }

  /**
   * Formats a date string for input fields (YYYY-MM-DD)
   * @param {string} dateString - Date string to format
   * @returns {string} Formatted date string
   */
  function formatDateForInput(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }

  /**
   * Fetches all members from the server and updates the display
   * Handles loading states and error conditions
   */
  async function loadMembers() {
    try {
      memberList.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border"></div> Loading...</td></tr>';
      const response = await fetch("/api/members");
      
      if (!response.ok) throw new Error("Failed to load members");
      
      allMembers = await response.json();
      console.log("Loaded members:", allMembers);
      
      // Normalize member data by setting default values for optional fields
      allMembers = allMembers.map(member => ({
        ...member,
        birthday: member.birthday || null,
        gender: member.gender || 'Not specified'
      }));
      
      applyFilterAndSearch();
    } catch (err) {
      console.error("Error loading members:", err);
      showAlert(err.message);
      memberList.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading members</td></tr>';
    }
  }

  /**
   * Filters and searches members based on role and name
   * Updates the table display with filtered results
   */
  function applyFilterAndSearch() {
    const role = filterRole.value;
    const name = searchName.value.toLowerCase();
    
    const filtered = allMembers.filter(m =>
      (role === "" || m.role === role) &&
      (name === "" || m.full_name.toLowerCase().includes(name))
    );
    renderTable(filtered);
  }

  /**
   * Renders the member table with the provided data
   * @param {Array} data - Array of member objects to display
   */
  function renderTable(data) {
    memberList.innerHTML = data.map(member => `
      <tr>
        <td>${escapeHtml(member.full_name)}</td>
        <td>${escapeHtml(member.gender)}</td>
        <td>${formatDateForDisplay(member.birthday)}</td>
        <td>${escapeHtml(member.role)}</td>
        <td>${escapeHtml(member.contact_info)}</td>
        <td><img src="https://api.qrserver.com/v1/create-qr-code/?data=${member.qr_code_data}&size=100x100" width="60"></td>
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="editMember('${member.member_id}')">
            Edit
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteMember('${member.member_id}')">
            Delete
          </button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" class="text-center">No members found</td></tr>';
  }

  // Add Member Form Submission Handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const memberData = {
        full_name: sanitizeInput(form.full_name.value),
        gender: form.gender.value,
        birthday: form.birthday.value,
        role: form.role.value,
        contact_info: sanitizeInput(form.contact_info.value)
      };
      
      console.log("Submitting new member:", memberData);
      
      // Validate required fields
      if (!memberData.full_name || memberData.full_name.length < 2) {
        throw new Error("Name must be at least 2 characters");
      }
      if (!memberData.gender) {
        throw new Error("Please select a gender");
      }

      const response = await fetch("/api/add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add member");
      }

      form.reset();
      showAlert("Member added successfully!", "success");
      await loadMembers();
    } catch (err) {
      showAlert(err.message);
    }
  });

  /**
   * Opens the edit modal for a specific member
   * @param {string} id - Member ID to edit
   */
  window.editMember = async (id) => {
    try {
      const member = allMembers.find(m => m.member_id == id);
      if (!member) throw new Error("Member not found");
  
      console.log("Editing member:", member);
      
      // Populate edit form with member data
      document.getElementById("edit_id").value = member.member_id;
      document.getElementById("edit_full_name").value = member.full_name;
      document.getElementById("edit_gender").value = member.gender || 'Male';
      document.getElementById("edit_birthday").value = formatDateForInput(member.birthday);
      document.getElementById("edit_role").value = member.role;
      document.getElementById("edit_contact_info").value = member.contact_info || '';
      
      editModal.show();
    } catch (err) {
      showAlert(err.message);
    }
  };

  // Edit Member Form Submission Handler
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const memberData = {
        full_name: sanitizeInput(editForm.edit_full_name.value),
        gender: editForm.edit_gender.value,
        birthday: editForm.edit_birthday.value,
        role: editForm.edit_role.value,
        contact_info: sanitizeInput(editForm.edit_contact_info.value)
      };

      console.log("Updating member:", memberData);

      // Validate required fields
      if (!memberData.full_name || memberData.full_name.length < 2) {
        throw new Error("Name must be at least 2 characters");
      }

      const id = editForm.edit_id.value;
      const response = await fetch(`/api/update-member/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update member");
      }

      editModal.hide();
      showAlert("Member updated successfully!", "success");
      await loadMembers();
    } catch (err) {
      showAlert(err.message);
    }
  });

  /**
   * Opens the delete confirmation modal for a member
   * @param {string} id - Member ID to delete
   */
  window.deleteMember = (id) => {
    memberToDelete = id;
    deleteModal.show();
  };
    
  // Delete Confirmation Handler
  document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
    if (!memberToDelete) return;
  
    try {
      const response = await fetch(`/api/delete-member/${memberToDelete}`, {
        method: "DELETE"
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete member");
      }
  
      showAlert("Member deleted successfully!", "success");
      deleteModal.hide();
      memberToDelete = null;
      await loadMembers();
    } catch (err) {
      showAlert(err.message);
    }
  });

  // Initialize event listeners and load initial data
  filterRole.addEventListener("change", applyFilterAndSearch);
  searchName.addEventListener("input", applyFilterAndSearch);
  loadMembers();
});

