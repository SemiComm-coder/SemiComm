const SHEET_NAME = 'Subscribers';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action ? e.parameter.action : '').toLowerCase();

  if (action !== 'export') {
    return ContentService.createTextOutput('SemiComm subscriber endpoint is online.');
  }

  const token = e && e.parameter && e.parameter.token ? e.parameter.token : '';
  const expectedToken = PropertiesService.getScriptProperties().getProperty('EXPORT_TOKEN') || '';

  if (!token || token !== expectedToken) {
    return ContentService.createTextOutput('Unauthorized');
  }

  const sheet = getOrCreateSheet_();
  const data = sheet.getDataRange().getDisplayValues();

  if (!data.length) {
    return ContentService.createTextOutput('timestamp,email,source,scope,page,referrer,userAgent');
  }

  const csv = data
    .map((row) => row.map((value) => escapeCsv_(value)).join(','))
    .join('\n');

  return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.CSV);
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const email = ((payload.email || '') + '').trim().toLowerCase();

    if (!isValidEmail_(email)) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'invalid_email' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getOrCreateSheet_();
    const allRows = sheet.getDataRange().getValues();
    const normalizedEmail = email.toLowerCase();

    const record = [
      new Date(),
      normalizedEmail,
      ((payload.source || '') + '').trim(),
      ((payload.scope || '') + '').trim(),
      ((payload.page || '') + '').trim(),
      ((payload.referrer || '') + '').trim(),
      ((payload.userAgent || '') + '').trim()
    ];

    let existingRowNumber = -1;

    for (let i = 1; i < allRows.length; i += 1) {
      const existingEmail = ((allRows[i][1] || '') + '').trim().toLowerCase();
      if (existingEmail === normalizedEmail) {
        existingRowNumber = i + 1;
        break;
      }
    }

    if (existingRowNumber > 0) {
      sheet.getRange(existingRowNumber, 1, 1, record.length).setValues([record]);
    } else {
      sheet.appendRow(record);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(['timestamp', 'email', 'source', 'scope', 'page', 'referrer', 'userAgent']);
  }

  return sheet;
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeCsv_(value) {
  const text = String(value || '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}
