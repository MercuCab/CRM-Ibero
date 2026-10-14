// Catálogo base de la app. Editá textos, precios y duraciones acá.
// Las fotos NO van en este archivo: se cargan desde el panel "Fotos"
// de la app y quedan guardadas en el dispositivo (IndexedDB).
window.COSMIA_DATA = {
  negocio: {
    nombre: "Cosmiatría",
    eslogan: "Tu piel, en las mejores manos",
    whatsapp: "5490000000000", // reemplazar por el número real (sin + ni espacios)
    instagram: "",
    direccion: ""
  },

  // Slides del carrusel principal (las fotos se cargan desde el panel)
  hero: [
    { titulo: "Renová tu piel", texto: "Tratamientos faciales personalizados según tu tipo de piel." },
    { titulo: "Cuidado profesional", texto: "Aparatología de última generación y productos de calidad." },
    { titulo: "Tu momento", texto: "Un espacio pensado para que te relajes y te sientas bien." }
  ],

  secciones: [
    {
      id: "faciales",
      nombre: "Faciales",
      icono: "✨",
      descripcion: "Limpiezas, hidratación y tratamientos para cada tipo de piel.",
      servicios: [
        { id: "limpieza-profunda", nombre: "Limpieza facial profunda", duracion: "60 min", precio: "",
          descripcion: "Higiene completa con extracción, exfoliación, mascarilla y masaje descontracturante." },
        { id: "hidratacion", nombre: "Hidratación intensiva", duracion: "45 min", precio: "",
          descripcion: "Devuelve luminosidad y elasticidad a pieles deshidratadas o apagadas." },
        { id: "peeling", nombre: "Peeling químico", duracion: "40 min", precio: "",
          descripcion: "Renovación celular para manchas, marcas de acné y textura irregular." }
      ]
    },
    {
      id: "corporales",
      nombre: "Corporales",
      icono: "🌿",
      descripcion: "Tratamientos reductores, reafirmantes y relajantes.",
      servicios: [
        { id: "drenaje", nombre: "Drenaje linfático", duracion: "50 min", precio: "",
          descripcion: "Técnica manual suave que reduce la retención de líquidos y desinflama." },
        { id: "reductor", nombre: "Tratamiento reductor", duracion: "60 min", precio: "",
          descripcion: "Combinación de aparatología y activos para modelar la silueta." },
        { id: "exfoliacion-corporal", nombre: "Exfoliación corporal", duracion: "40 min", precio: "",
          descripcion: "Piel suave y renovada de pies a cabeza." }
      ]
    },
    {
      id: "aparatologia",
      nombre: "Aparatología",
      icono: "💎",
      descripcion: "Tecnología aplicada al cuidado de la piel.",
      servicios: [
        { id: "dermapen", nombre: "Dermapen", duracion: "50 min", precio: "",
          descripcion: "Microneedling que estimula colágeno y mejora cicatrices y poros." },
        { id: "radiofrecuencia", nombre: "Radiofrecuencia", duracion: "40 min", precio: "",
          descripcion: "Efecto tensor y reafirmante, sin dolor y sin tiempo de recuperación." },
        { id: "punta-diamante", nombre: "Punta de diamante", duracion: "30 min", precio: "",
          descripcion: "Microdermoabrasión que afina la textura y unifica el tono." }
      ]
    },
    {
      id: "cejas-pestanas",
      nombre: "Cejas y pestañas",
      icono: "👁️",
      descripcion: "Mirada definida y natural.",
      servicios: [
        { id: "lifting-pestanas", nombre: "Lifting de pestañas", duracion: "60 min", precio: "",
          descripcion: "Curvatura natural que dura semanas, sin extensiones." },
        { id: "perfilado-cejas", nombre: "Perfilado de cejas", duracion: "30 min", precio: "",
          descripcion: "Diseño según la forma de tu rostro, con o sin laminado." }
      ]
    }
  ]
};
