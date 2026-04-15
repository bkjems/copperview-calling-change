var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzFkhiIYgxUqWKyyAwSKcW864MLgczgh_DhDYTtDQKU91tFxVwWSBmPLUDz-B2kWD2O/exec';

// Build ward-to-building map from config
var wardBuildingMap = {};
CONFIG.buildings.forEach(function(b) {
  b.wards.forEach(function(w) {
    wardBuildingMap[w] = b.name;
  });
});

// Populate title
document.getElementById('stakeName').textContent = CONFIG.stakeName;
document.title = CONFIG.stakeName + ' — Calling Change';

// Populate ward dropdown (sorted)
var wardSelect = document.querySelector('select[name="ward"]');
var allWards = [];
CONFIG.buildings.forEach(function(b) {
  b.wards.forEach(function(w) { allWards.push(w); });
});
allWards.sort(function(a, b) {
  return parseInt(a) - parseInt(b);
});
allWards.forEach(function(w) {
  var opt = document.createElement('option');
  opt.value = w;
  opt.textContent = w;
  wardSelect.appendChild(opt);
});

// Populate building dropdown
var buildingSelect = document.querySelector('select[name="building"]');
CONFIG.buildings.forEach(function(b) {
  var opt = document.createElement('option');
  opt.value = b.name;
  opt.textContent = b.name;
  buildingSelect.appendChild(opt);
});

function autoSelectBuilding(ward) {
  var building = document.querySelector('select[name="building"]');
  building.value = wardBuildingMap[ward] || "";
}

function confirmCancel() {
  var form = document.getElementById('callingChangeForm');
  var hasInput = form.ward.value || form.building.value || form.changeType.value || form.bulkChanges.value;
  if (!hasInput || confirm('Are you sure you want to clear the form?')) {
    form.reset();
    document.getElementById('message').textContent = '';
  }
}

function toggleMode() {
  document.body.classList.toggle('light');
  var btn = document.getElementById('modeToggle');
  btn.innerHTML = document.body.classList.contains('light') ? '&#9789;' : '&#9728;';
}

document.getElementById('callingChangeForm').addEventListener('submit', function(ev) {
  ev.preventDefault();
  var form = ev.target;

  form.bulkChanges.value = form.bulkChanges.value.trim();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  var msg = document.getElementById('message');
  function showError(text) {
    msg.style.color = '#f44336';
    msg.textContent = text;
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  var data = {
    type: 'callingChange',
    ward: form.ward.value,
    building: form.building.value,
    changeType: form.changeType.value,
    bulkChanges: form.bulkChanges.value
  };

  var submitBtn = form.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  msg.textContent = '';

  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(JSON.stringify(data))
  })
  .then(function() {
    msg.style.color = '#4caf50';
    msg.textContent = 'Calling change request submitted successfully!';
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Request';
    setTimeout(function() { msg.textContent = ''; }, 7000);
  })
  .catch(function(err) {
    showError('Error: ' + err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Request';
  });
});
