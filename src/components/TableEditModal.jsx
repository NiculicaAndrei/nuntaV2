import { useState } from 'react';

/**
 * Modal pentru editarea unei mese: nume + capacitate, cu validare simplă
 * și opțiune de ștergere (cu confirmare, pentru că invitații asociați
 * devin automat nealocați).
 */
function TableEditModal({ masa, ocupareCurenta, onSave, onDelete, onClose }) {
  const [nume, setNume] = useState(masa.nume);
  const [capacitate, setCapacitate] = useState(String(masa.capacitate));
  const [eroare, setEroare] = useState('');

  const handleSave = () => {
    const numeCurat = nume.trim();
    const cap = parseInt(capacitate, 10);

    if (!numeCurat) {
      setEroare('Numele mesei nu poate fi gol.');
      return;
    }
    if (Number.isNaN(cap) || cap < 1) {
      setEroare('Capacitatea trebuie să fie un număr mai mare ca 0.');
      return;
    }
    if (cap < ocupareCurenta) {
      setEroare(`Sunt deja ${ocupareCurenta} invitați la această masă. Scoate-i pe unii înainte să micșorezi capacitatea.`);
      return;
    }

    onSave({ nume: numeCurat, capacitate: cap });
  };

  const handleDelete = () => {
    const confirmat = window.confirm(
      `Sigur vrei să ștergi "${masa.nume}"? Cei ${ocupareCurenta} invitați asociați vor reveni în lista de nealocați.`
    );
    if (confirmat) onDelete();
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#fff', fontSize: '18px' }}>
          Editează masa
        </h3>

        <label style={labelStyle}>Nume masă</label>
        <input value={nume} onChange={(e) => setNume(e.target.value)} style={inputStyle} autoFocus />

        <label style={labelStyle}>Capacitate (nr. persoane)</label>
        <input
          type="number"
          min={1}
          value={capacitate}
          onChange={(e) => setCapacitate(e.target.value)}
          style={inputStyle}
        />

        {eroare && (
          <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px', marginBottom: 0 }}>{eroare}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '22px' }}>
          <button onClick={handleDelete} style={dangerButtonStyle}>🗑️ Șterge masa</button>
          <div>
            <button onClick={onClose} style={secondaryButtonStyle}>Anulează</button>
            <button onClick={handleSave} style={primaryButtonStyle}>Salvează</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
};

const modalStyle = {
  backgroundColor: '#1e1e1e',
  padding: '24px',
  borderRadius: '10px',
  width: '320px',
  border: '1px solid #333',
  boxShadow: '0 20px 45px rgba(0,0,0,0.6)',
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  color: '#aaa',
  marginTop: '14px',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #333',
  backgroundColor: '#2a2a2a',
  color: '#fff',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const primaryButtonStyle = {
  padding: '9px 16px',
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginLeft: '8px',
  fontSize: '14px',
};

const secondaryButtonStyle = {
  padding: '9px 16px',
  backgroundColor: 'transparent',
  color: '#aaa',
  border: '1px solid #444',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
};

const dangerButtonStyle = {
  padding: '9px 14px',
  backgroundColor: 'transparent',
  color: '#ef4444',
  border: '1px solid #ef4444',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
};

export default TableEditModal;
