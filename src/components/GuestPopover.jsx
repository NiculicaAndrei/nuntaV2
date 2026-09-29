/**
 * Popover DOM (nu canvas) cu lista de invitați ai unei mese.
 * E randat ca element normal peste Stage, poziționat cu coordonate absolute
 * (primite prin `style` din App.jsx) — liste de text + click-uri sunt mult
 * mai simplu de construit în DOM decât desenate manual pe canvas.
 */
function GuestPopover({ masa, invitati, style, onRemoveGuest, onClose }) {
  return (
    <div
      style={{
        position: 'absolute',
        backgroundColor: 'rgba(30, 30, 30, 0.97)',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '10px 12px',
        minWidth: '190px',
        maxWidth: '240px',
        boxShadow: '0 12px 28px rgba(0,0,0,0.55)',
        zIndex: 50,
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <strong style={{ fontSize: '13px', color: '#fff' }}>{masa.nume}</strong>
        <span onClick={onClose} title="Închide" style={{ cursor: 'pointer', color: '#888', fontSize: '13px', padding: '0 4px' }}>
          ✕
        </span>
      </div>

      {invitati.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#777', margin: 0 }}>Niciun invitat încă.</p>
      ) : (
        invitati.map((inv) => (
          <div
            key={inv.id}
            onClick={() => onRemoveGuest(inv.id)}
            title="Click pentru a-l scoate de la masă"
            style={{
              fontSize: '13px',
              padding: '4px 2px',
              borderBottom: '1px solid #333',
              cursor: 'pointer',
              color: '#e2e8f0',
            }}
          >
            ✕ {inv.nume}
          </div>
        ))
      )}
    </div>
  );
}

export default GuestPopover;
