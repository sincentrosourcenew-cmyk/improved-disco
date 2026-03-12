export interface Chapter {
  number: number;
  title: string;
  summary: string;
  content: string;
  wordCount: number;
  status: 'pending' | 'writing' | 'done' | 'error';
}

export interface Book {
  id: string;
  title: string;
  authorName: string;
  genre: string;
  language: string;
  writingStyle: string;
  numChapters: number;
  chapters: Chapter[];
  wordCount: number;
  createdAt: string;
  idea: string;
}

export interface BookForm {
  title: string;
  authorName: string;
  genre: string;
  language: string;
  writingStyle: string;
  numChapters: number;
}
