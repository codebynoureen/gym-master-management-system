        // -------------------- GLOBAL --------------------
let currentAdmin = null;
let currentPage = 'dashboard';

// API endpoint helpers — keeps frontend in sync with server routes
function apiListEndpoint(type) {
  if (type === 'equipment') return '/api/equipment';
  if (type === 'class') return '/api/classes';
  if (type === 'payment') return '/api/payments';
  return `/api/${type}s`;
}

function apiSingleEndpoint(type, id) {
  if (type === 'equipment') return `/api/equipment/${id}`;
  if (type === 'class') return `/api/classes/${id}`;
  if (type === 'payment') return `/api/payments/${id}`;
  return `/api/${type}s/${id}`;
}

function apiItemKey(type) {
  if (type === 'equipment') return 'equipment';
  if (type === 'class') return 'classes';
  if (type === 'payment') return 'payments';
  return `${type}s`;
}

// -------------------- DOM CONTENT LOADED --------------------
document.addEventListener('DOMContentLoaded', function() {
  const adminData = localStorage.getItem('admin');
  const path = window.location.pathname;

  
  if (adminData) {
    currentAdmin = JSON.parse(adminData);

    // Update admin name in the header
    const userNameElements = document.querySelectorAll('.user-name');
    if (userNameElements.length > 0) {
      userNameElements.forEach(el => {
        el.textContent = currentAdmin.username;
      });
    }

    // Update user avatar with first letter of username
    const userAvatarElements = document.querySelectorAll('.user-avatar');
    if (userAvatarElements.length > 0) {
      userAvatarElements.forEach(el => {
        el.textContent = currentAdmin.username.charAt(0).toUpperCase();
      });
    }

    // Redirect logged-in admin from login/register to dashboard
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
      window.location.replace('/admin/dashboard.html');
      return;
    }

    initializePage();
  }

  initEventListeners();
  setupNavigation();
});

// -------------------- INITIALIZE PAGE --------------------
function initializePage() {
  const path = window.location.pathname;

  if (path.includes('dashboard.html')) {
    currentPage = 'dashboard';
    loadDashboard();
  } else if (path.includes('members.html')) {
    currentPage = 'members';
    loadMembers();
  } else if (path.includes('trainers.html')) {
    currentPage = 'trainers';
    loadTrainers();
  } else if (path.includes('classes.html')) {
    currentPage = 'classes';
    loadClasses();
  } else if (path.includes('equipment.html')) {
    currentPage = 'equipment';
    loadEquipment();
  } else if (path.includes('payments.html')) {
    currentPage = 'payments';
    loadPayments();
  } else if (path.includes('profile.html')) {
    currentPage = 'profile';
    loadProfile();
  }
}

// -------------------- SETUP NAVIGATION --------------------
function setupNavigation() {
  // Add click event to menu items
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    if (!item.id || item.id !== 'logout-btn') {
      item.addEventListener('click', function() {
        const target = this.getAttribute('data-target');
        if (target) {
          window.location.href = `/admin/${target}.html`;
        }
      });
    }
  });
}

// -------------------- EVENT LISTENERS --------------------
function initEventListeners() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const registerForm = document.getElementById('register-form');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // Use event delegation for dynamic elements
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-btn')) {
      showAddForm(e.target.dataset.type);
    } else if (e.target.classList.contains('edit-btn')) {
      showEditForm(e.target.dataset.type, e.target.dataset.id);
    } else if (e.target.classList.contains('delete-btn')) {
      deleteItem(e.target.dataset.type, e.target.dataset.id);
    }
  });
}

// -------------------- LOGIN --------------------
function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) return showAlert('Please enter both username and password', 'error');

  showLoading('Logging in...');

  fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    hideLoading();
    if (data.success) {
      localStorage.setItem('admin', JSON.stringify(data.admin));
      window.location.replace('/admin/dashboard.html');
    } else {
      showAlert(data.message, 'error');
    }
  })
  .catch(err => {
    hideLoading();
    showAlert('Login failed. Please try again.', 'error');
    console.error('Login error:', err);
  });
}

// -------------------- REGISTER --------------------
function handleRegister(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !email || !password) return showAlert('Please fill all fields', 'error');

  showLoading('Registering...');

  fetch('/api/admin/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  })
  .then(res => res.json())
  .then(data => {
    hideLoading();
    if (data.success) {
      showAlert(data.message, 'success');
      setTimeout(() => window.location.replace('/admin/login.html'), 1500);
    } else {
      showAlert(data.message, 'error');
    }
  })
  .catch(err => {
    hideLoading();
    showAlert('Registration failed. Please try again.', 'error');
    console.error('Registration error:', err);
  });
}

// -------------------- LOGOUT --------------------
function handleLogout() {
  localStorage.removeItem('admin');
  window.location.replace('/admin/login.html');
}

// -------------------- DASHBOARD --------------------
function loadDashboard() {
  showLoading('Loading dashboard...');
  Promise.all([
    fetch('/api/members').then(r=>r.json()),
    fetch('/api/trainers').then(r=>r.json()),
    fetch('/api/classes').then(r=>r.json()),
    fetch('/api/equipment').then(r=>r.json()),
    fetch('/api/payments').then(r=>r.json())
  ])
  .then(([membersData, trainersData, classesData, equipmentData, paymentsData]) => {
    hideLoading();
    if (membersData.success && trainersData.success && classesData.success && equipmentData.success && paymentsData.success) {
      document.getElementById('total-members').textContent = membersData.members.length;
      document.getElementById('total-trainers').textContent = trainersData.trainers.length;
      document.getElementById('total-classes').textContent = classesData.classes.length;
      document.getElementById('total-equipment').textContent = equipmentData.equipment.length;
      const totalRevenue = paymentsData.payments.filter(p => p.status==='paid')
        .reduce((sum,p)=>sum+parseFloat(p.amount),0);
      document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
      loadRecentMembers(membersData.members.slice(0,5));
    } else showAlert('Failed to load dashboard data', 'error');
  })
  .catch(err => { hideLoading(); showAlert('Dashboard loading error', 'error'); console.error(err); });
}

function loadRecentMembers(members){
  const tbody = document.getElementById('recent-members-table');
  if(!tbody) return;
  tbody.innerHTML = '';
  members.forEach(m=>{
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${m.name}</td>
      <td>${m.email}</td>
      <td>${m.phone||'N/A'}</td>
      <td>${m.membership_type||'N/A'}</td>
      <td><span class="status-badge status-${m.status}">${m.status}</span></td>
    `;
    tbody.appendChild(row);
  });
}

// -------------------- LOAD MEMBERS --------------------
function loadMembers() {
  showLoading('Loading members...');
  fetch('/api/members')
    .then(r => r.json())
    .then(data => {
      hideLoading();
      if (data.success) {
        renderMembersTable(data.members);
      } else {
        showAlert('Failed to load members', 'error');
      }
    })
    .catch(err => {
      hideLoading();
      showAlert('Failed to load members', 'error');
      console.error(err);
    });
}

function renderMembersTable(members) {
  const tbody = document.getElementById('members-table');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  members.forEach(member => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${member.id}</td>
      <td>${member.name}</td>
      <td>${member.email}</td>
      <td>${member.phone || 'N/A'}</td>
      <td>${member.membership_type || 'N/A'}</td>
      <td>${member.join_date || 'N/A'}</td>
      <td><span class="status-badge status-${member.status}">${member.status}</span></td>
      <td>
        <button class="btn btn-primary edit-btn" data-type="member" data-id="${member.id}">Edit</button>
        <button class="btn btn-danger delete-btn" data-type="member" data-id="${member.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// -------------------- LOAD TRAINERS --------------------
function loadTrainers() {
  showLoading('Loading trainers...');
  fetch('/api/trainers')
    .then(r => r.json())
    .then(data => {
      hideLoading();
      if (data.success) {
        renderTrainersTable(data.trainers);
      } else {
        showAlert('Failed to load trainers', 'error');
      }
    })
    .catch(err => {
      hideLoading();
      showAlert('Failed to load trainers', 'error');
      console.error(err);
    });
}

function renderTrainersTable(trainers) {
  const tbody = document.getElementById('trainers-table');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  trainers.forEach(trainer => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${trainer.name}</td>
      <td>${trainer.email}</td>
      <td>${trainer.phone || 'N/A'}</td>
      <td>${trainer.specialization || 'N/A'}</td>
      <td>${trainer.experience ? trainer.experience + ' years' : 'N/A'}</td>
      <td><span class="status-badge status-${trainer.status}">${trainer.status}</span></td>
      <td>
        <button class="btn btn-primary edit-btn" data-type="trainer" data-id="${trainer.id}">Edit</button>
        <button class="btn btn-danger delete-btn" data-type="trainer" data-id="${trainer.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// -------------------- LOAD CLASSES --------------------
function loadClasses() {
  showLoading('Loading classes...');
  fetch('/api/classes')
    .then(r => r.json())
    .then(data => {
      hideLoading();
      if (data.success) {
        renderClassesTable(data.classes);
      } else {
        showAlert('Failed to load classes', 'error');
      }
    })
    .catch(err => {
      hideLoading();
      showAlert('Failed to load classes', 'error');
      console.error(err);
    });
}

function renderClassesTable(classes) {
  const tbody = document.getElementById('classes-table');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  classes.forEach(cls => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cls.name}</td>
      <td>${cls.trainer_name || 'N/A'}</td>
      <td>${cls.schedule ? new Date(cls.schedule).toLocaleString() : 'N/A'}</td>
      <td>${cls.duration ? cls.duration + ' mins' : 'N/A'}</td>
      <td>${cls.capacity || 'N/A'}</td>
      <td><span class="status-badge status-${cls.status}">${cls.status}</span></td>
      <td>
        <button class="btn btn-primary edit-btn" data-type="class" data-id="${cls.id}">Edit</button>
        <button class="btn btn-danger delete-btn" data-type="class" data-id="${cls.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// -------------------- LOAD EQUIPMENT --------------------
function loadEquipment() {
  showLoading('Loading equipment...');
  fetch('/api/equipment')
    .then(r => r.json())
    .then(data => {
      hideLoading();
      if (data.success) {
        renderEquipmentTable(data.equipment);
      } else {
        showAlert('Failed to load equipment', 'error');
      }
    })
    .catch(err => {
      hideLoading();
      showAlert('Failed to load equipment', 'error');
      console.error(err);
    });
}

function renderEquipmentTable(equipment) {
  const tbody = document.getElementById('equipment-table');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  equipment.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category || 'N/A'}</td>
      <td>${item.purchase_date || 'N/A'}</td>
      <td>${item.last_maintenance || 'N/A'}</td>
      <td><span class="status-badge status-${item.status}">${item.status}</span></td>
      <td>
        <button class="btn btn-primary edit-btn" data-type="equipment" data-id="${item.id}">Edit</button>
        <button class="btn btn-danger delete-btn" data-type="equipment" data-id="${item.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// -------------------- LOAD PAYMENTS --------------------
function loadPayments() {
  showLoading('Loading payments...');
  fetch('/api/payments')
    .then(r => r.json())
    .then(data => {
      hideLoading();
      if (data.success) {
        renderPaymentsTable(data.payments);
      } else {
        showAlert('Failed to load payments', 'error');
      }
    })
    .catch(err => {
      hideLoading();
      showAlert('Failed to load payments', 'error');
      console.error(err);
    });
}

function renderPaymentsTable(payments) {
  const tbody = document.getElementById('payments-table');
  if (!tbody) return;

  tbody.innerHTML = '';
  payments.forEach(payment => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${payment.member_name || 'N/A'}</td>
      <td>$${payment.amount || '0.00'}</td>
      <td>${payment.payment_date || 'N/A'}</td>
      <td>${payment.due_date || 'N/A'}</td>
      <td>
        <span class="status-badge status-${payment.status}">${payment.status}</span>
      </td>
      <td>
        <button class="btn btn-primary edit-btn" data-type="payment" data-id="${payment.id}">Edit</button>
        <button class="btn btn-danger delete-btn" data-type="payment" data-id="${payment.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// -------------------- ADD / EDIT / DELETE --------------------
function showAddForm(type) {
  // Create a modal for adding new items
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;
  
  let formHTML = '';
  let title = '';
  
  switch(type) {
    case 'member':
      title = 'Add New Member';
      formHTML = `
        <input type="text" name="name" placeholder="Full Name" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="tel" name="phone" placeholder="Phone">
        <select name="membership_type" required>
          <option value="">Select Membership Type</option>
          <option value="Basic">Basic</option>
          <option value="Standard">Standard</option>
          <option value="Premium">Premium</option>
        </select>
        <input type="date" name="join_date" placeholder="Join Date" required>
        <select name="status" required>
          <option value="">Select Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
        </select>
      `;
      break;
    case 'trainer':
      title = 'Add New Trainer';
      formHTML = `
        <input type="text" name="name" placeholder="Full Name" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="tel" name="phone" placeholder="Phone">
        <input type="text" name="specialization" placeholder="Specialization">
        <input type="number" name="experience" placeholder="Years of Experience" min="0">
        <select name="status" required>
          <option value="">Select Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      `;
      break;
    case 'class':
      title = 'Add New Class';
      formHTML = `
        <input type="text" name="name" placeholder="Class Name" required>
        <select id="trainer-select" name="trainer_id" required>
          <option value="">Select Trainer</option>
        </select>
        <input type="datetime-local" name="schedule" placeholder="Schedule" required>
        <input type="number" name="duration" placeholder="Duration (minutes)" min="1" required>
        <input type="number" name="capacity" placeholder="Capacity" min="1" required>
        <select name="status" required>
          <option value="">Select Status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      `;
      break;
    case 'equipment':
      title = 'Add New Equipment';
      formHTML = `
        <input type="text" name="name" placeholder="Equipment Name" required>
        <input type="text" name="category" placeholder="Category">
        <input type="date" name="purchase_date" placeholder="Purchase Date">
        <input type="date" name="last_maintenance" placeholder="Last Maintenance">
        <select name="status" required>
          <option value="">Select Status</option>
          <option value="Available">Available</option>
          <option value="In Use">In Use</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Retired">Retired</option>
        </select>
      `;
      break;
    case 'payment':
      title = 'Add New Payment';
      formHTML = `
        <select id="member-select" name="member_id" required>
          <option value="">Select Member</option>
        </select>
        <input type="number" name="amount" placeholder="Amount" min="0" step="0.01" required>
        <input type="date" name="payment_date" placeholder="Payment Date" required>
        <input type="date" name="due_date" placeholder="Due Date" required>
        <select name="status" required>
          <option value="">Select Status</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>
      `;
      break;
  }
  
  modal.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 10px; width: 90%; max-width: 500px;">
      <h2>${title}</h2>
      <form id="add-form" style="display: flex; flex-direction: column; gap: 15px; margin: 20px 0;">
        ${formHTML}
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Load dynamic data for selects if needed
  if (type === 'class') {
    fetch('/api/trainers')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const select = document.getElementById('trainer-select');
          data.trainers.forEach(trainer => {
            const option = document.createElement('option');
            option.value = trainer.id;
            option.textContent = trainer.name;
            select.appendChild(option);
          });
        }
      });
  } else if (type === 'payment') {
    fetch('/api/members')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const select = document.getElementById('member-select');
          data.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.name;
            select.appendChild(option);
          });
        }
      });
  }
  
  // Handle form submission
  modal.querySelector('form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    // Format datetime for MySQL (for classes)
    if (type === 'class' && data.schedule) {
      data.schedule = new Date(data.schedule)
        .toISOString()
        .slice(0, 16)        // "2025-09-01T17:30:00"
        .replace('T', ' ');  // "2025-09-01 17:30:00"
    }

    // Payment-specific validation
    if (type === 'payment') {
      if (!data.member_id || !data.amount || !data.status) {
        showAlert("Member, Amount and Status are required fields", "error");
        return;
      }
    } 
    // Equipment-specific validation
    else if (type === 'equipment') {
      if (!data.name || !data.status) {
        showAlert("Name and Status are required fields", "error");
        return;
      }
    }
    // General validation for other types
    else if (!data.name || !data.status) {
      showAlert("Name and Status are required fields", "error");
      return;
    }

    showLoading(`Adding ${type}...`);
    try {
      const res = await fetch(apiListEndpoint(type), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      hideLoading();
      if (result.success) {
        showAlert(result.message || `${type} added`, 'success');
        modal.remove();
        reloadCurrentPage();
      } else {
        showAlert(result.message || 'Failed to add', 'error');
      }
    } catch (err) {
      hideLoading();
      console.error('Add error:', err);
      showAlert(`Failed to add ${type}: ${err.message}`, 'error');
    }
  });
}

function showEditForm(type, id) {
  // map banaya irregular plural fix k liye
  const apiMap = {
    class: { endpoint: '/api/classes', key: 'classes' },
    equipment: { endpoint: '/api/equipment', key: 'equipment' },
    member: { endpoint: '/api/members', key: 'members' },
    trainer: { endpoint: '/api/trainers', key: 'trainers' },
    payment: { endpoint: '/api/payments', key: 'payments' }
  };

  const config = apiMap[type];
  if (!config) {
    showAlert(`Unknown type: ${type}`, 'error');
    return;
  }

  showLoading(`Loading ${type} data...`);

  fetch(config.endpoint)
    .then(res => res.json())
    .then(data => {
      hideLoading();
      if (!data.success) {
        showAlert(`Failed to load ${type} data`, 'error');
        return;
      }

      const items = data[config.key] || [];
      const item = items.find(i => i.id == id);

      if (!item) {
        showAlert(`${type} not found`, 'error');
        return;
      }

      showEditModal(type, item);
    })
    .catch(err => {
      hideLoading();
      showAlert(`Failed to load ${type} data`, 'error');
      console.error(`${type} load error:`, err);
    });
}


function showEditModal(type, item) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;
  
  let formHTML = '';
  let title = '';
  
  switch(type) {
    case 'member':
      title = 'Edit Member';
      formHTML = `
        <input type="text" name="name" placeholder="Full Name" value="${item.name || ''}" required>
        <input type="email" name="email" placeholder="Email" value="${item.email || ''}" required>
        <input type="tel" name="phone" placeholder="Phone" value="${item.phone || ''}">
        <select name="membership_type" required>
          <option value="">Select Membership Type</option>
          <option value="Basic" ${item.membership_type === 'Basic' ? 'selected' : ''}>Basic</option>
          <option value="Standard" ${item.membership_type === 'Standard' ? 'selected' : ''}>Standard</option>
          <option value="Premium" ${item.membership_type === 'Premium' ? 'selected' : ''}>Premium</option>
        </select>
        <input type="date" name="join_date" placeholder="Join Date" value="${item.join_date || ''}" required>
        <select name="status" required>
          <option value="">Select Status</option>
          <option value="Active" ${item.status === 'Active' ? 'selected' : ''}>Active</option>
          <option value="Inactive" ${item.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
        </select>
      `;
      break;
    case 'trainer':
      title = 'Edit Trainer';
      formHTML = `
        <input type="text" name="name" placeholder="Full Name" value="${item.name || ''}" required>
        <input type="email" name="email" placeholder="Email" value="${item.email || ''}" required>
        <input type="tel" name="phone" placeholder="Phone" value="${item.phone || ''}">
        <input type="text" name="specialization" placeholder="Specialization" value="${item.specialization || ''}">
        <input type="number" name="experience" placeholder="Years of Experience" min="0" value="${item.experience || ''}">
        <select name="status" required>
          <option value="">Select Status</option>
          <option value="Active" ${item.status === 'Active' ? 'selected' : ''}>Active</option>
          <option value="Inactive" ${item.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
        </select>
      `;
      break;
    case 'class':
      title = 'Edit Class';
      formHTML = `
        <input type="text" name="name" placeholder="Class Name" value="${item.name || ''}" required>
        <select id="trainer-select-edit" name="trainer_id" required>
          <option value="">Select Trainer</option>
        </select>
        <input type="datetime-local" name="schedule" placeholder="Schedule" value="${item.schedule ? item.schedule.replace(' ', 'T') : ''}" required>
        <input type="number" name="duration" placeholder="Duration (minutes)" min="1" value="${item.duration || ''}" required>
        <input type="number" name="capacity" placeholder="Capacity" min="1" value="${item.capacity || ''}" required>
        <select name="status" required>
          <option value="">Select Status</option>
          <option value="Scheduled" ${item.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
          <option value="Completed" ${item.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Cancelled" ${item.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      `;
      break;
    case 'equipment':
      title = 'Edit Equipment';
      formHTML = `
        <input type="text" name="name" placeholder="Equipment Name" value="${item.name || ''}" required>
        <input type="text" name="category" placeholder="Category" value="${item.category || ''}">
        <input type="date" name="purchase_date" placeholder="Purchase Date" value="${item.purchase_date || ''}">
        <input type="date" name="last_maintenance" placeholder="Last Maintenance" value="${item.last_maintenance || ''}">
        <select name="status" required>
          <option value="">Select Status</option>
          <option value="Available" ${item.status === 'Available' ? 'selected' : ''}>Available</option>
          <option value="In Use" ${item.status === 'In Use' ? 'selected' : ''}>In Use</option>
          <option value="Maintenance" ${item.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
          <option value="Retired" ${item.status === 'Retired' ? 'selected' : ''}>Retired</option>
        </select>
      `;
      break;
    case 'payment':
      title = 'Edit Payment';
      formHTML = `
        <select id="member-select-edit" name="member_id" required>
          <option value="">Select Member</option>
        </select>
        <input type="number" name="amount" placeholder="Amount" min="0" step="0.01" value="${item.amount || ''}" required>
        <input type="date" name="payment_date" placeholder="Payment Date" value="${item.payment_date || ''}" required>
        <input type="date" name="due_date" placeholder="Due Date" value="${item.due_date || ''}" required>
        <select name="status" required>
          <option value="">Select Status</option>
          <option value="Paid" ${item.status === 'Paid' ? 'selected' : ''}>Paid</option>
          <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Overdue" ${item.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
        </select>
      `;
      break;
  }
  
  modal.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 10px; width: 90%; max-width: 500px;">
      <h2>${title}</h2>
      <form id="edit-form" style="display: flex; flex-direction: column; gap: 15px; margin: 20px 0;">
        ${formHTML}
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Load dynamic data for selects if needed
  if (type === 'class' || type === 'payment') {
    const endpoint = type === 'class' ? '/api/trainers' : '/api/members';
    const selectId = type === 'class' ? 'trainer-select-edit' : 'member-select-edit';
    
    fetch(endpoint)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const select = document.getElementById(selectId);
          data[type === 'class' ? 'trainers' : 'members'].forEach(optionItem => {
            const option = document.createElement('option');
            option.value = optionItem.id;
            option.textContent = optionItem.name;
            if (type === 'class' && item.trainer_id == optionItem.id) option.selected = true;
            if (type === 'payment' && item.member_id == optionItem.id) option.selected = true;
            select.appendChild(option);
          });
        }
      });
  }
  
  // Handle form submission
  modal.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    showLoading(`Updating ${type}...`);
    fetch(`/api/${type}s/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(result => {
      hideLoading();
      if (result.success) {
        showAlert(result.message, 'success');
        modal.remove();
        reloadCurrentPage();
      } else {
        showAlert(result.message, 'error');
      }
    })
    .catch(err => {
      hideLoading();
      showAlert(`Failed to update ${type}`, 'error');
      console.error(err);
    });
  });
}

function showEditModal(type, item) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;
  
  let formHTML = '';
  let title = '';
  
  switch(type) {
    case 'member':
      title = 'Edit Member';
      formHTML = `
        <input type="text" name="name" placeholder="Full Name" value="${item.name || ''}" required>
        <input type="email" name="email" placeholder="Email" value="${item.email || ''}" required>
        <input type="tel" name="phone" placeholder="Phone" value="${item.phone || ''}">
        <select name="membership_type" required>
          <option value="">Select Membership Type</option>
          <option value="Basic" ${item.membership_type === 'Basic' ? 'selected' : ''}>Basic</option>
          <option value="Standard" ${item.membership_type === 'Standard' ? 'selected' : ''}>Standard</option>
          <option value="Premium" ${item.membership_type === 'Premium' ? 'selected' : ''}>Premium</option>
        </select>
        <input type="date" name="join_date" placeholder="Join Date" value="${item.join_date || ''}" required>
        <select name="status" required>
          <option value="">Select Status</option>
          <option value="Active" ${item.status === 'Active' ? 'selected' : ''}>Active</option>
        <option value="Inactive" ${item.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
        <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
      </select>
    `;
    break;
  case 'trainer':
    title = 'Edit Trainer';
    formHTML = `
      <input type="text" name="name" placeholder="Full Name" value="${item.name || ''}" required>
      <input type="email" name="email" placeholder="Email" value="${item.email || ''}" required>
      <input type="tel" name="phone" placeholder="Phone" value="${item.phone || ''}">
      <input type="text" name="specialization" placeholder="Specialization" value="${item.specialization || ''}">
      <input type="number" name="experience" placeholder="Years of Experience" min="0" value="${item.experience || ''}">
      <select name="status" required>
        <option value="">Select Status</option>
        <option value="Active" ${item.status === 'Active' ? 'selected' : ''}>Active</option>
        <option value="Inactive" ${item.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
      </select>
    `;
    break;
  case 'class':
    title = 'Edit Class';
    // Format datetime for the input field
    const scheduleValue = item.schedule ? new Date(item.schedule).toISOString().slice(0, 16) : '';
    formHTML = `
      <input type="text" name="name" placeholder="Class Name" value="${item.name || ''}" required>
      <select id="trainer-select-edit" name="trainer_id" required>
        <option value="">Select Trainer</option>
      </select>
      <input type="datetime-local" name="schedule" placeholder="Schedule" value="${scheduleValue}" required>
      <input type="number" name="duration" placeholder="Duration (minutes)" min="1" value="${item.duration || ''}" required>
      <input type="number" name="capacity" placeholder="Capacity" min="1" value="${item.capacity || ''}" required>
      <select name="status" required>
        <option value="">Select Status</option>
        <option value="Scheduled" ${item.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
        <option value="Completed" ${item.status === 'Completed' ? 'selected' : ''}>Completed</option>
        <option value="Cancelled" ${item.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
      </select>
    `;
    break;
  case 'equipment':
    title = 'Edit Equipment';
    formHTML = `
      <input type="text" name="name" placeholder="Equipment Name" value="${item.name || ''}" required>
      <input type="text" name="category" placeholder="Category" value="${item.category || ''}">
      <input type="date" name="purchase_date" placeholder="Purchase Date" value="${item.purchase_date || ''}">
      <input type="date" name="last_maintenance" placeholder="Last Maintenance" value="${item.last_maintenance || ''}">
      <select name="status" required>
        <option value="">Select Status</option>
        <option value="Available" ${item.status === 'Available' ? 'selected' : ''}>Available</option>
        <option value="In Use" ${item.status === 'In Use' ? 'selected' : ''}>In Use</option>
        <option value="Maintenance" ${item.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
        <option value="Retired" ${item.status === 'Retired' ? 'selected' : ''}>Retired</option>
      </select>
    `;
    break;
  case 'payment':
    title = 'Edit Payment';
    formHTML = `
      <select id="member-select-edit" name="member_id" required>
        <option value="">Select Member</option>
      </select>
      <input type="number" name="amount" placeholder="Amount" min="0" step="0.01" value="${item.amount || ''}" required>
      <input type="date" name="payment_date" placeholder="Payment Date" value="${item.payment_date || ''}" required>
      <input type="date" name="due_date" placeholder="Due Date" value="${item.due_date || ''}" required>
      <select name="status" required>
        <option value="">Select Status</option>
        <option value="Paid" ${item.status === 'Paid' ? 'selected' : ''}>Paid</option>
        <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
        <option value="Overdue" ${item.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
      </select>
    `;
    break;
}

modal.innerHTML = `
  <div style="background: white; padding: 20px; border-radius: 10px; width: 90%; max-width: 500px;">
    <h2>${title}</h2>
    <form id="edit-form" style="display: flex; flex-direction: column; gap: 15px; margin: 20px 0;">
      ${formHTML}
      <input type="hidden" name="id" value="${item.id}">
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove()">Cancel</button>
        <button type="submit" class="btn btn-primary">Update</button>
      </div>
    </form>
  </div>
`;

document.body.appendChild(modal);

// Load dynamic data for selects if needed
if (type === 'class' || type === 'payment') {
  const endpoint = type === 'class' ? '/api/trainers' : '/api/members';
  const selectId = type === 'class' ? 'trainer-select-edit' : 'member-select-edit';
  
  fetch(endpoint)
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        const select = document.getElementById(selectId);
        data[type === 'class' ? 'trainers' : 'members'].forEach(optionItem => {
          const option = document.createElement('option');
          option.value = optionItem.id;
          option.textContent = optionItem.name;
          if (type === 'class' && item.trainer_id == optionItem.id) option.selected = true;
          if (type === 'payment' && item.member_id == optionItem.id) option.selected = true;
          select.appendChild(option);
        });
      }
    });
}

// Handle form submission
modal.querySelector('form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());
  
  // Format datetime for MySQL (for classes)
  if (type === 'class' && data.schedule) {
    data.schedule = new Date(data.schedule)
      .toISOString()
      .slice(0, 19)        // "2025-09-01T17:30:00"
      .replace('T', ' ');  // "2025-09-01 17:30:00"
  }

  showLoading(`Updating ${type}...`);
  try {
    const res = await fetch(apiSingleEndpoint(type, data.id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await res.json();
    hideLoading();
    if (result.success) {
      showAlert(result.message || `${type} updated`, 'success');
      modal.remove();
      reloadCurrentPage();
    } else {
      showAlert(result.message || 'Failed to update', 'error');
    }
  } catch (err) {
    hideLoading();
    console.error('Update error:', err);
    showAlert(`Failed to update ${type}: ${err.message}`, 'error');
  }
});
}

function deleteItem(type, id) {
if(!confirm(`Are you sure you want to delete this ${type}?`)) return;
showLoading(`Deleting ${type}...`);
fetch(apiSingleEndpoint(type, id), { method: 'DELETE' })
.then(r=>r.json())
.then(data=>{
  hideLoading();
  if(data.success){ 
    showAlert(data.message,'success'); 
    reloadCurrentPage(); 
  } else {
    showAlert(data.message,'error');
  }
})
.catch(err=>{ 
  hideLoading(); 
  showAlert(`Failed to delete ${type}`,'error'); 
  console.error(err); 
});
}

function reloadCurrentPage() {
if(currentPage === 'dashboard') loadDashboard();
else if(currentPage === 'members') loadMembers();
else if(currentPage === 'trainers') loadTrainers();
else if(currentPage === 'classes') loadClasses();
else if(currentPage === 'equipment') loadEquipment();
else if(currentPage === 'payments') loadPayments();  
}

// -------------------- ALERTS & LOADING --------------------
function showAlert(msg, type = 'info') {
document.querySelectorAll('.alert').forEach(a => a.remove());
const alert = document.createElement('div');
alert.className = `alert alert-${type}`;
alert.textContent = msg;
alert.style.cssText = `position:fixed;top:20px;right:20px;background:${
  type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'
};color:white;padding:10px 15px;border-radius:5px;z-index:1000;`;
document.body.appendChild(alert);
setTimeout(() => alert.remove(), 4000);
}

function showLoading(msg = 'Loading...') {
let loader = document.getElementById('loading');
if(!loader) {
  loader = document.createElement('div');
  loader.id = 'loading';
  loader.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:9999;color:white;font-size:18px;`;
  loader.innerHTML = `<div class="spinner" style="width:50px;height:50px;border:5px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation: spin 1s linear infinite;"></div><div style="margin-top:15px;">${msg}</div>`;
  document.body.appendChild(loader);
} else { 
  loader.style.display = 'flex'; 
  loader.querySelector('div:nth-child(2)').textContent = msg; 
}
}

function hideLoading() { 
const loader = document.getElementById('loading'); 
if(loader) loader.style.display = 'none'; 
}

// -------------------- PROFILE --------------------
function loadProfile() {
// Load profile data
const adminData = JSON.parse(localStorage.getItem('admin'));
if (adminData) {
  document.getElementById('profile-username').value = adminData.username;
  document.getElementById('profile-email').value = adminData.email;
  document.getElementById('profile-fullname').value = adminData.full_name || '';
}

// Add event listener for profile form
const profileForm = document.getElementById('profile-form');
if (profileForm) {
  profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    showAlert('Profile update functionality would be implemented here', 'info');
  });
}
}