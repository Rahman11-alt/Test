const SHEETS = {
  SISWA: 'SISWA',
  GURU: 'GURU',
  KELAS: 'KELAS',
  NILAI: 'NILAI',
  ABSENSI: 'ABSENSI',
  LOG: 'LOG'
};

const HEADERS = {
  SISWA: ['ID','NISN','NIS','Nama Lengkap','Jenis Kelamin','Tempat Lahir','Tanggal Lahir','Kelas','Nama Ayah','Nama Ibu','No HP Orang Tua','Alamat','Status Siswa','Tanggal Input','Terakhir Diubah'],
  GURU: ['ID','NIP/NIK','Nama Guru','Jenis Kelamin','Mata Pelajaran','Jabatan','No HP','Email','Status'],
  KELAS: ['ID','Nama Kelas','Wali Kelas','Tahun Pelajaran','Jumlah Siswa'],
  NILAI: ['ID','NISN','Nama Siswa','Kelas','Mata Pelajaran','Nilai Tugas','Nilai STS','Nilai SAS','Nilai Akhir','Predikat','Keterangan'],
  ABSENSI: ['ID','NISN','Nama Siswa','Kelas','Tanggal','Status Kehadiran','Keterangan'],
  LOG: ['Timestamp','User','Aktivitas','Data','Status']
};

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'health';
    if (action === 'health') return jsonResponse({success:true,message:'API aktif'});
    const token = e.parameter.token || '';
    requireSession_(token);
    return handleAction_(action, e.parameter);
  } catch (err) {
    return jsonResponse({success:false,message:err.message || 'Terjadi kesalahan'});
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action || '';
    if (action === 'login') return login_(body);
    if (action === 'setup') return setup_(body);
    requireSession_(body.token);
    return handleAction_(action, body);
  } catch (err) {
    return jsonResponse({success:false,message:err.message || 'Terjadi kesalahan'});
  }
}

function handleAction_(action, data) {
  switch (action) {
    case 'getDashboard': return getDashboard_(data);
    case 'getStudents': return getStudents_(data);
    case 'addStudent': return addStudent_(data);
    case 'updateStudent': return updateStudent_(data);
    case 'deleteStudent': return deleteStudent_(data);
    case 'getTeachers': return getTeachers_(data);
    case 'addTeacher': return addTeacher_(data);
    case 'updateTeacher': return updateTeacher_(data);
    case 'deleteTeacher': return deleteTeacher_(data);
    case 'getClasses': return getClasses_(data);
    case 'getGrades': return getGrades_(data);
    case 'addGrade': return addGrade_(data);
    case 'updateGrade': return updateGrade_(data);
    case 'deleteGrade': return deleteGrade_(data);
    case 'getAttendance': return getAttendance_(data);
    case 'addAttendance': return addAttendance_(data);
    case 'exportAll': return exportAll_(data);
    case 'backupDatabase': return backupDatabase_(data);
    default: throw new Error('Aksi API tidak dikenal: ' + action);
  }
}

function setup_() {
  throw new Error('Setup dilakukan dari fungsi setupAdmin() di Apps Script, bukan dari frontend.');
}

function setupAdmin() {
  const props = PropertiesService.getScriptProperties();
  const username = 'admin';
  const password = 'admin123';
  
  props.setProperties({
    ADMIN_USERNAME: username,
    ADMIN_PASSWORD_HASH: hash_(password),
    ADMIN_NAME: 'Robby'
  }, true);
  
  setupDatabase();
  Logger.log('Administrator dan database awal berhasil disiapkan dengan password admin123.');
}

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach(function(key) {
    let sh = ss.getSheetByName(SHEETS[key]);
    if (!sh) sh = ss.insertSheet(SHEETS[key]);
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS[key]);
    else {
      const current = sh.getRange(1,1,1,HEADERS[key].length).getValues()[0];
      if (current.join('|') !== HEADERS[key].join('|')) {
        sh.getRange(1,1,1,HEADERS[key].length).setValues([HEADERS[key]]);
      }
    }
    sh.setFrozenRows(1);
  });
}

function login_(body) {
  const props = PropertiesService.getScriptProperties();
  const username = props.getProperty('ADMIN_USERNAME') || 'admin';
  const hash = props.getProperty('ADMIN_PASSWORD_HASH') || hash_('admin123');

  if (String(body.username || '') !== username || hash_(String(body.password || '')) !== hash) {
    writeLog_('Gagal Login', String(body.username || ''), 'GAGAL');
    throw new Error('Username atau password salah.');
  }
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('session_' + token, JSON.stringify({
    user: props.getProperty('ADMIN_NAME') || 'Robby',
    username: username,
    created: Date.now()
  }), 21600);
  writeLog_('Login', username, 'BERHASIL');
  return jsonResponse({success:true,message:'Login berhasil',token:token,user:props.getProperty('ADMIN_NAME') || 'Robby'});
}

function requireSession_(token) {
  if (!token) throw new Error('Sesi tidak ditemukan. Silakan login kembali.');
  const raw = CacheService.getScriptCache().get('session_' + token);
  if (!raw) throw new Error('Sesi berakhir. Silakan login kembali.');
  return JSON.parse(raw);
}

function getDashboard_(data) {
  const students = readObjects_(SHEETS.SISWA);
  const today = formatDate_(new Date());
  const attendance = readObjects_(SHEETS.ABSENSI).filter(r => String(r.Tanggal) === today);
  const classes = {};
  students.forEach(s => { const k = s.Kelas || 'Belum diisi'; classes[k] = (classes[k] || 0) + 1; });
  return jsonResponse({success:true,data:{
    totalStudents: students.length,
    male: students.filter(s => s['Jenis Kelamin'] === 'L').length,
    female: students.filter(s => s['Jenis Kelamin'] === 'P').length,
    presentToday: attendance.filter(a => String(a['Status Kehadiran']).toLowerCase() === 'hadir').length,
    classes: classes,
    latest: students.slice(-5).reverse()
  }});
}

function getStudents_() { return jsonResponse({success:true,data:readObjects_(SHEETS.SISWA)}); }
function getTeachers_() { return jsonResponse({success:true,data:readObjects_(SHEETS.GURU)}); }
function getClasses_() { return jsonResponse({success:true,data:readObjects_(SHEETS.KELAS)}); }
function getGrades_() { return jsonResponse({success:true,data:readObjects_(SHEETS.NILAI)}); }
function getAttendance_() { return jsonResponse({success:true,data:readObjects_(SHEETS.ABSENSI)}); }

function addStudent_(d) {
  validateStudent_(d);
  const rows = readObjects_(SHEETS.SISWA);
  if (rows.some(r => String(r.NISN) === String(d.NISN))) throw new Error('NISN sudah terdaftar.');
  const now = new Date();
  const row = [
    id_(), clean_(d.NISN), clean_(d.NIS), clean_(d['Nama Lengkap']), clean_(d['Jenis Kelamin']),
    clean_(d['Tempat Lahir']), clean_(d['Tanggal Lahir']), clean_(d.Kelas), clean_(d['Nama Ayah']),
    clean_(d['Nama Ibu']), clean_(d['No HP Orang Tua']), clean_(d.Alamat), clean_(d['Status Siswa'] || 'Aktif'),
    now, now
  ];
  append_(SHEETS.SISWA, row);
  writeLog_('Tambah Siswa', d['Nama Lengkap'], 'BERHASIL');
  return jsonResponse({success:true,message:'Data berhasil disimpan.',data:objectFromHeader_(HEADERS.SISWA,row)});
}

function updateStudent_(d) {
  validateStudent_(d);
  const found = findRowById_(SHEETS.SISWA, d.ID);
  if (!found) throw new Error('Data siswa tidak ditemukan.');
  const rows = readObjects_(SHEETS.SISWA);
  if (rows.some(r => String(r.NISN) === String(d.NISN) && String(r.ID) !== String(d.ID))) throw new Error('NISN sudah digunakan siswa lain.');
  const old = found.values;
  const row = [
    old[0], clean_(d.NISN), clean_(d.NIS), clean_(d['Nama Lengkap']), clean_(d['Jenis Kelamin']),
    clean_(d['Tempat Lahir']), clean_(d['Tanggal Lahir']), clean_(d.Kelas), clean_(d['Nama Ayah']),
    clean_(d['Nama Ibu']), clean_(d['No HP Orang Tua']), clean_(d.Alamat), clean_(d['Status Siswa'] || 'Aktif'),
    old[13] || new Date(), new Date()
  ];
  found.sheet.getRange(found.row,1,1,row.length).setValues([row]);
  writeLog_('Edit Siswa', d['Nama Lengkap'], 'BERHASIL');
  return jsonResponse({success:true,message:'Data berhasil diubah.',data:objectFromHeader_(HEADERS.SISWA,row)});
}

function deleteStudent_(d) {
  const found = findRowById_(SHEETS.SISWA, d.ID);
  if (!found) throw new Error('Data siswa tidak ditemukan.');
  found.sheet.deleteRow(found.row);
  writeLog_('Hapus Siswa', d.ID, 'BERHASIL');
  return jsonResponse({success:true,message:'Data berhasil dihapus.'});
}

function addTeacher_(d) { return genericAdd_(SHEETS.GURU, d, 'Tambah Guru'); }
function updateTeacher_(d) { return genericUpdate_(SHEETS.GURU, d, 'Edit Guru'); }
function deleteTeacher_(d) { return genericDelete_(SHEETS.GURU, d.ID, 'Hapus Guru'); }
function addGrade_(d) { return genericAdd_(SHEETS.NILAI, d, 'Tambah Nilai'); }
function updateGrade_(d) { return genericUpdate_(SHEETS.NILAI, d, 'Edit Nilai'); }
function deleteGrade_(d) { return genericDelete_(SHEETS.NILAI, d.ID, 'Hapus Nilai'); }
function addAttendance_(d) { return genericAdd_(SHEETS.ABSENSI, d, 'Tambah Absensi'); }

function genericAdd_(sheetName, d, activity) {
  const h = HEADERS[Object.keys(SHEETS).find(k => SHEETS[k] === sheetName)];
  const row = h.map(k => k === 'ID' ? id_() : clean_(d[k] || ''));
  if (sheetName === SHEETS.NILAI) {
    const tugas = num_(d['Nilai Tugas']), sts = num_(d['Nilai STS']), sas = num_(d['Nilai SAS']);
    const akhir = Math.round(((tugas + sts + sas) / 3) * 100) / 100;
    row[h.indexOf('Nilai Akhir')] = akhir;
    row[h.indexOf('Predikat')] = predicate_(akhir);
  }
  append_(sheetName, row);
  writeLog_(activity, JSON.stringify(d), 'BERHASIL');
  return jsonResponse({success:true,message:'Data berhasil disimpan.',data:objectFromHeader_(h,row)});
}

function genericUpdate_(sheetName, d, activity) {
  const found = findRowById_(sheetName, d.ID);
  if (!found) throw new Error('Data tidak ditemukan.');
  const h = HEADERS[Object.keys(SHEETS).find(k => SHEETS[k] === sheetName)];
  const old = found.values;
  const row = h.map((k,i) => k === 'ID' ? old[i] : clean_(d[k] !== undefined ? d[k] : old[i]));
  if (sheetName === SHEETS.NILAI) {
    const tugas = num_(d['Nilai Tugas']), sts = num_(d['Nilai STS']), sas = num_(d['Nilai SAS']);
    const akhir = Math.round(((tugas + sts + sas) / 3) * 100) / 100;
    row[h.indexOf('Nilai Akhir')] = akhir;
    row[h.indexOf('Predikat')] = predicate_(akhir);
  }
  found.sheet.getRange(found.row,1,1,row.length).setValues([row]);
  writeLog_(activity, JSON.stringify(d), 'BERHASIL');
  return jsonResponse({success:true,message:'Data berhasil diubah.',data:objectFromHeader_(h,row)});
}

function genericDelete_(sheetName, id, activity) {
  const found = findRowById_(sheetName, id);
  if (!found) throw new Error('Data tidak ditemukan.');
  found.sheet.deleteRow(found.row);
  writeLog_(activity, id, 'BERHASIL');
  return jsonResponse({success:true,message:'Data berhasil dihapus.'});
}

function exportAll_() {
  const out = {};
  Object.keys(SHEETS).forEach(k => { out[SHEETS[k]] = readObjects_(SHEETS[k]); });
  writeLog_('Export', 'Semua data', 'BERHASIL');
  return jsonResponse({success:true,message:'Data siap diekspor.',data:out});
}

function backupDatabase_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const file = DriveApp.getFileById(ss.getId());
  const copy = file.makeCopy('BACKUP_' + ss.getName() + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss'));
  writeLog_('Backup Database', copy.getName(), 'BERHASIL');
  return jsonResponse({success:true,message:'Backup berhasil dibuat di Google Drive.',data:{name:copy.getName(),url:copy.getUrl()}});
}

function validateStudent_(d) {
  if (!String(d.NISN || '').trim()) throw new Error('NISN wajib diisi.');
  if (!String(d['Nama Lengkap'] || '').trim()) throw new Error('Nama lengkap wajib diisi.');
  if (!['L','P'].includes(String(d['Jenis Kelamin'] || ''))) throw new Error('Jenis kelamin harus L atau P.');
}

function readObjects_(sheetName) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()).getValues();
  const headers = values.shift();
  return values.filter(r => r.some(v => v !== '')).map(r => objectFromHeader_(headers,r));
}

function objectFromHeader_(headers,row) {
  const o = {};
  headers.forEach((h,i) => o[h] = serialize_(row[i]));
  return o;
}

function findRowById_(sheetName,id) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return null;
  const values = sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  for (let i=0;i<values.length;i++) if (String(values[i][0]) === String(id)) return {sheet:sh,row:i+2,values:values[i]};
  return null;
}

function append_(sheetName,row) {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName).appendRow(row);
}

function writeLog_(activity,data,status) {
  try {
    const user = PropertiesService.getScriptProperties().getProperty('ADMIN_NAME') || 'Robby';
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.LOG).appendRow([new Date(),user,activity,String(data),status]);
  } catch(e) {}
}

function id_() { return Utilities.getUuid(); }
function hash_(s) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8));
}
function clean_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function num_(v) { const n = Number(v); return isNaN(n) ? 0 : n; }
function predicate_(n) { return n >= 90 ? 'A' : n >= 80 ? 'B' : n >= 70 ? 'C' : 'D'; }
function formatDate_(d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
function serialize_(v) { return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : v; }
function jsonResponse(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
