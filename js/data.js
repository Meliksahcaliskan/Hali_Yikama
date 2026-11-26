/* =========================================================
   Ezgi Halı Yıkama — Ortak veri ve yardımcı fonksiyonlar
   Fiyatları buradan değiştirebilirsiniz (demo değerleridir).
   ========================================================= */
const EZGI = {
  // m² başına fiyat (₺)
  rugTypes: [
    { id: "makine", name: "Makine Halısı",      price: 60,  desc: "Günlük kullanım halıları için derinlemesine yıkama." },
    { id: "shaggy", name: "Shaggy / Post Halı", price: 80,  desc: "Uzun tüylü halılar için özel şampuan ve kurutma." },
    { id: "yun",    name: "Yün Halı",           price: 100, desc: "Doğal liflere zarar vermeyen düşük pH'lı yıkama." },
    { id: "el",     name: "El Dokuma / İpek",   price: 180, desc: "Değerli halılar için elde, uzman ekiple yıkama." },
  ],

  // Hazır ölçüler (en x boy, cm)
  sizes: [
    { id: "80x150",  label: "80 × 150 cm",  m2: 1.2 },
    { id: "100x200", label: "100 × 200 cm", m2: 2.0 },
    { id: "120x180", label: "120 × 180 cm", m2: 2.16 },
    { id: "160x230", label: "160 × 230 cm", m2: 3.68 },
    { id: "200x290", label: "200 × 290 cm", m2: 5.8 },
    { id: "250x350", label: "250 × 350 cm", m2: 8.75 },
    { id: "ozel",    label: "Özel ölçü (m² gir)", m2: null },
  ],

  minOrder: 300,          // Minimum sipariş tutarı (₺)
  storageKey: "ezgi_orders",

  phone: "0 (850) 000 00 00",
  whatsapp: "0 (500) 000 00 00",
  email: "info@ezgihaliyikama.com",
};

const fmtTL = (n) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(n);

const fmtM2 = (n) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n) + " m²";

const getRugType = (id) => EZGI.rugTypes.find((t) => t.id === id);

function loadOrders() {
  try { return JSON.parse(localStorage.getItem(EZGI.storageKey)) || []; }
  catch { return []; }
}
function saveOrders(list) {
  localStorage.setItem(EZGI.storageKey, JSON.stringify(list));
}

// Mobil menü
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) toggle.addEventListener("click", () => nav.classList.toggle("open"));
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
});
