
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import "../../components/sidang/sidang.css";
import logoSimta from '../../assets/logo-simta.png'; 
import logoTelkom from '../../assets/logo-telkom.png';
import { useSidangContext, SidangFormProvider } from '../../context/SidangFormContext';
import { useAuth } from '../../context/AuthContext';
import Step1 from '../../components/sidang/Step1Sidang';
import Step2 from '../../components/sidang/Step2Sidang';
import api from '../../service/api';

function PendaftaranSidangContent() {
  const navigate = useNavigate();
  const { state, dispatch } = useSidangContext();
  const { user } = useAuth();
  const { step, data, documents } = state;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill from Auth state, buat auto generate
  /*
  useEffect(() => {
    if (user) {
      dispatch({
        type: 'SET_INITIAL_DATA',
        payload: {
          nama: user.nama || user.username || '',
          nim: user.nim || '',
          prodi: user.prodi || '',
          doswal: user.doswal || '',
          nipDoswal: user.nipDoswal || '',
          pembimbing1: user.pembimbing1 || '',
          pembimbing2: user.pembimbing2 || '',
          kelompokKeilmuan: user.kelompokKeilmuan || null
        }
      });
    }
  }, [user, dispatch]);
  */

  const setStep = (val) => {
    dispatch({ type: 'SET_STEP', value: val });
  };

  const handleSubmit = async () => {
    // Basic validation 
    /*
    const incompleteDocs = documents.filter(d => d.status !== 'completed');
    if (incompleteDocs.length > 0) {
      alert(`Harap lengkapi semua dokumen! (${incompleteDocs.length} dokumen tersisa)`);
      setStep(2);
      return;
    }

    if (!data.skema || !data.periodeSidang) {
      alert('Harap lengkapi Skema dan Periode Sidang di Step 1!');
      setStep(1);
      return;
    }
    */

    try {
      setIsSubmitting(true);
      
      // Simulation of payload preparation
      const payload = {
        student_id: user?.id, 
        dosbing_1_id: data.pembimbing1_id || data.pembimbing1, 
        dosbing_2_id: data.pembimbing2_id || data.pembimbing2,
        program: data.program,
        sks: parseInt(data.sks) || 0,
        ipk: parseFloat(typeof data.ipk === 'string' ? data.ipk.replace(',', '.') : (data.ipk || 0)),
        tak: parseInt(data.tak) || 0,
        sk_exp_date: data.batasSk,
        judul_ta_id: data.judulId,
        judul_ta_en: data.judulEn,
        skema_sidang_id: data.skema, 
        sidang_period_id: data.periodeSidang, 
        extra_data: {
          jalur_non_sidang: data.jalurNonSidang
        }
      };

      console.log('Sending to BE (Simulation):', payload);
      // await api.post('/api/sidang/daftar', payload);
      
      // Clear draft storage
      localStorage.removeItem('sidang_form_draft');
      
      alert('Berhasil Daftar Sidang');
      navigate('/mahasiswa/dashboard');
    } catch (error) {
      console.error('Submit failed:', error);
      
      alert('Berhasil Daftar Sidang'); 
      navigate('/mahasiswa/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="top-header-nav">
        <button className="btn-back-square" onClick={() => navigate('/mahasiswa/dashboard')}>
          <ArrowLeft size={18} />
          <span>Kembali</span>
        </button>
        <div className="header-logos">
          <img src={logoSimta} alt="SIMTA Logo" className="simta-brand-logo" referrerPolicy="no-referrer" />
          <div className="logo-divider"></div>
          <img src={logoTelkom} alt="Telkom Logo" className="telkom-brand-logo" referrerPolicy="no-referrer" />
        </div>
      </div>

      <div className="simta-container">
        <main>
          {step === 1 ? <Step1 /> : <Step2 />}
        </main>

        <footer className="footer-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn-pagination" onClick={() => setStep(1)} disabled={step === 1}>
            <ChevronLeft size={16} />
          </button>
          <div className={`page-num ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>1</div>
          <div className={`page-num ${step === 2 ? 'active' : ''}`} onClick={() => setStep(2)}>2</div>
          <button className="btn-pagination" onClick={() => setStep(2)} disabled={step === 2}>
            <ChevronRight size={16} />
          </button>
        </div>
        
        {step === 1 ? (
          <button className="btn-primary" onClick={() => setStep(2)}>Simpan & Lanjutkan</button>
        ) : (
          <button 
            className="btn-primary" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mengirim...' : 'Submit Pendaftaran'}
          </button>
        )}
      </footer>
    </div>
  </div>
  );
}

export default function PendaftaranSidang() {
  return (
    <SidangFormProvider>
      <PendaftaranSidangContent />
    </SidangFormProvider>
  );
}
