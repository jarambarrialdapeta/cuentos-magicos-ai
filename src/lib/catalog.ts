import { BookFormat, ContentType, IllustrationStyleId } from "./types";

export const CONTENT_TYPES: {
  id: ContentType;
  title: string;
  subtitle: string;
  description: string;
}[] = [
  {
    id: "narrativo",
    title: "Haurrentzako Abenturak",
    subtitle: "Magia eta dibertsioa",
    description:
      "Piratak, basozainak, dinosauroak edo espazioko bidaiak beren aurpegiarekin eta izenarekin orrialde bakoitzean.",
  },
  {
    id: "educativo",
    title: "Hezitzailea",
    subtitle: "Jolastuz ikasi",
    description:
      "Balioak, emozioak, irakurketa, zientzia edo naturarekiko maitasuna lantzeko ipuinak.",
  },
  {
    id: "adultos",
    title: "Gazte eta Helduak",
    subtitle: "Opari bereziak",
    description:
      "Urtebetetze, urteurren edo momentu berezietarako istorio landuagoak eta hunkigarriak.",
  },
  {
    id: "memorias",
    title: "Oroitzapenak",
    subtitle: "Zuen benetako istorioa",
    description:
      "Bihurtu familiako bidaia, pasadizo edo oroitzapen polit bat liburu ilustratu batean.",
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
    title: "Mikro Ipuina",
    ageRange: "0 - 3 urte",
    defaultPages: 6,
    description:
      "Esaldi oso motzak, letra handia eta ilustrazioaren protagonismo osoa txikienentzat.",
  },
  {
    id: "mini",
    title: "Mini Ipuina",
    ageRange: "3 - 6 urte",
    defaultPages: 8,
    description:
      "Letra handia, erritmo bizia eta lerro gutxi orrialdeko, oheratu aurretik irakurtzeko aproposa.",
  },
  {
    id: "aventura",
    title: "Abentura Ilustratua",
    ageRange: "6+ urte eta helduak",
    defaultPages: 12,
    description:
      "Narrazio aberatsagoa eta xehetasun gehiago orrialde osoko ilustrazioekin.",
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
    name: "Akuarela Klasikoa",
    tag: "Gogokoena",
    description: "Trazu leunak kotoizko paperaren gainean, argi bero eta naturalarekin.",
    previewImage: "/images/style-watercolor.jpg",
    promptModifier:
      "warm classic children's picture book watercolor illustration on textured cotton paper, soft brushwork, gentle natural lighting, no text",
  },
  {
    id: "3d",
    name: "3D Animazioa",
    tag: "Zinema estiloa",
    description: "Pertsonaia adierazkorrak bolumenarekin, argiztapen zinematografikoarekin eta xehetasun handiz.",
    previewImage: "/images/style-3d.jpg",
    promptModifier:
      "charming 3D animated storybook illustration, expressive character design, warm cinematic rim lighting, rich colors, no text",
  },
  {
    id: "classic",
    name: "Ipuin Klasikoa",
    tag: "Tinta eta gouache",
    description: "Betiko estetika europarra tinta finarekin eta gouache kolore goxoekin.",
    previewImage: "/images/style-classic.jpg",
    promptModifier:
      "classic European picture book illustration in fine ink linework and warm gouache paint, timeless storybook aesthetic, no text",
  },
  {
    id: "gouache",
    name: "Baso Magikoa",
    tag: "Beroa eta goxoa",
    description: "Udazkeneko paleta eta lur-tonuak gaueko ipuin magikoen giroarekin.",
    previewImage: "/images/scene-treehouse.jpg",
    promptModifier:
      "cozy storybook gouache illustration, warm amber lanterns, earthy forest palette, rich painterly texture, no text",
  },
  {
    id: "pencil",
    name: "Erretratu Ilustratua",
    tag: "Aurpegiari fidela",
    description: "Ilustrazio garbia, protagonistaren adierazkortasunean eta hazpegietan oinarritua.",
    previewImage: "/images/char-base.jpg",
    promptModifier:
      "clean expressive hand-drawn watercolor and colored pencil character illustration on warm cream paper, no text",
  },
  {
    id: "editorial",
    name: "Album Ilustratua",
    tag: "Egile edizioa",
    description: "Konposizio panoramikoa, azal gogorrean inprimatzeko pentsatua.",
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
    title: "Ipurtargien Basoko Sekretua",
    category: "Abentura eta natura",
    idea: "Zuhaitzen adaburuetan faroltxoz argitutako herrixka sekretu bat aurkitu eta basoko ilargi handiari argia itzultzen lagundu.",
  },
  {
    id: "mision-espacial",
    title: "Eraztun Planetarako Misioa",
    category: "Espazioa eta zientzia",
    idea: "Etxeko suziri batean aireratu koloretako planeten eta kometa musikarien artean galdutako izar bat erreskatatzeko.",
  },
  {
    id: "capitan-barco",
    title: "Paperezko Itsasontziko Kapitaina",
    category: "Piratak eta ozeanoak",
    idea: "Mapa zahar bati jarraituz nabigatu animaliek hitz egiten duten eta istorioen altxorra gordetzen duten uharte bateraino.",
  },
  {
    id: "valores-compartir",
    title: "Keinu Txikien Motxila",
    category: "Hezitzailea eta balioak",
    idea: "Ikasi entzuteak, partekatzeak eta laguntza eskatzeak eguneroko edozein arazo taldeko abentura handi bihurtzen duela.",
  },
];
