// Initialize global variables
let drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
let vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
let assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
let entries = JSON.parse(localStorage.getItem('entries') || '[]');
let roomAllocations = JSON.parse(localStorage.getItem('roomAllocations') || '{}');

// Initialize default data if not exists
if (!localStorage.getItem('driverProfiles')) {
  localStorage.setItem('driverProfiles', JSON.stringify([]));
}

if (!localStorage.getItem('vehicles')) {
  localStorage.setItem('vehicles', JSON.stringify([]));
}

if (!localStorage.getItem('assignments')) {
  localStorage.setItem('assignments', JSON.stringify([]));
}

// Core functions
function showTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  
  // Update content based on tab
  if (id === 'database') renderDatabase();
  if (id === 'weekly') generateWeeklySummary();
  if (id === 'summary') renderSummary();
  if (id === 'setup') renderSetup();
  
  // Update dropdowns
  updateDropdowns();
}

function updateDropdowns() {
  try {
    const driverProfiles = getStoredData('driverProfiles');
    const vehicles = getStoredData('vehicles');
    
    if (!Array.isArray(driverProfiles) || !Array.isArray(vehicles)) {
      console.error('Invalid data format in localStorage');
      return;
    }

    // Update driver dropdowns
    const driverLists = document.querySelectorAll('#driversList, #filterDriver, #assignDriver, #roomDriver, #pinDriver');
    driverLists.forEach(list => {
      if (list.tagName === 'DATALIST') {
        list.innerHTML = driverProfiles.map(d => `<option value="${d.name}">`).join('');
      } else {
        list.innerHTML = '<option value="">Select Driver</option>' + 
          driverProfiles.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
      }
    });

    // Update vehicle dropdowns
    const vehicleLists = document.querySelectorAll('#vehicleInput, #filterVehicle, #assignVehicle, #weeklyVehicle');
    vehicleLists.forEach(list => {
      list.innerHTML = '<option value="">Select Vehicle Number</option>' + 
        vehicles.map(v => `<option value="${v.number}">${v.number}</option>`).join('');
    });
  } catch (error) {
    console.error('Error in updateDropdowns:', error);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners
  const form = document.getElementById('entryForm');
  if (form) {
    ['earnings', 'offlineEarnings', 'hours'].forEach(field => {
      form[field].addEventListener('input', updateEntryCalculations);
    });
  }
});

function addDriver() {
  const name = prompt("Enter driver name:");
  if (name && !drivers.includes(name)) {
    drivers.push(name);
    localStorage.setItem('drivers', JSON.stringify(drivers));
    updateDropdowns();
    renderSetup();
  }
}

function addVehicle() {
  // This function is no longer needed as vehicle addition is handled via modal
  console.warn("addVehicle function is deprecated. Use addNewVehicle() via modal.");
}

function assignDriverVehicle() {
  try {
    const driverSelect = document.getElementById('assignDriver');
    const vehicleSelect = document.getElementById('assignVehicle');
    
    const driverName = driverSelect.value;
    const vehicleNumber = vehicleSelect.value;

    if (!driverName || !vehicleNumber) {
      alert('Please select both driver and vehicle');
      return;
    }

    const assignments = getStoredData('assignments');
    const vehicles = getStoredData('vehicles');

    // Check if vehicle exists and is active
    const vehicle = vehicles.find(v => v.number === vehicleNumber);
    if (!vehicle) {
      throw new Error('Selected vehicle number not found.');
    }
    if (vehicle.status !== 'active') {
      throw new Error('Cannot assign inactive vehicle.');
    }

    // Check if vehicle is already assigned
    const existingAssignment = assignments.find(a => a.vehicle === vehicleNumber);
    if (existingAssignment) {
      throw new Error(`Vehicle number ${vehicleNumber} is already assigned to driver: ${existingAssignment.driver}.`);
    }

    // Remove any existing assignment for this driver
    const updatedAssignments = assignments.filter(a => a.driver !== driverName);
    
    // Add new assignment
    updatedAssignments.push({
      driver: driverName,
      vehicle: vehicleNumber,
      assignedAt: new Date().toISOString()
    });

    if (!saveStoredData('assignments', updatedAssignments)) {
      throw new Error('Failed to save assignment.');
    }

    alert('Vehicle assigned successfully!');
    
    // Update UI
    renderAssignmentList();
    updateVehicleDropdowns();
    
    // Reset form
    driverSelect.value = '';
    vehicleSelect.value = '';
  } catch (error) {
    console.error('Error in assignDriverVehicle:', error);
    alert(error.message || 'Error assigning vehicle. Please try again.');
  }
}

function autoFillVehicle(driverName) {
  try {
    const assignments = getStoredData('assignments');
    const vehicles = getStoredData('vehicles');
    
    const assignment = assignments.find(a => a.driver === driverName);
    if (!assignment) {
      console.warn('No vehicle assignment found for driver:', driverName);
      const vehicleInput = document.getElementById('vehicleInput');
      if (vehicleInput) {
        vehicleInput.value = '';
        vehicleInput.readOnly = false;
      }
      return;
    }

    const vehicle = vehicles.find(v => v.number === assignment.vehicle);
    if (!vehicle) {
      console.warn('Assigned vehicle number not found:', assignment.vehicle);
      const vehicleInput = document.getElementById('vehicleInput');
      if (vehicleInput) {
        vehicleInput.value = '';
        vehicleInput.readOnly = false;
      }
      return;
    }

    const vehicleInput = document.getElementById('vehicleInput');
    if (vehicleInput) {
      vehicleInput.value = vehicle.number;
      // Trigger change event to update calculations
      vehicleInput.dispatchEvent(new Event('change'));
    }
  } catch (error) {
    console.error('Error in autoFillVehicle:', error);
  }
}

function renderSetup() {
  // Update driver select dropdowns
  const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
  const driverOptions = driverProfiles.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  ['driverSelect', 'assignDriver', 'roomDriver', 'pinDriver'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = `<option value="">Select Driver</option>${driverOptions}`;
    }
  });

  // Update vehicle select in Setup tab to display only numbers
  const vehicleSelectElement = document.getElementById('vehicleSelect');
  if (vehicleSelectElement) {
    vehicleSelectElement.innerHTML = '<option value="">Select Vehicle Number</option>' + 
      vehicles.map(v => `<option value="${v.number}">${v.number}</option>`).join('');
  }

  // Update assignVehicle dropdown in Setup tab to display only numbers
  const assignVehicle = document.getElementById('assignVehicle');
  if (assignVehicle) {
    assignVehicle.innerHTML = '<option value="">Select Vehicle Number</option>' + 
      vehicles.map(v => `<option value="${v.number}">${v.number}</option>`).join('');
  }

  // Render assignments list
  renderAssignmentList();

  // Render room allocations list
  const roomList = document.getElementById('roomList');
  if (roomList) {
    const roomAllocations = JSON.parse(localStorage.getItem('roomAllocations') || '{}');
    roomList.innerHTML = Object.entries(roomAllocations)
      .map(([driver, hasRoom]) => {
        const driverObj = driverProfiles.find(d => d.id === driver);
        return `
          <div class="room-item">
            <span>${driverObj ? driverObj.name : driver} - Room Rent: ₹${hasRoom ? '50' : '0'}</span>
            <button onclick="toggleRoomAllocation('${driver}')" class="edit-btn">
              ${hasRoom ? 'Remove Room' : 'Add Room'}
            </button>
          </div>
        `;
      }).join('');
  }
}

function editVehicle(index) {
  // This function is no longer needed as vehicle editing is handled via modal
  console.warn("editVehicle function is deprecated. Use editVehicle() via modal.");
}

function removeDriver(index) {
  if (confirm("Delete this driver?")) {
    const name = drivers[index];
    drivers.splice(index, 1);
    delete assignments[name];
    localStorage.setItem('drivers', JSON.stringify(drivers));
    localStorage.setItem('assignments', JSON.stringify(assignments));
    renderSetup();
    updateDropdowns();
  }
}

function removeVehicle(index) {
  // This function is no longer needed as vehicle deletion is handled via modal
  console.warn("removeVehicle function is deprecated. Use deleteVehicle() via modal.");
}

function removeAssignment(driverName) {
  try {
    if (!confirm(`Are you sure you want to remove the vehicle assignment for ${driverName}?`)) {
      return;
    }

    const assignments = getStoredData('assignments');
    const updatedAssignments = assignments.filter(a => a.driver !== driverName);

    if (!saveStoredData('assignments', updatedAssignments)) {
      throw new Error('Failed to remove assignment');
    }

    alert('Assignment removed successfully');
    renderAssignmentList();
    updateVehicleDropdowns();
  } catch (error) {
    console.error('Error in removeAssignment:', error);
    alert('Error removing assignment. Please try again.');
  }
}

document.getElementById('entryForm').addEventListener('input', () => {
  const f = Object.fromEntries(new FormData(document.getElementById('entryForm')).entries());
  
  // Calculate total earnings (Earnings + Offline earnings)
  const totalEarnings = (+f.earnings || 0) + (+f.offlineEarnings || 0);
  const hours = parseFloat(f.hours) || 0; // Use parseFloat for hours
  
  // Calculate Pay% based on earnings slab
  let pay = 0;
  if (totalEarnings >= 7000) pay = 38;
  else if (totalEarnings >= 6000) pay = 38;
  else if (totalEarnings >= 5000) pay = 34;
  else if (totalEarnings >= 4000) pay = 32;
  else if (totalEarnings >= 3000) pay = 30;
  else if (totalEarnings >= 2000) pay = 23;
  else if (totalEarnings >= 1000) pay = 10;
  else pay = 0;

  // Hours check with decimal support
  if (hours < 9) {
    pay = Math.max(0, pay - 10);
  } else if (hours < 11) {
    pay = Math.max(0, pay - 5);
  }

  const salary = Math.round(totalEarnings * pay / 100);
  const roomRent = roomAllocations[f.driver] ? 50 : 0;
  const payable = Math.round(
    (+f.cash || 0) + 
    (+f.offlineCash || 0) - 
    salary - 
    (+f.cng || 0) - 
    (+f.petrol || 0) - 
    (+f.other || 0) + 
    (+f.ob || 0) + 
    roomRent
  );
  const commission = Math.round((+f.cash || 0) - (+f.earnings || 0));
  const pl = Math.round(
    totalEarnings - 
    salary - 
    (+f.cng || 0) - 
    (+f.toll || 0) - 
    (+f.petrol || 0) - 
    (+f.other || 0) - 
    1080
  );

  // Display values
  document.getElementById('payPercent').innerText = pay;
  document.getElementById('salary').innerText = salary;
  document.getElementById('payable').innerText = payable;
  document.getElementById('commission').innerText = commission;
  document.querySelector('input[name="roomRent"]').value = roomRent;
});

document.getElementById('entryForm').addEventListener('submit', function(event) {
  event.preventDefault();
  try {
    const form = event.target;

    const numericFields = [
      'earnings', 'cash', 'offlineEarnings', 'offlineCash', 'trips',
      'toll', 'hours', 'cng', 'petrol', 'other', 'ob'
    ];

    for (const fieldName of numericFields) {
      const inputElement = form[fieldName];
      // Check if the input is required and its value is not a valid number
      if (inputElement && inputElement.hasAttribute('required') && (inputElement.value.trim() === '' || isNaN(parseFloat(inputElement.value)))) {
        // Format the field name for a user-friendly message
        const readableFieldName = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        alert(`Kripya '${readableFieldName}' ke liye ek sahi sankhya daalein. Yeh khaali nahi ho sakta ya galat akshar nahi ho sakte.`);
        inputElement.focus();
        return; // Prevent form submission
      }
    }

    const driverName = form.driver.value;
    const vehicleNumber = form.vehicle.value;
    
    // Get current data
    const entries = getStoredData('entries');
    const assignments = getStoredData('assignments');
    const vehicles = getStoredData('vehicles');
    
    // Validate vehicle assignment
    const currentAssignment = assignments.find(a => a.driver === driverName);
    if (!currentAssignment) {
      throw new Error('Driver is not assigned to any vehicle. Please assign a vehicle first.');
    }
    
    const assignedVehicle = vehicles.find(v => v.number === vehicleNumber);
    if (!assignedVehicle) {
      throw new Error('Assigned vehicle number not found in vehicle list.');
    }
    
    if (assignedVehicle.number !== vehicleNumber) {
      throw new Error(`Driver is assigned to vehicle number: ${assignedVehicle.number}. Please select the correct vehicle.`);
    }

    // Create new entry
    const newEntry = {
      id: 'e' + Date.now(),
      date: form.date.value,
      driver: driverName,
      vehicle: vehicleNumber,
      earnings: parseFloat(form.earnings.value) || 0,
      cash: parseFloat(form.cash.value) || 0,
      offlineEarnings: parseFloat(form.offlineEarnings.value) || 0,
      offlineCash: parseFloat(form.offlineCash.value) || 0,
      trips: parseInt(form.trips.value) || 0,
      toll: parseFloat(form.toll.value) || 0,
      hours: parseFloat(form.hours.value) || 0,
      cng: parseFloat(form.cng.value) || 0,
      petrol: parseFloat(form.petrol.value) || 0,
      other: parseFloat(form.other.value) || 0,
      ob: parseFloat(form.ob.value) || 0,
      roomRent: parseFloat(form.roomRent.value) || 0,
      timestamp: new Date().toISOString()
    };

    // Calculate payable amount
    const { payable, salary, commission, pl } = calculatePay(
      newEntry.earnings,
      newEntry.offlineEarnings,
      newEntry.cash,
      newEntry.toll,
      newEntry.cng,
      newEntry.petrol,
      newEntry.other,
      newEntry.hours,
      newEntry.ob,
      newEntry.roomRent
    );

    newEntry.payable = payable;
    newEntry.salary = salary;
    newEntry.commission = commission;
    newEntry.pl = pl;

    console.log('New Entry before saving:', newEntry); // Added console log

    // Add to entries
    entries.push(newEntry);
    
    // Save updated entries
    if (!saveStoredData('entries', entries)) {
      throw new Error('Failed to save entry. Please try again.');
    }

    // Reset form and show success message
    form.reset();
    alert('Entry saved successfully!');
    
    // Refresh all views
    renderDatabase();
    generateWeeklySummary();
    renderSummary();
    
  } catch (error) {
    console.error('Error saving entry:', error);
    alert(error.message || 'Error saving entry. Please try again.');
  }
});

function renderDatabase() {
  try {
    const entries = getStoredData('entries');
    const driverProfiles = getStoredData('driverProfiles');
    const vehicles = getStoredData('vehicles');
    
    const tbody = document.getElementById('dataBody');
    if (!tbody) return;

    // Sort by timestamp descending (latest first)
    const sortedEntries = [...entries].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

    // Filter entries based on user role
    const filteredEntries = filterEntriesByRole(sortedEntries);

    tbody.innerHTML = filteredEntries.map(entry => {
      const driver = driverProfiles.find(d => d.name === entry.driver) || { name: entry.driver };
      const vehicle = vehicles.find(v => v.number === entry.vehicle) || { number: entry.vehicle, type: 'N/A', status: 'N/A' };
      
      return `
        <tr>
          <td>${new Date(entry.date).toLocaleDateString()}</td>
          <td>${driver.name}</td>
          <td>${vehicle.number}</td>
          <td>${formatCurrency(entry.earnings)}</td>
          <td>${formatCurrency(entry.cash)}</td>
          <td>${formatCurrency(entry.offlineEarnings)}</td>
          <td>${formatCurrency(entry.offlineCash)}</td>
          <td>${entry.trips}</td>
          <td>${formatCurrency(entry.toll)}</td>
          <td>${entry.hours}</td>
          <td>${formatCurrency(entry.salary)}</td>
          <td>${formatCurrency(entry.cng)}</td>
          <td>${formatCurrency(entry.petrol)}</td>
          <td>${formatCurrency(entry.other)}</td>
          <td>${formatCurrency(entry.ob)}</td>
          <td>${formatCurrency(entry.roomRent)}</td>
          <td>${formatCurrency(entry.payable)}</td>
          ${isAdmin() ? `<td>${formatCurrency(entry.pl)}</td>` : ''}
          <td class="action-buttons">
            <button onclick="editEntry('${entry.id}')" class="edit" title="Edit Entry">✏️</button>
            <button onclick="deleteEntry('${entry.id}')" class="delete" title="Delete Entry">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');

    // Update filters
    updateFilters();
  } catch (error) {
    console.error('Error in renderDatabase:', error);
  }
}

function filterEntries(entries) {
  const fromDate = document.getElementById('filterFrom').value;
  const toDate = document.getElementById('filterTo').value;
  const driverId = document.getElementById('filterDriver').value;
  const vehicleId = document.getElementById('filterVehicle').value;
  
  return entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    
    const dateMatch = (!from || entryDate >= from) && (!to || entryDate <= to);
    const driverMatch = !driverId || entry.driver === driverId;
    const vehicleMatch = !vehicleId || entry.vehicle === vehicleId;
    
    return dateMatch && driverMatch && vehicleMatch;
  });
}

function deleteEntry(entryId, showConfirm = true) {
  try {
    if (showConfirm && !confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    const entries = getStoredData('entries');
    const updatedEntries = entries.filter(e => e.id !== entryId);
    
    if (!saveStoredData('entries', updatedEntries)) {
      throw new Error('Failed to delete entry');
    }

    if (showConfirm) {
      alert('Entry deleted successfully');
      renderDatabase();
      generateWeeklySummary();
      renderSummary();
      renderSummaryCharts();
    }
  } catch (error) {
    console.error('Error in deleteEntry:', error);
    alert(error.message || 'Error deleting entry. Please try again.');
  }
}

function importExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      // Get existing entries and profiles
      const existingEntries = JSON.parse(localStorage.getItem('entries') || '[]');
      const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
      const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
      
      if (!Array.isArray(driverProfiles)) {
        throw new Error('Driver profiles data is not in correct format. Please add drivers first.');
      }
      
      if (!Array.isArray(vehicles)) {
        throw new Error('Vehicles data is not in correct format. Please add vehicles first.');
      }
      
      if (driverProfiles.length === 0) {
        throw new Error('No drivers found. Please add drivers first.');
      }
      
      if (vehicles.length === 0) {
        throw new Error('No vehicles found. Please add vehicles first.');
      }
      
      // Process and validate each row
      const newEntries = jsonData.map(row => {
        // Generate unique ID for new entry
        const id = 'e' + Date.now() + Math.random().toString(36).substr(2, 9);
        
        // Convert date string to proper format
        let date = row.Date;
        if (typeof date === 'string') {
          const parts = date.split('/');
          if (parts.length === 3) {
            date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        
        // Find driver and vehicle by name/number
        const driver = driverProfiles.find(d => d.name === row.Driver);
        const vehicle = vehicles.find(v => v.number === row['Vehicle Number']);
        
        if (!driver) {
          throw new Error(`Driver not found: ${row.Driver}. Please add this driver first.`);
        }
        
        if (!vehicle) {
          throw new Error(`Vehicle number not found: ${row['Vehicle Number']}. Please add this vehicle first.`);
        }
        
        // Convert all numeric values to proper format
        return {
          id,
          date,
          driver: driver.name,
          vehicle: vehicle.number,
          earnings: parseFloat(row.Earnings) || 0,
          cash: parseFloat(row.Cash) || 0,
          offlineEarnings: parseFloat(row['Offline Earnings']) || 0,
          offlineCash: parseFloat(row['Offline Cash']) || 0,
          trips: parseInt(row.Trips) || 0,
          toll: parseFloat(row.Toll) || 0,
          hours: parseFloat(row['Login Hours']) || 0,
          cng: parseFloat(row.CNG) || 0,
          petrol: parseFloat(row.Petrol) || 0,
          other: parseFloat(row['Other Expenses']) || 0,
          ob: parseFloat(row['Opening Balance']) || 0,
          roomRent: parseFloat(row['Room Rent']) || 0,
          timestamp: new Date().toISOString()
        };
      });
      
      // Combine and save entries
      const updatedEntries = [...existingEntries, ...newEntries];
      localStorage.setItem('entries', JSON.stringify(updatedEntries));
      
      // Update UI
      renderDatabase();
      if (document.getElementById('summary').classList.contains('active')) {
        renderSummary();
      }
      
      alert(`Successfully imported ${newEntries.length} entries!`);
    } catch (error) {
      console.error('Error importing Excel:', error);
      alert(`Error importing Excel file: ${error.message}`);
    }
  };
  
  reader.readAsArrayBuffer(file);
}

function filterDatabase() {
  renderDatabase();
}

function shareEntry() {
  shareData('entry');
}

function shareData(type) {
  if (type === 'entry') {
    const form = document.getElementById('entryForm');
    const data = Object.fromEntries(new FormData(form).entries());
    
    // Safely get P&L value if element exists
    const plElement = document.getElementById('pl');
    const plText = plElement ? `P&L: ₹${plElement.innerText}` : '';
    
    const message = `
BN Cab's - Daily Entry
Date: ${data.date}
Driver: ${data.driver}
Vehicle Number: ${data.vehicle}

Earnings: ₹${formatCurrency(data.earnings)}
Cash Collection: ₹${formatCurrency(data.cash)}
Offline Earnings: ₹${formatCurrency(data.offlineEarnings)}
Offline Cash: ₹${formatCurrency(data.offlineCash)}

Trips: ${data.trips}
Toll: ₹${formatCurrency(data.toll)}
CNG: ₹${formatCurrency(data.cng)}
Petrol: ₹${formatCurrency(data.petrol)}
Other Expenses: ₹${formatCurrency(data.other)}

Login Hours: ${data.hours}
Opening Balance: ₹${formatCurrency(data.ob)}
Room Rent: ₹${formatCurrency(data.roomRent)}

Pay %: ${document.getElementById('payPercent').innerText}%
Salary: ₹${document.getElementById('salary').innerText}
Payable: ₹${document.getElementById('payable').innerText}
Commission: ₹${document.getElementById('commission').innerText}
${isAdmin() ? plText : ''}
    `.trim();

    if (navigator.share) {
      navigator.share({
        title: 'BN Cab\'s Daily Entry',
        text: message
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(message).then(() => {
        alert('Entry details copied to clipboard. You can now paste it in WhatsApp or email.');
      }).catch(console.error);
    }
  } else if (type === 'summary') {
    const entries = JSON.parse(localStorage.getItem('entries') || '[]');
    const drivers = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
    const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    
    const totalEarnings = entries.reduce((sum, e) => sum + (parseFloat(e.earnings) || 0), 0);
    const totalTrips = entries.reduce((sum, e) => sum + (parseInt(e.trips) || 0), 0);
    const totalDays = entries.length;
    
    const driverStats = drivers.map(driver => {
      const driverEntries = entries.filter(e => e.driver === driver.id);
      const earnings = driverEntries.reduce((sum, e) => sum + (parseFloat(e.earnings) || 0), 0);
      const trips = driverEntries.reduce((sum, e) => sum + (parseInt(e.trips) || 0), 0);
      return `${driver.name}: ₹${formatCurrency(earnings)} (${trips} trips)`;
    }).join('\n');

    const message = `
BN Cab's - Summary Report
Generated on: ${new Date().toLocaleDateString()}

Overall Statistics:
Total Earnings: ₹${formatCurrency(totalEarnings)}
Total Trips: ${totalTrips}
Total Days: ${totalDays}

Driver-wise Performance:
${driverStats}

Vehicle-wise Summary:
${vehicles.map(v => `${v.number}: ${entries.filter(e => e.vehicle === v.number).length} days`).join('\n')}
    `.trim();

    if (navigator.share) {
      navigator.share({
        title: 'BN Cab\'s Summary Report',
        text: message
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(message).then(() => {
        alert('Summary report copied to clipboard. You can now paste it in WhatsApp or email.');
      }).catch(console.error);
    }
  }
}

function exportDatabaseExcel() {
  try {
    const rows = [];
    const table = document.getElementById("dataTable");
    const headers = Array.from(table.querySelectorAll("thead th"))
      .map(th => th.innerText)
      .filter(h => h !== 'Actions');

    rows.push(headers);

    table.querySelectorAll("tbody tr").forEach(tr => {
      const row = [];
      tr.querySelectorAll("td").forEach((td, i) => {
        if (i < headers.length) {
          const input = td.querySelector("input");
          row.push(input ? +input.value : td.innerText);
        }
      });
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database");
    XLSX.writeFile(wb, `BN_Cab_Database_${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Error exporting to Excel. Please try again.');
  }
}

function exportDatabasePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });
  const rows = [], headers = [];

  document.querySelectorAll("#dataTable thead th").forEach((th, i) => {
    if (i < 18) headers.push(th.innerText); // Skip Action
  });

  document.querySelectorAll("#dataTable tbody tr").forEach(tr => {
    const row = [];
    tr.querySelectorAll("td input").forEach(input => row.push(input.value));
    rows.push(row);
  });

  doc.autoTable({ head: [headers], body: rows, startY: 20 });
  doc.save("BN_Cab_Database.pdf");
}

function exportWeekly() {
  try {
    const table = document.getElementById("weeklyTable");
    const headers = Array.from(table.querySelectorAll("thead th"))
      .map(th => th.innerText)
      .filter(h => h !== 'Actions');

    const rows = [headers];

    table.querySelectorAll("tbody tr").forEach(tr => {
      const row = [];
      tr.querySelectorAll("td").forEach((td, i) => {
        if (i < headers.length) {
          const input = td.querySelector("input");
          row.push(input ? +input.value : td.innerText);
        }
      });
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Weekly Summary");
    XLSX.writeFile(wb, `BN_Cab_Weekly_Summary_${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Error exporting to Excel. Please try again.');
  }
}

function generateWeeklySummary() {
  try {
    const fromDate = document.getElementById('weeklyFrom').value;
    const toDate = document.getElementById('weeklyTo').value;
    const selectedVehicle = document.getElementById('weeklyVehicle').value;

    if (!fromDate || !toDate) {
      alert('Please select both from and to dates.');
      return;
    }

    const entries = getStoredData('entries');
    const vehicles = getStoredData('vehicles');

    // Filter entries by date range and vehicle number
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // Include end date

      const dateMatch = entryDate >= from && entryDate <= to;
      const vehicleMatch = !selectedVehicle || entry.vehicle === selectedVehicle;

      return dateMatch && vehicleMatch;
    });

    // Group entries by week
    const weeklyData = {};
    filteredEntries.forEach(entry => {
      const date = new Date(entry.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

      const weekKey = `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          vehicle: entry.vehicle,
          earnings: 0,
          cash: 0,
          commission: 0,
          toll: 0,
          trips: 0,
          rent: 0,
          days: 0,
          insurance: 0,
          tds: 0,
          payable: 0
        };
      }

      const week = weeklyData[weekKey];
      week.earnings += (entry.earnings || 0) + (entry.offlineEarnings || 0);
      week.cash += (entry.cash || 0) + (entry.offlineCash || 0);
      week.commission += entry.commission || 0;
      week.toll += entry.toll || 0;
      week.trips += entry.trips || 0;
      week.rent += entry.roomRent || 0;
      week.days++;
      week.payable += entry.payable || 0;
    });

    // Render weekly summary table
    const tbody = document.querySelector('#weeklyTable tbody');
    if (!tbody) return;

    tbody.innerHTML = Object.values(weeklyData)
      .sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart))
      .map(week => `
        <tr>
          <td>${new Date(week.weekStart).toLocaleDateString()}</td>
          <td>${new Date(week.weekEnd).toLocaleDateString()}</td>
          <td>${week.vehicle}</td>
          <td>${formatCurrency(week.earnings)}</td>
          <td>${formatCurrency(week.cash)}</td>
          <td>${formatCurrency(week.commission)}</td>
          <td>${formatCurrency(week.toll)}</td>
          <td>${week.trips}</td>
          <td>${formatCurrency(week.rent)}</td>
          <td>${week.days}</td>
          <td>${formatCurrency(week.insurance)}</td>
          <td>${formatCurrency(week.tds)}</td>
          <td>${formatCurrency(week.payable)}</td>
        </tr>
      `).join('');

  } catch (error) {
    console.error('Error in generateWeeklySummary:', error);
    alert('Error generating weekly summary. Please try again.');
  }
}

function updateWeeklyPayable(input) {
  const row = input.closest("tr");
  const rent = +row.children[8].textContent;
  const days = +row.children[9].textContent;
  const insurance = +row.children[10].textContent;
  const tds = +input.value || 0;
  const toll = +row.children[6].textContent;
  const commission = +row.children[5].textContent;
  
  const payable = (rent * days) + insurance + tds + commission - toll;
  row.querySelector(".payable").textContent = payable.toFixed(2);
}

function renderSummary() {
  const entries = JSON.parse(localStorage.getItem('entries') || '[]');
  const drivers = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
  
  if (entries.length === 0) {
    document.getElementById('earningsChart').style.display = 'none';
    document.getElementById('weeklyTrendsChart').style.display = 'none';
    return;
  }
  
  // Show charts
  document.getElementById('earningsChart').style.display = 'block';
  document.getElementById('weeklyTrendsChart').style.display = 'block';
  
  // Prepare data for charts
  const driverEarnings = {};
  const weeklyData = {};
  
  entries.forEach(entry => {
    const date = new Date(entry.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    // Driver earnings
    if (!driverEarnings[entry.driver]) {
      driverEarnings[entry.driver] = 0;
    }
    driverEarnings[entry.driver] += parseFloat(entry.earnings) || 0; // Use entry.earnings for earnings by driver
    
    // Weekly data
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        earnings: 0,
        trips: 0
      };
    }
    weeklyData[weekKey].earnings += parseFloat(entry.earnings) || 0; // Use entry.earnings for weekly earnings
    weeklyData[weekKey].trips += parseInt(entry.trips) || 0;
  });
  
  // Sort weekly data by date
  const sortedWeeks = Object.keys(weeklyData).sort();
  
  // Call renderSummaryCharts with prepared data
  renderSummaryCharts(driverEarnings, weeklyData, sortedWeeks, drivers);
}

function renderSummaryCharts(driverEarnings, weeklyData, sortedWeeks, drivers) {
  // Get canvas elements
  const earningsCanvas = document.getElementById('earningsChart');
  const trendsCanvas = document.getElementById('weeklyTrendsChart');

  // Destroy existing charts if they exist
  // Use Chart.getChart() to get the chart instance associated with the canvas ID
  let earningsChartInstance = Chart.getChart(earningsCanvas); // Pass canvas element directly
  if (earningsChartInstance) {
    earningsChartInstance.destroy();
  }

  let trendsChartInstance = Chart.getChart(trendsCanvas); // Pass canvas element directly
  if (trendsChartInstance) {
    trendsChartInstance.destroy();
  }

  // Render Earnings by Driver Chart
  const earningsCtx = earningsCanvas.getContext('2d');
  window.earningsChart = new Chart(earningsCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(driverEarnings).map(driverId => {
        const driver = drivers.find(d => d.id === driverId);
        return driver ? driver.name : 'Unknown Driver';
      }),
      datasets: [{
        label: 'Total Earnings',
        data: Object.values(driverEarnings),
        backgroundColor: 'rgba(25, 118, 210, 0.8)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => '₹' + formatNumber(value)
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: context => '₹' + formatNumber(context.raw)
          }
        }
      }
    }
  });
  
  // Render Weekly Trends Chart
  const trendsCtx = trendsCanvas.getContext('2d');
  window.trendsChart = new Chart(trendsCtx, {
    type: 'line',
    data: {
      labels: sortedWeeks.map(week => new Date(week).toLocaleDateString()),
      datasets: [{
        label: 'Weekly Earnings',
        data: sortedWeeks.map(week => weeklyData[week].earnings),
        borderColor: 'rgba(76, 175, 80, 1)',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4
      }, {
        label: 'Weekly Trips',
        data: sortedWeeks.map(week => weeklyData[week].trips),
        borderColor: 'rgba(255, 152, 0, 1)',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'trips'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => '₹' + formatNumber(value)
          }
        },
        trips: {
          position: 'right',
          beginAtZero: true,
          grid: {
            drawOnChartArea: false
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: context => {
              if (context.dataset.label === 'Weekly Earnings') {
                return '₹' + formatNumber(context.raw);
              }
              return context.raw + ' trips';
            }
          }
        }
      }
    }
  });
}

function formatCurrency(value) {
  const numericValue = parseFloat(value) || 0; // Use parseFloat to handle potential string numbers
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numericValue);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

function calculatePay(earnings, offlineEarnings, cash, toll, cng, petrol, others, hours, oldBalance, roomRent) {
  // Convert all inputs to numbers and handle potential non-numeric values
  const totalEarnings = (parseFloat(earnings) || 0) + (parseFloat(offlineEarnings) || 0);
  const cashCollection = parseFloat(cash) || 0;
  const tollExpense = parseFloat(toll) || 0;
  const cngExpense = parseFloat(cng) || 0;
  const petrolExpense = parseFloat(petrol) || 0;
  const otherExpenses = parseFloat(others) || 0;
  const loginHours = parseFloat(hours) || 0;
  const openingBalance = parseFloat(oldBalance) || 0;
  const roomRentAmount = parseFloat(roomRent) || 0;
  
  let payPercent = 0;
  
  // Base pay slab calculation
  if (totalEarnings < 1800) {
    payPercent = 0;
  } else if (totalEarnings < 2500) {
    payPercent = 25;
  } else if (totalEarnings < 4000) {
    payPercent = 30;
  } else if (totalEarnings < 5000) {
    payPercent = 32;
  } else if (totalEarnings < 6000) {
    payPercent = 34;
  } else if (totalEarnings < 7000) {
    payPercent = 38;
  } else {
    payPercent = 40; // 7000 and above
  }
  
  // Login hours reduction
  if (loginHours < 9) {
    payPercent = Math.max(0, payPercent - 10);
  } else if (loginHours < 11) {
    payPercent = Math.max(0, payPercent - 5);
  }
  
  // Calculate components
  const salary = totalEarnings * payPercent / 100;
  const commission = cashCollection - totalEarnings;
  const payable = cashCollection - salary - cngExpense - petrolExpense - otherExpenses + openingBalance + roomRentAmount;
  const pnl = totalEarnings - salary - cngExpense - tollExpense - petrolExpense - otherExpenses - 1080; // Ensure 1080 is correctly subtracted
  
  return {
    totalEarnings: totalEarnings,
    payPercent: payPercent,
    salary: salary,
    commission: commission,
    payable: payable,
    pnl: pnl
  };
}

function updateEntryCalculations() {
  try {
    const form = document.getElementById('entryForm');
    if (!form) return;

    const formData = new FormData(form);
    const f = Object.fromEntries(formData.entries());
    
    // Calculate total earnings (Earnings + Offline earnings)
    const totalEarnings = (+f.earnings || 0) + (+f.offlineEarnings || 0);
    const hours = parseFloat(f.hours) || 0;
    
    // Calculate Pay% based on earnings slab
    let pay = 0;
    if (totalEarnings >= 7000) pay = 38;
    else if (totalEarnings >= 6000) pay = 38;
    else if (totalEarnings >= 5000) pay = 34;
    else if (totalEarnings >= 4000) pay = 32;
    else if (totalEarnings >= 3000) pay = 30;
    else if (totalEarnings >= 2000) pay = 23;
    else if (totalEarnings >= 1000) pay = 10;
    else pay = 0;
    
    // Hours check with decimal support
    if (hours < 9) {
      pay = Math.max(0, pay - 10);
    } else if (hours < 11) {
      pay = Math.max(0, pay - 5);
    }
    
    const salary = Math.round(totalEarnings * pay / 100);
    const roomRent = roomAllocations[f.driver] ? 50 : 0;
    const payable = Math.round(
      (+f.cash || 0) + 
      (+f.offlineCash || 0) - 
      salary - 
      (+f.cng || 0) - 
      (+f.petrol || 0) - 
      (+f.other || 0) + 
      (+f.ob || 0) + 
      roomRent
    );
    
    // Update UI elements if they exist
    const payPercentElement = document.getElementById('payPercent');
    const salaryElement = document.getElementById('salary');
    const payableElement = document.getElementById('payable');
    const commissionElement = document.getElementById('commission');
    
    if (payPercentElement) payPercentElement.textContent = pay;
    if (salaryElement) salaryElement.textContent = formatCurrency(salary);
    if (payableElement) payableElement.textContent = formatCurrency(payable);
    if (commissionElement) commissionElement.textContent = formatCurrency(totalEarnings - salary);
    
    // Update room rent field if it exists
    const roomRentInput = form.querySelector('input[name="roomRent"]');
    if (roomRentInput) roomRentInput.value = roomRent;
    
  } catch (error) {
    console.error('Error updating calculations:', error);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('entryForm');
  if (form) {
    ['earnings', 'offlineEarnings', 'hours'].forEach(field => {
      form[field].addEventListener('input', updateEntryCalculations);
    });
  }
});

// Vehicle Management Functions
function addNewVehicle() {
  try {
    // Reset form
    document.getElementById('vehicleForm').reset();
    document.getElementById('vehicleNumber').value = '';
    document.getElementById('vehicleType').value = 'sedan';
    document.getElementById('vehicleStatus').value = 'active';
    
    // Show modal
    document.getElementById('vehicleModal').style.display = 'block';
  } catch (error) {
    console.error('Error in addNewVehicle:', error);
    alert('Error opening vehicle form. Please try again.');
  }
}

function editVehicle() {
  try {
    const vehicleSelect = document.getElementById('vehicleSelect');
    const selectedVehicle = vehicleSelect.value;
    
    if (!selectedVehicle) {
      alert('Please select a vehicle to edit');
      return;
    }

    const vehicles = getStoredData('vehicles');
    const vehicle = vehicles.find(v => v.number === selectedVehicle);
    
    if (!vehicle) {
      throw new Error('Selected vehicle not found');
    }

    // Populate form
    document.getElementById('vehicleNumber').value = vehicle.number;
    document.getElementById('vehicleType').value = vehicle.type;
    document.getElementById('vehicleStatus').value = vehicle.status;
    
    // Show modal
    document.getElementById('vehicleModal').style.display = 'block';
  } catch (error) {
    console.error('Error in editVehicle:', error);
    alert(error.message || 'Error editing vehicle. Please try again.');
  }
}

function deleteVehicle() {
  try {
    const vehicleSelect = document.getElementById('vehicleSelect');
    const selectedVehicle = vehicleSelect.value;
    
    if (!selectedVehicle) {
      alert('Please select a vehicle to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete vehicle: ${selectedVehicle}?`)) {
      return;
    }

    const vehicles = getStoredData('vehicles');
    const assignments = getStoredData('assignments');
    const entries = getStoredData('entries');

    // Check if vehicle is assigned
    const isAssigned = assignments.some(a => a.vehicle === selectedVehicle);
    if (isAssigned) {
      throw new Error('Cannot delete vehicle that is currently assigned to a driver');
    }

    // Check if vehicle has entries
    const hasEntries = entries.some(e => e.vehicle === selectedVehicle);
    if (hasEntries) {
      throw new Error('Cannot delete vehicle that has existing entries');
    }

    // Remove vehicle
    const updatedVehicles = vehicles.filter(v => v.number !== selectedVehicle);
    
    if (!saveStoredData('vehicles', updatedVehicles)) {
      throw new Error('Failed to delete vehicle');
    }

    alert('Vehicle deleted successfully');
    
    // Update UI
    updateVehicleDropdowns();
    showVehicleDetails();
  } catch (error) {
    console.error('Error in deleteVehicle:', error);
    alert(error.message || 'Error deleting vehicle. Please try again.');
  }
}

function handleVehicleSubmit(event) {
  event.preventDefault();
  try {
    const number = document.getElementById('vehicleNumber').value.trim();
    const type = document.getElementById('vehicleType').value;
    const status = document.getElementById('vehicleStatus').value;

    if (!number) {
      throw new Error('Vehicle number is required');
    }

    const vehicles = getStoredData('vehicles');
    const assignments = getStoredData('assignments');
    const selectedVehicle = document.getElementById('vehicleSelect').value;

    // Check if vehicle number already exists (for new vehicles)
    const existingVehicle = vehicles.find(v => v.number === number);
    if (existingVehicle && (!selectedVehicle || selectedVehicle !== number)) {
      throw new Error('Vehicle with this number already exists');
    }

    // Check if vehicle is assigned and being made inactive
    if (existingVehicle && status === 'inactive') {
      const isAssigned = assignments.some(a => a.vehicle === number);
      if (isAssigned) {
        throw new Error('Cannot make vehicle inactive while it is assigned to a driver');
      }
    }

    const vehicleData = {
      number: number,
      type: type,
      status: status
    };

    let updatedVehicles;
    if (existingVehicle && selectedVehicle === number) {
      // Update existing vehicle
      updatedVehicles = vehicles.map(v => v.number === number ? vehicleData : v);
    } else if (!existingVehicle) {
      // Add new vehicle
      updatedVehicles = [...vehicles, vehicleData];
    } else {
      throw new Error('Invalid vehicle update');
    }

    if (!saveStoredData('vehicles', updatedVehicles)) {
      throw new Error('Failed to save vehicle');
    }

    // Close modal and update UI
    closeVehicleModal();
    updateVehicleDropdowns();
    showVehicleDetails();
    
    alert('Vehicle saved successfully');
  } catch (error) {
    console.error('Error in handleVehicleSubmit:', error);
    alert(error.message || 'Error saving vehicle. Please try again.');
  }
}

function closeVehicleModal() {
  document.getElementById('vehicleModal').style.display = 'none';
  document.getElementById('vehicleForm').reset();
}

function updateVehicleDropdowns() {
  try {
    const vehicles = getStoredData('vehicles');
    const assignments = getStoredData('assignments');
    
    // Update vehicle select in vehicle management
    const vehicleSelect = document.getElementById('vehicleSelect');
    if (vehicleSelect) {
      vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>' +
        vehicles.map(v => `<option value="${v.number}">${v.number} (${v.type})</option>`).join('');
    }

    // Update vehicle select in assignment form
    const assignVehicle = document.getElementById('assignVehicle');
    if (assignVehicle) {
      // Get assigned vehicles
      const assignedVehicles = assignments.map(a => a.vehicle);
      
      // Filter out assigned vehicles
      const availableVehicles = vehicles.filter(v => 
        !assignedVehicles.includes(v.number) && v.status === 'active'
      );
      
      assignVehicle.innerHTML = '<option value="">Select Vehicle</option>' +
        availableVehicles.map(v => `<option value="${v.number}">${v.number} (${v.type})</option>`).join('');
    }

    // Update vehicle select in entry form
    const vehicleInput = document.getElementById('vehicleInput');
    if (vehicleInput) {
      vehicleInput.innerHTML = vehicles
        .filter(v => v.status === 'active')
        .map(v => `<option value="${v.number}">${v.number} (${v.type})</option>`).join('');
    }

    // Update vehicle filter in database
    const filterVehicle = document.getElementById('filterVehicle');
    if (filterVehicle) {
      filterVehicle.innerHTML = '<option value="">All Vehicles</option>' +
        vehicles.map(v => `<option value="${v.number}">${v.number} (${v.type})</option>`).join('');
    }

    // Update vehicle filter in weekly summary
    const weeklyVehicle = document.getElementById('weeklyVehicle');
    if (weeklyVehicle) {
      weeklyVehicle.innerHTML = '<option value="">All Vehicles</option>' +
        vehicles.map(v => `<option value="${v.number}">${v.number} (${v.type})</option>`).join('');
    }
  } catch (error) {
    console.error('Error in updateVehicleDropdowns:', error);
  }
}

// Helper function to safely get data from localStorage
function getStoredData(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    
    const parsed = JSON.parse(data);
    
    // Special handling for 'assignments' to always return an array
    if (key === 'assignments') {
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Convert old object format to array of objects if found
        return Object.values(parsed);
      }
      return []; // Default to empty array if unexpected format
    }

    // Ensure the default value is returned if parsed is null or not an array for keys expecting arrays
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
        return defaultValue;
    }
    return parsed;
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Helper function to safely save data to localStorage
function saveStoredData(key, data) {
  try {
    // Special handling for 'assignments' to always save as an array
    if (key === 'assignments') {
      if (!Array.isArray(data)) {
        console.warn(`Attempting to save non-array data for assignments. Converting to array.`);
        if (typeof data === 'object' && data !== null) {
            data = Object.values(data); // Convert object to array of values
        } else {
            data = []; // Default to empty array if unexpected format
        }
      }
    }

    // Ensure data is always saved as an array if it's supposed to be an array
    if (Array.isArray(getStoredData(key, [])) && !Array.isArray(data)) { // Check if the key was expected to be an array and current data is not
        console.warn(`Attempting to save non-array data for key ${key} which expects an array. This might be an issue.`);
        // You might want to throw an error or convert more strictly here depending on the desired behavior
    }
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
}

function showVehicleDetails() {
  try {
    const vehicleSelect = document.getElementById('vehicleSelect');
    const selectedVehicle = vehicleSelect.value;
    const detailsContainer = document.getElementById('vehicleDetails');

    console.log('showVehicleDetails called.');
    console.log('Selected Vehicle Number:', selectedVehicle);

    if (!selectedVehicle) {
      detailsContainer.innerHTML = '<div class="no-details">Select a vehicle to view details</div>';
      console.log('No vehicle selected.');
      return;
    }

    const vehicles = getStoredData('vehicles');
    const assignments = getStoredData('assignments');
    const entries = getStoredData('entries');

    console.log('Current vehicles data:', vehicles);
    console.log('Current assignments data:', assignments);
    console.log('Current entries data:', entries);

    const vehicle = vehicles.find(v => v.number === selectedVehicle);
    console.log('Found vehicle object:', vehicle);

    if (!vehicle) {
      detailsContainer.innerHTML = '<div class="no-details">Vehicle number not found.</div>';
      console.log('Vehicle not found in vehicles data.');
      return;
    }

    // Get current assignment
    const currentAssignment = assignments.find(a => a.vehicle === selectedVehicle);
    console.log('Current assignment for selected vehicle:', currentAssignment);
    const assignedDriver = currentAssignment ? currentAssignment.driver : 'Not assigned';

    // Get vehicle statistics
    const vehicleEntries = entries.filter(e => e.vehicle === selectedVehicle);
    const totalTrips = vehicleEntries.reduce((sum, e) => sum + (e.trips || 0), 0);
    const totalEarnings = vehicleEntries.reduce((sum, e) => sum + (e.earnings || 0) + (e.offlineEarnings || 0), 0);

    console.log('Vehicle entries:', vehicleEntries);
    console.log('Total Trips:', totalTrips);
    console.log('Total Earnings:', totalEarnings);

    // Create details HTML
    const detailsHTML = `
      <div class="detail-section">
        <h3>Vehicle Information</h3>
        <div>Number: ${vehicle.number}</div>
        <div>Type: ${vehicle.type}</div>
        <div>Status: ${vehicle.status}</div>
      </div>
      <div class="detail-section">
        <h3>Current Assignment</h3>
        <div>Assigned Driver: ${assignedDriver}</div>
        <div>Assigned At: ${currentAssignment ? new Date(currentAssignment.assignedAt).toLocaleString() : 'N/A'}</div>
      </div>
      <div class="detail-section">
        <h3>Statistics</h3>
        <div>Total Trips: ${totalTrips}</div>
        <div>Total Earnings: ₹${formatCurrency(totalEarnings)}</div>
      </div>
    `;

    detailsContainer.innerHTML = detailsHTML;
  } catch (error) {
    console.error('Error in showVehicleDetails:', error);
    const detailsContainer = document.getElementById('vehicleDetails');
    detailsContainer.innerHTML = '<div class="no-details">Error loading vehicle details</div>';
  }
}

function renderAssignmentList() {
  try {
    const assignmentList = document.getElementById('assignmentList');
    if (!assignmentList) return;

    const assignments = getStoredData('assignments');
    const vehicles = getStoredData('vehicles');
    const driverProfiles = getStoredData('driverProfiles');

    if (assignments.length === 0) {
      assignmentList.innerHTML = '<div class="no-details">No vehicle assignments found</div>';
      return;
    }

    const assignmentsHTML = assignments.map(assignment => {
      const vehicle = vehicles.find(v => v.number === assignment.vehicle);
      const driver = driverProfiles.find(d => d.name === assignment.driver);
      
      return `
        <div class="assignment-item">
          <div>
            <strong>Driver:</strong> ${driver ? driver.name : assignment.driver}
            <br>
            <strong>Vehicle:</strong> ${vehicle ? `${vehicle.number} (${vehicle.type})` : assignment.vehicle}
            <br>
            <strong>Assigned At:</strong> ${new Date(assignment.assignedAt).toLocaleString()}
          </div>
          <button onclick="removeAssignment('${assignment.driver}')" class="delete-btn">Remove Assignment</button>
        </div>
      `;
    }).join('');

    assignmentList.innerHTML = assignmentsHTML;
  } catch (error) {
    console.error('Error in renderAssignmentList:', error);
    const assignmentList = document.getElementById('assignmentList');
    if (assignmentList) {
      assignmentList.innerHTML = '<div class="no-details">Error loading assignments</div>';
    }
  }
}

function editEntry(entryId) {
  try {
    const entries = getStoredData('entries');
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) {
      throw new Error('Entry not found');
    }

    // Populate form with entry data
    const form = document.getElementById('entryForm');
    form.date.value = entry.date;
    form.driver.value = entry.driver;
    form.vehicle.value = entry.vehicle;
    form.earnings.value = entry.earnings;
    form.cash.value = entry.cash;
    form.offlineEarnings.value = entry.offlineEarnings;
    form.offlineCash.value = entry.offlineCash;
    form.trips.value = entry.trips;
    form.toll.value = entry.toll;
    form.hours.value = entry.hours;
    form.cng.value = entry.cng;
    form.petrol.value = entry.petrol;
    form.other.value = entry.other;
    form.ob.value = entry.ob;
    form.roomRent.value = entry.roomRent;

    // Update calculations
    updateEntryCalculations();

    // Scroll to entry form
    showTab('entry');
    form.scrollIntoView({ behavior: 'smooth' });

    // Delete old entry
    deleteEntry(entryId, false);

  } catch (error) {
    console.error('Error in editEntry:', error);
    alert(error.message || 'Error editing entry. Please try again.');
  }
}

// Add updateFilters function
function updateFilters() {
  try {
    const entries = getStoredData('entries');
    const driverProfiles = getStoredData('driverProfiles');
    const vehicles = getStoredData('vehicles');

    // Update driver filter
    const filterDriver = document.getElementById('filterDriver');
    if (filterDriver) {
      const uniqueDrivers = [...new Set(entries.map(e => e.driver))];
      filterDriver.innerHTML = '<option value="">All Drivers</option>' +
        uniqueDrivers.map(driver => {
          const profile = driverProfiles.find(d => d.name === driver);
          return `<option value="${driver}">${profile ? profile.name : driver}</option>`;
        }).join('');
    }

    // Update vehicle filter
    const filterVehicle = document.getElementById('filterVehicle');
    if (filterVehicle) {
      const uniqueVehicles = [...new Set(entries.map(e => e.vehicle))];
      filterVehicle.innerHTML = '<option value="">All Vehicles</option>' +
        uniqueVehicles.map(vehicle => {
          const v = vehicles.find(v => v.number === vehicle);
          return `<option value="${vehicle}">${v ? `${v.number} (${v.type})` : vehicle}</option>`;
        }).join('');
    }
  } catch (error) {
    console.error('Error in updateFilters:', error);
  }
}
