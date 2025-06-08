// Initialize global variables
let drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
let vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
let assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
let entries = JSON.parse(localStorage.getItem('entries') || '[]');
let roomAllocations = JSON.parse(localStorage.getItem('roomAllocations') || '{}');

// Initialize default data if not exists
if (!localStorage.getItem('driverProfiles')) {
  localStorage.setItem('driverProfiles', JSON.stringify([]));
}

if (!localStorage.getItem('vehicles')) {
  localStorage.setItem('vehicles', JSON.stringify([]));
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
  const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
  const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
  
  // Update driver datalist
  const driversList = document.getElementById('driversList');
  if (driversList) {
    driversList.innerHTML = '';
    if (Array.isArray(driverProfiles)) {
      driverProfiles.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.name;
        option.dataset.id = driver.id;
        driversList.appendChild(option);
      });
    }
  }
  
  // Update vehicle select
  const vehicleSelect = document.getElementById('vehicleInput');
  if (vehicleSelect) {
    vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';
    if (Array.isArray(vehicles)) {
      vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        option.textContent = `${vehicle.name} (${vehicle.number})`;
        vehicleSelect.appendChild(option);
      });
    }
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
  const name = prompt("Enter vehicle number:");
  if (name && !vehicles.includes(name)) {
    vehicles.push(name);
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    updateDropdowns();
    renderSetup();
  }
}

function assignDriverVehicle() {
  const driver = document.getElementById('assignDriver').value;
  const vehicle = document.getElementById('assignVehicle').value;
  
  if (!driver || !vehicle) {
    alert('Please select both driver and vehicle');
    return;
  }

  // Check if vehicle is already assigned
  const assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
  const currentDriver = Object.entries(assignments).find(([_, v]) => v === vehicle)?.[0];
  
  if (currentDriver && currentDriver !== driver) {
    if (!confirm(`Vehicle ${vehicle} is already assigned to ${currentDriver}. Do you want to reassign it to ${driver}?`)) {
      return;
    }
  }

  assignments[driver] = vehicle;
  localStorage.setItem('assignments', JSON.stringify(assignments));
  renderSetup();
  alert(`Vehicle ${vehicle} assigned to ${driver}`);
}

function autoFillVehicle(driverName) {
  const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
  const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
  const assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
  
  const driver = Array.isArray(driverProfiles) ? driverProfiles.find(d => d.name === driverName) : null;
  if (!driver) return;
  
  const vehicleId = assignments[driver.id];
  if (vehicleId) {
    const vehicleSelect = document.getElementById('vehicleInput');
    vehicleSelect.value = vehicleId;
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

  // Update vehicle select dropdown
  const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
  const vehicleOptions = vehicles.map(v => `<option value="${v.id}">${v.name} (${v.number})</option>`).join('');
  const assignVehicle = document.getElementById('assignVehicle');
  if (assignVehicle) {
    assignVehicle.innerHTML = `<option value="">Select Vehicle</option>${vehicleOptions}`;
  }

  // Render assignments list
  const assignmentList = document.getElementById('assignmentList');
  if (assignmentList) {
    const assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
    assignmentList.innerHTML = Object.entries(assignments)
      .map(([driver, vehicle]) => {
        const driverObj = driverProfiles.find(d => d.id === driver);
        const vehicleObj = vehicles.find(v => v.id === vehicle);
        return `
          <div class="assignment-item">
            <span>${driverObj ? driverObj.name : driver} → ${vehicleObj ? vehicleObj.name : vehicle}</span>
            <button onclick="removeAssignment('${driver}')" class="delete-btn">Delete</button>
          </div>
        `;
      }).join('');
  }

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

function editDriver(index) {
  const name = prompt("Edit driver name:", drivers[index]);
  if (name && name !== drivers[index]) {
    drivers[index] = name;
    localStorage.setItem('drivers', JSON.stringify(drivers));
    renderSetup();
    updateDropdowns();
  }
}

function editVehicle(index) {
  const name = prompt("Edit vehicle number:", vehicles[index]);
  if (name && name !== vehicles[index]) {
    vehicles[index] = name;
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    renderSetup();
    updateDropdowns();
  }
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
  if (confirm("Delete this vehicle?")) {
    vehicles.splice(index, 1);
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    renderSetup();
    updateDropdowns();
  }
}

function removeAssignment(driver) {
  if (!confirm(`Remove vehicle assignment for ${driver}?`)) return;
  
  const assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
  delete assignments[driver];
  localStorage.setItem('assignments', JSON.stringify(assignments));
  renderSetup();
  alert(`Vehicle assignment removed for ${driver}`);
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
  document.getElementById('pl').innerText = pl;
  document.querySelector('input[name="roomRent"]').value = roomRent;
});

document.getElementById('entryForm').addEventListener('submit', function(event) {
  event.preventDefault();
  
  try {
    const formData = new FormData(this);
    const entry = Object.fromEntries(formData.entries());
    
    // Get driver and vehicle IDs
    const driverName = entry.driver;
    const vehicleId = entry.vehicle;
    
    const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
    const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    
    // Find driver ID
    const driver = Array.isArray(driverProfiles) ? driverProfiles.find(d => d.name === driverName) : null;
    if (!driver) {
      throw new Error('Driver not found. Please select a valid driver.');
    }
    
    // Verify vehicle exists
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found. Please select a valid vehicle.');
    }
    
    // Add entry data
    entry.id = 'e' + Date.now();
    entry.timestamp = new Date().toISOString();
    entry.driver = driver.id;
    entry.vehicle = vehicle.id;
    
    // Calculate total earnings
    entry.totalEarnings = (parseFloat(entry.earnings) || 0) + (parseFloat(entry.offlineEarnings) || 0);
    
    // Calculate salary and payable
    const totalEarnings = (parseFloat(entry.earnings) || 0) + (parseFloat(entry.offlineEarnings) || 0);
    const hours = parseFloat(entry.hours) || 0;
    let pay = 0;
    if (totalEarnings >= 7000) pay = 38;
    else if (totalEarnings >= 6000) pay = 38;
    else if (totalEarnings >= 5000) pay = 34;
    else if (totalEarnings >= 4000) pay = 32;
    else if (totalEarnings >= 3000) pay = 30;
    else if (totalEarnings >= 2000) pay = 23;
    else if (totalEarnings >= 1000) pay = 10;
    else pay = 0;
    if (hours < 9) pay = Math.max(0, pay - 10);
    else if (hours < 11) pay = Math.max(0, pay - 5);

    const salary = Math.round(totalEarnings * pay / 100);
    const roomRent = roomAllocations[driverName] ? 50 : 0;
    const payable = Math.round(
      (parseFloat(entry.cash) || 0) +
      (parseFloat(entry.offlineCash) || 0) -
      salary -
      (parseFloat(entry.cng) || 0) -
      (parseFloat(entry.petrol) || 0) -
      (parseFloat(entry.other) || 0) +
      (parseFloat(entry.ob) || 0) +
      roomRent
    );

    entry.salary = salary;
    entry.payable = payable;
    
    // Get existing entries and save
    const entries = JSON.parse(localStorage.getItem('entries') || '[]');
    entries.push(entry);
    localStorage.setItem('entries', JSON.stringify(entries));
    
    // Reset form and update UI
    this.reset();
    updateEntryCalculations();
    renderDatabase();
    
    // Update summary if on summary tab
    if (document.getElementById('summary').classList.contains('active')) {
      renderSummary();
    }
    
    alert('Entry saved successfully!');
  } catch (error) {
    console.error('Error saving entry:', error);
    alert(error.message || 'Error saving entry. Please try again.');
  }
});

function renderDatabase() {
  const entries = JSON.parse(localStorage.getItem('entries') || '[]');
  const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
  const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
  const tbody = document.getElementById('dataBody');
  
  // Filter entries based on role
  const filteredEntries = filterEntriesByRole(entries);
  
  // Apply any active filters
  const filteredData = filterEntries(filteredEntries);

  // Sort by timestamp descending (latest saved first)
  filteredData.sort((a, b) => new Date(b.timestamp || b.id.split('e')[1]) - new Date(a.timestamp || a.id.split('e')[1]));
  
  tbody.innerHTML = '';
  
  filteredData.forEach(entry => {
    const driver = driverProfiles.find(d => d.id === entry.driver) || { name: 'Unknown Driver' };
    const vehicle = vehicles.find(v => v.id === entry.vehicle) || { name: 'Unknown Vehicle', number: 'N/A' };
    
    // Calculate P&L for admin
    let pnlCell = '';
    if (isAdmin()) {
      const earnings = parseFloat(entry.earnings) || 0;
      const offlineEarnings = parseFloat(entry.offlineEarnings) || 0;
      const totalEarnings = earnings + offlineEarnings;
      const salary = parseFloat(entry.salary) || 0;
      const cng = parseFloat(entry.cng) || 0;
      const toll = parseFloat(entry.toll) || 0;
      const petrol = parseFloat(entry.petrol) || 0;
      const other = parseFloat(entry.other) || 0;
      const pnl = totalEarnings - salary - cng - toll - petrol - other - 1080; // 1080 is fixed cost
      pnlCell = `<td class="admin-only">${formatCurrency(pnl)}</td>`;
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${driver.name}</td>
      <td>${vehicle.name} (${vehicle.number})</td>
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
      ${pnlCell}
      <td class="action-buttons">
        <button onclick="shareEntry('${entry.id}')" class="share">Share</button>
        ${isAdmin() ? `<button onclick="deleteEntry('${entry.id}')" class="delete">Delete</button>` : ''}
      </td>
    `;
    tbody.appendChild(row);
  });
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

function deleteEntry(entryId) {
  if (!confirm('Are you sure you want to delete this entry?')) {
    return;
  }
  
  try {
    const entries = JSON.parse(localStorage.getItem('entries') || '[]');
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    
    if (updatedEntries.length === entries.length) {
      throw new Error('Entry not found');
    }
    
    localStorage.setItem('entries', JSON.stringify(updatedEntries));
    renderDatabase();
    
    // Update summary if on summary tab
    if (document.getElementById('summary').classList.contains('active')) {
      renderSummary();
    }
    
    alert('Entry deleted successfully!');
  } catch (error) {
    console.error('Error deleting entry:', error);
    alert('Error deleting entry. Please try again.');
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
        
        // Find driver and vehicle IDs
        const driver = driverProfiles.find(d => d.name === row.Driver);
        const vehicle = vehicles.find(v => v.name === row.Vehicle);
        
        if (!driver) {
          throw new Error(`Driver not found: ${row.Driver}. Please add this driver first.`);
        }
        
        if (!vehicle) {
          throw new Error(`Vehicle not found: ${row.Vehicle}. Please add this vehicle first.`);
        }
        
        // Convert all numeric values to proper format
        return {
          id,
          date,
          driver: driver.id,
          vehicle: vehicle.id,
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
Vehicle: ${data.vehicle}

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
${vehicles.map(v => `${v.name}: ${entries.filter(e => e.vehicle === v.name).length} days`).join('\n')}
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
  const fromDate = new Date(document.getElementById('weeklyFrom').value);
  const toDate = new Date(document.getElementById('weeklyTo').value);
  const vehicleFilter = document.getElementById('weeklyVehicle').value;

  if (!fromDate || !toDate) {
    alert('Please select both from and to dates');
    return;
  }

  const entries = JSON.parse(localStorage.getItem('entries') || '[]');
  const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
  
  // Filter entries by date range and vehicle
  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const vehicleMatch = !vehicleFilter || entry.vehicle === vehicleFilter;
    return entryDate >= fromDate && entryDate <= toDate && vehicleMatch;
  });

  // Group entries by week
  const weeklyData = {};
  filteredEntries.forEach(entry => {
    const entryDate = new Date(entry.date);
    const weekStart = new Date(entryDate);
    weekStart.setDate(entryDate.getDate() - entryDate.getDay()); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
    
    const weekKey = weekStart.toISOString().split('T')[0];
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
    
    weeklyData[weekKey].earnings += Number(entry.earnings) || 0;
    weeklyData[weekKey].cash += Number(entry.cash) || 0;
    weeklyData[weekKey].commission += (Number(entry.earnings) * 0.25) || 0; // 25% commission
    weeklyData[weekKey].toll += Number(entry.toll) || 0;
    weeklyData[weekKey].trips += Number(entry.trips) || 0;
    weeklyData[weekKey].rent += Number(entry.roomRent) || 0;
    weeklyData[weekKey].days++;
    
    // Calculate insurance and TDS
    const vehicle = vehicles.find(v => v.id === entry.vehicle);
    if (vehicle) {
      weeklyData[weekKey].insurance = 100; // Fixed insurance per week
      weeklyData[weekKey].tds = (Number(entry.earnings) * 0.05) || 0; // 5% TDS
    }
    
    // Calculate payable
    weeklyData[weekKey].payable = weeklyData[weekKey].earnings - 
                                 weeklyData[weekKey].commission - 
                                 weeklyData[weekKey].toll - 
                                 weeklyData[weekKey].rent - 
                                 weeklyData[weekKey].insurance - 
                                 weeklyData[weekKey].tds;
  });

  // Sort weeks by start date
  const sortedWeeks = Object.values(weeklyData).sort((a, b) => 
    new Date(a.weekStart) - new Date(b.weekStart)
  );

  // Update table
  const tbody = document.querySelector('#weeklyTable tbody');
  tbody.innerHTML = sortedWeeks.map(week => {
    const vehicle = vehicles.find(v => v.id === week.vehicle);
    const vehicleDisplay = vehicle ? `${vehicle.name} (${vehicle.number})` : 'Unknown Vehicle';
    return `
      <tr>
        <td>${week.weekStart}</td>
        <td>${week.weekEnd}</td>
        <td>${vehicleDisplay}</td>
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
    `;
  }).join('');
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
    driverEarnings[entry.driver] += parseFloat(entry.totalEarnings) || 0;
    
    // Weekly data
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        earnings: 0,
        trips: 0
      };
    }
    weeklyData[weekKey].earnings += parseFloat(entry.totalEarnings) || 0;
    weeklyData[weekKey].trips += parseInt(entry.trips) || 0;
  });
  
  // Sort weekly data by date
  const sortedWeeks = Object.keys(weeklyData).sort();
  
  // Destroy existing charts if they exist
  if (typeof window.earningsChart !== 'undefined' && window.earningsChart instanceof Chart) {
    window.earningsChart.destroy();
  }
  if (typeof window.trendsChart !== 'undefined' && window.trendsChart instanceof Chart) {
    window.trendsChart.destroy();
  }
  
  // Render Earnings by Driver Chart
  const earningsCtx = document.getElementById('earningsChart').getContext('2d');
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
  const trendsCtx = document.getElementById('weeklyTrendsChart').getContext('2d');
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

function toggleRoomAllocation() {
  const driver = document.getElementById('roomDriver').value;
  if (!driver) {
    alert('Please select a driver');
    return;
  }

  const roomAllocations = JSON.parse(localStorage.getItem('roomAllocations') || '{}');
  roomAllocations[driver] = !roomAllocations[driver];
  localStorage.setItem('roomAllocations', JSON.stringify(roomAllocations));
  renderSetup();
  alert(`Room allocation ${roomAllocations[driver] ? 'enabled' : 'disabled'} for ${driver}`);
}

function setDriverPin() {
  const driver = document.getElementById('pinDriver').value;
  const pin = document.getElementById('driverPin').value;
  
  if (!driver || !pin || pin.length !== 6) {
    alert('Please select a driver and enter a 6-digit PIN');
    return;
  }
  
  const driverPins = JSON.parse(localStorage.getItem('driverPins') || '{}');
  driverPins[driver] = pin;
  localStorage.setItem('driverPins', JSON.stringify(driverPins));
  
  alert('PIN set successfully');
  document.getElementById('driverPin').value = '';
  renderPINList();
}

function resetDriverPin(driver) {
  if (confirm('Are you sure you want to reset the PIN for this driver?')) {
    const driverPins = JSON.parse(localStorage.getItem('driverPins') || '{}');
    delete driverPins[driver];
    localStorage.setItem('driverPins', JSON.stringify(driverPins));
    renderPINList();
  }
}

function showSetupTab(tabId) {
  document.querySelectorAll('.setup-content').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelectorAll('.setup-tabs button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

function showDriverDetails() {
  const driverId = document.getElementById('driverSelect').value;
  if (!driverId) return;

  const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
  const profile = driverProfiles.find(d => d.id === driverId);
  const profileDiv = document.getElementById('driverProfile');

  if (profile) {
    profileDiv.innerHTML = `
      <div class="profile-section">
        <h3>Personal Information</h3>
        <div><strong>Name:</strong> ${profile.name}</div>
        <div><strong>Father's Name:</strong> ${profile.fatherName}</div>
        <div><strong>Date of Birth:</strong> ${profile.dob}</div>
        <div><strong>Joining Date:</strong> ${profile.joiningDate}</div>
      </div>
      <div class="profile-section">
        <h3>Contact Information</h3>
        <div><strong>Mobile:</strong> ${profile.mobile1}</div>
        <div><strong>Alternate Mobile:</strong> ${profile.mobile2 || 'N/A'}</div>
        <div><strong>Email:</strong> ${profile.email}</div>
      </div>
      <div class="profile-section">
        <h3>Document Information</h3>
        <div><strong>DL Number:</strong> ${profile.dlNumber}</div>
        <div><strong>DL Status:</strong> ${profile.documents?.dl || 'Not uploaded'}</div>
        <div><strong>Aadhar Number:</strong> ${profile.aadharNumber}</div>
        <div><strong>Aadhar Status:</strong> ${profile.documents?.aadhar || 'Not uploaded'}</div>
        <div><strong>PAN Number:</strong> ${profile.panNumber}</div>
        <div><strong>Passport Number:</strong> ${profile.passportNumber || 'N/A'}</div>
        <div><strong>Passport Status:</strong> ${profile.documents?.passport || 'Not uploaded'}</div>
        <div><strong>Photo Status:</strong> ${profile.documents?.photo || 'Not uploaded'}</div>
      </div>
      <div class="profile-section">
        <h3>Address Information</h3>
        <div><strong>Permanent Address:</strong> ${profile.permanentAddress}</div>
        <div><strong>Present Address:</strong> ${profile.presentAddress}</div>
      </div>
      <div class="profile-section">
        <h3>References</h3>
        <div><strong>Reference 1:</strong> ${profile.reference1Name} (${profile.reference1Relation}) - ${profile.reference1Mobile}</div>
        <div><strong>Reference 2:</strong> ${profile.reference2Name} (${profile.reference2Relation}) - ${profile.reference2Mobile}</div>
      </div>
    `;
  } else {
    profileDiv.innerHTML = '<div class="no-profile">No profile found for this driver</div>';
  }
}

function editDriverProfile() {
  const driver = document.getElementById('driverSelect').value;
  if (!driver) {
    alert('Please select a driver first');
    return;
  }

  const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
  const profile = driverProfiles.find(d => d.id === driver);
  
  if (!profile) {
    alert('No profile found for this driver');
    return;
  }

  // Open joining form in edit mode
  localStorage.setItem('editDriverProfile', JSON.stringify(profile));
  window.location.href = 'joining-form.html?edit=true';
}

function deleteDriverProfile() {
  const driverId = document.getElementById('driverSelect').value;
  if (!driverId) {
    alert('Please select a driver first');
    return;
  }

  const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
  const driver = driverProfiles.find(d => d.id === driverId);
  
  if (!driver) {
    alert('No profile found for this driver');
    return;
  }

  if (!confirm(`Are you sure you want to delete ${driver.name}'s profile? This will also remove their vehicle assignment and room allocation.`)) {
    return;
  }

  // Remove profile
  const updatedProfiles = driverProfiles.filter(d => d.id !== driverId);
  localStorage.setItem('driverProfiles', JSON.stringify(updatedProfiles));

  // Remove assignments
  const assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
  delete assignments[driverId];
  localStorage.setItem('assignments', JSON.stringify(assignments));

  // Remove room allocation
  const roomAllocations = JSON.parse(localStorage.getItem('roomAllocations') || '{}');
  delete roomAllocations[driverId];
  localStorage.setItem('roomAllocations', JSON.stringify(roomAllocations));

  // Update UI
  updateDropdowns();
  renderSetup();
  alert('Driver profile deleted successfully');
}

function handleFileUpload(input, statusId) {
  const status = document.getElementById(statusId);
  if (input.files && input.files[0]) {
    const file = input.files[0];
    // Here you would typically upload the file to a server
    // For now, we'll just show the filename
    status.textContent = file.name;
    status.style.color = '#4caf50';
  } else {
    status.textContent = 'No file selected';
    status.style.color = '#666';
  }
}

function handleJoiningSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  // Validate required fields
  const requiredFields = ['name', 'fatherName', 'dob', 'mobile1', 'email', 'dlNumber', 'aadharNumber', 'panNumber', 'permanentAddress', 'presentAddress', 'reference1Name', 'reference1Relation', 'reference1Mobile', 'reference2Name', 'reference2Relation', 'reference2Mobile'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    showJoiningError(`Please fill in all required fields: ${missingFields.join(', ')}`);
    return false;
  }
  
  try {
    // Generate unique ID for driver
    const driverId = 'd' + Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Get existing driver profiles and ensure it's an array
    let driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
    if (!Array.isArray(driverProfiles)) {
      driverProfiles = [];
    }
    
    // Add new driver profile
    const newDriver = {
      id: driverId,
      name: data.name,
      fatherName: data.fatherName,
      dob: data.dob,
      mobile1: data.mobile1,
      mobile2: data.mobile2 || '',
      email: data.email,
      dlNumber: data.dlNumber,
      aadharNumber: data.aadharNumber,
      panNumber: data.panNumber,
      passportNumber: data.passportNumber || '',
      permanentAddress: data.permanentAddress,
      presentAddress: data.presentAddress,
      reference1Name: data.reference1Name,
      reference1Relation: data.reference1Relation,
      reference1Mobile: data.reference1Mobile,
      reference2Name: data.reference2Name,
      reference2Relation: data.reference2Relation,
      reference2Mobile: data.reference2Mobile,
      joiningDate: new Date().toISOString().split('T')[0],
      documents: {
        dl: document.getElementById('dlStatus').textContent,
        aadhar: document.getElementById('aadharStatus').textContent,
        passport: document.getElementById('passportStatus').textContent,
        photo: document.getElementById('photoStatus').textContent
      }
    };
    
    // Add to driver profiles array
    driverProfiles.push(newDriver);
    localStorage.setItem('driverProfiles', JSON.stringify(driverProfiles));
    
    // Reset form
    form.reset();
    document.querySelectorAll('.upload-status').forEach(status => {
      status.textContent = 'No file selected';
      status.style.color = '#666';
    });
    
    // Show success message and switch to setup tab
    alert('Driver profile added successfully!');
    showTab('setup');
    renderSetup();
    updateDropdowns();
    return false;
  } catch (error) {
    console.error('Error saving driver profile:', error);
    showJoiningError('Error saving driver profile. Please try again.');
    return false;
  }
}

function showJoiningError(message) {
  const errorMessage = document.getElementById('joiningErrorMessage');
  errorMessage.style.display = 'block';
  errorMessage.textContent = message;
}

function updateProfilePanel() {
  const profilePanel = document.getElementById('profilePanel');
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;

  profilePanel.innerHTML = `
    <div class="profile-info">
      <div>${currentUser.name}</div>
      <div class="profile-details-dropdown">
        <h4>Profile Details</h4>
        <div>Username: ${currentUser.username}</div>
        <div>Role: ${currentUser.role}</div>
        <div>Last Login: ${new Date(currentUser.lastLogin).toLocaleString()}</div>
        <button onclick="logout()">Logout</button>
      </div>
    </div>
  `;
}

function renderPINList() {
  const pinList = document.getElementById('pinList');
  const driverPins = JSON.parse(localStorage.getItem('driverPins') || '{}');
  const drivers = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
  
  pinList.innerHTML = drivers.map(driver => {
    const hasPin = driverPins[driver.id] ? 'Yes' : 'No';
    return `
      <div class="pin-item">
        <div>
          <strong>${driver.name}</strong>
          <span>PIN Set: ${hasPin}</span>
        </div>
        <button onclick="resetDriverPin('${driver.id}')">Reset PIN</button>
      </div>
    `;
  }).join('');
}

function renderSummaryCharts() {
  const entries = JSON.parse(localStorage.getItem('entries') || '[]');
  const drivers = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
  
  // Earnings by Driver Chart
  const earningsData = drivers.map(driver => {
    const driverEntries = entries.filter(e => e.driver === driver.id);
    const totalEarnings = driverEntries.reduce((sum, e) => sum + (e.earnings || 0), 0);
    return { driver: driver.name, earnings: totalEarnings };
  });

  new Chart(document.getElementById('earningsChart'), {
    type: 'bar',
    data: {
      labels: earningsData.map(d => d.driver),
      datasets: [{
        label: 'Total Earnings',
        data: earningsData.map(d => d.earnings),
        backgroundColor: '#4CAF50'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatCurrency(value)
          }
        }
      }
    }
  });

  // Weekly Trends Chart
  const weeklyData = {};
  entries.forEach(entry => {
    const weekStart = getWeekStart(entry.date);
    if (!weeklyData[weekStart]) {
      weeklyData[weekStart] = { earnings: 0, trips: 0 };
    }
    weeklyData[weekStart].earnings += entry.earnings || 0;
    weeklyData[weekStart].trips += entry.trips || 0;
  });

  new Chart(document.getElementById('weeklyTrendsChart'), {
    type: 'line',
    data: {
      labels: Object.keys(weeklyData).map(date => new Date(date).toLocaleDateString()),
      datasets: [{
        label: 'Weekly Earnings',
        data: Object.values(weeklyData).map(d => d.earnings),
        borderColor: '#2196F3',
        fill: false
      }, {
        label: 'Weekly Trips',
        data: Object.values(weeklyData).map(d => d.trips),
        borderColor: '#FFC107',
        fill: false,
        yAxisID: 'y1'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatCurrency(value)
          }
        },
        y1: {
          beginAtZero: true,
          position: 'right'
        }
      }
    }
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

function calculatePay(earnings, offlineEarnings, cash, toll, cng, petrol, others, hours, oldBalance, roomRent) {
  // Convert all inputs to numbers
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
  const pnl = totalEarnings - salary - cngExpense - tollExpense - petrolExpense - otherExpenses - 1080;
  
  return {
    totalEarnings: totalEarnings.toFixed(2),
    payPercent: payPercent,
    salary: salary.toFixed(2),
    commission: commission.toFixed(2),
    payable: payable.toFixed(2),
    pnl: pnl.toFixed(2)
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

updateDropdowns();
renderSetup();
renderDatabase();

// Vehicle Management Functions
function showVehicleDetails() {
  const vehicleId = document.getElementById('vehicleSelect').value;
  const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
  const vehicle = vehicles.find(v => v.id === vehicleId);
  const detailsDiv = document.getElementById('vehicleDetails');
  
  if (!vehicle) {
    detailsDiv.innerHTML = '<div class="no-details">Select a vehicle to view details</div>';
    return;
  }
  
  detailsDiv.innerHTML = `
    <div class="detail-section">
      <h3>Basic Information</h3>
      <div><strong>Name:</strong> ${vehicle.name}</div>
      <div><strong>Number:</strong> ${vehicle.number}</div>
      <div><strong>Type:</strong> ${vehicle.type}</div>
      <div><strong>Status:</strong> ${vehicle.status}</div>
    </div>
    <div class="detail-section">
      <h3>Assignment History</h3>
      ${getVehicleAssignmentHistory(vehicle.id)}
    </div>
  `;
}

function getVehicleAssignmentHistory(vehicleId) {
  const assignments = JSON.parse(localStorage.getItem('vehicleAssignments') || '[]');
  const drivers = JSON.parse(localStorage.getItem('driverProfiles') || '[]');
  
  const vehicleAssignments = assignments.filter(a => a.vehicle === vehicleId);
  if (vehicleAssignments.length === 0) {
    return '<div>No assignment history</div>';
  }
  
  return vehicleAssignments.map(assignment => {
    const driver = drivers.find(d => d.id === assignment.driver);
    return `
      <div class="assignment-item">
        <div>
          <strong>${driver ? driver.name : 'Unknown Driver'}</strong>
          <div>From: ${new Date(assignment.from).toLocaleDateString()}</div>
          ${assignment.to ? `<div>To: ${new Date(assignment.to).toLocaleDateString()}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function addNewVehicle() {
  document.getElementById('vehicleForm').reset();
  document.getElementById('vehicleModal').style.display = 'block';
}

function editVehicle() {
  const vehicleId = document.getElementById('vehicleSelect').value;
  if (!vehicleId) {
    alert('Please select a vehicle to edit');
    return;
  }
  
  const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
  const vehicle = vehicles.find(v => v.id === vehicleId);
  
  if (vehicle) {
    document.getElementById('vehicleName').value = vehicle.name;
    document.getElementById('vehicleNumber').value = vehicle.number;
    document.getElementById('vehicleType').value = vehicle.type;
    document.getElementById('vehicleStatus').value = vehicle.status;
    document.getElementById('vehicleForm').dataset.editId = vehicleId;
    document.getElementById('vehicleModal').style.display = 'block';
  }
}

function deleteVehicle() {
  const vehicleId = document.getElementById('vehicleSelect').value;
  if (!vehicleId) {
    alert('Please select a vehicle to delete');
    return;
  }
  
  if (confirm('Are you sure you want to delete this vehicle?')) {
    const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    const updatedVehicles = vehicles.filter(v => v.id !== vehicleId);
    localStorage.setItem('vehicles', JSON.stringify(updatedVehicles));
    
    // Remove vehicle assignments
    const assignments = JSON.parse(localStorage.getItem('vehicleAssignments') || '[]');
    const updatedAssignments = assignments.filter(a => a.vehicle !== vehicleId);
    localStorage.setItem('vehicleAssignments', JSON.stringify(updatedAssignments));
    
    updateVehicleDropdowns();
    document.getElementById('vehicleSelect').value = '';
    showVehicleDetails();
  }
}

function handleVehicleSubmit(event) {
  event.preventDefault();
  
  const vehicleData = {
    id: event.target.dataset.editId || 'v' + Date.now(),
    name: document.getElementById('vehicleName').value,
    number: document.getElementById('vehicleNumber').value,
    type: document.getElementById('vehicleType').value,
    status: document.getElementById('vehicleStatus').value
  };
  
  const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
  
  if (event.target.dataset.editId) {
    // Update existing vehicle
    const index = vehicles.findIndex(v => v.id === event.target.dataset.editId);
    if (index !== -1) {
      vehicles[index] = vehicleData;
    }
  } else {
    // Add new vehicle
    vehicles.push(vehicleData);
  }
  
  localStorage.setItem('vehicles', JSON.stringify(vehicles));
  updateVehicleDropdowns();
  closeVehicleModal();
  showVehicleDetails();
}

function closeVehicleModal() {
  document.getElementById('vehicleModal').style.display = 'none';
  document.getElementById('vehicleForm').reset();
  delete document.getElementById('vehicleForm').dataset.editId;
}

// Update vehicle dropdowns in all forms
function updateVehicleDropdowns() {
  const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
  const vehicleOptions = vehicles.map(v => 
    `<option value="${v.id}">${v.name} (${v.number})</option>`
  ).join('');
  
  // Update all vehicle dropdowns
  ['vehicleSelect', 'assignVehicle', 'filterVehicle', 'weeklyVehicle'].forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      const currentValue = select.value;
      select.innerHTML = `<option value="">Select Vehicle</option>${vehicleOptions}`;
      select.value = currentValue;
    }
  });
}
