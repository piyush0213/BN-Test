// Initialize required data structures if they don't exist
function initializeStorage() {
  const requiredKeys = {
    'entries': [],
    'driverProfiles': [],
    'vehicles': [],
    'assignments': [],
    'roomAllocations': [],
    'driverPins': { 'admin': '123456' }
  };

  for (const [key, defaultValue] of Object.entries(requiredKeys)) {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
    }
  }
}

// Check authentication and initialize app
function checkAuth() {
  initializeStorage(); // Initialize storage first
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  // Update UI based on role
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = currentUser.role === 'admin' ? '' : 'none';
  });

  // Update welcome message
  const welcomeMessage = document.getElementById('welcomeMessage');
  if (welcomeMessage) {
    welcomeMessage.textContent = `Welcome, ${currentUser.username}`;
  }

  // If driver, filter database to show only their entries
  if (currentUser.role === 'driver') {
    const filterDriver = document.getElementById('filterDriver');
    if (filterDriver) {
      filterDriver.value = currentUser.username;
      filterDriver.disabled = true;
    }
  }

  // Initialize UI components AFTER successful authentication
  updateDropdowns();
  renderSetup();
  renderDatabase();
  initializeRoleBasedUI();
}

// Logout function
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', () => {
  // Skip auth check on login page
  if (window.location.pathname.endsWith('login.html')) {
    return;
  }
  checkAuth();
});

// Role-based access control
function isAdmin() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  return currentUser && currentUser.role === 'admin';
}

// Filter entries based on user role
function filterEntriesByRole(entries) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser && currentUser.role === 'driver') {
    return entries.filter(e => e.driver === currentUser.username);
  }
  return entries;
}

// Update dropdowns based on role
function updateDropdownsByRole() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser && currentUser.role === 'driver') {
    // For drivers, only show their vehicle
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]'); // Changed from {} to [] for consistency with getStoredData
    const assignedVehicleNumber = assignments.find(a => a.driver === currentUser.username)?.vehicle; // Get the assigned vehicle number

    if (assignedVehicleNumber) {
      const vehicleInput = document.getElementById('vehicleInput');
      if (vehicleInput) {
        vehicleInput.value = assignedVehicleNumber; // Set the value to the assigned vehicle number
        vehicleInput.readOnly = true;

        // Disable the dropdown options except the assigned one
        Array.from(vehicleInput.options).forEach(option => {
          if (option.value !== assignedVehicleNumber) {
            option.disabled = true;
          }
        });

        // If the assigned vehicle is not in the dropdown (e.g., if inactive), add it temporarily
        if (!Array.from(vehicleInput.options).some(o => o.value === assignedVehicleNumber)) {
          const newOption = document.createElement('option');
          newOption.value = assignedVehicleNumber;
          newOption.textContent = assignedVehicleNumber;
          newOption.selected = true;
          vehicleInput.appendChild(newOption);
        }
      }
    }
  }
}

// Initialize role-based UI
function initializeRoleBasedUI() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;

  // Hide admin-only elements for drivers
  if (currentUser.role === 'driver') {
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = 'none';
    });
  }

  // Update dropdowns
  updateDropdownsByRole();
}

// Export functions
window.checkAuth = checkAuth;
window.logout = logout;
window.isAdmin = isAdmin;
window.filterEntriesByRole = filterEntriesByRole;
window.updateDropdownsByRole = updateDropdownsByRole;
window.initializeRoleBasedUI = initializeRoleBasedUI; 