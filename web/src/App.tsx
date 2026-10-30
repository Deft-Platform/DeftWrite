import { AppProvider } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { LeftSidebar } from '@/components/sidebar/LeftSidebar';
import { MainEditor } from '@/components/editor/Editor';
import { RightSidebar } from '@/components/sidebar/RightSidebar';
import { SettingsModal } from '@/components/settings/SettingsModal';

function App() {
  return (
    <AppProvider>
      <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
        <Header />
        <main className="flex-1 flex overflow-hidden">
          <LeftSidebar />
          <MainEditor />
          <RightSidebar />
        </main>
        <SettingsModal />
      </div>
    </AppProvider>
  );
}

export default App;
