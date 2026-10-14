(function () {
  const D = window.COSMIA_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function linkWhatsapp(texto) {
    const msg = encodeURIComponent(texto || `Hola! Quiero consultar por un turno en ${D.negocio.nombre}.`);
    return `https://wa.me/${String(D.negocio.whatsapp || "").replace(/\D/g, "")}?text=${msg}`;
  }
  const money = n => "$ " + Number(n).toLocaleString("es-AR");
  const dur = m => m < 60 ? m + " min" : Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : "");

  // ---------- Textos generales ----------
  $$("[data-bind]").forEach(el => { el.textContent = D.negocio[el.dataset.bind] || ""; });
  document.title = D.negocio.nombre;
  $("#btn-wa-general").href = linkWhatsapp();
  if (D.consejo) {
    $("#consejo-titulo").textContent = D.consejo.titulo;
    $("#consejo-texto").textContent = D.consejo.texto;
  } else $("#consejo").remove();

  // ---------- Splash ----------
  window.addEventListener("load", () => {
    setTimeout(() => $("#splash").classList.add("out"), reduceMotion ? 0 : 1300);
  });

  // ---------- Topbar compacto al scrollear ----------
  const topbar = $("#topbar");
  const onScroll = () => {
    const s = scrollY > 40;
    topbar.classList.toggle("scrolled", s);
    document.body.classList.toggle("scrolled", s);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Efecto ripple en botones ----------
  document.addEventListener("pointerdown", e => {
    const btn = e.target.closest(".btn");
    if (!btn || reduceMotion) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    btn.appendChild(span);
    span.addEventListener("animationend", () => span.remove());
  });

  // ---------- Toasts ----------
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    $("#toasts").appendChild(t);
    setTimeout(() => {
      t.classList.add("out");
      t.addEventListener("animationend", () => t.remove());
    }, 2600);
  }

  // ---------- Confirmación ----------
  function confirmar(texto) {
    return new Promise(resolve => {
      const box = $("#confirm");
      $("#confirm-text").textContent = texto;
      box.hidden = false;
      const fin = v => { box.hidden = true; yes.onclick = no.onclick = null; resolve(v); };
      const yes = $("#confirm-yes"), no = $("#confirm-no");
      yes.onclick = () => fin(true);
      no.onclick = () => fin(false);
    });
  }

  // ---------- Revelado al scrollear ----------
  const revealObs = "IntersectionObserver" in window
    ? new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) { en.target.classList.add("in"); revealObs.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
    : null;
  function observarReveal(root = document) {
    $$(".reveal:not(.in)", root).forEach(el => revealObs ? revealObs.observe(el) : el.classList.add("in"));
  }

  // ---------- Swipe genérico ----------
  function onSwipe(el, cb) {
    let x0 = null, y0 = null;
    el.addEventListener("pointerdown", e => { x0 = e.clientX; y0 = e.clientY; });
    el.addEventListener("pointerup", e => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) cb(dx < 0 ? 1 : -1);
    });
    el.addEventListener("pointercancel", () => { x0 = null; });
  }

  // ======================================================
  //  CARRUSEL PRINCIPAL
  // ======================================================
  const Hero = (() => {
    const DURACION = 5500;
    const track = $("#hero-track"), dots = $("#hero-dots"), bar = $("#hero-progress");
    let i = 0, n = 0, timer = null, anim = null, pausado = false;

    async function render() {
      const fotos = await Fotos.listar("hero");
      const textos = D.hero.length ? D.hero : [{ titulo: D.negocio.nombre, texto: D.negocio.eslogan }];
      n = Math.max(textos.length, fotos.length);
      track.innerHTML = "";
      dots.innerHTML = "";
      for (let k = 0; k < n; k++) {
        const t = textos[k % textos.length];
        const f = fotos[k];
        const slide = document.createElement("div");
        slide.className = "slide";
        slide.setAttribute("aria-roledescription", "slide");
        slide.innerHTML = `
          <div class="slide-bg ${f ? "" : "placeholder"}" ${f ? `style="background-image:url('${f.url}')"` : ""}></div>
          <div class="slide-content">
            <span class="eyebrow">${esc(D.negocio.etiqueta || "")}</span>
            <h2>${esc(t.titulo)}</h2>
            <p>${esc(t.texto)}</p>
            <a class="btn btn-light btn-lg" href="#${D.secciones[0]?.id || "contacto"}">Ver servicios</a>
          </div>`;
        track.appendChild(slide);
        const d = document.createElement("button");
        d.setAttribute("role", "tab");
        d.setAttribute("aria-label", `Ir a la imagen ${k + 1}`);
        d.onclick = () => ir(k);
        dots.appendChild(d);
      }
      i = Math.min(i, n - 1);
      ir(i, true);
    }

    function ir(k, inmediato) {
      if (!n) return;
      i = (k + n) % n;
      $$(".slide", track).forEach((s, idx) => s.classList.toggle("active", idx === i));
      $$("button", dots).forEach((d, idx) => {
        d.classList.toggle("active", idx === i);
        d.setAttribute("aria-selected", idx === i);
      });
      reiniciar(inmediato);
    }

    function reiniciar() {
      clearTimeout(timer);
      if (anim) anim.cancel();
      if (n < 2 || pausado || reduceMotion) { bar.style.width = n < 2 ? "100%" : "0"; return; }
      anim = bar.animate([{ width: "0%" }, { width: "100%" }], { duration: DURACION, easing: "linear", fill: "forwards" });
      timer = setTimeout(() => ir(i + 1), DURACION);
    }

    function pausar(v) { pausado = v; reiniciar(); }

    $("#hero-prev").onclick = () => ir(i - 1);
    $("#hero-next").onclick = () => ir(i + 1);
    const hero = $("#inicio");
    hero.addEventListener("mouseenter", () => pausar(true));
    hero.addEventListener("mouseleave", () => pausar(false));
    onSwipe(hero, dir => ir(i + dir));
    document.addEventListener("visibilitychange", () => pausar(document.hidden));

    return { render };
  })();

  // ======================================================
  //  PESTAÑAS (chips) CON INDICADOR ANIMADO
  // ======================================================
  const Chips = (() => {
    const cont = $("#chips"), ind = $("#chip-indicator");
    let activo = null, clickScroll = false;

    function render() {
      D.secciones.forEach(sec => {
        const b = document.createElement("button");
        b.className = "chip";
        b.dataset.id = sec.id;
        b.setAttribute("role", "tab");
        b.textContent = `${sec.icono} ${sec.nombre}`;
        b.onclick = () => {
          activar(sec.id);
          clickScroll = true;
          document.getElementById(sec.id).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
          setTimeout(() => { clickScroll = false; }, 900);
        };
        cont.appendChild(b);
      });
      // Menú del encabezado en escritorio
      $("#topnav").innerHTML = D.secciones.map(s => `<a href="#${s.id}">${esc(s.nombre)}</a>`).join("")
        + `<a href="#contacto">Contacto</a>`;
      activar(D.secciones[0]?.id);
      addEventListener("resize", () => mover(activo));
    }

    function mover(id) {
      const b = cont.querySelector(`.chip[data-id="${id}"]`);
      if (!b) return;
      ind.style.width = b.offsetWidth + "px";
      ind.style.transform = `translateX(${b.offsetLeft}px)`;
    }

    function activar(id) {
      if (!id || id === activo) return;
      activo = id;
      $$(".chip", cont).forEach(c => {
        const on = c.dataset.id === id;
        c.classList.toggle("active", on);
        c.setAttribute("aria-selected", on);
        if (on) c.scrollIntoView({ block: "nearest", inline: "center", behavior: reduceMotion ? "auto" : "smooth" });
      });
      mover(id);
    }

    // Marca la sección visible mientras se scrollea
    function espiar() {
      if (!("IntersectionObserver" in window)) return;
      const obs = new IntersectionObserver(entries => {
        if (clickScroll) return;
        entries.forEach(en => { if (en.isIntersecting) activar(en.target.id); });
      }, { rootMargin: "-45% 0px -50% 0px" });
      D.secciones.forEach(s => obs.observe(document.getElementById(s.id)));
    }

    return { render, espiar };
  })();

  // ======================================================
  //  SECCIONES Y TARJETAS DE SERVICIOS
  // ======================================================
  const servicioPorId = {};
  D.secciones.forEach(sec => sec.servicios.forEach(s => { servicioPorId[s.id] = { ...s, seccion: sec }; }));

  function metaHTML(s) {
    return [s.min && `<span>⏱ ${dur(s.min)}</span>`,
            D.negocio.mostrarPrecios && s.precio && `<span class="price">${money(s.precio)}</span>`]
      .filter(Boolean).join("");
  }

  function armarSecciones() {
    const cont = $("#secciones");
    cont.innerHTML = D.secciones.map(sec => `
      <section class="seccion" id="${sec.id}">
        <div class="seccion-banner reveal" data-banner="${sec.id}">
          <div class="bg placeholder"></div>
          <div class="txt">
            <span class="emoji">${sec.icono}</span>
            <h2>${esc(sec.nombre)}</h2>
            <p>${esc(sec.descripcion)}</p>
          </div>
        </div>
        <div class="grid">
          ${sec.servicios.map((s, k) => `
            <article class="card reveal" style="--d:${(k % 3) * 0.09}s" tabindex="0" data-srv="${s.id}" aria-label="${esc(s.nombre)}">
              <div class="card-media"><div class="ph">${sec.icono}</div></div>
              <div class="card-body">
                <h3>${esc(s.nombre)}</h3>
                <p>${esc(s.descripcion)}</p>
                <div class="card-foot">
                  <div class="meta">${metaHTML(s)}</div>
                  <span class="more">Ver más <i>→</i></span>
                  <button class="add" data-add="${s.id}" aria-pressed="false">Agregar</button>
                </div>
              </div>
            </article>`).join("")}
        </div>
      </section>`).join("");

    cont.addEventListener("click", e => {
      const add = e.target.closest(".add");
      if (add) return Turno.alternar(add.dataset.add);
      const card = e.target.closest(".card");
      if (card) Detalle.abrir(card.dataset.srv);
    });
    cont.addEventListener("keydown", e => {
      const card = e.target.closest(".card");
      if (card && e.target === card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); Detalle.abrir(card.dataset.srv); }
    });

    observarReveal(cont);
  }

  // Pone las fotos cargadas en banners y tarjetas (sin rearmar todo)
  async function aplicarFotos() {
    for (const sec of D.secciones) {
      const [portada] = await Fotos.listar("sec:" + sec.id);
      const bg = $(`[data-banner="${sec.id}"] .bg`);
      bg.classList.toggle("placeholder", !portada);
      bg.style.backgroundImage = portada ? `url('${portada.url}')` : "";

      for (const s of sec.servicios) {
        const fotos = await Fotos.listar("srv:" + s.id);
        const media = $(`.card[data-srv="${s.id}"] .card-media`);
        media.innerHTML = fotos.length
          ? `<img src="${fotos[0].url}" alt="${esc(s.nombre)}" loading="lazy">
             ${fotos.length > 1 ? `<span class="card-count">${fotos.length} fotos</span>` : ""}`
          : `<div class="ph">${sec.icono}</div>`;
      }
    }
  }

  // ======================================================
  //  HOJAS (modales) — abrir / cerrar animado
  // ======================================================
  function abrirSheet(el) {
    el.hidden = false;
    document.body.classList.add("locked");
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("open")));
    $(".sheet-close", el).focus({ preventScroll: true });
  }
  function cerrarSheet(el) {
    el.classList.remove("open");
    const panel = $(".sheet-panel", el);
    const fin = () => {
      el.hidden = true;
      if (!$$(".sheet.open").length) document.body.classList.remove("locked");
    };
    if (reduceMotion) return fin();
    panel.addEventListener("transitionend", fin, { once: true });
    setTimeout(fin, 600); // por si no dispara transitionend
  }
  $$(".sheet").forEach(sh => sh.addEventListener("click", e => {
    if (e.target.closest("[data-close]")) cerrarSheet(sh);
  }));
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const abierto = $$(".sheet.open").pop();
    if (abierto && $("#confirm").hidden) cerrarSheet(abierto);
  });

  // ======================================================
  //  DETALLE DE SERVICIO (con galería deslizable)
  // ======================================================
  const Detalle = (() => {
    const sheet = $("#sheet-servicio");
    const track = $("#srv-gallery-track"), dots = $("#srv-gallery-dots");
    let i = 0, n = 0, actual = null;

    function ir(k) {
      if (!n) return;
      i = Math.max(0, Math.min(n - 1, k));
      track.style.transform = `translateX(${-i * 100}%)`;
      $$("button", dots).forEach((d, idx) => d.classList.toggle("active", idx === i));
    }

    async function abrir(id) {
      const s = servicioPorId[id];
      if (!s) return;
      $("#srv-seccion").textContent = s.seccion.nombre;
      $("#srv-titulo").textContent = s.nombre;
      $("#srv-meta").innerHTML = metaHTML(s);
      $("#srv-desc").textContent = s.descripcion;
      actual = id;
      Turno.pintar();

      const fotos = await Fotos.listar("srv:" + id);
      n = Math.max(1, fotos.length);
      track.style.transition = "none";
      track.innerHTML = fotos.length
        ? fotos.map((f, k) => `<img src="${f.url}" alt="${esc(s.nombre)} — foto ${k + 1}" draggable="false">`).join("")
        : `<div class="ph">${s.seccion.icono}</div>`;
      dots.innerHTML = fotos.length > 1 ? fotos.map((_, k) => `<button aria-label="Foto ${k + 1}" data-k="${k}"></button>`).join("") : "";
      ir(0);
      requestAnimationFrame(() => { track.style.transition = ""; });
      abrirSheet(sheet);
    }

    dots.addEventListener("click", e => { const b = e.target.closest("button"); if (b) ir(+b.dataset.k); });
    onSwipe($("#srv-gallery"), dir => ir(i + dir));
    $("#srv-agregar").onclick = () => Turno.alternar(actual);

    return { abrir, actual: () => actual };
  })();

  // ======================================================
  //  PANEL DE CARGA DE FOTOS
  // ======================================================
  const Panel = (() => {
    const sheet = $("#sheet-fotos");
    const sel = $("#fotos-destino"), grid = $("#fotos-grid"), input = $("#fotos-input");
    const drop = $("#dropzone"), prog = $("#upload-progress");

    // Lista de destinos posibles
    const destinos = [{ v: "hero", t: "🏠 Carrusel de inicio", g: "General" }];
    D.secciones.forEach(sec => {
      destinos.push({ v: "sec:" + sec.id, t: `Portada de la sección`, g: `${sec.icono} ${sec.nombre}` });
      sec.servicios.forEach(s => destinos.push({ v: "srv:" + s.id, t: s.nombre, g: `${sec.icono} ${sec.nombre}` }));
    });
    const nombreDestino = v => {
      const d = destinos.find(x => x.v === v);
      return d ? (d.g === "General" ? d.t : `${d.g} › ${d.t}`) : v;
    };

    function armarSelect(conteos = {}) {
      const actual = sel.value || "hero";
      const grupos = {};
      destinos.forEach(d => (grupos[d.g] = grupos[d.g] || []).push(d));
      sel.innerHTML = Object.entries(grupos).map(([g, ds]) =>
        `<optgroup label="${esc(g)}">${ds.map(d =>
          `<option value="${d.v}">${esc(d.t)}${conteos[d.v] ? ` (${conteos[d.v]})` : ""}</option>`).join("")}</optgroup>`
      ).join("");
      sel.value = actual;
    }

    async function render() {
      const target = sel.value;
      const fotos = await Fotos.listar(target);
      $("#fotos-count").textContent = `${fotos.length} ${fotos.length === 1 ? "foto" : "fotos"} en ${nombreDestino(target)}`;
      grid.innerHTML = fotos.length ? fotos.map((f, k) => `
        <div class="foto" data-id="${f.id}" style="animation-delay:${k * 0.04}s">
          <img src="${f.url}" alt="">
          ${k === 0 ? `<span class="badge">Portada</span>` : ""}
          <div class="acts">
            <button data-act="izq" title="Mover a la izquierda" ${k === 0 ? "disabled" : ""}>←</button>
            ${k ? `<button data-act="portada" title="Usar como portada">★</button>` : ""}
            <button data-act="der" title="Mover a la derecha" ${k === fotos.length - 1 ? "disabled" : ""}>→</button>
            <button data-act="del" class="del" title="Eliminar">🗑</button>
          </div>
        </div>`).join("") : `<div class="empty">Todavía no hay fotos acá. ¡Subí la primera!</div>`;

      const conteos = await Fotos.conteos();
      armarSelect(conteos);
      const lista = destinos.filter(d => conteos[d.v]);
      $("#fotos-resumen").innerHTML = lista.length
        ? lista.map(d => `<li>${esc(nombreDestino(d.v))}: <strong>${conteos[d.v]}</strong></li>`).join("")
        : "<li>Sin fotos cargadas todavía.</li>";
    }

    async function subir(files) {
      if (!files || !files.length) return;
      prog.hidden = false;
      const bar = $("span", prog);
      bar.style.width = "0";
      try {
        const n = await Fotos.agregar(sel.value, files, p => { bar.style.width = (p * 100) + "%"; });
        toast(n ? `✓ ${n} ${n === 1 ? "foto cargada" : "fotos cargadas"}` : "No se encontraron imágenes");
      } catch (err) {
        console.error(err);
        toast("No se pudo guardar la foto. Probá con otra imagen.");
      } finally {
        setTimeout(() => { prog.hidden = true; }, 400);
        input.value = "";
      }
    }

    sel.addEventListener("change", render);
    input.addEventListener("change", () => subir(input.files));
    ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", e => subir(e.dataTransfer.files));

    grid.addEventListener("click", async e => {
      const b = e.target.closest("button[data-act]");
      if (!b) return;
      const card = b.closest(".foto"), id = +card.dataset.id, target = sel.value;
      const act = b.dataset.act;
      if (act === "izq") Fotos.mover(target, id, -1);
      else if (act === "der") Fotos.mover(target, id, 1);
      else if (act === "portada") { await Fotos.hacerPortada(target, id); toast("Portada actualizada"); }
      else if (act === "del" && await confirmar("¿Eliminar esta foto?")) {
        card.classList.add("removing");
        setTimeout(async () => { await Fotos.eliminar(id); toast("Foto eliminada"); }, 280);
      }
    });

    function abrir(target) {
      armarSelect();
      if (target) sel.value = target;
      render();
      abrirSheet(sheet);
    }

    return { abrir, render, visible: () => !sheet.hidden };
  })();

  $("#btn-fotos").onclick = () => Panel.abrir();

  // ======================================================
  //  PEDIDO DE TURNO (carrito → mensaje de WhatsApp)
  // ======================================================
  const Turno = (() => {
    const elegidos = new Set();
    const bar = $("#turno-bar"), sheet = $("#sheet-turno");
    const nombre = $("#turno-nombre"), dia = $("#turno-dia");

    const lista = () => Object.values(servicioPorId).filter(s => elegidos.has(s.id));
    function totales() {
      const l = lista();
      return { n: l.length, min: l.reduce((a, s) => a + (s.min || 0), 0), p: l.reduce((a, s) => a + (s.precio || 0), 0) };
    }
    const resumen = t => dur(t.min) + (D.negocio.mostrarPrecios ? " · " + money(t.p) : "");

    function mensaje() {
      const quien = nombre.value.trim(), cuando = dia.value.trim();
      return "Hola! " + (quien ? "Soy " + quien + ". " : "") + "Quiero pedir turno para:\n" +
        lista().map(s => "• " + s.nombre + " (" + dur(s.min) + ")").join("\n") +
        (cuando ? "\nDía que prefiero: " + cuando : "") +
        "\n(Pedido desde la app de " + D.negocio.nombre + ")";
    }

    function alternar(id) {
      if (!id) return;
      const agregado = !elegidos.has(id);
      agregado ? elegidos.add(id) : elegidos.delete(id);
      pintar(id);
      toast(agregado ? "Agregado a tu turno" : "Quitado de tu turno");
    }

    function pintar(cambiado) {
      $$(".add[data-add]").forEach(b => {
        const on = elegidos.has(b.dataset.add);
        b.setAttribute("aria-pressed", on);
        b.textContent = on ? "Agregado ✓" : "Agregar";
        b.closest(".card").classList.toggle("elegida", on);
        if (b.dataset.add === cambiado && !reduceMotion) {
          b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
        }
      });
      const actual = Detalle.actual();
      if (actual) $("#srv-agregar").textContent = elegidos.has(actual) ? "Quitar del turno" : "Agregar al turno";

      const t = totales();
      $("#turno-sum").textContent = t.n
        ? t.n + (t.n === 1 ? " tratamiento" : " tratamientos") + " · " + resumen(t)
        : "Elegí un tratamiento para pedir turno";
      $("#btn-pedir").disabled = !t.n;
      bar.classList.toggle("visible", t.n > 0);

      if (!sheet.hidden) {
        if (!t.n) return cerrarSheet(sheet);
        $("#turno-lista").innerHTML = lista().map(s =>
          `<li><span>${esc(s.nombre)}</span><button data-quitar="${s.id}">Quitar</button></li>`).join("");
        $("#turno-total").textContent = "Total: " + resumen(t);
        refrescarMensaje();
      }
    }

    function refrescarMensaje() {
      const m = mensaje();
      $("#turno-msg").value = m;
      $("#turno-wa").href = linkWhatsapp(m);
    }

    $("#btn-pedir").onclick = () => { sheet.hidden = false; pintar(); abrirSheet(sheet); };
    $("#turno-lista").addEventListener("click", e => {
      const b = e.target.closest("[data-quitar]");
      if (b) { elegidos.delete(b.dataset.quitar); pintar(); }
    });
    nombre.addEventListener("input", refrescarMensaje);
    dia.addEventListener("input", refrescarMensaje);
    $("#turno-copiar").onclick = async e => {
      const btn = e.currentTarget, area = $("#turno-msg");
      try { await navigator.clipboard.writeText(area.value); btn.textContent = "Mensaje copiado ✓"; }
      catch { area.focus(); area.select(); btn.textContent = "Texto seleccionado, copialo"; }
      setTimeout(() => { btn.textContent = "Copiar mensaje"; }, 2500);
    };

    return { alternar, pintar };
  })();

  // Cuando cambian las fotos, se actualiza todo lo que se ve
  document.addEventListener("fotos:change", () => {
    Hero.render();
    aplicarFotos();
    if (Panel.visible()) Panel.render();
  });

  // ---------- Inicio ----------
  armarSecciones();
  Chips.render();
  Chips.espiar();
  observarReveal();
  Hero.render();
  aplicarFotos();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
