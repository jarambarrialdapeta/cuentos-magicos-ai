export type ContentType = "narrativo" | "educativo" | "adultos" | "memorias";

export type BookFormat = "micro" | "mini" | "aventura";

export type StoryLanguage = "eu" | "es" | "en" | "fr";

export type IllustrationStyleId =
  | "watercolor"
  | "3d"
  | "classic"
  | "gouache"
  | "pencil"
  | "editorial";

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  ageOrNote: string;
  styleId: IllustrationStyleId;
  photoDataUrl?: string;
  baseIllustrationUrl?: string;
  createdAt: string;
}

export interface CharacterInput {
  id: string;
  name: string;
  role: string;
  ageOrNote: string;
  photoDataUrl?: string;
  baseIllustrationUrl?: string;
}

export interface StoryPage {
  pageNumber: number;
  text: string;
  scenePrompt: string;
  imageUrl: string;
}

export interface Story {
  id: string;
  title: string;
  dedication: string;
  language?: StoryLanguage;
  contentType: ContentType;
  bookFormat: BookFormat;
  styleId: IllustrationStyleId;
  characters: CharacterInput[];
  pages: StoryPage[];
  mode: "ai" | "demo";
  aiWarning?: string;
  createdAt: string;
}
