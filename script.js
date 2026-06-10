const testcaseForm = document.getElementById('testcase-form');
const projectNameInput = document.getElementById('project-name');
const projectDisplay = document.getElementById('project-display');
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

function readOptionalCount(input) {
  const rawValue = input.value.trim();
  if (rawValue === '') {
    return null;
  }

  const number = Number(rawValue);
  return Number.isFinite(number) && number >= 0 ? number : NaN;
}

function toCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function setFormError(message) {
  formMessage.textContent = message;
  formMessage.classList.add('error');
}

function clearFormError() {
  formMessage.textContent = '';
  formMessage.classList.remove('error');
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

  const projectName = projectNameInput.value.trim();
  if (!projectName) {
    setFormError('Project Name is required.');
    return;
  }

  const total = readOptionalCount(totalCountInput);
  const pass = readOptionalCount(passCountInput);
  const fail = readOptionalCount(failCountInput);
  const onhold = readOptionalCount(onholdCountInput);
  const pending = readOptionalCount(pendingCountInput);

  const values = { total, pass, fail, onhold, pending };
  if (Object.values(values).some((value) => Number.isNaN(value))) {
    setFormError('Enter valid non-negative numbers only.');
    return;
  }

  const blanks = Object.entries(values)
    .filter(([, value]) => value === null)
    .map(([key]) => key);

  if (blanks.length > 1) {
    setFormError('Leave only one field blank so the app can calculate it.');
    return;
  }

  const presentSum = [pass, fail, onhold, pending].reduce((sum, value) => sum + (value ?? 0), 0);

  if (blanks.length === 1) {
    const missingKey = blanks[0];
    if (missingKey === 'total') {
      values.total = presentSum;
    } else {
      if (total === null) {
        setFormError('Enter Total when leaving one status count blank.');
        return;
      }

      const missingValue = total - (presentSum - (values[missingKey] ?? 0));
      if (missingValue < 0) {
        setFormError('Counts exceed Total.');
        return;
      }

      values[missingKey] = missingValue;
    }
  } else if (total === null) {
    values.total = presentSum;
  } else if (total !== presentSum) {
    setFormError('Total must equal Pass + Fail + On Hold + Pending. Leave one field blank to auto-calculate it.');
    return;
  }

  clearFormError();

  const record = {
    project: projectName,
    module: moduleInput.value.trim(),
    submodule: submoduleInput.value.trim(),
    total: values.total,
    pass: values.pass,
    fail: values.fail,
    onhold: values.onhold,
    pending: values.pending,
    comments: commentInput.value.trim(),
  };

  if (!record.module || !record.submodule || Number.isNaN(record.total)) {
    return;
  }

  records.push(record);
  moduleInput.value = '';
  submoduleInput.value = '';
  totalCountInput.value = '';
  passCountInput.value = '';
  failCountInput.value = '';
  onholdCountInput.value = '';
  pendingCountInput.value = '';
  commentInput.value = '';

  refreshDashboard();
}

function refreshDashboard() {
  updateTable();
  updateSummaryUI(summarize());
}

function exportSummary() {
  const projectName = projectNameInput.value.trim();
  if (!projectName) {
    setFormError('Project Name is required.');
    return;
  }

  const summary = summarize();
  const payload = {
    projectName,
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
  const projectName = projectNameInput.value.trim();
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
      project: projectName,
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
    setFormError('Add at least one record before downloading Excel.');
    return;
  }

  try {
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
    const projectName = projectNameInput.value.trim();
    if (!projectName) {
      setFormError('Project Name is required.');
      return;
    }

    const groupedRecords = groupByModule();
    const summaryRows = [[`Project: ${projectName}`], [], ['Module', 'Submodule', 'Total', 'Pass', 'Fail', 'On Hold', 'Pending', 'Status', 'Comments']];
    const summaryMerges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

    Object.entries(groupedRecords).forEach(([moduleName, moduleRecords]) => {
      const moduleHeaderRowIndex = summaryRows.length;
      summaryRows.push([moduleName, '', '', '', '', '', '', '', '']);
      summaryMerges.push({ s: { r: moduleHeaderRowIndex, c: 0 }, e: { r: moduleHeaderRowIndex, c: 8 } });

      moduleRecords.forEach((record) => {
        summaryRows.push(['', record.submodule, record.total, record.pass, record.fail, record.onhold, record.pending, getStatus(record), record.comments || '-']);
      });
    });

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    summarySheet['!merges'] = summaryMerges;

    if (summarySheet['A1']) {
      summarySheet['A1'].s = {
        alignment: { horizontal: 'center', vertical: 'center' },
        font: { bold: true, sz: 14 },
      };
    }

    summaryMerges.slice(1).forEach((merge) => {
      const cellRef = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
      if (summarySheet[cellRef]) {
        summarySheet[cellRef].s = {
          alignment: { horizontal: 'center', vertical: 'center' },
          font: { bold: true },
        };
      }
    });

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    formMessage.textContent = '';
    formMessage.classList.remove('error');
    XLSX.writeFile(workbook, 'module-status-tracker.xlsx');
  } catch (error) {
    setFormError('Excel download is unavailable right now. Please try again.');
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
  projectNameInput.addEventListener('input', () => {
    const projectName = projectNameInput.value.trim();
    projectDisplay.textContent = projectName || 'Untitled Project';
    document.title = projectName ? `${projectName} - Module Status Tracker` : 'Module Status Tracker';
  });
  projectDisplay.textContent = projectNameInput.value.trim() || 'Untitled Project';
  refreshDashboard();
}

init();