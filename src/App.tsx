import { Book as BookIcon, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BookCard } from './components/BookCard';
import { generateChapterContent, generateOutline } from './lib/gemini';
import type { Book, BookForm, Chapter } from './types';

const defaultForm: BookForm = {
  title: '',
  authorName: '',
  genre: 'Fantasy',
  language: 'English',
  writingStyle: 'Cinematic and immersive',
  numChapters: 5,
};

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [idea, setIdea] = useState('');
  const [form, setForm] = useState<BookForm>(defaultForm);

  const isFormValid = useMemo(
    () => form.title.trim() && form.authorName.trim() && idea.trim() && form.numChapters > 0,
    [form, idea],
  );

  const updateForm = <K extends keyof BookForm>(key: K, value: BookForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const generateNewBook = async () => {
    if (!isFormValid) return;

    setIsGenerating(true);
    try {
      const outline = await generateOutline(form, idea);
      const initialChapters: Chapter[] = Array.from({ length: form.numChapters }, (_, i) => {
        const generated = outline[i] ?? {};
        return {
          number: generated.number ?? i + 1,
          title: generated.title ?? `Chapter ${i + 1}`,
          summary: generated.summary ?? 'Continuing the narrative...',
          content: '',
          wordCount: 0,
          status: 'pending',
        };
      });

      const newBook: Book = {
        id: Date.now().toString(),
        title: form.title,
        authorName: form.authorName,
        genre: form.genre,
        language: form.language,
        writingStyle: form.writingStyle,
        numChapters: form.numChapters,
        chapters: initialChapters,
        wordCount: 0,
        createdAt: new Date().toISOString(),
        idea,
      };

      setBooks((prev) => [...prev, newBook]);

      for (let i = 0; i < newBook.chapters.length; i += 1) {
        const chapter = newBook.chapters[i];
        chapter.status = 'writing';
        setBooks((prev) => prev.map((b) => (b.id === newBook.id ? { ...newBook } : b)));

        const content = await generateChapterContent(
          chapter,
          form,
          idea,
          newBook.chapters
            .slice(0, i)
            .map((c) => c.content)
            .join('\n'),
        );

        chapter.content = content;
        chapter.wordCount = content.split(/\s+/).filter(Boolean).length;
        chapter.status = 'done';
        newBook.wordCount = newBook.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
        setBooks((prev) => prev.map((b) => (b.id === newBook.id ? { ...newBook } : b)));
      }

      setForm(defaultForm);
      setIdea('');
    } catch (error) {
      console.error('Failed to generate book:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-stone-900">Omnibook AI</h1>
          <p className="mx-auto max-w-2xl text-stone-600">
            Professional AI-powered book generation platform creating full-length books using Gemini Flash.
          </p>
        </header>

        <section className="mb-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-stone-900">
            <Sparkles size={20} className="text-emerald-600" />
            New Book Generator
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input className="input" placeholder="Book title" value={form.title} onChange={(e) => updateForm('title', e.target.value)} />
            <input
              className="input"
              placeholder="Author name"
              value={form.authorName}
              onChange={(e) => updateForm('authorName', e.target.value)}
            />
            <input className="input" placeholder="Genre" value={form.genre} onChange={(e) => updateForm('genre', e.target.value)} />
            <input
              className="input"
              placeholder="Language"
              value={form.language}
              onChange={(e) => updateForm('language', e.target.value)}
            />
            <input
              className="input"
              placeholder="Writing style"
              value={form.writingStyle}
              onChange={(e) => updateForm('writingStyle', e.target.value)}
            />
            <input
              type="number"
              min={1}
              max={30}
              className="input"
              placeholder="Number of chapters"
              value={form.numChapters}
              onChange={(e) => updateForm('numChapters', Number(e.target.value) || 1)}
            />
          </div>

          <textarea
            className="input mt-4 min-h-28"
            placeholder="Book core idea / premise"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />

          <button
            type="button"
            disabled={!isFormValid || isGenerating}
            onClick={generateNewBook}
            className="mt-4 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {isGenerating ? 'Generating...' : 'Generate Book'}
          </button>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

        {books.length === 0 && !isGenerating && (
          <div className="py-20 text-center">
            <BookIcon size={48} className="mx-auto mb-4 text-stone-300" />
            <p className="text-stone-500">No books yet. Start by generating your first book!</p>
          </div>
        )}

        {isGenerating && (
          <div className="fixed right-6 bottom-6 rounded-2xl bg-stone-900 px-6 py-4 text-white shadow-2xl">
            <p className="font-medium">Generating your book...</p>
            <p className="mt-1 text-sm text-stone-400">This may take a few minutes.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
