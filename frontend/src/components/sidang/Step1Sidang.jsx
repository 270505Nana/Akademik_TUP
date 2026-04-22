
import { Search, User, GraduationCap, Calendar, Mail, FileText, CheckCircle2, ChevronLeft, ChevronRight, Download, UploadCloud, Info, AlertTriangle, Check } from 'lucide-react';
import { useSidangContext } from '../../context/SidangFormContext';

export default function Step1() {
  const { state, dispatch } = useSidangContext();
  const { data } = state;

  const updateField = (field, value) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  const programs = ['Reguler', 'Alih Jenjang'];
  const skemas = ['Sidang Reguler', 'Non Sidang', 'Capstone', 'Sidang Khusus Prodi'];
  const periodes = ['Periode 1 - 2024', 'Periode 2 - 2024', 'Periode 3 - 2024'];
  const jalurNonSidangOptions = ['Publikasi Jurnal', 'Proceeding International', 'HKI'];
  
  const toggleJalurNonSidang = (option) => {
    const current = data.jalurNonSidang || [];
    const next = current.includes(option) 
      ? current.filter(i => i !== option) 
      : [...current, option];
    updateField('jalurNonSidang', next);
  };
  const keilmuans = [
    'Electronics and Telecommunications Science',
    'Industrial Systems Engineering',
    'Media, Design and Creative Innovation',
    'Applied Artificial Intelligence',
    'Information System, Digital Business & Data Driven Solution',
    'Cyber Security, IOT, and Cloud System',
    'Data Science and Optimization',
    'Bioengineering, Food Technology and Advance Material',
    'Software Engineering and Multimedia'
  ];

  return (
    <div className="step-content">
      <div className="info-banner">
        <div className="banner-icon-container">
          <Info color="#d69e2e" size={24} />
        </div>
        <div className="banner-content">
          <h4>Pendaftaran Sidang Telkom University Purwokerto</h4>
          <p>Sebelum melengkapi data pendaftaran sidang, silahkan pelajari dan pahami informasi terkait pendaftaran sidang pada tautan : <a href="https://tel-u.ac.id/panduansidangtup">https://tel-u.ac.id/panduansidangtup</a></p>
          <p><strong>Harap Baca Dengan Teliti</strong></p>
        </div>
        <div className="contact-person-badge" onClick={() => window.open('https://wa.me/6285117001281', '_blank')}>
                   <Mail size={16} />
                   <span>Contact Person : Helpdesk Layanan Sidang-Yudisium TUP wa.me/+6285117001281</span>
        </div>
      </div>

      <div className="step-title-container">
        <div className="step-label">Step 1</div>
        <h2 className="step-main-title">Pendaftaran Sidang Telkom University Purwokerto</h2>
      </div>

      <section className="form-section">
        <h3 className="section-head">Identitas & Program Studi</h3>
        <div className="form-grid">
          <div className="input-group">
            <label>Nama</label>
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Masukan Nama Anda"
                value={data.nama}
                onChange={(e) => updateField('nama', e.target.value)}
              />
            </div>
          </div>
          <div className="input-group">
            <label>NIM (NOMOR INDUK MAHASISWA) *</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                placeholder="Masukan NIM Anda"
                value={data.nim}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  updateField('nim', val);
                }}
              />
            </div>
            <span className="helper-text">NIM terverifikasi oleh sistem secara otomatis.</span>
          </div>
          <div className="input-group">
            <label>Program Studi</label>
            <div className="input-with-icon">
              <GraduationCap className="input-icon" size={18} />
              <select 
                className="input-field"
                value={data.prodi}
                onChange={(e) => updateField('prodi', e.target.value)}
              >
                <option value="">Pilih Program Studi Anda</option>
                <option value="S1 Informatika">S1 Informatika</option>
                <option value="S1 Sistem Informasi">S1 Sistem Informasi</option>
                <option value="S1 Rekayasa Perangkat Lunak">S1 Rekayasa Perangkat Lunak</option>
                <option value="S1 Sains Data">S1 Sains Data</option>
                <option value="S1 Teknik Elektro">S1 Teknik Elektro</option>
                <option value="S1 Teknik Industri">S1 Teknik Industri</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>Jumlah Total SKS Lulus</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                placeholder="0"
                value={data.sks}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  updateField('sks', val);
                }}
              />
            </div>
          </div>
          <div className="input-group">
            <label>TAK</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                placeholder="0"
                value={data.tak}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  updateField('tak', val);
                }}
              />
            </div>
            <span className="helper-text">Poin minimum untuk TAK Mahasiswa Reguler : 60, Alih Jenjang : 25, Diploma : 45</span>
          </div>
          <div className="input-group">
            <label>Nilai IPK Sebelum Sidang</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                placeholder="0.00"
                value={data.ipk}
                onChange={(e) => {
                  // Allow numbers and one decimal point
                  const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                  updateField('ipk', val);
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val && !isNaN(parseFloat(val))) {
                    updateField('ipk', parseFloat(val).toFixed(2));
                  }
                }}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Program</label>
            <div className="program-selector">
              {programs.map(p => (
                <div 
                  key={p} 
                  className={`program-card ${data.program === p ? 'active' : ''}`}
                  onClick={() => updateField('program', p)}
                >
                  <div className="checkbox-visual">
                    {data.program === p && <Check color="white" size={14} strokeWidth={3} />}
                  </div>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="input-group">
            <label>Tanggal Batas Akhir SK iGracias</label>
            <div className="input-with-icon">
              <input 
                type="date" 
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                value={data.batasSk}
                onChange={(e) => updateField('batasSk', e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3 className="section-head">Informasi Tugas Akhir</h3>
        <div className="form-grid">
          <div className="input-group">
            <label>Kode Dosen Wali</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                placeholder="Masukan Kode Dosen Wali"
                value={data.doswal}
                onChange={(e) => updateField('doswal', e.target.value)}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Kode Dosen Pembimbing 1</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                placeholder="Masukan Kode Pembimbing 1"
                value={data.pembimbing1}
                onChange={(e) => updateField('pembimbing1', e.target.value)}
              />
            </div>
          </div>
          <div className="input-group">
            <label>NIP Dosen Wali</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                placeholder="Masukan NIP Dosen Wali"
                value={data.nipDoswal}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  updateField('nipDoswal', val);
                }}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Kode Dosen Pembimbing 2</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '1rem' }}
                placeholder="Masukan Kode Pembimbing 2"
                value={data.pembimbing2}
                onChange={(e) => updateField('pembimbing2', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="input-group" style={{ marginTop: '2rem' }}>
          <label>Kelompok Keilmuan</label>
          <span className="helper-text">kk mengikuti Dosen Pembimbing 1</span>
          <div className="kelompok-keilmuan-grid">
            {keilmuans.map(k => (
              <div 
                key={k} 
                className={`radio-item ${data.kelompokKeilmuan === k ? 'active' : ''}`}
                onClick={() => updateField('kelompokKeilmuan', k)}
              >
                <div className="radio-visual"></div>
                <span>{k}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="input-group" style={{ marginTop: '2rem' }}>
          <label>Skema Sidang *</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {skemas.map(s => (
              <div 
                key={s} 
                className={`radio-item ${data.skema === s ? 'active' : ''}`}
                onClick={() => updateField('skema', s)}
              >
                <div className="radio-visual"></div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {data.skema === 'Non Sidang' && (
          <div className="input-group" style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-grey)' }}>
            <label style={{ color: 'var(--primary-red)' }}>Jalur Non Sidang *</label>
            <span className="helper-text">Pilih opsi publikasi yang sesuai</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {jalurNonSidangOptions.map(option => (
                <div 
                  key={option} 
                  className={`program-card ${data.jalurNonSidang?.includes(option) ? 'active' : ''}`}
                  onClick={() => toggleJalurNonSidang(option)}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <div className="checkbox-visual">
                    {data.jalurNonSidang?.includes(option) && <Check color="white" size={14} strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '0.85rem' }}>{option}</span>
                </div>
              ))}
            </div>
          </div>
        )}

       

        <div className="input-group" style={{ marginTop: '2rem' }}>
          <label>Judul Tugas Akhir (Bahasa Indonesia) *</label>
          <textarea 
            className="textarea-field"
            placeholder="Masukan Judul Tugas Akhir (Bahasa Indonesia)"
            value={data.judulId}
            onChange={(e) => updateField('judulId', e.target.value)}
          ></textarea>
        </div>

        <div className="input-group" style={{ marginTop: '2rem' }}>
          <label>Judul Tugas Akhir (Bahasa Inggris) *</label>
          <textarea 
            className="textarea-field"
            placeholder="Masukan Judul Tugas Akhir (Bahasa Inggris)"
            value={data.judulEn}
            onChange={(e) => updateField('judulEn', e.target.value)}
          ></textarea>
          <span className="helper-text">Pastikan judul sesuai dengan yang tertera di SK Yudisium terakhir.</span>
        </div>
      </section>
    </div>
  );
}
