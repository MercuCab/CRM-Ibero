// Almacenamiento de fotos en el dispositivo (IndexedDB).
// Cada foto tiene un "destino": "hero" (carrusel de inicio),
// "sec:<id>" (portada de sección) o "srv:<id>" (galería de servicio).
// Más adelante este módulo se puede reemplazar por uno que suba a un
// servidor sin tocar app.js: solo tiene que respetar la misma interfaz.
(function () {
  const DB_NAME = "cosmia";
  const STORE = "fotos";
  const MAX_LADO = 1600;   // px del lado más largo al comprimir
  const CALIDAD = 0.82;

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
      const store = t.objectStore(STORE);
      const out = fn(store);
      t.oncomplete = () => resolve(out && "result" in out ? out.result : out);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  function urlDe(reg) {
    if (!urls.has(reg.id)) urls.set(reg.id, URL.createObjectURL(reg.blob));
    return urls.get(reg.id);
  }

  async function todas() {
    const regs = await tx("readonly", s => s.getAll());
    return regs.sort((a, b) => a.orden - b.orden || a.id - b.id);
  }

  async function listar(target) {
    const regs = await tx("readonly", s => s.index("target").getAll(target));
    return regs
      .sort((a, b) => a.orden - b.orden || a.id - b.id)
      .map(r => ({ id: r.id, target: r.target, url: urlDe(r) }));
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

  async function agregar(target, files, onProgress) {
    const imgs = [...files].filter(f => f.type.startsWith("image/"));
    const existentes = await listar(target);
    let orden = existentes.length;
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
    await tx("readwrite", s => s.delete(id));
    if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
    avisar();
  }

  // Reescribe el orden de un destino a partir de una lista de ids
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
    const ids = (await listar(target)).map(f => f.id);
    const i = ids.indexOf(id), j = i + delta;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await reordenar(target, ids);
  }

  async function hacerPortada(target, id) {
    const ids = (await listar(target)).map(f => f.id).filter(x => x !== id);
    await reordenar(target, [id, ...ids]);
  }

  async function conteos() {
    const regs = await todas();
    const c = {};
    regs.forEach(r => { c[r.target] = (c[r.target] || 0) + 1; });
    return c;
  }

  function avisar() {
    document.dispatchEvent(new CustomEvent("fotos:change"));
  }

  window.Fotos = { listar, agregar, eliminar, mover, hacerPortada, conteos };
})();
