// Fotos de la app. Cada foto tiene un "destino": "hero" (carrusel de
// inicio), "sec:<id>" (portada de sección) o "srv:<id>" (galería de servicio).
//
// Dos modos con la misma interfaz (window.Fotos):
// - Artefacto de Claude: las fotos se suben al almacenamiento del artefacto
//   y la lista de fotos viaja dentro de la propia página. Al tocar
//   "Publicar" la página se vuelve a publicar con la lista nueva, así las
//   clientas las ven sin iniciar sesión. Solo quien puede editar el
//   artefacto ve el panel de fotos.
// - Archivo suelto (repo / navegador): las fotos quedan en el dispositivo
//   (IndexedDB), útil para probar.
(function () {
  const MAX_LADO = 1600;   // px del lado más largo al comprimir
  const CALIDAD = 0.82;

  function avisar() {
    document.dispatchEvent(new CustomEvent("fotos:change"));
  }

  // Reduce la foto para que la app no pese de más en el celular.
  async function comprimir(file) {
    let bmp;
    try {
      bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      bmp = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    }
    const w = bmp.width, h = bmp.height;
    const k = Math.min(1, MAX_LADO / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * k);
    canvas.height = Math.round(h * k);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    if (bmp.close) bmp.close();
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", CALIDAD));
    return blob || file;
  }

  const soloImagenes = files => [...files].filter(f => f.type.startsWith("image/"));

  // ======================================================
  //  MODO ARTEFACTO
  // ======================================================
  function modoArtefacto(nodoDatos) {
    const PENDIENTE = "cosmia-fotos-pendientes";
    const publicado = nodoDatos.textContent.trim() || "{}";
    let estado = {};
    try { estado = JSON.parse(publicado) || {}; } catch { estado = {}; }

    let assets = null, artifact = null;
    const permisos = (async () => {
      if (!window.claude || !window.claude.use) return { editable: false };
      [assets, artifact] = await Promise.all([
        window.claude.use("assets").catch(() => null),
        window.claude.use("artifact").catch(() => null)
      ]);
      const editable = !!(assets && artifact);
      // Recupera cambios que quedaron sin publicar en este navegador
      if (editable) {
        try {
          const guardado = localStorage.getItem(PENDIENTE);
          if (guardado === publicado) localStorage.removeItem(PENDIENTE);
          else if (guardado) { estado = JSON.parse(guardado); avisar(); }
        } catch { /* sin almacenamiento local: se sigue sin recuperar */ }
      }
      return { editable };
    })();

    const pendiente = () => JSON.stringify(estado) !== publicado;
    function cambio() {
      try {
        if (pendiente()) localStorage.setItem(PENDIENTE, JSON.stringify(estado));
        else localStorage.removeItem(PENDIENTE);
      } catch { /* sin almacenamiento local */ }
      avisar();
    }
    const ids = target => estado[target] || [];
    function fijar(target, lista) {
      if (lista.length) estado[target] = lista; else delete estado[target];
      cambio();
    }

    async function listar(target) {
      return ids(target).map(id => ({ id, target, url: "/_blob/" + id }));
    }

    async function agregar(target, files, onProgress) {
      if (!assets) throw { code: "not_granted" };
      const imgs = soloImagenes(files);
      let hechas = 0;
      for (const f of imgs) {
        const blob = await comprimir(f);
        const r = await assets.upload(blob, { type: "image/jpeg" });
        fijar(target, [...ids(target), r.id]);
        hechas++;
        onProgress && onProgress(hechas / imgs.length);
      }
      return hechas;
    }

    // Quitar una foto la saca de la app al publicar. El archivo queda en el
    // almacenamiento hasta entonces, así la versión publicada no se rompe.
    async function eliminar(id, target) {
      const t = target || Object.keys(estado).find(k => ids(k).includes(id));
      if (t) fijar(t, ids(t).filter(x => x !== id));
    }

    async function mover(target, id, delta) {
      const l = [...ids(target)];
      const i = l.indexOf(id), j = i + delta;
      if (i < 0 || j < 0 || j >= l.length) return;
      [l[i], l[j]] = [l[j], l[i]];
      fijar(target, l);
    }

    async function hacerPortada(target, id) {
      fijar(target, [id, ...ids(target).filter(x => x !== id)]);
    }

    async function conteos() {
      const c = {};
      Object.keys(estado).forEach(k => { c[k] = ids(k).length; });
      return c;
    }

    // Vuelve a generar la página completa con la lista de fotos nueva.
    const MARCA_T = "__COSMIA" + "_T__", MARCA_F = "__COSMIA" + "_F__";
    const seguro = v => JSON.stringify(v).replace(/</g, "\\u003c");
    const ESQUELETO = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>';

    async function publicar() {
      if (!artifact) throw { code: "not_granted" };
      const plantilla = window.COSMIA_TEMPLATE;
      const contenido = plantilla.replace(new RegExp(MARCA_T + "|" + MARCA_F, "g"),
        m => m === MARCA_T ? seguro(plantilla) : seguro(estado));
      return artifact.publish(ESQUELETO + contenido + "</body></html>");
    }

    return { listar, agregar, eliminar, mover, hacerPortada, conteos,
             permisos: () => permisos, pendiente, publicar, modo: "artefacto" };
  }

  // ======================================================
  //  MODO LOCAL (IndexedDB)
  // ======================================================
  function modoLocal() {
    const DB_NAME = "cosmia";
    const STORE = "fotos";
    let dbPromise = null;
    const urls = new Map(); // id -> objectURL

    function abrir() {
      if (dbPromise) return dbPromise;
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const store = req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
          store.createIndex("target", "target");
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      return dbPromise;
    }

    async function tx(mode, fn) {
      const db = await abrir();
      return new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const out = fn(t.objectStore(STORE));
        t.oncomplete = () => resolve(out && "result" in out ? out.result : out);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      });
    }

    function urlDe(reg) {
      if (!urls.has(reg.id)) urls.set(reg.id, URL.createObjectURL(reg.blob));
      return urls.get(reg.id);
    }

    async function listar(target) {
      const regs = await tx("readonly", s => s.index("target").getAll(target));
      return regs
        .sort((a, b) => a.orden - b.orden || a.id - b.id)
        .map(r => ({ id: r.id, target: r.target, url: urlDe(r) }));
    }

    async function agregar(target, files, onProgress) {
      const imgs = soloImagenes(files);
      let orden = (await listar(target)).length;
      let hechas = 0;
      for (const f of imgs) {
        const blob = await comprimir(f);
        await tx("readwrite", s => s.add({ target, blob, orden: orden++, creada: Date.now() }));
        hechas++;
        onProgress && onProgress(hechas / imgs.length);
      }
      avisar();
      return hechas;
    }

    async function eliminar(id) {
      id = Number(id);
      await tx("readwrite", s => s.delete(id));
      if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
      avisar();
    }

    async function reordenar(target, ids) {
      const regs = await tx("readonly", s => s.index("target").getAll(target));
      const porId = new Map(regs.map(r => [r.id, r]));
      await tx("readwrite", s => {
        ids.forEach((id, i) => {
          const r = porId.get(id);
          if (r) { r.orden = i; s.put(r); }
        });
      });
      avisar();
    }

    async function mover(target, id, delta) {
      id = Number(id);
      const ids = (await listar(target)).map(f => f.id);
      const i = ids.indexOf(id), j = i + delta;
      if (i < 0 || j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      await reordenar(target, ids);
    }

    async function hacerPortada(target, id) {
      id = Number(id);
      const ids = (await listar(target)).map(f => f.id).filter(x => x !== id);
      await reordenar(target, [id, ...ids]);
    }

    async function conteos() {
      const regs = await tx("readonly", s => s.getAll());
      const c = {};
      regs.forEach(r => { c[r.target] = (c[r.target] || 0) + 1; });
      return c;
    }

    return { listar, agregar, eliminar, mover, hacerPortada, conteos,
             permisos: async () => ({ editable: true }), pendiente: () => false,
             publicar: async () => {}, modo: "local" };
  }

  const nodo = document.getElementById("cosmia-fotos");
  window.Fotos = nodo && window.COSMIA_TEMPLATE ? modoArtefacto(nodo) : modoLocal();
})();
