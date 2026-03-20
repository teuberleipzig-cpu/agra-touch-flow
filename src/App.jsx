import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Home from './pages/Home';
import Admin from './pages/Admin';
import { AuthProvider } from '@/lib/AuthContext';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            {/* Startseite = Kiosk-App (Wochenmodus / Eventmodus / Notfall) */}
            <Route path="/" element={<Home />} />
            <Route path="/Home" element={<Home />} />

            {/* Admin-Bereich – nur für Büro-Nutzung */}
            <Route path="/Admin" element={<Admin />} />

            {/* Alle anderen URLs → Kiosk-Startseite */}
            <Route path="*" element={<Home />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
