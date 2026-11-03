import { AppProvider } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { LeftSidebar } from '@/components/sidebar/LeftSidebar';
import { MainEditor } from '@/components/editor/Editor';
import { RightSidebar } from '@/components/sidebar/RightSidebar';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { useApp } from '@/contexts/AppContext';

function Layout() {
  const { focusMode } = useApp();

  return (
    <div className={`h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden transition-all duration-500 ${focusMode ? 'items-center justify-start pt-4' : ''}`}>
      <Header />
      <main className={`flex-1 flex overflow-hidden relative transition-all duration-500 ${
        focusMode
          ? 'w-full max-w-2xl items-center justify-center'
          : 'w-full'
      }`}>
        {!focusMode && <LeftSidebar />}
        <MainEditor />
        {!focusMode && <RightSidebar />}
      </main>
      <SettingsModal />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}

export default App;
