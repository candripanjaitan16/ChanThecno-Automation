import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/main/Dashboard";
import KelolaKredit from "./pages/main/KelolaKredit";
import RiwayatTransaksi from "./pages/main/RiwayatTransaksi";
import TugasAI from "./pages/main/TugasAi";
import Pengaturan from "./pages/main/Pengaturan";
import TestChat from "./pages/main/TestChat";
import QrWhatsapp from "./pages/main/QrWhatsapp";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Publik */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Wajib login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/kelola-kredit" element={<KelolaKredit />} />
            <Route path="/riwayat-transaksi" element={<RiwayatTransaksi />} />
            <Route path="/tugas-ai" element={<TugasAI />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
            <Route path="/test-chat" element={<TestChat />} />
            <Route path="/qr-whatsapp" element={<QrWhatsapp />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
