// Constantes: REEMPLAZA CON EL ID DE LA CARPETA RAÍZ DONDE SE GUARDARÁN LOS CASOS
const FOLDER_RAIZ_ID = "19qvtcnwp2Ec4g3iu9dCNleZTz22zArBY";

function doPost(e) {
  // Configurar encabezados CORS y de respuesta
  const output = { setContent: function(x) { return x; }, setMimeType: function(x) { return this; } };
  const ContentService = { createTextOutput: function() { return output; }, MimeType: { JSON: "JSON" } };
  const SpreadsheetApp = { getActiveSpreadsheet: function() {} };
  const LockService = { getScriptLock: function() { return { waitLock: function(){}, releaseLock: function(){} } } };
  
  output.setMimeType(ContentService.MimeType.JSON);
  
  if (!e.postData || !e.postData.contents) {
    return output.setContent(JSON.stringify({ success: false, error: "No data received" }));
  }

  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return output.setContent(JSON.stringify({ success: false, error: "Invalid JSON" }));
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (payload.accion === "LISTAR_CASOS") {
    try {
      return output.setContent(JSON.stringify({ success: true, data: [] }));
    } catch (err) {
      return output.setContent(JSON.stringify({ success: false, error: err.toString() }));
    }
  }

  // =========================================================
  // --- INSERCIÓN GENÉRICA FINAL PARA OTRAS TABLAS ---
  // =========================================================
  const lock2 = LockService.getScriptLock();
  try {
    lock2.waitLock(10000); 
    let sheet = spreadsheet.getSheetByName(payload.tabla);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(payload.tabla);
      sheet.appendRow(Object.keys(payload.datos));
    }
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(header => {
      let value = payload.datos[header] !== undefined ? payload.datos[header] : "";
      return (typeof value === 'object') ? JSON.stringify(value) : value;
    });
    sheet.appendRow(row);
    return output.setContent(JSON.stringify({ success: true }));
  } catch (err) {
    return output.setContent(JSON.stringify({ success: false, error: err.toString() }));
  } finally {
    lock2.releaseLock();
  }
}
