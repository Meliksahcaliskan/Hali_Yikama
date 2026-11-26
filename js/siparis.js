/* =========================================================
   Ezgi Halı Yıkama — Sipariş akışı
   ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let uid = 0;
  let rugs = [];
  let customer = null;

  const newRug = (type = "makine", size = "160x230", m2 = 3.68, qty = 1) => ({ id: ++uid, type, size, m2, qty });

  // URL'den gelen hızlı hesaplama verisi (ana sayfadan)
  const params = new URLSearchParams(location.search);
  if (params.get("tur") && getRugType(params.get("tur"))) {
    const adet = Math.max(1, Math.min(20, parseInt(params.get("adet")) || 1));
    const total = parseFloat(params.get("m2")) || 0;
    const each = total > 0 ? Math.round((total / adet) * 100) / 100 : 3.68;
    rugs.push(newRug(params.get("tur"), "ozel", each, adet));
  } else {
    rugs.push(newRug());
  }

  /* ---------- Hesaplamalar ---------- */
  const lineTotal = (r) => (r.m2 || 0) * (r.qty || 0) * getRugType(r.type).price;
  function totals() {
    const count = rugs.reduce((a, r) => a + (r.qty || 0), 0);
    const m2 = rugs.reduce((a, r) => a + (r.m2 || 0) * (r.qty || 0), 0);
    const sub = rugs.reduce((a, r) => a + lineTotal(r), 0);
    const minDiff = sub > 0 && sub < EZGI.minOrder ? EZGI.minOrder - sub : 0;
    return { count, m2, sub, minDiff, total: sub + minDiff };
  }

  /* ---------- Halı satırları ---------- */
  const typeOptions = (sel) =>
    EZGI.rugTypes.map((t) => `<option value="${t.id}" ${t.id === sel ? "selected" : ""}>${t.name} (${fmtTL(t.price)}/m²)</option>`).join("");
  const sizeOptions = (sel) =>
    EZGI.sizes.map((s) => `<option value="${s.id}" ${s.id === sel ? "selected" : ""}>${s.label}</option>`).join("");

  function renderRugs() {
    $("#rugList").innerHTML = rugs.map((r, i) => `
      <div class="rug-row" data-id="${r.id}">
        <div class="rug-index">${i + 1}</div>
        <div class="field">
          <label>Halı türü</label>
          <select data-k="type">${typeOptions(r.type)}</select>
        </div>
        <div class="field">
          <label>Ölçü</label>
          <select data-k="size">${sizeOptions(r.size)}</select>
        </div>
        <div class="field">
          <label>m² (tek halı)</label>
          <input data-k="m2" type="number" min="0.5" max="100" step="0.01" value="${r.m2 ?? ""}" ${r.size !== "ozel" ? "disabled" : ""} />
        </div>
        <div class="field">
          <label>Adet</label>
          <input data-k="qty" type="number" min="1" max="50" step="1" value="${r.qty}" />
        </div>
        <div class="rug-total"><small>Tutar</small><strong data-total>${fmtTL(lineTotal(r))}</strong></div>
        <button type="button" class="rug-remove" title="Kaldır" ${rugs.length === 1 ? "disabled" : ""}>×</button>
      </div>`).join("");
    renderSummary();
  }

  $("#rugList").addEventListener("input", (e) => {
    const row = e.target.closest(".rug-row");
    if (!row || !e.target.dataset.k) return;
    const rug = rugs.find((r) => r.id === +row.dataset.id);
    const k = e.target.dataset.k;
    const v = e.target.value;

    if (k === "type") rug.type = v;
    if (k === "qty") rug.qty = Math.max(0, parseInt(v) || 0);
    if (k === "m2") rug.m2 = Math.max(0, parseFloat(v) || 0);
    if (k === "size") {
      rug.size = v;
      const s = EZGI.sizes.find((x) => x.id === v);
      const m2Input = $('[data-k="m2"]', row);
      m2Input.disabled = v !== "ozel";
      if (s.m2) { rug.m2 = s.m2; m2Input.value = s.m2; }
      else m2Input.focus();
    }
    $("[data-total]", row).textContent = fmtTL(lineTotal(rug));
    renderSummary();
  });

  $("#rugList").addEventListener("click", (e) => {
    if (!e.target.classList.contains("rug-remove")) return;
    const id = +e.target.closest(".rug-row").dataset.id;
    rugs = rugs.filter((r) => r.id !== id);
    renderRugs();
  });

  $("#addRug").addEventListener("click", () => {
    rugs.push(newRug());
    renderRugs();
  });

  /* ---------- Özet ---------- */
  function renderSummary() {
    const t = totals();
    const valid = rugs.filter((r) => r.m2 > 0 && r.qty > 0);
    $("#summaryLines").innerHTML = valid.length
      ? valid.map((r) => `
          <div class="line">
            <span>${r.qty} × ${getRugType(r.type).name}<br><small>${fmtM2(r.m2)} / adet</small></span>
            <span>${fmtTL(lineTotal(r))}</span>
          </div>`).join("")
      : `<p class="summary-empty">Henüz halı eklenmedi.</p>`;
    $("#sumCount").textContent = `${t.count} adet`;
    $("#sumM2").textContent = fmtM2(t.m2);
    $("#minLine").classList.toggle("hidden", !t.minDiff);
    $("#minDiff").textContent = fmtTL(t.minDiff);
    $("#sumTotal").textContent = fmtTL(t.total);
  }

  /* ---------- Adım geçişleri ---------- */
  function goto(step) {
    $$("[data-panel]").forEach((p) => p.classList.toggle("hidden", +p.dataset.panel !== step));
    $$(".progress-step").forEach((s) => {
      const n = +s.dataset.step;
      s.classList.toggle("active", n === step);
      s.classList.toggle("done", n < step || step === 4);
    });
    $("#summary").classList.toggle("hidden", step === 4);
    if (step === 3) renderReview();
    window.scrollTo({ top: $(".order-wrap").offsetTop - 80, behavior: "smooth" });
  }
  $$("[data-goto]").forEach((b) => b.addEventListener("click", () => goto(+b.dataset.goto)));

  $("#toStep2").addEventListener("click", () => {
    const bad = rugs.find((r) => !(r.m2 > 0) || !(r.qty > 0));
    if (bad) {
      alert("Lütfen tüm halılar için geçerli bir m² ve adet girin.");
      return;
    }
    goto(2);
  });

  /* ---------- Adres formu ---------- */
  const dateInput = $("#date");
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  dateInput.min = toISO(tomorrow);
  const max = new Date(); max.setDate(max.getDate() + 30);
  dateInput.max = toISO(max);
  if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1); // Pazar'ı atla
  dateInput.value = toISO(tomorrow);

  function validateField(el) {
    const f = el.closest(".field");
    let ok = el.value.trim().length > 1;
    if (el.id === "phone") ok = /^0?5\d{9}$/.test(el.value.replace(/\D/g, ""));
    if (el.id === "date") {
      const d = new Date(el.value + "T00:00");
      ok = !!el.value && el.value >= el.min && el.value <= el.max && d.getDay() !== 0;
    }
    f.classList.toggle("invalid", !ok);
    return ok;
  }
  $$("#addressForm [required]").forEach((el) =>
    el.addEventListener("blur", () => validateField(el))
  );

  $("#addressForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fields = $$("#addressForm [required]");
    const results = fields.map(validateField);
    if (results.includes(false)) {
      fields[results.indexOf(false)].focus();
      return;
    }
    const fd = new FormData(e.target);
    customer = Object.fromEntries(fd.entries());
    goto(3);
  });

  /* ---------- Onay ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (iso) => new Date(iso + "T00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  function renderReview() {
    const t = totals();
    $("#reviewRugs").innerHTML = `
      <tr><th>Halı</th><th>m² / adet</th><th>Adet</th><th>Tutar</th></tr>
      ${rugs.map((r) => `<tr><td>${getRugType(r.type).name}</td><td>${fmtM2(r.m2)}</td><td>${r.qty}</td><td>${fmtTL(lineTotal(r))}</td></tr>`).join("")}
      ${t.minDiff ? `<tr><td colspan="3">Minimum sipariş farkı</td><td>${fmtTL(t.minDiff)}</td></tr>` : ""}
      <tr><td colspan="3"><strong>Toplam (${t.count} halı, ${fmtM2(t.m2)})</strong></td><td><strong>${fmtTL(t.total)}</strong></td></tr>`;
    const c = customer;
    $("#reviewAddress").innerHTML = `
      <dt>Ad Soyad</dt><dd>${esc(c.name)}</dd>
      <dt>Telefon</dt><dd>${esc(c.phone)}</dd>
      <dt>Adres</dt><dd>${esc(c.neighborhood)} Mah., ${esc(c.address)}<br>${esc(c.district)} / ${esc(c.city)}</dd>
      <dt>Alım zamanı</dt><dd>${fmtDate(c.date)}, ${esc(c.slot)}</dd>
      ${c.note ? `<dt>Not</dt><dd>${esc(c.note)}</dd>` : ""}`;
  }

  $("#agree").addEventListener("change", (e) => ($("#submitOrder").disabled = !e.target.checked));

  $("#submitOrder").addEventListener("click", () => {
    const t = totals();
    const no = "EZG-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);
    const order = {
      no,
      createdAt: new Date().toISOString(),
      status: "new",
      rugs: rugs.map((r) => ({ type: r.type, typeName: getRugType(r.type).name, m2: r.m2, qty: r.qty, price: getRugType(r.type).price, total: lineTotal(r) })),
      totals: t,
      customer,
      payment: "Kapıda (nakit / kart)",
    };
    // DEMO: Sipariş tarayıcıda saklanır. Gerçek sürümde burası bir API'ye gönderilecek.
    const list = loadOrders();
    list.unshift(order);
    saveOrders(list);

    $("#orderNo").textContent = no;
    $("#successInfo").innerHTML =
      `Alım zamanı: <strong>${fmtDate(customer.date)}, ${esc(customer.slot)}</strong><br>Tahmini tutar: <strong>${fmtTL(t.total)}</strong> — ödeme teslimatta.`;
    goto(4);
  });

  renderRugs();
})();
