import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import "../../components/yudisium/yudisium.css";
import logoSimta from '../../assets/logo-simta.png'; 
import logoTelkom from '../../assets/logo-telkom.png';
import { YudisiumFormProvider, useYudisiumForm } from '../../context/YudisiumFormContext';
import Step1Yudisium from '../../components/yudisium/Step1Yudisium';
import Step2Yudisium from '../../components/yudisium/Step2Yudisium';

function YudisiumPageContent() {
  const navigate = useNavigate();
  const { state } = useYudisiumForm();
  const { step } = state;

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
          {step === 1 ? <Step1Yudisium /> : <Step2Yudisium />}
        </main>
      </div>
    </div>
  );
}

export default function PendaftaranYudisium() {
  return (
    <YudisiumFormProvider>
      <YudisiumPageContent />
    </YudisiumFormProvider>
  );
}
