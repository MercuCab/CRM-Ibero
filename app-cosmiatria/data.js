// Catálogo base de la app (tomado del artefacto "App de cosmiatría de mamá").
// Editá textos, precios y duraciones acá.
// Las fotos NO van en este archivo: se cargan desde el panel "Fotos"
// de la app y quedan guardadas en el dispositivo (IndexedDB).
window.COSMIA_DATA = {
  negocio: {
    nombre: "Piel Serena",
    eslogan: "Cosmiatría y cuidado de la piel, con turno previo.",
    etiqueta: "Cosmiatría · Turnos por WhatsApp",
    whatsapp: "", // número que recibe los turnos: código de país, sin + ni espacios (ej: 5491123456789)
    mostrarPrecios: true
  },

  // Slides del carrusel principal (las fotos se cargan desde el panel)
  // La primera diapositiva lleva el video "rostro" de fondo (se sube desde
  // el panel de fotos, en "Video de fondo") y el texto en vertical.
  hero: [
    { tipo: "video", vertical: "rostro", boton: "Ver tratamientos faciales", destino: "limpieza",
      titulo: "Tratamientos faciales" },
    { titulo: "Tu piel, renovada", texto: "Limpiezas, peelings e hidratación según tu tipo de piel." },
    { titulo: "Aparatología", texto: "Punta de diamante, radiofrecuencia y dermapen." }
  ],

  // Consejo que se muestra al final del catálogo
  consejo: {
    titulo: "Después de un peeling",
    texto: "Usá protector solar FPS 50 todos los días y evitá el sol directo por una semana."
  },

  secciones: [
    {
      id: "limpieza",
      nombre: "Limpieza",
      icono: "🫧",
      descripcion: "Higiene profunda para una piel limpia y equilibrada.",
      servicios: [
        { id: "limpieza", nombre: "Limpieza facial profunda", min: 60, precio: 28000,
          descripcion: "Vapor, extracción de puntos negros y máscara según tu tipo de piel." },
        { id: "acne", nombre: "Tratamiento para piel con acné", min: 60, precio: 32000,
          descripcion: "Limpieza suave, alta frecuencia y máscara descongestiva." },
        { id: "espalda", nombre: "Limpieza de espalda", min: 60, precio: 34000,
          descripcion: "Exfoliación, extracción de puntos negros y máscara purificante en toda la espalda." }
      ]
    },
    {
      id: "peelings",
      nombre: "Peelings",
      icono: "✨",
      descripcion: "Renovación de la piel para emparejar el tono y afinar la textura.",
      servicios: [
        { id: "peelq", nombre: "Peeling químico superficial", min: 45, precio: 35000,
          descripcion: "Con ácido glicólico o mandélico. Empareja el tono y afina la textura." },
        { id: "peele", nombre: "Peeling enzimático", min: 40, precio: 30000,
          descripcion: "Exfoliación suave con enzimas de papaya, apta para piel sensible." }
      ]
    },
    {
      id: "aparatologia",
      nombre: "Aparatología",
      icono: "💎",
      descripcion: "Tecnología aplicada al cuidado de la piel.",
      servicios: [
        { id: "punta", nombre: "Punta de diamante", min: 45, precio: 33000,
          descripcion: "Microdermoabrasión que pule la capa superficial y deja la piel lisa." },
        { id: "radio", nombre: "Radiofrecuencia facial", min: 50, precio: 38000,
          descripcion: "Calor profundo que estimula el colágeno y mejora la firmeza." },
        { id: "dermapen", nombre: "Dermapen", min: 60, precio: 45000,
          descripcion: "Microagujas para cicatrices de acné, poros y líneas finas." }
      ]
    },
    {
      id: "hidratacion",
      nombre: "Hidratación",
      icono: "💧",
      descripcion: "Agua y luminosidad para pieles apagadas o deshidratadas.",
      servicios: [
        { id: "hidra", nombre: "Hidratación con ácido hialurónico", min: 45, precio: 30000,
          descripcion: "Máscara y principios activos que devuelven agua y luminosidad." }
      ]
    }
  ]
};
