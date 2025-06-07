let drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
let vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
let assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
let entries = JSON.parse(localStorage.getItem('entries') || '[]');
let roomAllocations = JSON.parse(localStorage.getItem('roomAllocations') || '{}');

function showTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'database') renderDatabase();
  if (id === 'weekly') generateWeeklySummary();
  if (id === 'summary') renderSummary();
  if (id === 'setup') renderSetup();
  updateDropdowns();
}

function updateDropdowns() {
  const driverOptions = drivers.map(d => `<option value="${d}">${d}</option>`).join('');
  const vehicleOptions = vehicles.map(v => `<option value="${v}">${v}</option>`).join('');

  ['driversList', 'filterDriver', 'assignDriver', 'roomDriver', 'pinDriver', 'driverSelect'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      if (id === 'driversList') {
        element.innerHTML = drivers.map(d => `<option value="${d}">`).join('');
      } else {
        element.innerHTML = `<option value="">Select Driver</option>${driverOptions}`;
      }
    }
  });

  ['filterVehicle', 'assignVehicle', 'weeklyVehicle'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = `<option value="">All Vehicles</option>${vehicleOptions}`;
    }
  });
}

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

function autoFillVehicle(driver) {
  const veh = assignments[driver];
  if (veh) document.getElementById('vehicleInput').value = veh;
}

function renderSetup() {
  // Update driver select dropdowns
  const driverOptions = drivers.map(d => `<option value="${d}">${d}</option>`).join('');
  ['driverSelect', 'assignDriver', 'roomDriver'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = `<option value="">Select Driver</option>${driverOptions}`;
    }
  });

  // Update vehicle select dropdown
  const vehicleOptions = vehicles.map(v => `<option value="${v}">${v}</option>`).join('');
  const assignVehicle = document.getElementById('assignVehicle');
  if (assignVehicle) {
    assignVehicle.innerHTML = `<option value="">Select Vehicle</option>${vehicleOptions}`;
  }

  // Render assignments list
  const assignmentList = document.getElementById('assignmentList');
  if (assignmentList) {
    const assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
    assignmentList.innerHTML = Object.entries(assignments)
      .map(([driver, vehicle]) => `
        <div class="assignment-item">
          <span>${driver} → ${vehicle}</span>
          <button onclick="removeAssignment('${driver}')" class="delete-btn">Delete</button>
        </div>
      `).join('');
  }

  // Render room allocations list
  const roomList = document.getElementById('roomList');
  if (roomList) {
    const roomAllocations = JSON.parse(localStorage.getItem('roomAllocations') || '{}');
    roomList.innerHTML = Object.entries(roomAllocations)
      .map(([driver, hasRoom]) => `
        <div class="room-item">
          <span>${driver} - Room Rent: ₹${hasRoom ? '50' : '0'}</span>
          <button onclick="toggleRoomAllocation('${driver}')" class="edit-btn">
            ${hasRoom ? 'Remove Room' : 'Add Room'}
          </button>
        </div>
      `).join('');
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
  else if (totalEarnings >= 6000) pay = 34;
  else if (totalEarnings >= 5000) pay = 32;
  else if (totalEarnings >= 4000) pay = 30;
  else if (totalEarnings >= 2500) pay = 25;
  else if (totalEarnings >= 1800) pay = 20;
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

document.getElementById('entryForm').addEventListener('submit', e => {
  e.preventDefault();
  
  try {
    const form = e.target;
    const formData = new FormData(form);
    const f = Object.fromEntries(formData.entries());
    
    // Validate required fields
    if (!f.date || !f.driver || !f.vehicle) {
      alert('Please fill in all required fields (Date, Driver, Vehicle)');
      return;
    }

    // Calculate values using the same logic as above
    const totalEarnings = (+f.earnings || 0) + (+f.offlineEarnings || 0);
    const hours = parseFloat(f.hours) || 0; // Use parseFloat for hours
    
    let pay = 0;
    if (totalEarnings >= 7000) pay = 38;
    else if (totalEarnings >= 6000) pay = 34;
    else if (totalEarnings >= 5000) pay = 32;
    else if (totalEarnings >= 4000) pay = 30;
    else if (totalEarnings >= 2500) pay = 25;
    else if (totalEarnings >= 1800) pay = 20;
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

    // Create entry object with calculated values
    const entry = {
      date: f.date,
      driver: f.driver,
      vehicle: f.vehicle,
      earnings: +f.earnings || 0,
      cash: +f.cash || 0,
      offlineEarnings: +f.offlineEarnings || 0,
      offlineCash: +f.offlineCash || 0,
      trips: +f.trips || 0,
      toll: +f.toll || 0,
      hours: hours,
      cng: +f.cng || 0,
      petrol: +f.petrol || 0,
      other: +f.other || 0,
      ob: +f.ob || 0,
      roomRent: roomRent,
      salary: salary,
      payable: payable,
      commission: commission,
      payPercent: pay,
      pl: pl
    };

    // Get existing entries
    let entries = JSON.parse(localStorage.getItem('entries') || '[]');

    // Check if entry already exists for this date and driver
    const existingIndex = entries.findIndex(x => x.date === entry.date && x.driver === entry.driver);
    
    if (existingIndex >= 0) {
      // Update existing entry
      if (confirm('An entry already exists for this date and driver. Do you want to update it?')) {
        entries[existingIndex] = entry;
      } else {
        return;
      }
    } else {
      // Add new entry
      entries.push(entry);
    }

    // Save to localStorage
    localStorage.setItem('entries', JSON.stringify(entries));
    
    // Reset form
    form.reset();
    
    // Update UI
    renderDatabase();
    renderSummary();
    
    // Show success message
    alert('Entry saved successfully!');
    
  } catch (error) {
    console.error('Error saving entry:', error);
    alert('Error saving entry. Please try again.');
  }
});

function renderDatabase() {
  const tbody = document.getElementById('dataBody');
  tbody.innerHTML = '';
  const from = new Date(document.getElementById('filterFrom').value);
  const to = new Date(document.getElementById('filterTo').value);
  const fDriver = document.getElementById('filterDriver').value;
  const fVehicle = document.getElementById('filterVehicle').value;

  let filteredEntries = filterEntriesByRole(entries);
  filteredEntries = filteredEntries.filter(e => {
    const d = new Date(e.date);
    return (!isNaN(from) ? d >= from : true) &&
           (!isNaN(to) ? d <= to : true) &&
           (!fDriver || e.driver === fDriver) &&
           (!fVehicle || e.vehicle === fVehicle);
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const e of filteredEntries) {
    const tr = tbody.insertRow();
    const fields = [
      "date", "driver", "vehicle", "earnings", "cash", "offlineEarnings",
      "offlineCash", "trips", "toll", "hours", "salary", "cng", "petrol",
      "other", "ob", "roomRent", "payable"
    ];
    
    if (isAdmin()) fields.push("pl");
    
    for (const field of fields) {
      const cell = tr.insertCell();
      const span = document.createElement("span");
      let value = e[field];
      
      // Special handling for hours field to show 2 decimal places
      if (field === "hours") {
        value = Number(value).toFixed(2);
      } else if (typeof value === 'number') {
        // Round other numbers to integers
        value = Math.round(value);
      }
      
      span.textContent = value;
      cell.appendChild(span);
    }

    // Add action buttons
    const actionCell = tr.insertCell();
    const actionDiv = document.createElement("div");
    actionDiv.className = "action-buttons";
    
    const editBtn = document.createElement("button");
    editBtn.className = "edit";
    editBtn.innerHTML = "✏️";
    editBtn.title = "Edit Entry";
    editBtn.onclick = () => {
      const form = document.getElementById('entryForm');
      Object.keys(e).forEach(key => {
        const input = form.elements[key];
        if (input) {
          // Keep original values for form, including decimal hours
          input.value = e[key];
        }
      });
      showTab('entry');
      form.scrollIntoView({ behavior: 'smooth' });
    };
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete";
    deleteBtn.innerHTML = "❌";
    deleteBtn.title = "Delete Entry";
    deleteBtn.onclick = () => {
      if (confirm("Are you sure you want to delete this entry?")) {
        entries = entries.filter(x => !(x.date === e.date && x.driver === e.driver));
        localStorage.setItem('entries', JSON.stringify(entries));
        renderDatabase();
        renderSummary();
      }
    };
    
    actionDiv.appendChild(editBtn);
    actionDiv.appendChild(deleteBtn);
    actionCell.appendChild(actionDiv);
  }
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
  const tbody = document.querySelector("#weeklyTable tbody");
  tbody.innerHTML = "";
  const start = new Date(document.getElementById('weeklyFrom').value);
  const end = new Date(document.getElementById('weeklyTo').value);
  const fVehicle = document.getElementById('weeklyVehicle').value;

  if (!start || !end) {
    alert('Please select both From and To dates');
    return;
  }

  if (start > end) {
    alert('From date cannot be after To date');
    return;
  }

  const summary = {};

  // Process entries for weekly summary
  for (const e of entries) {
    const d = new Date(e.date);
    if ((!isNaN(start) && d < start) || (!isNaN(end) && d > end)) continue;
    if (fVehicle && e.vehicle !== fVehicle) continue;

    // Get Monday of the week
    const monday = new Date(d);
    monday.setDate(d.getDate() - d.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const weekKey = `${e.vehicle}-${monday.toISOString().slice(0,10)}`;
    if (!summary[weekKey]) {
      summary[weekKey] = {
        vehicle: e.vehicle,
        start: monday,
        end: sunday,
        earnings: 0,
        cash: 0,
        commission: 0,
        trips: 0,
        toll: 0,
        days: 0,
        tds: 0
      };
    }

    const row = summary[weekKey];
    row.earnings += +e.earnings;
    row.cash += +e.cash;
    row.commission += ((+e.cash || 0) - (+e.earnings || 0)); // Uber Commission calculation
    row.trips += +e.trips;
    row.toll += +e.toll;
    row.days++;
  }

  // Generate table rows
  for (const row of Object.values(summary)) {
    // Calculate rent based on trips
    let rent = 1050; // Default rent
    if (row.trips >= 120) rent = 750;
    else if (row.trips >= 90) rent = 850;
    else if (row.trips >= 60) rent = 950;

    // Calculate insurance (₹30 per day)
    const insurance = row.days * 30;

    // Calculate payable
    const payable = (rent * row.days) + insurance + row.tds + row.commission - row.toll;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.start.toISOString().slice(0,10)}</td>
      <td>${row.end.toISOString().slice(0,10)}</td>
      <td>${row.vehicle}</td>
      <td>${row.earnings.toFixed(2)}</td>
      <td>${row.cash.toFixed(2)}</td>
      <td>${row.commission.toFixed(2)}</td>
      <td>${row.toll.toFixed(2)}</td>
      <td>${row.trips}</td>
      <td>${rent}</td>
      <td>${row.days}</td>
      <td>${insurance}</td>
      <td><input type="number" value="${row.tds}" onchange="updateWeeklyPayable(this)" step="0.01"></td>
      <td class="payable">${payable.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
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
  const driverData = {};
  entries.forEach(e => {
    if (!driverData[e.driver]) {
      driverData[e.driver] = { trips: 0, earnings: 0 };
    }
    driverData[e.driver].trips += +e.trips;
    driverData[e.driver].earnings += +e.earnings;
  });

  new Chart(document.getElementById('driverTripsChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(driverData),
      datasets: [{
        label: 'Trips',
        data: Object.values(driverData).map(d => d.trips),
        backgroundColor: '#2196f3'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });

  new Chart(document.getElementById('driverEarningsChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(driverData),
      datasets: [{
        label: 'Earnings',
        data: Object.values(driverData).map(d => d.earnings),
        backgroundColor: '#4caf50'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });

  const vehicleData = {};
  entries.forEach(e => {
    if (!vehicleData[e.vehicle]) {
      vehicleData[e.vehicle] = { trips: 0, earnings: 0 };
    }
    vehicleData[e.vehicle].trips += +e.trips;
    vehicleData[e.vehicle].earnings += +e.earnings;
  });

  new Chart(document.getElementById('vehicleTripsChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(vehicleData),
      datasets: [{
        label: 'Trips',
        data: Object.values(vehicleData).map(d => d.trips),
        backgroundColor: '#2196f3'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });

  new Chart(document.getElementById('vehicleEarningsChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(vehicleData),
      datasets: [{
        label: 'Earnings',
        data: Object.values(vehicleData).map(d => d.earnings),
        backgroundColor: '#4caf50'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
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
  const pin = document.getElementById('newPin').value;
  if (!driver || !pin || pin.length !== 6) return;

  const driverPins = JSON.parse(localStorage.getItem('driverPins') || '{}');
  driverPins[driver] = pin;
  localStorage.setItem('driverPins', JSON.stringify(driverPins));
  
  document.getElementById('newPin').value = '';
  renderSetup();
}

function resetDriverPin(driver) {
  if (!confirm(`Reset PIN for ${driver}?`)) return;
  
  const driverPins = JSON.parse(localStorage.getItem('driverPins') || '{}');
  driverPins[driver] = '123456';
  localStorage.setItem('driverPins', JSON.stringify(driverPins));
  renderSetup();
}

function importExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headers = rows[0];
      const requiredHeaders = ["Date", "Driver", "Vehicle", "Earnings", "Cash Collection"];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        alert(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      const newEntries = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < headers.length) continue;

        const entry = {};
        headers.forEach((h, j) => {
          let value = row[j];
          if (h === 'Date') {
            if (typeof value === 'number') {
              const date = new Date((value - 25569) * 86400 * 1000);
              value = date.toISOString().slice(0,10);
            }
          } else if (typeof value === 'number') {
            value = Math.round(value * 100) / 100;
          }
          entry[h.toLowerCase().replace(/\s+/g, '')] = value;
        });

        if (entry.date && entry.driver && entry.vehicle) {
          // Calculate dependent fields
          const totalEarnings = (+entry.earnings || 0) + (+entry.offlineearnings || 0);
          const hours = parseFloat(entry.loginhours) || 0;
          
          let pay = 0;
          if (totalEarnings >= 7000) pay = 38;
          else if (totalEarnings >= 6000) pay = 34;
          else if (totalEarnings >= 5000) pay = 32;
          else if (totalEarnings >= 4000) pay = 30;
          else if (totalEarnings >= 2500) pay = 25;
          else if (totalEarnings >= 1800) pay = 20;

          if (hours < 9) pay = Math.max(0, pay - 10);
          else if (hours < 11) pay = Math.max(0, pay - 5);

          entry.salary = totalEarnings * pay / 100;
          entry.payable = (+entry.cashcollection || 0) + (+entry.offlinecash || 0) - 
                         entry.salary - (+entry.cng || 0) - (+entry.petrol || 0) - 
                         (+entry.otherexpenses || 0) + (+entry.openingbalance || 0) + 
                         (+entry.roomrent || 0);
          entry.pl = totalEarnings - entry.salary - (+entry.cng || 0) - 
                    (+entry.toll || 0) - (+entry.petrol || 0) - 
                    (+entry.otherexpenses || 0) - 1080;
          
          newEntries.push(entry);
        }
      }

      entries = [...entries, ...newEntries];
      localStorage.setItem('entries', JSON.stringify(entries));
      renderDatabase();
      renderSummary();
      alert(`Imported ${newEntries.length} entries successfully`);
    } catch (error) {
      console.error('Error importing Excel:', error);
      alert('Error importing Excel file. Please check the file format and try again.');
    }
  };
  reader.readAsArrayBuffer(file);
}

function clearFilters() {
  document.getElementById('filterFrom').value = '';
  document.getElementById('filterTo').value = '';
  document.getElementById('filterDriver').value = '';
  document.getElementById('filterVehicle').value = '';
  renderDatabase();
}

function showSetupTab(tabId) {
  document.querySelectorAll('.setup-content').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelectorAll('.setup-tabs button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

function showDriverDetails() {
  const driver = document.getElementById('driverSelect').value;
  if (!driver) return;

  const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '{}');
  const profile = driverProfiles[driver];
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

  const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '{}');
  const profile = driverProfiles[driver];
  
  if (!profile) {
    alert('No profile found for this driver');
    return;
  }

  // Open joining form in edit mode
  localStorage.setItem('editDriverProfile', JSON.stringify(profile));
  window.location.href = 'joining-form.html?edit=true';
}

function deleteDriverProfile() {
  const driver = document.getElementById('driverSelect').value;
  if (!driver) {
    alert('Please select a driver first');
    return;
  }

  if (!confirm(`Are you sure you want to delete ${driver}'s profile? This will also remove their vehicle assignment and room allocation.`)) {
    return;
  }

  // Remove from drivers list
  const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
  const driverIndex = drivers.indexOf(driver);
  if (driverIndex > -1) {
    drivers.splice(driverIndex, 1);
    localStorage.setItem('drivers', JSON.stringify(drivers));
  }

  // Remove profile
  const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '{}');
  delete driverProfiles[driver];
  localStorage.setItem('driverProfiles', JSON.stringify(driverProfiles));

  // Remove assignments
  const assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
  delete assignments[driver];
  localStorage.setItem('assignments', JSON.stringify(assignments));

  // Remove room allocation
  const roomAllocations = JSON.parse(localStorage.getItem('roomAllocations') || '{}');
  delete roomAllocations[driver];
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

  // Validate mobile numbers
  const mobilePattern = /^[0-9]{10}$/;
  if (!mobilePattern.test(data.mobile1)) {
    showJoiningError('Please enter a valid 10-digit mobile number');
    return false;
  }

  // Validate Aadhar number
  const aadharPattern = /^[0-9]{12}$/;
  if (!aadharPattern.test(data.aadharNumber)) {
    showJoiningError('Please enter a valid 12-digit Aadhar number');
    return false;
  }

  // Validate PAN number
  const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panPattern.test(data.panNumber)) {
    showJoiningError('Please enter a valid PAN number');
    return false;
  }

  try {
    // Save to localStorage
    const driverProfiles = JSON.parse(localStorage.getItem('driverProfiles') || '{}');
    driverProfiles[data.name] = {
      ...data,
      joiningDate: new Date().toISOString().split('T')[0],
      documents: {
        dl: document.getElementById('dlStatus').textContent,
        aadhar: document.getElementById('aadharStatus').textContent,
        passport: document.getElementById('passportStatus').textContent,
        photo: document.getElementById('photoStatus').textContent
      }
    };
    localStorage.setItem('driverProfiles', JSON.stringify(driverProfiles));

    // Add to drivers list if not exists
    const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    if (!drivers.includes(data.name)) {
      drivers.push(data.name);
      localStorage.setItem('drivers', JSON.stringify(drivers));
    }

    // Reset form
    form.reset();
    document.querySelectorAll('.upload-status').forEach(status => {
      status.textContent = 'No file selected';
      status.style.color = '#666';
    });

    // Show success message and switch to setup tab
    alert('Driver profile added successfully!');
    showTab('setup');
    renderSetup(); // Refresh setup page to show new driver
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
  const pins = JSON.parse(localStorage.getItem('driverPins') || '{}');
  const drivers = JSON.parse(localStorage.getItem('driverProfiles') || '[]');

  pinList.innerHTML = '';
  Object.entries(pins).forEach(([driverId, pin]) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    const div = document.createElement('div');
    div.className = 'pin-item';
    div.innerHTML = `
      <div>
        <strong>${driver.name}</strong>
        <div>PIN: ${pin}</div>
      </div>
      <button onclick="removeDriverPIN('${driverId}')">Remove</button>
    `;
    pinList.appendChild(div);
  });
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

updateDropdowns();
renderSetup();
renderDatabase();
