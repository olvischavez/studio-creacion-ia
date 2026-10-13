import React, { useState, useEffect } from 'react';
import { Header, MainTabId } from './components/Header';
import { AICreationTab } from './components/AICreationTab';
import { SavedProjectsTab } from './components/SavedProjectsTab';
import { AdminPanelTab } from './components/AdminPanelTab';
import { LockedTabPaywall } from './components/LockedTabPaywall';
import { LoginMembershipModal } from './components/LoginMembershipModal';
import { QRPaymentModal } from './components/QRPaymentModal';
import { MembershipProvider, useMembership } from './context/MembershipContext';
import { INITIAL_FLOW_DOC, INITIAL_POV_SHORT } from './data/mockTemplates';
import { 
  buildUniversalHistoricalDocumentary, 
  buildAntiochSiegeDocumentary, 
  buildTeutonicLakePeipusDocumentary 
} from './data/historicalChronicles';
import { FlowDocumentary, FlowChapter, FlowClip, POVShort } from './types/content';
import { db, doc, setDoc, deleteDoc, collection, getDocs } from './lib/firebase';
import { cleanStoryVoiceover } from './utils/textCleaning';

interface SavedItem {
  id: string;
  type: 'strategy' | 'flow_doc' | 'pov_short';
  title: string;
  timestamp: string;
  data: any;
}

export function sanitizeFlowDoc(doc: FlowDocumentary): FlowDocumentary {
  if (!doc || !Array.isArray(doc.chapters)) return doc;
  return {
    ...doc,
    chapters: doc.chapters.map((chapter: FlowChapter) => ({
      ...chapter,
      clips: Array.isArray(chapter.clips) ? chapter.clips.map((clip: FlowClip) => ({
        ...clip,
        voiceoverSegmentSpanish: cleanStoryVoiceover(clip.voiceoverSegmentSpanish),
        voiceoverSegmentEnglish: clip.voiceoverSegmentEnglish ? cleanStoryVoiceover(clip.voiceoverSegmentEnglish) : clip.voiceoverSegmentEnglish,
      })) : []
    }))
  };
}

function MainAppContent() {
  const { currentUser, hasAccessToTab, isMasterAdmin, qrPaymentModalOpen, setQrPaymentModalOpen, refreshUser, login } = useMembership();

  const [activeTab, setActiveTab] = useState<MainTabId>('ai');
  const [flowDoc, setFlowDoc] = useState<FlowDocumentary>(() => sanitizeFlowDoc(INITIAL_FLOW_DOC));
  const [povShort, setPovShort] = useState<POVShort>(INITIAL_POV_SHORT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Saved items with localStorage and backend user database
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    try {
      const stored = localStorage.getItem('olvis_bolt_saved_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Load user saved projects from Firestore and database when user is logged in
  useEffect(() => {
    if (!currentUser?.email) return;
    const fetchUserSaved = async () => {
      const cleanEmail = currentUser.email.toLowerCase();
      const safeId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');

      // 1. Try Firestore
      try {
        const querySnap = await getDocs(collection(db, 'users', safeId, 'savedProjects'));
        if (!querySnap.empty) {
          const firestoreItems: SavedItem[] = [];
          querySnap.forEach((d) => {
            firestoreItems.push(d.data() as SavedItem);
          });
          if (firestoreItems.length > 0) {
            setSavedItems(firestoreItems);
            return;
          }
        }
      } catch (firestoreErr) {
        console.warn('Firestore load saved notice:', firestoreErr);
      }

      // 2. Fallback to server DB
      try {
        const res = await fetch(`/api/user/saved-projects?email=${encodeURIComponent(cleanEmail)}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.items) && json.items.length > 0) {
            setSavedItems(json.items);
          }
        }
      } catch (e) {
        console.warn('Could not sync user saved projects from DB:', e);
      }
    };
    fetchUserSaved();
  }, [currentUser?.email]);

  useEffect(() => {
    try {
      localStorage.setItem('olvis_bolt_saved_items', JSON.stringify(savedItems));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [savedItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Generating new Google Flow 9-minute documentary
  const handleGenerateDocumentary = async (topic: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/generate-flow-documentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      if (res.ok) {
        const data = await res.json();
        setFlowDoc(sanitizeFlowDoc(data));
        showToast(`¡Documental (10 Actos) generado para "${data.documentaryTitle.slice(0, 35)}..."!`);
        return;
      }
      throw new Error(`Server returned status ${res.status}`);
    } catch (err: any) {
      console.warn('Documentary API notice, using intelligent fallback generator:', err);
      try {
        const cleanTopic = (topic || 'Historia Antigua').trim();
        const fallback = /antioqu/i.test(cleanTopic)
          ? buildAntiochSiegeDocumentary()
          : /peipus|teuton/i.test(cleanTopic)
          ? buildTeutonicLakePeipusDocumentary()
          : buildUniversalHistoricalDocumentary(cleanTopic);
        setFlowDoc(sanitizeFlowDoc(fallback));
        showToast(`¡Documental (10 Actos) generado para "${fallback.documentaryTitle.slice(0, 35)}..."!`);
      } catch (e2) {
        setErrorMessage('No se pudo generar el documental con IA en este momento.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Generating new POV Short (4 scenes, 20-30s)
  const handleGeneratePOV = async (scenario: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/generate-pov-short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      if (res.ok) {
        const data = await res.json();
        setPovShort(data);
        showToast(`¡Short POV (4 Escenas • ${data.durationSeconds || 26}s) generado con éxito!`);
        return;
      }
      throw new Error(`Server returned status ${res.status}`);
    } catch (err: any) {
      console.warn('POV API notice, using procedural fallback:', err);
      try {
        const sc = (scenario || 'Cripta Medieval').trim();
        const fallback = {
          ...INITIAL_POV_SHORT,
          title: `POV: ${sc.slice(0, 50)}`,
          hook: `POV: Estás en ${sc.slice(0, 40)} y no hay vuelta atrás`,
        };
        setPovShort(fallback);
        showToast(`¡Short POV generado con éxito!`);
      } catch (e2) {
        setErrorMessage('No se pudo generar el POV con IA en este momento.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save Item to user database and state
  const handleSaveItem = async (itemPayload: { type: 'strategy' | 'flow_doc' | 'pov_short'; data: any }) => {
    const title = itemPayload.type === 'flow_doc' 
      ? itemPayload.data.documentaryTitle 
      : itemPayload.data.title;

    const exists = savedItems.some(i => i.title === title && i.type === itemPayload.type);
    let updatedList: SavedItem[];
    let itemToSave: SavedItem;

    if (exists) {
      itemToSave = {
        ...savedItems.find(i => i.title === title && i.type === itemPayload.type)!,
        timestamp: new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        data: itemPayload.data
      };
      updatedList = savedItems.map(i => (i.title === title && i.type === itemPayload.type) ? itemToSave : i);
      setSavedItems(updatedList);
      showToast('¡Temática actualizada y guardada en tu base de datos!');
    } else {
      itemToSave = {
        id: Date.now().toString(),
        type: itemPayload.type,
        title: title || 'Sin título',
        timestamp: new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        data: itemPayload.data
      };
      updatedList = [itemToSave, ...savedItems];
      setSavedItems(updatedList);
      showToast('¡Temática guardada en la base de datos de tu usuario!');
    }

    // Persist to user database in server and Firestore
    if (currentUser?.email) {
      const cleanEmail = currentUser.email.toLowerCase();
      const safeId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');

      // 1. Firestore Save
      try {
        const projectDocRef = doc(db, 'users', safeId, 'savedProjects', itemToSave.id);
        await setDoc(projectDocRef, {
          ...itemToSave,
          userId: cleanEmail,
          userEmail: cleanEmail,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn('Firestore save project notice:', firestoreErr);
      }

      // 2. Server DB Save
      try {
        await fetch('/api/user/saved-projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            item: itemToSave
          })
        });
      } catch (e) {
        console.warn('Could not persist to server database:', e);
      }
    }
  };

  // Load Saved Item back to main screen
  const handleLoadItem = (item: SavedItem) => {
    if (item.type === 'flow_doc') {
      setFlowDoc(sanitizeFlowDoc(item.data));
      setActiveTab('ai');
      showToast(`Documental "${item.title.slice(0, 30)}..." cargado en Google Flow.`);
    } else if (item.type === 'pov_short') {
      setPovShort(item.data);
      setActiveTab('ai');
      showToast(`Short POV "${item.title.slice(0, 30)}..." cargado.`);
    }
  };

  const isCurrentSaved = (type: 'strategy' | 'flow_doc' | 'pov_short', currentTitle: string) => {
    return savedItems.some(i => i.type === type && i.title === currentTitle);
  };

  const handleRemoveSaved = async (id: string) => {
    setSavedItems(prev => prev.filter(i => i.id !== id));
    if (currentUser?.email) {
      const cleanEmail = currentUser.email.toLowerCase();
      const safeId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');

      // 1. Delete from Firestore
      try {
        await deleteDoc(doc(db, 'users', safeId, 'savedProjects', id));
      } catch (firestoreErr) {
        console.warn('Firestore delete notice:', firestoreErr);
      }

      // 2. Delete from server DB
      try {
        await fetch(`/api/user/saved-projects/${id}?email=${encodeURIComponent(currentUser.email)}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.warn('Could not delete from user database:', e);
      }
    }
  };

  const handleClearAllSaved = () => {
    if (window.confirm('¿Seguro que deseas eliminar todos los proyectos guardados?')) {
      setSavedItems([]);
      showToast('Todos los guardados fueron eliminados');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header with Channel Identity, Membership Pill & Tabs */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedCount={savedItems.length}
      />

      {/* Global Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-emerald-500/60 text-emerald-300 text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Error alert banner */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-amber-400 hover:text-white font-bold ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area based on Tab and User Permissions */}
      <main className="flex-1 pb-16">
        
        {/* Tab 1: Creación con IA */}
        {activeTab === 'ai' && (
          hasAccessToTab('ai') ? (
            <AICreationTab
              documentary={flowDoc}
              povShort={povShort}
              onGenerateDocumentary={handleGenerateDocumentary}
              onGeneratePOV={handleGeneratePOV}
              isLoading={isLoading}
              onSave={handleSaveItem}
              isDocSaved={isCurrentSaved('flow_doc', flowDoc.documentaryTitle)}
              isPovSaved={isCurrentSaved('pov_short', povShort.title)}
            />
          ) : (
            <LockedTabPaywall 
              tabName="Creación con IA"
              description="Genera documentales monetizables para usar en Youtube o Facebook"
            />
          )
        )}

        {/* Tab 2: Proyectos Guardados */}
        {activeTab === 'saved' && (
          hasAccessToTab('saved') ? (
            <SavedProjectsTab
              savedItems={savedItems}
              onRemove={handleRemoveSaved}
              onClearAll={handleClearAllSaved}
              onLoadItem={handleLoadItem}
            />
          ) : (
            <LockedTabPaywall 
              tabName="Temáticas Guardadas" 
              description="Guarda y administra tus documentales y shorts favoritos en tu base de datos de usuario."
            />
          )
        )}

        {/* Tab 3: EXCLUSIVE ADMIN PANEL (STRICTLY FOR OLVIS: olvischavezmustafa@gmail.com) */}
        {activeTab === 'admin' && (
          (currentUser && currentUser.email.trim().toLowerCase() === 'olvischavezmustafa@gmail.com') ? (
            <AdminPanelTab />
          ) : (
            <LockedTabPaywall 
              tabName="Panel de Administrador"
              description="Este panel solo está visible y es editable para el correo del propietario: olvischavezmustafa@gmail.com"
            />
          )
        )}

      </main>

      {/* Bottom Sticky Status Bar */}
      <footer className="border-t border-zinc-900 bg-zinc-950/95 py-3 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-zinc-400">
              Olvis Bolt Studio
            </span>
          </div>
        </div>
      </footer>

      {/* Login & Membership Modal */}
      <LoginMembershipModal />

      {/* QR Payment Modal (Bolivia & Binance) */}
      <QRPaymentModal 
        isOpen={qrPaymentModalOpen} 
        onClose={() => setQrPaymentModalOpen(false)} 
      />

    </div>
  );
}

export default function App() {
  return (
    <MembershipProvider>
      <MainAppContent />
    </MembershipProvider>
  );
}
