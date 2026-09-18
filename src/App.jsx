import { BrowserRouter, Routes, Route } from "react-router-dom";
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
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/kelola-kredit" element={<KelolaKredit />} />
        <Route path="/riwayat-transaksi" element={<RiwayatTransaksi />} />
        <Route path="/tugas-ai" element={<TugasAI />} />
        <Route path="/pengaturan" element={<Pengaturan />} />
        <Route path="/test-chat" element={<TestChat />} />
        <Route path="/qr-whatsapp" element={<QrWhatsapp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
