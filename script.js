const testcaseForm = document.getElementById('testcase-form');
const moduleInput = document.getElementById('module-name');
const submoduleInput = document.getElementById('submodule-name');
const totalCountInput = document.getElementById('total-count-input');
const passCountInput = document.getElementById('pass-count-input');
const failCountInput = document.getElementById('fail-count-input');
const onholdCountInput = document.getElementById('onhold-count-input');
const pendingCountInput = document.getElementById('pending-count-input');
const commentInput = document.getElementById('comment-text');
const formMessage = document.getElementById('form-message');
const testcaseTableBody = document.querySelector('#testcase-table tbody');
const totalCountEl = document.getElementById('total-count');
const submoduleTotalCountEl = document.getElementById('submodule-total-count');
const passCountEl = document.getElementById('pass-count');
const failCountEl = document.getElementById('fail-count');
const onholdCountEl = document.getElementById('onhold-count');
const pendingCountEl = document.getElementById('pending-count');
const exportButton = document.getElementById('export-json');
const exportExcelButton = document.getElementById('export-excel');

const records = [];

function toCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function getStatus(record) {
  if (record.total > 0 && record.pass === record.total) {
    return 'Pass';
  }

  if (record.fail > 0) {
    return 'Fail';
  }

  if (record.onhold > 0) {
    return 'On Hold';
  }

  if (record.pending > 0) {
    return 'Pending';
  }

  return 'Pending';
}

function groupByModule() {
  return records.reduce((groups, record) => {
    const key = record.module;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(record);
    return groups;
  }, {});
}

function getModuleStatus(summary) {
  if (summary.total > 0 && summary.pass === summary.total) {
    return 'Pass';
  }

  if (summary.fail > 0) {
    return 'Fail';
  }

  if (summary.onhold > 0) {
    return 'On Hold';
  }

  if (summary.pending > 0) {
    return 'Pending';
  }

  return 'Pending';
}

function createModuleHeaderRow(moduleName, moduleSummary) {
  const status = getModuleStatus(moduleSummary);
  const tr = document.createElement('tr');
  tr.className = 'module-header-row';
  tr.innerHTML = `
    <td colspan="10">
      <strong>${moduleName}</strong>
      <span class="module-header-meta">Total: ${moduleSummary.total} | Pass: ${moduleSummary.pass} | Fail: ${moduleSummary.fail} | On Hold: ${moduleSummary.onhold} | Pending: ${moduleSummary.pending} | Status: ${status}</span>
    </td>
  `;
  return tr;
}

function createRow(record, index) {
  const status = getStatus(record);
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${record.module}</td>
    <td>${record.submodule}</td>
    <td>${record.total}</td>
    <td class="status-pass">${record.pass}</td>
    <td class="status-fail">${record.fail}</td>
    <td class="status-onhold">${record.onhold}</td>
    <td class="status-pending">${record.pending}</td>
    <td>${status}</td>
    <td>${record.comments || '-'}</td>
    <td><button class="remove-button" data-index="${index}">Remove</button></td>
  `;
  return tr;
}

function updateTable() {
  testcaseTableBody.innerHTML = '';

  if (!records.length) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="10" class="empty-state">Add a module and submodule total to begin tracking progress.</td>';
    testcaseTableBody.appendChild(emptyRow);
    return;
  }

  const groupedRecords = groupByModule();
  Object.entries(groupedRecords).forEach(([moduleName, moduleRecords]) => {
    const moduleSummary = moduleRecords.reduce(
      (summary, record) => {
        summary.total += record.total;
        summary.pass += record.pass;
        summary.fail += record.fail;
        summary.onhold += record.onhold;
        summary.pending += record.pending;
        return summary;
      },
      {
        total: 0,
        pass: 0,
        fail: 0,
        onhold: 0,
        pending: 0,
      },
    );

    testcaseTableBody.appendChild(createModuleHeaderRow(moduleName, moduleSummary));
    moduleRecords.forEach((record) => {
      const index = records.indexOf(record);
      testcaseTableBody.appendChild(createRow(record, index));
    });
  });
}

function summarize() {
  return records.reduce(
    (summary, record) => {
      summary.totalSubmodules += 1;
      summary.total += record.total;
      summary.pass += record.pass;
      summary.fail += record.fail;
      summary.onhold += record.onhold;
      summary.pending += record.pending;
      return summary;
    },
    {
      totalSubmodules: 0,
      total: 0,
      pass: 0,
      fail: 0,
      onhold: 0,
      pending: 0,
    },
  );
}

function updateSummaryUI(summary) {
  totalCountEl.textContent = summary.totalSubmodules;
  submoduleTotalCountEl.textContent = summary.total;
  passCountEl.textContent = summary.pass;
  failCountEl.textContent = summary.fail;
  onholdCountEl.textContent = summary.onhold;
  pendingCountEl.textContent = summary.pending;
}

function parseTestcaseForm(event) {
  event.preventDefault();

  const pass = toCount(passCountInput.value);
  const fail = toCount(failCountInput.value);
  const onhold = toCount(onholdCountInput.value);
  const pending = toCount(pendingCountInput.value);
  const total = toCount(totalCountInput.value);
  const enteredTotal = pass + fail + onhold + pending;

  if (enteredTotal > total) {
    formMessage.textContent = 'We cannot save this record because Pass + Fail + On Hold + Pending is greater than Total.';
    formMessage.classList.add('error');
    return;
  }

  formMessage.textContent = '';
  formMessage.classList.remove('error');

  const record = {
    module: moduleInput.value.trim(),
    submodule: submoduleInput.value.trim(),
    pass,
    fail,
    onhold,
    pending,
    total,
    comments: commentInput.value.trim(),
  };

  if (!record.module || !record.submodule || Number.isNaN(total)) {
    return;
  }

  records.push(record);
  moduleInput.value = '';
  submoduleInput.value = '';
  totalCountInput.value = '';
  passCountInput.value = '0';
  failCountInput.value = '0';
  onholdCountInput.value = '0';
  pendingCountInput.value = '0';
  commentInput.value = '';

  refreshDashboard();
}

function refreshDashboard() {
  updateTable();
  updateSummaryUI(summarize());
}

function exportSummary() {
  const summary = summarize();
  const payload = {
    generatedAt: new Date().toISOString(),
    summary,
    records,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'module-submodule-totals.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getModuleSummaries() {
  const groupedRecords = groupByModule();
  return Object.entries(groupedRecords).map(([moduleName, moduleRecords]) => {
    const summary = moduleRecords.reduce(
      (accumulator, record) => {
        accumulator.total += record.total;
        accumulator.pass += record.pass;
        accumulator.fail += record.fail;
        accumulator.onhold += record.onhold;
        accumulator.pending += record.pending;
        return accumulator;
      },
      {
        total: 0,
        pass: 0,
        fail: 0,
        onhold: 0,
        pending: 0,
      },
    );

    return {
      module: moduleName,
      submodules: moduleRecords.map((record) => record.submodule).join(', '),
      total: summary.total,
      pass: summary.pass,
      fail: summary.fail,
      onhold: summary.onhold,
      pending: summary.pending,
      status: getModuleStatus(summary),
    };
  });
}

async function downloadExcel() {
  if (!records.length) {
    formMessage.textContent = 'Add at least one record before downloading Excel.';
    formMessage.classList.add('error');
    return;
  }

  try {
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
    const moduleSheetData = getModuleSummaries();
    const detailSheetData = records.map((record) => ({
      Module: record.module,
      Submodule: record.submodule,
      Total: record.total,
      Pass: record.pass,
      Fail: record.fail,
      'On Hold': record.onhold,
      Pending: record.pending,
      Status: getStatus(record),
      Comments: record.comments || '-',
    }));

    const workbook = XLSX.utils.book_new();
    const moduleSheet = XLSX.utils.json_to_sheet(moduleSheetData);
    const detailSheet = XLSX.utils.json_to_sheet(detailSheetData);

    XLSX.utils.book_append_sheet(workbook, moduleSheet, 'Module Summary');
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'Submodule Details');

    formMessage.textContent = '';
    formMessage.classList.remove('error');
    XLSX.writeFile(workbook, 'module-status-tracker.xlsx');
  } catch (error) {
    formMessage.textContent = 'Excel download is unavailable right now. Please try again.';
    formMessage.classList.add('error');
  }
}

function removeRecord(event) {
  if (!event.target.matches('.remove-button')) {
    return;
  }

  const index = Number(event.target.dataset.index);
  if (!Number.isNaN(index)) {
    records.splice(index, 1);
    refreshDashboard();
  }
}

function init() {
  testcaseForm.addEventListener('submit', parseTestcaseForm);
  testcaseTableBody.addEventListener('click', removeRecord);
  exportButton.addEventListener('click', exportSummary);
  exportExcelButton.addEventListener('click', downloadExcel);
  refreshDashboard();
}

init();