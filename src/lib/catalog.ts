import { BookFormat, ContentType, IllustrationStyleId } from "./types";

export const CONTENT_TYPES: {
  id: ContentType;
  title: string;
  subtitle: string;
  description: string;
}[] = [
  {
    id: "narrativo",
    title: "Infantil Recreativo",
    subtitle: "Aventuras y magia",
    description:
      "Piratas, exploradores, dinosaurios o viajes espaciales con su cara y su nombre en cada página.",
  },
  {
    id: "educativo",
    title: "Educativo",
    subtitle: "Aprender jugando",
    description:
      "Historias diseñadas para enseñar valores, emociones, lectura, ciencia o matemáticas.",
  },
  {
    id: "adultos",
    title: "Jóvenes y Adultos",
    subtitle: "Regalos especiales",
    description:
      "Relatos más profundos para cumpleaños, aniversarios, bodas o jubilaciones inolvidables.",
  },
  {
    id: "memorias",
    title: "Memorias",
    subtitle: "Vuestra historia real",
    description:
      "Convierte un viaje familiar, una anécdota o un recuerdo especial en un libro ilustrado.",
  },
];

export const BOOK_FORMATS: {
  id: BookFormat;
  title: string;
  ageRange: string;
  defaultPages: number;
  description: string;
}[] = [
  {
    id: "micro",
    title: "Micro Cuento",
    ageRange: "0 a 3 años",
    defaultPages: 6,
    description:
      "Frases muy cortas, letra gigante y protagonismo absoluto de la ilustración.",
  },
  {
    id: "mini",
    title: "Mini Cuento",
    ageRange: "3 a 6 años",
    defaultPages: 8,
    description:
      "Letra grande, ritmo ágil y pocas líneas por página para leer antes de dormir.",
  },
  {
    id: "aventura",
    title: "Aventura Ilustrada",
    ageRange: "6+ años y adultos",
    defaultPages: 10,
    description:
      "Narrativa más rica y detallada con ilustraciones a página completa.",
  },
];

export const ILLUSTRATION_STYLES: {
  id: IllustrationStyleId;
  name: string;
  tag: string;
  description: string;
  previewImage: string;
  promptModifier: string;
}[] = [
  {
    id: "watercolor",
    name: "Acuarela Clásica",
    tag: "El más elegido",
    description: "Trazos suaves sobre papel de algodón con luz cálida y orgánica.",
    previewImage: "/images/style-watercolor.jpg",
    promptModifier:
      "warm classic children's picture book watercolor illustration on textured cotton paper, soft brushwork, gentle natural lighting, no text",
  },
  {
    id: "3d",
    name: "Animación 3D",
    tag: "Estilo cine",
    description: "Personajes expresivos con volumen, iluminación cinematográfica y gran detalle.",
    previewImage: "/images/style-3d.jpg",
    promptModifier:
      "charming 3D animated storybook illustration, expressive character design, warm cinematic rim lighting, rich colors, no text",
  },
  {
    id: "classic",
    name: "Cuento Clásico",
    tag: "Tinta y gouache",
    description: "Estética europea atemporal con línea fina de tinta y color gouache.",
    previewImage: "/images/style-classic.jpg",
    promptModifier:
      "classic European picture book illustration in fine ink linework and warm gouache paint, timeless storybook aesthetic, no text",
  },
  {
    id: "gouache",
    name: "Bosque Encantado",
    tag: "Cálido y acogedor",
    description: "Paleta otoñal y tonos tierra con atmósfera mágica de cuento nocturno.",
    previewImage: "/images/scene-treehouse.jpg",
    promptModifier:
      "cozy storybook gouache illustration, warm amber lanterns, earthy forest palette, rich painterly texture, no text",
  },
  {
    id: "pencil",
    name: "Retrato Ilustrado",
    tag: "Fiel al rostro",
    description: "Ilustración limpia centrada en la expresividad y los rasgos del protagonista.",
    previewImage: "/images/char-base.jpg",
    promptModifier:
      "clean expressive hand-drawn watercolor and colored pencil character illustration on warm cream paper, no text",
  },
  {
    id: "editorial",
    name: "Álbum Ilustrado",
    tag: "Edición de autor",
    description: "Composición panorámica pensada para imprimir en tapa dura.",
    previewImage: "/images/hero-storybook.jpg",
    promptModifier:
      "editorial picture book spread illustration, balanced composition, warm sunlit tones, artisanal print look, no text",
  },
];

export const STORY_TEMPLATES: {
  id: string;
  title: string;
  category: string;
  idea: string;
}[] = [
  {
    id: "bosque-luciernagas",
    title: "El Secreto del Bosque de Luciérnagas",
    category: "Aventura y naturaleza",
    idea: "Descubre una aldea secreta iluminada por farolillos en las copas de los árboles y ayuda a devolver la luz a la gran luna del bosque.",
  },
  {
    id: "mision-espacial",
    title: "Misión al Planeta Anillo",
    category: "Espacio y ciencia",
    idea: "Despega en un cohete casero para rescatar una estrella perdida entre planetas de colores y cometas musicales.",
  },
  {
    id: "capitan-barco",
    title: "El Capitán del Barco de Papel",
    category: "Piratas y océanos",
    idea: "Navega por mares tranquilos siguiendo un mapa antiguo hasta una isla donde los animales hablan y guardan un tesoro de historias.",
  },
  {
    id: "valores-compartir",
    title: "La Mochila de los Pequeños Gestos",
    category: "Educativo y valores",
    idea: "Aprende que escuchar, compartir y pedir ayuda convierte cualquier problema cotidiano en una gran aventura en equipo.",
  },
];
