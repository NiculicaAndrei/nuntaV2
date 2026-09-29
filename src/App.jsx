import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Stage, Layer, Circle, Text as KonvaText, Group, Line, Rect, Arc } from 'react-konva';
import { 
  Users, Wallet, Plus, Grid, Trash2, User, Download, 
  Search, CheckCircle, Circle as CircleIcon, Check, 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Clock, Copy, ArrowRight, Printer, X, List, AlertTriangle, CalendarDays
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';

// IMPORT FIREBASE - AM ADĂUGAT updateDoc AICI
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';


// =========================================================================
// 1. PANOUL DE ADMINISTRARE
// =========================================================================
function AdminDashboard() {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [generatedLink, setGeneratedLink] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null); 
  const [history, setHistory] = useState([]);
  
  // Stări pentru Calendarul Custom
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonthView, setCurrentMonthView] = useState(new Date());

  const navigate = useNavigate();

  const formatYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const aziStr = formatYMD(new Date());
  const monthNames = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

  const nextMonth = () => setCurrentMonthView(new Date(currentMonthView.getFullYear(), currentMonthView.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonthView(new Date(currentMonthView.getFullYear(), currentMonthView.getMonth() - 1, 1));

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const daysInMonth = getDaysInMonth(currentMonthView.getFullYear(), currentMonthView.getMonth());
  const startDay = getFirstDayOfMonth(currentMonthView.getFullYear(), currentMonthView.getMonth());

  const fetchHistory = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "evenimente"));
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      // Sortăm, dar avem grijă la documentele zombie care ar putea să nu aibă dată
      lista.sort((a, b) => {
        const dateA = a.dataEveniment ? new Date(a.dataEveniment) : new Date(0);
        const dateB = b.dataEveniment ? new Date(b.dataEveniment) : new Date(0);
        return dateA - dateB;
      });
      setHistory(lista);
    } catch (error) {
      console.error("Eroare la încărcarea istoricului:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventName || !eventDate) return alert("Completează numele și alege data din calendar!");

    setIsLoading(true);
    const safeName = eventName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const eventId = `${safeName}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await setDoc(doc(db, "evenimente", eventId), {
        nume: eventName,
        dataEveniment: eventDate,
        tables: [],
        guests: [],
        createdAt: new Date().toISOString()
      });
      
      setGeneratedLink(`${window.location.origin}/eveniment/${eventId}`);
      fetchHistory(); 
      setEventName("");
      setEventDate("");
    } catch (error) {
      console.error(error);
      alert("Eroare la generare link. Verifică setările Firebase.");
    } finally {
      setIsLoading(false);
    }
  };

  const getEventStatus = (dateString) => {
    if (!dateString) return { text: "Eroare Sistem", badgeClass: "bg-red-500/10 text-red-500" };
    
    const dataNuntii = new Date(dateString);
    const acum = new Date();
    const diferentaTimp = dataNuntii - acum;
    const zileRamase = Math.ceil(diferentaTimp / (1000 * 60 * 60 * 24));

    if (zileRamase > 0) {
      return { text: `Au rămas ${zileRamase} zile`, badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    } else {
      const oreTrecute = Math.abs(diferentaTimp) / (1000 * 60 * 60);
      if (oreTrecute <= 72) {
        return { text: "În desfășurare (Live)", badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse" };
      } else {
        return { text: "Expirat (Read-Only)", badgeClass: "bg-red-500/10 text-red-400 border-red-500/20" };
      }
    }
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      await deleteDoc(doc(db, "evenimente", eventToDelete.id));
      setEventToDelete(null); 
      fetchHistory(); 
    } catch (error) {
      console.error("Eroare la ștergere:", error);
      alert("Nu s-a putut șterge evenimentul din baza de date.");
    }
  };

  const calendarRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      className="min-h-screen text-slate-200 flex items-center justify-center p-6 relative bg-[#0f172a]"
      style={{ backgroundImage: "url('/poza.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-[4px]"></div>
      
      <div className="absolute bottom-6 right-8 text-slate-300/30 hover:text-slate-300/60 transition-colors text-xs font-semibold tracking-widest pointer-events-none select-none z-10 uppercase bg-[#0f172a]/20 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
        Software by Niculica Andrei
      </div>
      
      <div className="w-full max-w-md bg-[#1e293b]/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-slate-700 relative z-10">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-700">
          <Grid className="text-blue-500" size={32} />
          <div>
            <h1 className="text-2xl font-bold text-white">Panou Manager</h1>
            <p className="text-sm text-slate-400">Creare și Gestiune Săli</p>
          </div>
        </div>

        <form onSubmit={handleCreateEvent} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nume Familie Miri</label>
            <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} className="w-full p-3 bg-[#0f172a] border border-slate-600 rounded-lg focus:border-blue-500 outline-none text-white text-base" placeholder="" required />
          </div>
          
          <div className="relative" ref={calendarRef}>
            <label className="block text-sm font-medium text-slate-300 mb-2">Data Nunții (Link-ul expiră la +72h)</label>
            
            <div 
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`w-full p-3 bg-[#0f172a] border rounded-lg flex justify-between items-center cursor-pointer transition-colors ${isCalendarOpen ? 'border-blue-500' : 'border-slate-600 hover:border-slate-500'}`}
            >
              <span className={eventDate ? "text-white" : "text-slate-500"}>
                {eventDate ? eventDate.split('-').reverse().join('.') : "Alege o dată..."}
              </span>
              <CalendarDays size={18} className={isCalendarOpen ? "text-blue-500" : "text-slate-400"} />
            </div>

            {isCalendarOpen && (
              <div className="absolute z-50 mt-2 w-full p-4 bg-[#1e293b] border border-slate-600 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-4">
                  <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><ChevronLeft size={18}/></button>
                  <span className="text-white font-bold text-sm tracking-wide">{monthNames[currentMonthView.getMonth()]} {currentMonthView.getFullYear()}</span>
                  <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><ChevronRight size={18}/></button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map(d => <div key={d} className="text-center text-xs font-bold text-slate-500">{d}</div>)}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({length: startDay}).map((_, i) => <div key={`empty-${i}`}/>)}
                  {Array.from({length: daysInMonth}).map((_, i) => {
                    const cellDate = new Date(currentMonthView.getFullYear(), currentMonthView.getMonth(), i + 1);
                    const cellDateStr = formatYMD(cellDate);
                    const isPast = cellDateStr < aziStr;
                    const isSelected = eventDate === cellDateStr;
                    
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isPast}
                        onClick={() => { setEventDate(cellDateStr); setIsCalendarOpen(false); }}
                        className={`w-full aspect-square flex items-center justify-center rounded-lg text-sm transition-all
                          ${isPast ? 'text-slate-600/50 cursor-not-allowed line-through decoration-slate-600/30' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                          ${isSelected ? 'bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-md' : ''}
                        `}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={isLoading} className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 text-sm shadow-lg shadow-blue-900/20">
            {isLoading ? "Se salvează în Cloud..." : <><Plus size={18} /> Generează Eveniment & Link</>}
          </button>
        </form>

        {generatedLink && (
          <div className="mt-8 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-in fade-in zoom-in">
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2">Link Generat cu Succes!</p>
            <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-700 break-all text-xs font-mono text-slate-300 mb-4 select-all">{generatedLink}</div>
            <button onClick={() => { navigator.clipboard.writeText(generatedLink); alert("Copiat în clipboard!"); }} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg">
              <Copy size={16} /> Copiază Link-ul pentru Miri
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-700">
          <button onClick={() => { fetchHistory(); setIsModalOpen(true); }} className="w-full flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 py-3.5 rounded-xl text-sm font-bold transition-colors border border-slate-600 shadow-md">
            <List size={18} /> Monitorizare Evenimente Active
          </button>
        </div>
      </div>

      {/* POP-UP ISTORIC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-[#1e293b] w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-slate-700 animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-[#0f172a]/50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><List className="text-blue-500" size={24}/> Situație Evenimente</h2>
                <p className="text-sm text-slate-400 mt-1">Gestiunea link-urilor și a stării de expirare</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 rounded-lg transition-colors border border-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 bg-[#1e293b]">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic text-sm border-2 border-dashed border-slate-700 rounded-xl bg-[#0f172a]/50">Nu s-a creat niciun eveniment până acum.</div>
              ) : (
                history.map((eveniment) => {
                  // SCUT ANTI-CRASH: Dacă documentul zombie nu are date, îi punem valori sigure
                  const areDateComplete = eveniment.dataEveniment && eveniment.nume;
                  const displayDate = areDateComplete ? eveniment.dataEveniment.split('-').reverse().join('.') : "Fără Dată (Eroare)";
                  const status = areDateComplete ? getEventStatus(eveniment.dataEveniment) : { text: "Date Corupte / Incomplete", badgeClass: "bg-red-500/10 text-red-500" };

                  return (
                    <div key={eveniment.id} className="bg-[#0f172a] p-5 rounded-xl border border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-500 transition-colors shadow-sm">
                      <div>
                        <h3 className="font-bold text-white text-base">{eveniment.nume || "Eveniment Necunoscut"}</h3>
                        <p className="text-xs text-slate-400 mt-1">Dată: <span className="text-slate-300 font-medium">{displayDate}</span></p>
                        <div className={`mt-2.5 inline-block px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider ${status.badgeClass}`}>{status.text}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center mt-2 sm:mt-0">
                        {areDateComplete && (
                          <>
                            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/eveniment/${eveniment.id}`); alert("Link copiat!"); }} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700" title="Copiază Link Client">
                              <Copy size={16} />
                            </button>
                            <button onClick={() => navigate(`/eveniment/${eveniment.id}`)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-colors" title="Deschide ca administrator">
                              Schița <ArrowRight size={14} />
                            </button>
                          </>
                        )}
                        <button onClick={() => setEventToDelete(eveniment)} className="p-2.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors border border-red-600/20" title="Șterge permanent">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* POP-UP CONFIRMARE ȘTERGERE */}
      {eventToDelete && (
        <div className="fixed inset-0 z-[60] bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1e293b] p-7 rounded-2xl w-full max-w-md shadow-2xl border border-red-900/50 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 text-red-400 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Confirmare Ștergere</h3>
            </div>
            
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Ești sigur că vrei să ștergi evenimentul <strong className="text-white">{eventToDelete.nume || "Eroare"}</strong>? Toate datele asociate, mesele și lista de invitați vor fi eliminate definitiv din baza de date. 
              <br/><br/>
              <span className="text-red-400 font-medium">Acest link va deveni inactiv. Această acțiune este ireversibilă!</span>
            </p>
            
            <div className="flex gap-3">
              <button onClick={() => setEventToDelete(null)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors">
                Anulează
              </button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-900/20">
                Da, Șterge Definitiv
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// =========================================================================
// 2. SCHIȚA EVENIMENTULUI (INTERFAȚA MIRILOR)
// =========================================================================
function EventCanvas() {
  const { eventId } = useParams(); 

  const [eventDetails, setEventDetails] = useState(null);
  const [tables, setTables] = useState([]);
  const [guests, setGuests] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isExpired, setIsExpired] = useState(false); 
  
  const [editingGuest, setEditingGuest] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stageScale, setStageScale] = useState(1); 
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 }); 
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isExporting, setIsExporting] = useState(false);

  const stageRef = useRef(null);
  const legendRef = useRef(null);
  const isInitialMount = useRef(true);

  const eventRef = useMemo(() => doc(db, "evenimente", eventId), [eventId]);

  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        const snap = await getDoc(eventRef);
        if (snap.exists()) {
          const data = snap.data();
          setEventDetails(data);
          setTables(data.tables || []);
          setGuests(data.guests || []);

          if (data.dataEveniment) {
            const dateOfEvent = new Date(data.dataEveniment);
            const now = new Date();
            const hoursPassed = (now - dateOfEvent) / (1000 * 60 * 60);
            if (hoursPassed > 72) {
              setIsExpired(true);
            }
          }
        } else {
          setEventDetails(null); 
        }
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Eroare la citirea din Firebase:", error);
        setIsDataLoaded(true);
      }
    };
    fetchCloudData();
  }, [eventId, eventRef]);

  // AICI ESTE FIX-UL ANTI-ZOMBIE (Am schimbat setDoc cu updateDoc)
  useEffect(() => {
    if (isInitialMount.current || !isDataLoaded || isExpired || !eventDetails) {
      isInitialMount.current = false;
      return;
    }
    const saveToCloud = async () => {
      try {
        // updateDoc NU creează documentul la loc dacă tu l-ai șters din Admin. Dă doar eroare și se oprește liniștit.
        await updateDoc(eventRef, { tables, guests });
      } catch (error) { 
        console.error("Nu s-a putut salva (posibil eveniment șters de admin)."); 
      }
    };
    const timeoutId = setTimeout(saveToCloud, 500);
    return () => clearTimeout(timeoutId);
  }, [tables, guests, isDataLoaded, isExpired, eventRef, eventDetails]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const stergeMasaLocal = (idMasa) => {
    if (isExpired) return;
    setTables(prevTables => prevTables.filter(t => t.id !== idMasa));
    setGuests(prevGuests => prevGuests.map(g => g.tableId === idMasa ? { ...g, tableId: null, seatIndex: null } : g));
    setSelectedTableId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isExpired || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTableId) {
        stergeMasaLocal(selectedTableId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTableId, isExpired]);

  const gridPattern = useMemo(() => {
    const lines = [];
    lines.push(<Rect key="bg" x={-50000} y={-50000} width={100000} height={100000} fill="#0f172a" listening={false} />);
    if (!isExporting) {
      for (let i = -5000; i < 5000; i += 50) {
        lines.push(<Line key={`v${i}`} points={[i, -5000, i, 5000]} stroke="#334155" strokeWidth={0.5} opacity={0.3} listening={false} />);
        lines.push(<Line key={`h${i}`} points={[-5000, i, 5000, i]} stroke="#334155" strokeWidth={0.5} opacity={0.3} listening={false} />);
      }
    }
    return lines;
  }, [isExporting]);


  if (!isDataLoaded) return <div className="flex h-screen w-full items-center justify-center bg-[#0f172a] text-slate-400 font-medium">Se încarcă evenimentul tău din Cloud...</div>;
  if (!eventDetails) return <div className="flex h-screen w-full items-center justify-center bg-[#0f172a]"><div className="bg-[#1e293b] p-8 rounded-xl border border-red-900/50 text-center shadow-2xl"><h2 className="text-2xl font-bold text-red-400 mb-2">Eroare Link</h2><p className="text-slate-400 text-sm">Acest eveniment nu există sau a fost șters de către administrator.</p></div></div>;

  const totalMoney = guests.reduce((sum, guest) => sum + (Number(guest.giftAmount) || 0), 0);
  const cursEuro = 5.2345; 
  const totalEuro = totalMoney > 0 ? (totalMoney / cursEuro).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";

  const guestsAtTables = guests.filter(g => g.tableId !== null);
  const countStandard = guestsAtTables.filter(g => !g.menuType || g.menuType === 'standard').length;
  const countVegan = guestsAtTables.filter(g => g.menuType === 'vegetarian').length;
  const countCopil = guestsAtTables.filter(g => g.menuType === 'copil').length;
  const countAlergie = guestsAtTables.filter(g => g.menuType === 'alergie').length;

  const getMenuBadge = (type) => {
    if (type === 'vegetarian') return { color: '#10b981', letter: 'V' };
    if (type === 'copil') return { color: '#3b82f6', letter: 'C' };
    if (type === 'alergie') return { color: '#ef4444', letter: '!' };
    return null;
  };

  const adaugaMasa = () => {
    if (isExpired) return; 
    const idNou = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    const centerX = (windowSize.width / 2 - stagePosition.x) / stageScale;
    const centerY = (windowSize.height / 2 - stagePosition.y) / stageScale;
    setTables([...tables, { id: idNou, name: `Masa ${idNou}`, capacity: 8, radius: (8 * 45) / (2 * Math.PI), x: centerX, y: centerY }]);
    setSelectedTableId(idNou);
  };

  const exportaSchitaPDF = () => {
    if (!stageRef.current) return;
    if (tables.length === 0) return alert("Adaugă cel puțin o masă!");
    setIsExporting(true);

    setTimeout(async () => {
      try {
        const { jsPDF } = await import('jspdf');

        const stage = stageRef.current;
        const oldScaleX = stage.scaleX();
        const oldScaleY = stage.scaleY();
        const oldPos = stage.position();
        const oldWidth = stage.width();
        const oldHeight = stage.height();

        const paddingLeft = 100, paddingTop = 100, paddingBottom = 100, paddingRight = 450; 
        const minX = Math.min(...tables.map(t => t.x - t.radius)) - paddingLeft;
        const minY = Math.min(...tables.map(t => t.y - t.radius)) - paddingTop;
        const maxX = Math.max(...tables.map(t => t.x + t.radius)) + paddingRight;
        const maxY = Math.max(...tables.map(t => t.y + t.radius)) + paddingBottom;

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        const pdfWidth = 1122, pdfHeight = 793;
        const scaleX = pdfWidth / contentWidth;
        const scaleY = pdfHeight / contentHeight;
        const finalScale = Math.min(scaleX, scaleY);
        const offsetX = (pdfWidth - contentWidth * finalScale) / 2;
        const offsetY = (pdfHeight - contentHeight * finalScale) / 2;

        stage.width(pdfWidth); stage.height(pdfHeight);
        stage.scale({ x: finalScale, y: finalScale });
        stage.position({ x: -minX * finalScale + offsetX, y: -minY * finalScale + offsetY });

        if (legendRef.current) {
          legendRef.current.position({ x: maxX - 380, y: minY + 50 });
          legendRef.current.scale({ x: 1.5, y: 1.5 });
        }

        stage.draw();
        const dataUrl = stage.toDataURL({ pixelRatio: 2, bgcolor: '#0f172a' });

        stage.width(oldWidth); stage.height(oldHeight);
        stage.scale({ x: oldScaleX, y: oldScaleY });
        stage.position(oldPos);
        stage.draw();

        const pdf = new jsPDF('l', 'px', [pdfWidth, pdfHeight]);
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('Schita_Sala_Ospatari.pdf');
      } catch (error) {
        console.error(error); alert("Eroare la generarea PDF. Ai instalat jspdf?");
      } finally { setIsExporting(false); }
    }, 500); 
  };

  const exportaInExcel = () => {
    const dateExcel = [ ["Nume Invitat", "Gen", "Tip Meniu", "Locație", "Prezent", "Suma Oferită (RON)"] ];
    guests.forEach(g => {
      const tableName = tables.find(t => t.id === g.tableId)?.name || "Fără Masă";
      let meniuNume = "Standard";
      if(g.menuType === 'vegetarian') meniuNume = "Vegan/Vegetarian";
      if(g.menuType === 'copil') meniuNume = "Meniu Copil";
      if(g.menuType === 'alergie') meniuNume = "Alergie/Special";
      dateExcel.push([g.name, g.gender === 'M' ? "Bărbat" : "Femeie", meniuNume, tableName, g.isPresent ? "Da" : "Nu", Number(g.giftAmount) || 0]);
    });
    dateExcel.push(["", "", "", "", "", ""]);
    dateExcel.push(["TOTAL EVENIMENT", "", "", "", "", `${totalMoney.toLocaleString('ro-RO')} RON`]);
    
    const worksheet = XLSX.utils.aoa_to_sheet(dateExcel);
    worksheet['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 25 }, { wch: 10 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Situatie_Nunta");
    XLSX.writeFile(workbook, "Situatie_Mese_Eveniment.xlsx");
  };

  const stergeMasa = (idMasa) => { stergeMasaLocal(idMasa); };

  const togglePrezentaRapid = (idInvitat, e) => {
    e.stopPropagation(); 
    if (isExpired) return;
    setGuests(guests.map(g => g.id === idInvitat ? { ...g, isPresent: !g.isPresent } : g));
  };

  const handleTableMove = (e, tableId) => {
    if (isExpired) return;
    setTables(tables.map(t => t.id === tableId ? { ...t, x: e.target.x(), y: e.target.y() } : t));
  };

  const handleTableResize = (e, table) => {
    if (isExpired) return;
    e.cancelBubble = true; 
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const relativeX = (pointerPos.x - stage.x()) / stageScale;
    const relativeY = (pointerPos.y - stage.y()) / stageScale;
    const dx = relativeX - table.x, dy = relativeY - table.y;
    let rawRadius = Math.max(40, Math.min(180, Math.sqrt(dx * dx + dy * dy)));
    let calculatedCapacity = Math.floor((2 * Math.PI * rawRadius) / 45);
    const tableGuests = guests.filter(g => g.tableId === table.id);
    let newCapacity = Math.max(Math.max(4, tableGuests.length), Math.min(16, calculatedCapacity));
    let newRadius = Math.max(40, (newCapacity * 45) / (2 * Math.PI)); 

    let guestsChanged = false;
    let ocupate = tableGuests.filter(g => g.seatIndex < newCapacity).map(g => g.seatIndex);
    let currentGuests = guests.map(g => {
      if (g.tableId === table.id && g.seatIndex >= newCapacity) {
        let newSeat = 0; while (ocupate.includes(newSeat)) newSeat++; ocupate.push(newSeat);
        guestsChanged = true; return { ...g, seatIndex: newSeat };
      }
      return g;
    });

    if (guestsChanged) setGuests(currentGuests);
    setTables(tables.map(t => t.id === table.id ? { ...t, radius: newRadius, capacity: newCapacity } : t));
  };

  const handleSeatClick = (e, tableId, seatIndex, existingGuest) => {
    e.cancelBubble = true; 
    setSelectedTableId(tableId);
    if (isExpired) return; 
    if (existingGuest) setEditingGuest(existingGuest);
    else setEditingGuest({ id: Date.now(), name: "", tableId, seatIndex, giftAmount: "", gender: "M", isPresent: false, menuType: "standard" });
  };

  const checkDeselect = (e) => { if (e.target === e.target.getStage()) setSelectedTableId(null); };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05; 
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(0.3, Math.min(newScale, 3)); 
    setStageScale(newScale);
    setStagePosition({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
  };

  const zoomControl = (factor) => {
    const centerX = windowSize.width / 2;
    const centerY = windowSize.height / 2;
    const mousePointTo = { x: (centerX - stagePosition.x) / stageScale, y: (centerY - stagePosition.y) / stageScale };
    let newScale = Math.max(0.3, Math.min(stageScale * factor, 3));
    setStageScale(newScale);
    setStagePosition({ x: centerX - mousePointTo.x * newScale, y: centerY - mousePointTo.y * newScale });
  };

  const unassignedGuests = guests.filter(g => g.tableId === null && g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-screen bg-[#0f172a] font-sans text-slate-200 overflow-hidden relative">
      
      <div className={`bg-[#1e293b] shadow-2xl z-30 flex flex-col border-r border-slate-700 transition-all duration-300 relative`} style={{ width: isSidebarOpen ? '420px' : '0px', minWidth: isSidebarOpen ? '420px' : '0px' }}>
        <div className={`w-[420px] h-full flex flex-col transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          
          <div className="p-6 border-b border-slate-700 bg-[#0f172a]/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Grid className="text-blue-500" size={28} />
              <div>
                <h1 className="text-xl font-bold tracking-wide text-white truncate max-w-[200px]" title={eventDetails?.nume || "Eveniment"}>{eventDetails?.nume || "Eveniment"}</h1>
                <p className="text-sm text-slate-400">Data: <span className="font-medium text-slate-300">{eventDetails?.dataEveniment.split('-').reverse().join('.')}</span></p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm ${isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
               <div className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`}></div>
               <span className="text-[10px] font-bold uppercase tracking-wide">{isExpired ? 'Expirat' : 'Live'}</span>
            </div>
          </div>

          {isExpired && (
            <div className="bg-red-500/10 border-b border-red-500/20 p-3 flex items-center justify-center gap-2 text-red-400">
              <Clock size={16} />
              <span className="text-xs font-bold uppercase tracking-wider text-center">Au trecut 72h de la eveniment. Modificările sunt blocate permanent.</span>
            </div>
          )}

          <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar relative">
            <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-700 shadow-inner">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Sumar Financiar & Capacitate</h2>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20"><Wallet size={20} /></div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1">Total Bani Colectați</p>
                    <p className="text-2xl font-bold text-white">{totalMoney.toLocaleString('ro-RO')} <span className="text-sm text-emerald-400 font-normal">lei</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Estimat Euro</p>
                  <p className="text-lg font-semibold text-slate-300">≈ {totalEuro} <span className="text-xs text-slate-500">€</span></p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20"><Users size={20} /></div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Invitați Prezenți Sosiți</p>
                  <p className="text-xl font-bold text-white">{guests.filter(g => g.tableId !== null && g.isPresent).length} <span className="text-sm text-slate-500 font-normal"> / {guests.filter(g => g.tableId !== null).length} alocați</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={adaugaMasa} disabled={isExpired} className="flex items-center justify-center gap-2 bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus size={16} /> Masă Nouă
              </button>
              <button onClick={exportaInExcel} className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-medium py-3 rounded-xl hover:bg-emerald-500 shadow-lg">
                <Download size={16} /> Excel
              </button>
              <button onClick={exportaSchitaPDF} disabled={isExporting} className="col-span-2 flex items-center justify-center gap-2 bg-slate-700 text-white font-medium py-3 rounded-xl hover:bg-slate-600 border border-slate-600 shadow-lg disabled:opacity-50">
                <Printer size={16} /> {isExporting ? "Se Generază PDF..." : "Exportă Schița în PDF (Ospătari)"}
              </button>
            </div>

            {selectedTableId && !isExpired && (
              <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-4 animate-in fade-in"><button onClick={() => stergeMasa(selectedTableId)} className="w-full flex items-center justify-center gap-2 bg-red-600/10 text-red-400 border border-red-600/30 hover:bg-red-600 hover:text-white font-medium py-2.5 rounded-lg"><Trash2 size={16} /> Șterge Masa (Del)</button></div>
            )}

            <div className="mt-8">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-700 pb-2">Caută Invitat</h2>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                <input type="text" placeholder="Introdu numele..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 p-2.5 bg-[#0f172a] border border-slate-600 rounded-lg focus:border-blue-500 outline-none text-white text-sm" />
              </div>
            </div>

            <div className="space-y-4 pt-2 pb-10">
              {tables.map(table => {
                const tableGuests = guests.filter(g => g.tableId === table.id && g.name.toLowerCase().includes(searchQuery.toLowerCase()));
                const allGuestsAtTable = guests.filter(g => g.tableId === table.id); 
                const tableTotal = allGuestsAtTable.reduce((sum, g) => sum + (Number(g.giftAmount) || 0), 0);
                if (searchQuery && tableGuests.length === 0) return null;

                return (
                  <div key={table.id} className="bg-[#0f172a] border border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-800/80 p-3.5 flex justify-between items-center border-b border-slate-700">
                      <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">{table.name} <span className="text-slate-500 font-normal text-xs bg-slate-900 px-2 py-0.5 rounded-full">{allGuestsAtTable.length}/{table.capacity}</span></h3>
                      <span className="text-emerald-400 font-bold text-sm bg-emerald-400/10 px-2.5 py-1 rounded-md border border-emerald-500/20">{tableTotal} lei</span>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      {tableGuests.length === 0 ? <p className="text-xs text-slate-500 p-2 text-center italic">Niciun invitat la această masă.</p> : (
                        tableGuests.map(g => {
                          const badge = getMenuBadge(g.menuType);
                          return (
                          <div key={g.id} onClick={() => { if(!isExpired) setEditingGuest(g); }} className={`flex justify-between items-center p-2.5 rounded-lg group bg-slate-900/30 ${isExpired ? 'opacity-80' : 'cursor-pointer hover:bg-slate-700/50'}`}>
                            <div className="flex items-center gap-2">
                              <User size={18} className={g.gender === 'F' ? 'text-pink-400' : 'text-blue-400'} />
                              <span className={`text-sm transition-colors ${g.isPresent ? 'text-emerald-400 font-bold' : 'text-slate-300 font-medium group-hover:text-white'}`}>{g.name}</span>
                              {badge && <span style={{backgroundColor: badge.color}} className="text-white text-[9px] w-4 h-4 flex items-center justify-center font-bold rounded-full shadow-sm">{badge.letter}</span>}
                              <button onClick={(e) => togglePrezentaRapid(g.id, e)} disabled={isExpired} className={`p-1 rounded-md ml-1 ${isExpired ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-600'}`}>
                                {g.isPresent ? <CheckCircle size={16} className="text-emerald-500" /> : <CircleIcon size={16} className="text-slate-500 hover:text-emerald-400" />}
                              </button>
                            </div>
                            {g.giftAmount ? <span className="text-xs font-semibold text-emerald-400/80">+{g.giftAmount}</span> : <span className="text-xs text-slate-600">-</span>}
                          </div>
                        )})
                      )}
                    </div>
                  </div>
                );
              })}

              {unassignedGuests.length > 0 && (
                <div className="bg-red-950/20 border border-red-900/40 rounded-xl overflow-hidden mt-6">
                  <div className="bg-red-900/30 p-3.5 flex justify-between items-center border-b border-red-900/40"><h3 className="font-bold text-red-400 text-sm">Fără Masă (În așteptare)</h3></div>
                  <div className="p-2 space-y-1">
                    {unassignedGuests.map(g => {
                      const badge = getMenuBadge(g.menuType);
                      return (
                      <div key={g.id} onClick={() => { if(!isExpired) setEditingGuest(g); }} className={`flex justify-between items-center p-2.5 rounded-lg group bg-slate-900/30 ${isExpired ? 'opacity-80' : 'cursor-pointer hover:bg-slate-700/50'}`}>
                        <div className="flex items-center gap-2">
                          <User size={18} className={g.gender === 'F' ? 'text-pink-400' : 'text-blue-400'} />
                          <span className={`text-sm transition-colors ${g.isPresent ? 'text-emerald-400 font-bold' : 'text-slate-300 font-medium'}`}>{g.name}</span>
                          {badge && <span style={{backgroundColor: badge.color}} className="text-white text-[9px] w-4 h-4 flex items-center justify-center font-bold rounded-full">{badge.letter}</span>}
                          <button onClick={(e) => togglePrezentaRapid(g.id, e)} disabled={isExpired} className={`p-1 rounded-md ml-1 ${isExpired ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-600'}`}>
                            {g.isPresent ? <CheckCircle size={16} className="text-emerald-500" /> : <CircleIcon size={16} className="text-slate-500 hover:text-emerald-400" />}
                          </button>
                        </div>
                        {g.giftAmount ? <span className="text-xs font-semibold text-emerald-400/80">+{g.giftAmount}</span> : <span className="text-xs text-slate-600">-</span>}
                      </div>
                    )})}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute top-6 z-40 bg-[#1e293b] border border-slate-600 border-l-0 text-slate-300 hover:text-white hover:bg-blue-600 p-2.5 rounded-r-xl shadow-2xl" style={{ left: isSidebarOpen ? '420px' : '0px' }}>
        {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
      </button>

      <div className="absolute bottom-8 right-8 z-20 flex bg-[#1e293b] rounded-xl shadow-2xl border border-slate-700 overflow-hidden divide-x divide-slate-700">
        <div className="px-4 flex items-center justify-center text-xs font-mono text-slate-400 bg-slate-800/50 pointer-events-none select-none">{Math.round(stageScale * 100)}%</div>
        <button onClick={() => zoomControl(1.15)} className="p-3 hover:bg-slate-700 text-slate-300 hover:text-white"><ZoomIn size={20} /></button>
        <button onClick={() => { setStageScale(1); setStagePosition({x:0, y:0}); }} className="p-3 hover:bg-blue-600 text-slate-300 hover:text-white"><Maximize size={20} /></button>
        <button onClick={() => zoomControl(1 / 1.15)} className="p-3 hover:bg-slate-700 text-slate-300 hover:text-white"><ZoomOut size={20} /></button>
      </div>

      <div className="flex-1 relative bg-[#0f172a] overflow-hidden h-screen w-full">
        <div className="absolute top-6 right-8 text-slate-500 flex items-center gap-2 select-none pointer-events-none bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 z-20">
          <span className="text-xs font-medium uppercase tracking-wider">Trage pt. navigare • Scroll pt. Zoom</span>
        </div>

        <Stage 
          ref={stageRef} width={windowSize.width} height={windowSize.height} 
          onMouseDown={checkDeselect} onTouchStart={checkDeselect} onWheel={handleWheel}
          draggable scaleX={stageScale} scaleY={stageScale} x={stagePosition.x} y={stagePosition.y}
          onDragEnd={(e) => { if (e.target === e.target.getStage()) setStagePosition({ x: e.target.x(), y: e.target.y() }); }}
          className="cursor-grab active:cursor-grabbing"
        >
          <Layer>{gridPattern}</Layer>
          <Layer>
            {tables.map(table => {
              const tableGuests = guests.filter(g => Number(g.tableId) === table.id);
              const isFull = tableGuests.length >= table.capacity;
              const isSelected = selectedTableId === table.id;

              return (
                <Group key={table.id} x={table.x} y={table.y} draggable={!isExpired} 
                  onDblClick={(e) => { e.cancelBubble = true; if(!isExpired) setEditingTable(table); }}
                  onDragStart={(e) => { if (e.target !== e.currentTarget || isExpired) return; e.cancelBubble = true; setSelectedTableId(table.id); }}
                  onDragEnd={(e) => { if (e.target === e.currentTarget && !isExpired) handleTableMove(e, table.id); }}
                  onClick={(e) => { if (e.target === e.currentTarget) { e.cancelBubble = true; setSelectedTableId(table.id); } }}
                >
                  {isSelected && !isExporting && !isExpired && <Circle radius={table.radius + 20} fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth={2 / stageScale} dash={[5 / stageScale, 5 / stageScale]} />}

                  <Circle radius={table.radius} fill={isExporting ? "#ffffff" : "#1e293b"} stroke={isFull ? "#10b981" : (isSelected && !isExporting && !isExpired ? "#60a5fa" : "#334155")} strokeWidth={isSelected && !isExporting && !isExpired ? 4 / stageScale : 2 / stageScale} shadowColor="#000" shadowBlur={15} />
                  
                  <KonvaText text={table.name} x={-table.radius} y={-10} width={table.radius * 2} align="center" fontSize={16} fontStyle="bold" fill={isExporting ? "#0f172a" : "#f8fafc"} />
                  <KonvaText text={`${tableGuests.length} / ${table.capacity}`} x={-table.radius} y={10} width={table.radius * 2} align="center" fontSize={12} fill={isExporting ? "#475569" : "#94a3b8"} />

                  {isSelected && !isExporting && !isExpired && (
                    <Group x={table.radius} y={0} draggable onDragStart={(e) => { e.cancelBubble = true; }} onDragMove={(e) => handleTableResize(e, table)} onDragEnd={(e) => { e.cancelBubble = true; e.target.position({ x: table.radius, y: 0 }); }} onMouseEnter={(e) => e.target.getStage().container().style.cursor = 'ew-resize'} onMouseLeave={(e) => e.target.getStage().container().style.cursor = 'grab'}>
                      <Circle radius={14 / Math.sqrt(stageScale)} fill="#0f172a" stroke="#60a5fa" strokeWidth={3 / stageScale} />
                      <Line points={[-4 / stageScale, -5 / Math.sqrt(stageScale), -4 / stageScale, 5 / Math.sqrt(stageScale)]} stroke="#60a5fa" strokeWidth={2 / stageScale} />
                      <Line points={[4 / stageScale, -5 / Math.sqrt(stageScale), 4 / stageScale, 5 / Math.sqrt(stageScale)]} stroke="#60a5fa" strokeWidth={2 / stageScale} />
                    </Group>
                  )}

                  {Array.from({ length: table.capacity }).map((_, i) => {
                    const angle = (i / table.capacity) * Math.PI * 2;
                    const cx = Math.cos(angle) * (table.radius + 35);
                    const cy = Math.sin(angle) * (table.radius + 35);
                    const guestAtSeat = tableGuests.find(g => g.seatIndex === i);
                    const isSearched = searchQuery && guestAtSeat && guestAtSeat.name.toLowerCase().includes(searchQuery.toLowerCase());
                    const badge = guestAtSeat ? getMenuBadge(guestAtSeat.menuType) : null;

                    return (
                      <Group key={`chair-${i}`} x={cx} y={cy} onClick={(e) => handleSeatClick(e, table.id, i, guestAtSeat)} onMouseEnter={(e) => { if(!isExpired) e.target.getStage().container().style.cursor = 'pointer'; }} onMouseLeave={(e) => { if(!isExpired) e.target.getStage().container().style.cursor = 'grab'; }}>
                        {!guestAtSeat && <Circle radius={10} fill="#0f172a" stroke="#475569" strokeWidth={2 / stageScale} dash={[4 / stageScale, 2 / stageScale]} />}
                        {guestAtSeat && (
                          <Group rotation={(angle * 180) / Math.PI + 90}>
                            {isSearched && !isExporting && <Rect x={-18} y={-12} width={36} height={28} fill="rgba(250, 204, 21, 0.3)" cornerRadius={12} shadowColor="#facc15" shadowBlur={15} />}
                            <Rect x={-14} y={-8} width={28} height={20} fill={guestAtSeat.gender === 'F' ? '#ec4899' : '#3b82f6'} cornerRadius={10} shadowColor="#000" shadowBlur={5} shadowOffsetY={3} />
                            <Circle x={0} y={0} radius={9} fill="#fed7aa" stroke="#1e293b" strokeWidth={1} />
                            <Arc x={0} y={1} innerRadius={0} outerRadius={9.5} angle={180} rotation={180} fill={guestAtSeat.gender === 'F' ? '#78350f' : '#1e293b'} />
                          </Group>
                        )}
                        {badge && guestAtSeat && (
                          <Group x={12} y={-12}><Circle radius={7} fill={badge.color} stroke="#1e293b" strokeWidth={1.5} /><KonvaText text={badge.letter} x={-7} y={-4} width={14} align="center" fontSize={9} fontStyle="bold" fill="#fff" /></Group>
                        )}
                        {guestAtSeat && <KonvaText text={guestAtSeat.name} x={cx > 0 ? 20 : -120} y={-6} width={100} align={cx > 0 ? "left" : "right"} fontSize={12} fontStyle="bold" fill={isSearched && !isExporting ? "#fde047" : (guestAtSeat.isPresent ? "#34d399" : "#ffffff")} shadowColor="#0f172a" shadowBlur={isExporting ? 8 : 4} />}
                      </Group>
                    );
                  })}
                </Group>
              );
            })}

            <Group ref={legendRef} visible={isExporting}>
              <Rect x={0} y={0} width={220} height={145} fill="rgba(15, 23, 42, 0.95)" stroke="#475569" strokeWidth={2} cornerRadius={8} shadowColor="#000" shadowBlur={15} />
              <KonvaText text="RAPORT MENIURI (TOTAL)" x={15} y={14} fontSize={12} fontStyle="bold" fill="#cbd5e1" />
              <Circle x={22} y={40} radius={8} fill="#475569" stroke="#1e293b" strokeWidth={1.5} /><KonvaText text="S" x={15} y={36} width={14} align="center" fontSize={10} fontStyle="bold" fill="#fff" /><KonvaText text={`Standard: ${countStandard}`} x={40} y={35} fontSize={12} fontStyle="bold" fill="#f8fafc" />
              <Circle x={22} y={62} radius={8} fill="#10b981" stroke="#1e293b" strokeWidth={1.5} /><KonvaText text="V" x={15} y={58} width={14} align="center" fontSize={10} fontStyle="bold" fill="#fff" /><KonvaText text={`Vegan / Veg: ${countVegan}`} x={40} y={57} fontSize={12} fontStyle="bold" fill="#f8fafc" />
              <Circle x={22} y={84} radius={8} fill="#3b82f6" stroke="#1e293b" strokeWidth={1.5} /><KonvaText text="C" x={15} y={80} width={14} align="center" fontSize={10} fontStyle="bold" fill="#fff" /><KonvaText text={`Meniu Copil: ${countCopil}`} x={40} y={79} fontSize={12} fontStyle="bold" fill="#f8fafc" />
              <Circle x={22} y={106} radius={8} fill="#ef4444" stroke="#1e293b" strokeWidth={1.5} /><KonvaText text="!" x={15} y={102} width={14} align="center" fontSize={10} fontStyle="bold" fill="#fff" /><KonvaText text={`Alergie/Special: ${countAlergie}`} x={40} y={101} fontSize={12} fontStyle="bold" fill="#f8fafc" />
            </Group>
          </Layer>
        </Stage>
      </div>

      {editingTable && !isExpired && (
        <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1e293b] p-7 rounded-2xl w-[350px] shadow-2xl border border-slate-700 animate-in zoom-in-95">
            <h3 className="text-lg font-semibold text-white mb-4">Redenumește Masa</h3>
            <form onSubmit={(e) => { e.preventDefault(); setTables(tables.map(t => t.id === editingTable.id ? editingTable : t)); setEditingTable(null); }} className="space-y-4">
              <input type="text" autoFocus value={editingTable.name} onChange={e => setEditingTable({...editingTable, name: e.target.value})} className="w-full p-3 bg-[#0f172a] border border-slate-600 rounded-lg focus:border-blue-500 outline-none text-white text-center font-bold text-lg" required />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingTable(null)} className="flex-1 py-3 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium">Anulează</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">Actualizează</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingGuest && !isExpired && (
        <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1e293b] p-7 rounded-2xl w-[420px] shadow-2xl border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-5">{editingGuest.name ? "Editează Invitat" : "Adaugă Invitat"}</h3>
            <form onSubmit={(e) => { e.preventDefault(); if (guests.find(g => g.id === editingGuest.id)) setGuests(guests.map(g => g.id === editingGuest.id ? editingGuest : g)); else setGuests([...guests, editingGuest]); setEditingGuest(null); }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nume Persoană / Familie *</label>
                <input autoFocus type="text" value={editingGuest.name} onChange={e => setEditingGuest({...editingGuest, name: e.target.value})} className="w-full p-3 bg-[#0f172a] border border-slate-600 rounded-lg focus:border-blue-500 outline-none text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Gen</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer ${editingGuest.gender === 'M' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#0f172a] border-slate-600 text-slate-400'}`}><input type="radio" name="gender" value="M" checked={editingGuest.gender === 'M'} onChange={(e) => setEditingGuest({...editingGuest, gender: e.target.value})} className="hidden" />Bărbat</label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer ${editingGuest.gender === 'F' ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-[#0f172a] border-slate-600 text-slate-400'}`}><input type="radio" name="gender" value="F" checked={editingGuest.gender === 'F'} onChange={(e) => setEditingGuest({...editingGuest, gender: e.target.value})} className="hidden" />Femeie</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tip Meniu (Ospătari)</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${(!editingGuest.menuType || editingGuest.menuType === 'standard') ? 'bg-slate-700 border-slate-500 text-white' : 'bg-[#0f172a] border-slate-600 text-slate-400'}`}><input type="radio" name="menuType" value="standard" checked={!editingGuest.menuType || editingGuest.menuType === 'standard'} onChange={(e) => setEditingGuest({...editingGuest, menuType: e.target.value})} className="hidden" />Standard</label>
                  <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${editingGuest.menuType === 'vegetarian' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-[#0f172a] border-slate-600 text-slate-400'}`}><input type="radio" name="menuType" value="vegetarian" checked={editingGuest.menuType === 'vegetarian'} onChange={(e) => setEditingGuest({...editingGuest, menuType: e.target.value})} className="hidden" />Vegan / Veg.</label>
                  <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${editingGuest.menuType === 'copil' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#0f172a] border-slate-600 text-slate-400'}`}><input type="radio" name="menuType" value="copil" checked={editingGuest.menuType === 'copil'} onChange={(e) => setEditingGuest({...editingGuest, menuType: e.target.value})} className="hidden" />Meniu Copil</label>
                  <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${editingGuest.menuType === 'alergie' ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-[#0f172a] border-slate-600 text-slate-400'}`}><input type="radio" name="menuType" value="alergie" checked={editingGuest.menuType === 'alergie'} onChange={(e) => setEditingGuest({...editingGuest, menuType: e.target.value})} className="hidden" />Alergie / Special</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Suma oferită (Opțional)</label>
                <div className="relative"><input type="number" value={editingGuest.giftAmount} onChange={e => setEditingGuest({...editingGuest, giftAmount: e.target.value})} className="w-full p-3 bg-[#0f172a] border border-slate-600 rounded-lg focus:border-emerald-500 outline-none text-emerald-400 font-bold pr-12" placeholder="0" /><span className="absolute right-4 top-3.5 text-slate-400 font-medium">lei</span></div>
              </div>
              <div onClick={() => setEditingGuest({...editingGuest, isPresent: !editingGuest.isPresent})} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer ${editingGuest.isPresent ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-800/50 border-slate-600'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${editingGuest.isPresent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}><Check size={18} /></div>
                  <div><p className={`text-sm font-bold ${editingGuest.isPresent ? 'text-emerald-400' : 'text-slate-400'}`}>{editingGuest.isPresent ? 'Prezent' : 'Absent / Așteptat'}</p></div>
                </div>
              </div>
              <div className="flex gap-3 mt-8 pt-4 border-t border-slate-700">
                {editingGuest.name && <button type="button" onClick={() => { setGuests(guests.filter(g => g.id !== editingGuest.id)); setEditingGuest(null); }} className="py-3 px-4 text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-lg"><Trash2 size={18} /></button>}
                <button type="button" onClick={() => setEditingGuest(null)} className="flex-1 py-3 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium">Anulează</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">Salvează</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 3. RUTARE PRINCIPALĂ
// =========================================================================
export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/eveniment/:eventId" element={<EventCanvas />} />
      </Routes>
    </Router>
  );
}