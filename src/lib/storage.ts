import fs from "fs";
import path from "path";
import { CharacterProfile, Story } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORIES_FILE = path.join(DATA_DIR, "stories.json");
const CHARACTERS_FILE = path.join(DATA_DIR, "characters.json");

const SEED_CHARACTERS: CharacterProfile[] = [
  {
    id: "char-lukas",
    name: "Lukas",
    role: "Basozain gaztea",
    ageOrNote: "Jantzi berdeak, txapela beltza eta motxila marroia",
    styleId: "classic",
    baseIllustrationUrl: "/images/lukas-olentzero/p1.jpg",
    createdAt: "2026-11-19T08:00:00.000Z",
  },
  {
    id: "char-olentzero",
    name: "Olentzero",
    role: "Baserritar bizarduna",
    ageOrNote: "Bizar zuri handia, txapela, txaleko iluna eta zapi gorria",
    styleId: "classic",
    baseIllustrationUrl: "/images/lukas-olentzero/azala.jpg",
    createdAt: "2026-11-19T08:00:00.000Z",
  },
];

const SEED_STORIES: Story[] = [
  {
    id: "ejemplo-lukas-olentzero",
    title: "Lukas eta Olentzeroren Gurdi Magikoa",
    dedication: "Euskal Herriko ume guztientzat, gabon magiko eta alai bat opa dizuegu.",
    language: "eu",
    contentType: "narrativo",
    bookFormat: "mini",
    styleId: "classic",
    mode: "ai",
    createdAt: "2026-11-19T08:00:00.000Z",
    characters: [
      {
        id: "char-lukas",
        name: "Lukas",
        role: "Basozain gaztea",
        ageOrNote: "Jantzi berdeak, txapela eta motxila",
        baseIllustrationUrl: "/images/lukas-olentzero/azala.jpg",
      },
      {
        id: "char-olentzero",
        name: "Olentzero",
        role: "Baserritar bizarduna",
        ageOrNote: "Bizar zuri handia, txapela eta zapi gorria",
      },
      {
        id: "char-astotxoa",
        name: "Astotxoa",
        role: "Asto magikoa",
        ageOrNote: "Astotxo gris txikia eta lagunkoia",
      },
    ],
    pages: [
      {
        pageNumber: 1,
        text: "Hau Lukas da! Basozain gazte eta oso alai bat. Baserri polit batean bizi da, basotik gertu. «Kaixo, Lukas!»",
        scenePrompt: "Lukas basozain alaia basoaren ondoan agurtzen.",
        imageUrl: "/images/lukas-olentzero/p1.jpg",
      },
      {
        pageNumber: 2,
        text: "Ondoan, Olentzero bizi da. «Lukas, lagundu, mesedez! Opari asko ditut, baina ez dut gurdiarik!»",
        scenePrompt: "Olentzero baserriko atean Lukasi deika opari piloarekin.",
        imageUrl: "/images/lukas-olentzero/p2.jpg",
      },
      {
        pageNumber: 3,
        text: "Lukas lanean hasi da! Ttak, ttak, ttak! aizkorarekin. Zirri-zarra, zirri-zarra! zerrarekin enborrak mozten.",
        scenePrompt: "Lukas aizkora eta zerrarekin lanean Olentzero animatzen duelarik.",
        imageUrl: "/images/lukas-olentzero/p3.jpg",
      },
      {
        pageNumber: 4,
        text: "Gurdia prest dago! Baina nork eramango du? Saia gaitezen euli txiki batekin! Bzzz... Ezinezkoa da, ezin du! Oso-oso txikia da!",
        scenePrompt: "Euli txiki-txiki bat gurdiari sokatxo batez tiraka.",
        imageUrl: "/images/lukas-olentzero/p4.jpg",
      },
      {
        pageNumber: 5,
        text: "Eta hipopotamo potolo batekin? Uf, uf! Indar handia egiten du, baina honek ere ezin du gurdia mugitu!",
        scenePrompt: "Hipopotamo potolo bat gurdiaren aurrean sokatik tiraka.",
        imageUrl: "/images/lukas-olentzero/p5.jpg",
      },
      {
        pageNumber: 6,
        text: "Elefanteak ere ezin du! Eta kokodriloak? Alferrik, gurdia oso astuna da! Nor falta da?",
        scenePrompt: "Elefantea eta kokodriloa gurditik tiraka alferrik.",
        imageUrl: "/images/lukas-olentzero/p6.jpg",
      },
      {
        pageNumber: 7,
        text: "Baiki! Olentzerok animalia magiko bat du: bere astotxo maitea! I-a, i-a! «Honek baietz!»",
        scenePrompt: "Olentzero ideia argiarekin eta astotxo gris lagunkoia ondoan.",
        imageUrl: "/images/lukas-olentzero/p7.jpg",
      },
      {
        pageNumber: 8,
        text: "Astotxoak tira egin du eta... Biba! Gurdia, opariz beteta, martxan jarri da! Lukas eta Olentzero oso-oso pozik daude!",
        scenePrompt: "Astotxoa opariz betetako gurdiarekin pozik martxan.",
        imageUrl: "/images/lukas-olentzero/azala.jpg",
      },
      {
        pageNumber: 9,
        text: "«Eskerrik asko, Lukas!» esan dio Olentzerok. Eta astoarekin batera, Euskal Herriko ume guztiei opariak ematera abiatu da. Agur, Olentzero! Gabon!",
        scenePrompt: "Olentzero gurdian urruntzen gaueko zeru izartsuaren azpian, Lukas agurtzen.",
        imageUrl: "/images/lukas-olentzero/p9.jpg",
      },
    ],
  },
  {
    id: "ejemplo-lucia-bosque",
    title: "Lucía y el Bosque de las Luciérnagas",
    dedication: "Para Lucía, para que nunca dejes de mirar el mundo con curiosidad.",
    language: "es",
    contentType: "narrativo",
    bookFormat: "mini",
    styleId: "watercolor",
    mode: "demo",
    createdAt: "2026-11-10T10:00:00.000Z",
    characters: [
      {
        id: "char-lucia",
        name: "Lucía",
        role: "Protagonista",
        ageOrNote: "6 años, pelo rizado y chubasquero amarillo",
        baseIllustrationUrl: "/images/char-base.jpg",
      },
    ],
    pages: [
      {
        pageNumber: 1,
        text: "Aquella tarde de otoño, Lucía se puso su chubasquero amarillo y preparó la mochila verde para descubrir qué había más allá del puente de piedra.",
        scenePrompt: "Lucía con chubasquero amarillo frente al sendero del bosque al atardecer.",
        imageUrl: "/images/char-base.jpg",
      },
      {
        pageNumber: 2,
        text: "Al cruzar el puente cubierto de musgo, el aire se llenó de pequeños destellos dorados. ¡Eran farolillos suspendidos entre las ramas de los árboles!",
        scenePrompt: "Lucía mirando una aldea iluminada en los árboles.",
        imageUrl: "/images/scene-treehouse.jpg",
      },
      {
        pageNumber: 3,
        text: "Cada farolillo guardaba un susurro del bosque. Lucía señaló el más brillante de todos, que titilaba suavemente como si la invitara a acercarse.",
        scenePrompt: "Lucía señalando farolillos luminosos colgando de las ramas.",
        imageUrl: "/images/style-watercolor.jpg",
      },
    ],
  },
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getAllStories(): Story[] {
  ensureDataDir();
  if (!fs.existsSync(STORIES_FILE)) {
    fs.writeFileSync(STORIES_FILE, JSON.stringify(SEED_STORIES, null, 2), "utf8");
  }
  return JSON.parse(fs.readFileSync(STORIES_FILE, "utf8")) as Story[];
}

export function getStoryById(id: string): Story | undefined {
  return getAllStories().find((s) => s.id === id);
}

export function saveStory(story: Story): Story {
  const stories = getAllStories();
  const idx = stories.findIndex((s) => s.id === story.id);
  if (idx >= 0) {
    stories[idx] = story;
  } else {
    stories.unshift(story);
  }
  fs.writeFileSync(STORIES_FILE, JSON.stringify(stories, null, 2), "utf8");
  return story;
}

export function deleteStory(id: string): void {
  const stories = getAllStories().filter((s) => s.id !== id);
  fs.writeFileSync(STORIES_FILE, JSON.stringify(stories, null, 2), "utf8");
}

export function getAllCharacters(): CharacterProfile[] {
  ensureDataDir();
  if (!fs.existsSync(CHARACTERS_FILE)) {
    fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(SEED_CHARACTERS, null, 2), "utf8");
  }
  return JSON.parse(fs.readFileSync(CHARACTERS_FILE, "utf8")) as CharacterProfile[];
}

export function getCharacterById(id: string): CharacterProfile | undefined {
  return getAllCharacters().find((c) => c.id === id);
}

export function saveCharacter(character: CharacterProfile): CharacterProfile {
  const chars = getAllCharacters();
  const idx = chars.findIndex((c) => c.id === character.id);
  if (idx >= 0) {
    chars[idx] = character;
  } else {
    chars.unshift(character);
  }
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(chars, null, 2), "utf8");
  return character;
}

export function deleteCharacter(id: string): void {
  const chars = getAllCharacters().filter((c) => c.id !== id);
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(chars, null, 2), "utf8");
}
