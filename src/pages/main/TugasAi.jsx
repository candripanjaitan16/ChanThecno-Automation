import { useState } from "react";
import {
  Upload,
  Plus,
  GripVertical,
  Trash2,
  Bot,
  Phone,
  FileText,
  ShieldAlert,
} from "lucide-react";
import Sidebar from "../../components/ui/Sidebar";

export default function TugasAI() {
  const [taskFile, setTaskFile] = useState(null);
  const [ruleFile, setRuleFile] = useState(null);
  const [additionalTask, setAdditionalTask] = useState("");
  const [additionalRule, setAdditionalRule] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [stopReply, setStopReply] = useState(true);

  const [products, setProducts] = useState([
    {
      id: 1,
      name: "",
      description: "",
      price: "",
      stock: "",
      code: "CP-001",
    },
  ]);

  const handleFileChange = (event, type) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (type === "task") {
      setTaskFile(file);
    } else {
      setRuleFile(file);
    }
  };

  const addProduct = () => {
    const nextId = products.length + 1;

    setProducts([
      ...products,
      {
        id: nextId,
        name: "",
        description: "",
        price: "",
        stock: "",
        code: `CP-${String(nextId).padStart(3, "0")}`,
      },
    ]);
  };

  const removeProduct = (id) => {
    if (products.length === 1) return;

    setProducts(products.filter((product) => product.id !== id));
  };

  const updateProduct = (id, field, value) => {
    setProducts(
      products.map((product) =>
        product.id === id
          ? {
              ...product,
              [field]: value,
            }
          : product,
      ),
    );
  };

  const moveProduct = (index, direction) => {
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= products.length) return;

    const updatedProducts = [...products];
    const current = updatedProducts[index];

    updatedProducts[index] = updatedProducts[newIndex];
    updatedProducts[newIndex] = current;

    setProducts(updatedProducts);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <Bot size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Tugas AI
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Masukkan tugas untuk automation di WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Masukkan tugas AI
                  </h2>

                  <p className="text-xs text-slate-400">
                    Kamu bisa mengatur tugas AI kamu di sini.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row">
                <label className="flex min-h-[90px] w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center transition hover:border-blue-300 hover:bg-blue-50 md:w-40">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => handleFileChange(event, "task")}
                  />

                  <div>
                    <Upload size={22} className="mx-auto mb-2 text-slate-400" />

                    <p className="text-xs font-medium text-slate-600">
                      {taskFile ? taskFile.name : "Upload file"}
                    </p>

                    {!taskFile && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        Klik untuk memilih file
                      </p>
                    )}
                  </div>
                </label>

                <div className="flex-1">
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Informasi tugas
                  </p>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-medium text-slate-700">
                      Masukkan tugas AI
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Kamu bisa mengatur AI kamu disini. Masukkan dengan bagus
                      agar AI dapat memahami tugas yang diberikan.
                    </p>
                  </div>
                </div>
              </div>

              <textarea
                value={additionalTask}
                onChange={(event) => setAdditionalTask(event.target.value)}
                placeholder="Ketik tambahan"
                className="mt-4 min-h-[130px] w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-500" />

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Masukkan larangan untuk AI
                  </h2>

                  <p className="text-xs text-slate-400">
                    Atur hal-hal yang tidak boleh dilakukan oleh AI.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row">
                <label className="flex min-h-[90px] w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center transition hover:border-blue-300 hover:bg-blue-50 md:w-40">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => handleFileChange(event, "rule")}
                  />

                  <div>
                    <Upload size={22} className="mx-auto mb-2 text-slate-400" />

                    <p className="text-xs font-medium text-slate-600">
                      {ruleFile ? ruleFile.name : "Upload file"}
                    </p>

                    {!ruleFile && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        Klik untuk memilih file
                      </p>
                    )}
                  </div>
                </label>

                <div className="flex-1">
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Informasi larangan
                  </p>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-medium text-slate-700">
                      Masukkan larangan untuk AI
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Kamu bisa membuat aturan larangan AI kamu disini. Masukkan
                      dengan bagus agar AI dapat mengikuti aturan yang
                      diberikan.
                    </p>
                  </div>
                </div>
              </div>

              <textarea
                value={additionalRule}
                onChange={(event) => setAdditionalRule(event.target.value)}
                placeholder="Ketik tambahan"
                className="mt-4 min-h-[130px] w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-blue-600" />

                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Produk
                    </h2>

                    <p className="text-xs text-slate-400">
                      Masukkan produk yang akan digunakan oleh AI.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="w-12 px-3 py-3 text-center text-xs font-semibold text-slate-500">
                        #
                      </th>

                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">
                        ID
                      </th>

                      <th className="min-w-[150px] px-3 py-3 text-left text-xs font-semibold text-slate-500">
                        Nama
                      </th>

                      <th className="min-w-[180px] px-3 py-3 text-left text-xs font-semibold text-slate-500">
                        Deskripsi
                      </th>

                      <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-slate-500">
                        Harga
                      </th>

                      <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-slate-500">
                        Stok
                      </th>

                      <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-slate-500">
                        Kode
                      </th>

                      <th className="w-20 px-3 py-3 text-center text-xs font-semibold text-slate-500">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product, index) => (
                      <tr
                        key={product.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveProduct(index, -1)}
                              disabled={index === 0}
                              className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                            >
                              ↑
                            </button>

                            <GripVertical
                              size={16}
                              className="text-slate-300"
                            />

                            <button
                              type="button"
                              onClick={() => moveProduct(index, 1)}
                              disabled={index === products.length - 1}
                              className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                            >
                              ↓
                            </button>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-xs font-medium text-slate-500">
                          {String(index + 1).padStart(2, "0")}
                        </td>

                        <td className="px-3 py-3">
                          <input
                            type="text"
                            value={product.name}
                            onChange={(event) =>
                              updateProduct(
                                product.id,
                                "name",
                                event.target.value,
                              )
                            }
                            placeholder="Nama produk"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            type="text"
                            value={product.description}
                            onChange={(event) =>
                              updateProduct(
                                product.id,
                                "description",
                                event.target.value,
                              )
                            }
                            placeholder="Deskripsi"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={product.price}
                            onChange={(event) =>
                              updateProduct(
                                product.id,
                                "price",
                                event.target.value,
                              )
                            }
                            placeholder="Rp 0"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={product.stock}
                            onChange={(event) =>
                              updateProduct(
                                product.id,
                                "stock",
                                event.target.value,
                              )
                            }
                            placeholder="0"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            type="text"
                            value={product.code}
                            onChange={(event) =>
                              updateProduct(
                                product.id,
                                "code",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeProduct(product.id)}
                            disabled={products.length === 1}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    <tr>
                      <td colSpan="8" className="px-3 py-3">
                        <button
                          type="button"
                          onClick={addProduct}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          <Plus size={16} />
                          Tambahkan Produk
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Phone size={18} className="text-emerald-600" />

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Nomor WhatsApp Admin
                  </h2>

                  <p className="text-xs text-slate-400">
                    Nomor khusus yang digunakan AI sebagai Admin.
                  </p>
                </div>
              </div>

              <label className="mb-2 block text-xs font-medium text-slate-500">
                Nomor WhatsApp
              </label>

              <input
                type="tel"
                value={whatsappNumber}
                onChange={(event) => setWhatsappNumber(event.target.value)}
                placeholder="Masukkan Nomor WA Admin"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 md:max-w-md"
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={stopReply}
                  onChange={(event) => setStopReply(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Hentikan balasan AI ketika pembeli menyetujui barang dan mengirim nomor admin.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    ChanThecno Automation akan mengatur agar AI berhenti
                    membalas ketika pembeli menyetujui transaksi untuk menghemat kredit. Jika belum
                    berhasil, ChanThecno akan memberikan notif <b>Wa</b>.
                  </p>
                </div>
              </label>
            </section>

            <div className="flex justify-end pb-4">
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
              >
                Simpan Tugas AI
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
