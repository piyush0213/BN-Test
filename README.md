# BN Cab's Fleet Manager

## Overview
BN Cab's Fleet Manager is a web-based application designed to manage cab fleet operations efficiently. It allows admins and drivers to manage daily entries, driver and vehicle profiles, assignments, room allocations, and generate reports.

## Features
- **Driver & Vehicle Management:** Add, edit, and delete driver and vehicle profiles.
- **Vehicle Assignment:** Assign vehicles to drivers and manage assignment history.
- **Room Allocation:** Allocate rooms to drivers and manage room rent.
- **Daily Entry:** Record daily earnings, expenses, trips, and other operational data.
- **Auto Calculations:** Automatic calculation of salary, payable, commission, and P&L based on entries.
- **Database & Filters:** View all entries in a searchable, filterable table. Export data to Excel or PDF.
- **Weekly & Summary Reports:** Generate weekly and summary reports with charts for admin analysis.
- **Role-based Access:** Admin and driver roles with different access levels.
- **PIN Management:** Set and reset driver PINs for secure login.

## Setup & Usage
1. **Clone or Download:**
   - Download the project files to your local machine.

2. **Open in Browser:**
   - Open `index.html` in your preferred web browser.

3. **Login:**
   - Default admin PIN: `123456` (username: `admin`)
   - Drivers can log in with their assigned PINs.

4. **Admin Actions:**
   - Use the Setup tab to add drivers, vehicles, assign vehicles, and allocate rooms.
   - Use the Joining Form to add new drivers.
   - Use the Entry tab to record daily operational data.
   - Use the Database tab to view, filter, export, and manage entries.
   - Use the Weekly and Summary tabs for analytics and reports.

5. **Driver Actions:**
   - Drivers can log in and view/add their own entries.

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Libraries:**
  - [Chart.js](https://www.chartjs.org/) (charts)
  - [SheetJS/xlsx](https://sheetjs.com/) (Excel import/export)
  - [jsPDF](https://github.com/parallax/jsPDF) (PDF export)

## Notes
- All data is stored in the browser's localStorage. No backend/server required.
- For best experience, use a modern browser (Chrome, Edge, Firefox).
- To reset all data, clear the browser's localStorage.

## License
This project is for internal use by BN Cab's. For any queries, contact the developer. 