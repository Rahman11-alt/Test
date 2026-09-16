const API_URL = "https://script.google.com/macros/s/AKfycbyC9IcJzn8ob3PqEltUHW-nvvFbQapiIxYVzfIzdLzXBH6EISZAHDSFe1loHrgPpuJrJg/exec"";
let token = sessionStorage.getItem('admin_session') || '';
let currentUser = sessionStorage.getItem('admin_user') || '';
let students=[], teachers=[], classes=[], grades=[], attendance=[];

const $ = id => document.getElementById(id);
const modal = new bootstrap.Modal($('studentModal'));

document.addEventListener('DOMContentLoaded',()=>{
  $('loginForm').addEventListener('submit',login);
  $('logoutBtn').addEventListener('click',logout);
  $('menuBtn').addEventListener('click',()=> $('sidebar').classList.toggle('open'));
  document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
  $('studentForm').addEventListener('submit',saveStudent);
  if(token && API_URL !== 'https://script.google.com/macros/s/AKfycbyC9IcJzn8ob3PqEltUHW-nvvFbQapiIxYVzfIzdLzXBH6EISZAHDSFe1loHrgPpuJrJg/exec"') startApp(); else showLogin();
});

async function api(action,data={}) {
  if(API_URL==='https://script.google.com/macros/s/AKfycbyC9IcJzn8ob3PqEltUHW-nvvFbQapiIxYVzfIzdLzXBH6EISZAHDSFe1loHrgPpuJrJg/exec"') throw new Error('API_URL belum diisi pada script.js.');
  showLoading(true);
  try {
    const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,token,...data})});
    const j=await r.json();
    if(!j.success) throw new Error(j.message||'Operasi gagal');
    return j;
  } catch(e) {
    if(/Sesi|session/i.test(e.message)){logout();}
    throw new Error(e.message==='Failed to fetch'?'Koneksi internet bermasalah. Data belum dapat disimpan.':e.message);
  } finally { showLoading(false); }
}
async function login(e){
  e.preventDefault();
  try{
    const j=await apiNoSession('login',{username:$('username').value,password:$('password').value});
    token=j.token; currentUser=j.user;
    sessionStorage.setItem('admin_session',token); sessionStorage.setItem('admin_user',currentUser);
    $('password').value=''; startApp();
  }catch(err){$('loginMsg').innerHTML=`<div class="alert alert-danger py-2">${esc(err.message)}</div>`;}
}
async function apiNoSession(action,data={}){
  if(API_URL==='[ISI DI SINI]') throw new Error('API_URL belum diisi pada script.js.');
  const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...data})});
  const j=await r.json(); if(!j.success) throw new Error(j.message||'Operasi gagal'); return j;
}
function logout(){sessionStorage.clear();token='';currentUser='';showLogin();}
function showLogin(){$('loginView').classList.remove('d-none');$('appView').classList.add('d-none');}
async function startApp(){ $('loginView').classList.add('d-none');$('appView').classList.remove('d-none');$('userName').textContent=currentUser; await loadAll(); showPage('dashboard');}
async function loadAll(){
  try{
    const [s,t,c,g,a]=await Promise.all([api('getStudents'),api('getTeachers'),api('getClasses'),api('getGrades'),api('getAttendance')]);
    students=s.data||[];teachers=t.data||[];classes=c.data||[];grades=g.data||[];attendance=a.data||[];
    renderCurrent();
  }catch(e){toast(e.message,true);}
}
function showPage(page){
  document.querySelectorAll('.page').forEach(x=>x.classList.add('d-none'));
  $(page+'Page').classList.remove('d-none');
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
  $('sidebar').classList.remove('open');
  renderPage(page);
}
function renderCurrent(){const active=document.querySelector('.nav-item.active');if(active)renderPage(active.dataset.page);}
function renderPage(p){
  if(p==='dashboard')renderDashboard(); if(p==='students')renderStudents(); if(p==='teachers')renderTeachers(); if(p==='classes')renderClasses(); if(p==='grades')renderGrades(); if(p==='attendance')renderAttendance(); if(p==='import')renderImport(); if(p==='export')renderExport(); if(p==='settings')renderSettings();
}
function renderDashboard(){
 const male=students.filter(x=>x['Jenis Kelamin']==='L').length,female=students.filter(x=>x['Jenis Kelamin']==='P').length;
 const today=new Date().toISOString().slice(0,10);
 const hadir=attendance.filter(x=>String(x.Tanggal).startsWith(today)&&String(x['Status Kehadiran']).toLowerCase()==='hadir').length;
 const counts={};students.forEach(s=>counts[s.Kelas||'Belum diisi']=(counts[s.Kelas||'Belum diisi']||0)+1);
 $('dashboardPage').innerHTML=`<div class="page-title"><div><h2>Dashboard</h2><div class="muted">Ringkasan administrasi kelas</div></div></div>
 <div class="row g-3 mb-4">${stat('bi-people','Jumlah Siswa',students.length)}${stat('bi-gender-male','Laki-laki',male)}${stat('bi-gender-female','Perempuan',female)}${stat('bi-check-circle','Hadir Hari Ini',hadir)}</div>
 <div class="row g-3"><div class="col-lg-7"><div class="cardx"><h5>Siswa berdasarkan kelas</h5><div class="table-wrap"><table class="table mt-3"><thead><tr><th>Kelas</th><th>Jumlah</th></tr></thead><tbody>${Object.entries(counts).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join('')||'<tr><td colspan=2 class=empty>Belum ada data</td></tr>'}</tbody></table></div></div></div>
 <div class="col-lg-5"><div class="cardx"><h5>Data siswa terbaru</h5>${students.slice(-5).reverse().map(s=>`<div class="d-flex justify-content-between py-2 border-bottom"><span>${esc(s['Nama Lengkap'])}</span><span class="badge badge-soft">${esc(s.Kelas||'-')}</span></div>`).join('')||'<div class=empty>Belum ada data</div>'}</div></div></div>`;
}
function stat(icon,label,num){return `<div class="col-6 col-xl-3"><div class="stat"><div class="icon"><i class="bi ${icon}"></i></div><div class="muted">${label}</div><div class="num">${num}</div></div></div>`}
function renderStudents(){
 $('studentsPage').innerHTML=`<div class="page-title"><div><h2>Data Siswa</h2><div class="muted">Kelola data siswa tersimpan di Google Sheets</div></div><button class="btn btn-primary" onclick="openStudent()"><i class="bi bi-plus-lg"></i> Tambah Siswa</button></div>
 <div class="cardx"><div class="row g-2 mb-3"><div class="col-md-7"><input id="studentSearch" class="form-control" placeholder="Cari NISN, NIS, nama, kelas, atau orang tua..." oninput="filterStudents()"></div><div class="col-md-3"><select id="studentClassFilter" class="form-select" onchange="filterStudents()"><option value="">Semua Kelas</option>${[...new Set(students.map(s=>s.Kelas).filter(Boolean))].sort().map(x=>`<option>${esc(x)}</option>`).join('')}</select></div><div class="col-md-2"><button class="btn btn-outline-secondary w-100" onclick="renderStudents()">Reset</button></div></div><div id="studentTable"></div></div>`;
 filterStudents();
}
function filterStudents(){
 const q=($('studentSearch')?.value||'').toLowerCase(),k=$('studentClassFilter')?.value||'';
 const rows=students.filter(s=>!k||s.Kelas===k).filter(s=>Object.values(s).join(' ').toLowerCase().includes(q));
 $('studentTable').innerHTML=`<div class="table-wrap"><table class="table table-hover align-middle"><thead><tr><th>No</th><th>NISN</th><th>NIS</th><th>Nama</th><th>L/P</th><th>Tempat Lahir</th><th>Tanggal Lahir</th><th>Kelas</th><th>Orang Tua</th><th>No HP</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.NISN)}</td><td>${esc(s.NIS)}</td><td><strong>${esc(s['Nama Lengkap'])}</strong></td><td>${esc(s['Jenis Kelamin'])}</td><td>${esc(s['Tempat Lahir'])}</td><td>${esc(s['Tanggal Lahir'])}</td><td>${esc(s.Kelas)}</td><td>${esc(s['Nama Ayah'])} / ${esc(s['Nama Ibu'])}</td><td>${esc(s['No HP Orang Tua'])}</td><td><span class="badge badge-soft">${esc(s['Status Siswa'])}</span></td><td><button class="btn btn-sm btn-outline-primary action-btn" onclick='editStudent(${JSON.stringify(s)})'><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-outline-danger action-btn" onclick="deleteStudent('${s.ID}')"><i class="bi bi-trash"></i></button></td></tr>`).join('')||'<tr><td colspan=12 class=empty>Belum ada data</td></tr>'}</tbody></table></div>`;
}
function openStudent(s={}){ $('studentModalTitle').textContent=s.ID?'Edit Siswa':'Tambah Siswa';$('sID').value=s.ID||'';$('sNISN').value=s.NISN||'';$('sNIS').value=s.NIS||'';$('sNama').value=s['Nama Lengkap']||'';$('sJK').value=s['Jenis Kelamin']||'';$('sTempat').value=s['Tempat Lahir']||'';$('sTgl').value=(s['Tanggal Lahir']||'').slice(0,10);$('sKelas').value=s.Kelas||'6';$('sAyah').value=s['Nama Ayah']||'';$('sIbu').value=s['Nama Ibu']||'';$('sHP').value=s['No HP Orang Tua']||'';$('sAlamat').value=s.Alamat||'';$('sStatus').value=s['Status Siswa']||'Aktif';modal.show();}
function editStudent(s){openStudent(s)}
async function saveStudent(e){e.preventDefault();const d={ID:$('sID').value,NISN:$('sNISN').value,NIS:$('sNIS').value,'Nama Lengkap':$('sNama').value,'Jenis Kelamin':$('sJK').value,'Tempat Lahir':$('sTempat').value,'Tanggal Lahir':$('sTgl').value,Kelas:$('sKelas').value,'Nama Ayah':$('sAyah').value,'Nama Ibu':$('sIbu').value,'No HP Orang Tua':$('sHP').value,Alamat:$('sAlamat').value,'Status Siswa':$('sStatus').value};try{const j=await api(d.ID?'updateStudent':'addStudent',d);toast(j.message);modal.hide();await loadAll();showPage('students');}catch(err){toast(err.message,true);}}
async function deleteStudent(id){if(!confirm('Apakah Anda yakin ingin menghapus data ini?'))return;try{const j=await api('deleteStudent',{ID:id});toast(j.message);await loadAll();showPage('students');}catch(e){toast(e.message,true);}}

function renderTeachers(){ $('teachersPage').innerHTML=`<div class="page-title"><div><h2>Data Guru</h2><div class="muted">Data guru dari Google Sheets</div></div></div>${simpleTable(teachers,['NIP/NIK','Nama Guru','Jenis Kelamin','Mata Pelajaran','Jabatan','No HP','Email','Status'])}`;}
function renderClasses(){ $('classesPage').innerHTML=`<div class="page-title"><div><h2>Data Kelas</h2><div class="muted">Data rombel dan wali kelas</div></div></div>${simpleTable(classes,['Nama Kelas','Wali Kelas','Tahun Pelajaran','Jumlah Siswa'])}`;}
function renderGrades(){ $('gradesPage').innerHTML=`<div class="page-title"><div><h2>Nilai</h2><div class="muted">Rekap nilai dari Google Sheets</div></div></div>${simpleTable(grades,['NISN','Nama Siswa','Kelas','Mata Pelajaran','Nilai Tugas','Nilai STS','Nilai SAS','Nilai Akhir','Predikat','Keterangan'])}`;}
function renderAttendance(){ $('attendancePage').innerHTML=`<div class="page-title"><div><h2>Absensi</h2><div class="muted">Data kehadiran siswa</div></div></div>${simpleTable(attendance,['NISN','Nama Siswa','Kelas','Tanggal','Status Kehadiran','Keterangan'])}`;}
function simpleTable(data,cols){return `<div class="cardx"><div class="table-wrap"><table class="table table-hover"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${data.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c])}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${cols.length}" class="empty">Belum ada data</td></tr>`}</tbody></table></div></div>`}
function renderImport(){$('importPage').innerHTML=`<div class="page-title"><div><h2>Import Data Siswa</h2><div class="muted">Excel/CSV → validasi → preview → konfirmasi → Google Sheets</div></div></div><div class="cardx"><p>Kolom template: NISN, NIS, Nama Lengkap, Jenis Kelamin, Tempat Lahir, Tanggal Lahir, Kelas, Nama Ayah, Nama Ibu, No HP Orang Tua, Alamat.</p><input id="importFile" type="file" class="form-control" accept=".xlsx,.xls,.csv" onchange="previewImport(event)"><div id="importPreview" class="mt-3"></div></div>`}
let importRows=[];
function previewImport(e){const f=e.target.files[0];if(!f)return;const reader=new FileReader();reader.onload=ev=>{const wb=XLSX.read(ev.target.result,{type:'array'});const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});importRows=rows;const valid=rows.filter(r=>r.NISN&&r['Nama Lengkap']&&['L','P'].includes(String(r['Jenis Kelamin']).toUpperCase()));$('importPreview').innerHTML=`<div class="alert alert-info">Valid: <strong>${valid.length}</strong> · Bermasalah: <strong>${rows.length-valid.length}</strong></div><div class="table-wrap">${simpleTable(rows.slice(0,20),['NISN','NIS','Nama Lengkap','Jenis Kelamin','Tempat Lahir','Tanggal Lahir','Kelas','Nama Ayah','Nama Ibu','No HP Orang Tua','Alamat'])}</div><button class="btn btn-primary mt-3" onclick="confirmImport()">Konfirmasi Import</button>`};reader.readAsArrayBuffer(f);}
async function confirmImport(){const existing=new Set(students.map(s=>String(s.NISN)));const valid=importRows.filter(r=>r.NISN&&r['Nama Lengkap']&&['L','P'].includes(String(r['Jenis Kelamin']).toUpperCase())&&!existing.has(String(r.NISN)));if(!confirm(`Import ${valid.length} data valid ke Google Sheets?`))return;let ok=0,bad=0;for(const r of valid){try{await api('addStudent',r);ok++}catch(e){bad++}}toast(`Import selesai. Berhasil: ${ok}, gagal: ${bad}`);await loadAll();showPage('students');}
function renderExport(){$('exportPage').innerHTML=`<div class="page-title"><div><h2>Export & Backup</h2><div class="muted">Unduh data yang tersimpan di Google Sheets</div></div></div><div class="row g-3"><div class="col-md-6"><div class="cardx"><h5>Export Excel</h5><p>Semua data utama akan dibuat menjadi satu workbook Excel.</p><button class="btn btn-success" onclick="exportExcel()"><i class="bi bi-file-earmark-excel"></i> Export Excel</button> <button class="btn btn-outline-secondary" onclick="window.print()">Export PDF / Cetak</button></div></div><div class="col-md-6"><div class="cardx"><h5>Backup Database</h5><p>Membuat salinan Google Spreadsheet di Google Drive.</p><button class="btn btn-primary" onclick="backup()"><i class="bi bi-cloud-arrow-down"></i> Backup Database</button></div></div></div>`}
async function exportExcel(){try{const j=await api('exportAll');const wb=XLSX.utils.book_new();Object.entries(j.data).forEach(([name,rows])=>{const ws=XLSX.utils.json_to_sheet(rows);XLSX.utils.book_append_sheet(wb,ws,name.slice(0,31));});XLSX.writeFile(wb,'Administrasi_Kelas_6_2026_2027.xlsx');toast('Export Excel berhasil.');}catch(e){toast(e.message,true);}}
async function backup(){try{const j=await api('backupDatabase');toast(j.message+' '+j.data.url);}catch(e){toast(e.message,true);}}
function renderSettings(){$('settingsPage').innerHTML=`<div class="page-title"><div><h2>Pengaturan</h2><div class="muted">Konfigurasi aplikasi</div></div></div><div class="cardx"><h5>Konfigurasi API</h5><p>URL backend disimpan pada <code>script.js</code> di konstanta <code>API_URL</code>. Jangan memasukkan password administrator ke file frontend.</p><hr><h5>Administrator</h5><p>Username awal: <code>admin</code><br>Nama administrator: <code>Robby</code><br>Password disimpan sebagai hash di Script Properties Google Apps Script.</p></div>`}
function showLoading(v){$('loading').classList.toggle('d-none',!v)}
function toast(msg,error=false){const d=document.createElement('div');d.className='toastx'+(error?' error':'');d.textContent=msg;$('toastArea').appendChild(d);setTimeout(()=>d.remove(),3500)}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
