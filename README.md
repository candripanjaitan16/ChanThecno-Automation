membuat dashboard, untuk halaman user dan admin.

admin:
Memiliki menu

1. Untuk halaman Dahsboard dengan halaman untuk menampilkan user aktif, harga kredit, kemampuan ai.
2. Untuk halaman mengatur apikey midtrans, ai, model [lebih dari 1], endpoint [lebih dari 1], pembuatan untuk plan "free/pro", dan pro dan mengatur kredit dan mengatur nama "free", harga, model, pembatasan kredit.
3. Untuk mengatur halaman server, database kemana di simpan yang semuanya terkunci "Hanya mengatur halaman untuk database 100% di atur disini dan disimpan ke vps".
4. Mengatur untuk mengisi supaya bisa login google. "100% saya kelolah dari sini".

User:
Memiliki menu

1. Halaman ke dahshboard wajib login dengan google scret yang di isi di admin.
2. Halaman dahsboard yang menampilkan halaman yang berisi total kredit, history pemakaian.
3. Halaman akun yang mengatur nama toko, pemilik, nomor admin, dan halaman untuk toppup kredit yang di bayar ke api key midtrans yang menjadi tempat pembayaran.

src/
├── components/ # Komponen global (Button, Input, dll)
│ ├── ui/
│ └── admin/ # Komponen khusus admin (SidebarAdmin, NavbarAdmin)
├── layouts/ # Layout halaman
│ ├── AdminLayout.jsx # Layout dengan Sidebar + Header khusus Admin
│ └── GuestLayout.jsx # Layout untuk halaman umum / login
├── pages/ # Semua halaman aplikasi
│ ├── auth/ # Halaman Login / Register
│ │ └── Login.jsx
│ ├── admin/ # TEMPAT HALAMAN ADMIN DI SINI
│ │ ├── Dashboard.jsx
│ │ ├── Users.jsx
│ │ └── Products.jsx
│ └── main/ # Halaman utama user biasa (Home, About)
│ └── Home.jsx
├── App.jsx # Pengaturan Routing (React Router)
└── main.jsx
