export type ContentType = "narrativo" | "educativo" | "adultos" | "memorias";

export type BookFormat = "micro" | "mini" | "aventura";

export type IllustrationStyleId =
  | "watercolor"
  | "3d"
  | "classic"
  | "gouache"
  | "pencil"
  | "editorial";

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
  contentType: ContentType;
  bookFormat: BookFormat;
  styleId: IllustrationStyleId;
  characters: CharacterInput[];
  pages: StoryPage[];
  mode: "ai" | "demo";
  createdAt: string;
}
