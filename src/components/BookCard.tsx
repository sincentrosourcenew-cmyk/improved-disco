import { Book as BookIcon, Clock, Download, FileText } from 'lucide-react';
import type { Book } from '../types';
import { downloadBookPDF } from '../lib/pdf';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <div className="group rounded-2xl border border-stone-200 bg-white p-6 transition-all hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white shadow-inner">
          <BookIcon size={24} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-stone-900 transition-colors group-hover:text-emerald-600">{book.title}</h3>
          <p className="mb-3 text-sm text-stone-500">by {book.authorName}</p>

          <div className="flex flex-wrap gap-3 text-xs font-medium text-stone-400">
            <div className="flex items-center gap-1">
              <FileText size={14} />
              <span>{book.numChapters} Chapters</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{new Date(book.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => downloadBookPDF(book)}
          className="rounded-full p-2 text-stone-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
          title="Download PDF"
        >
          <Download size={20} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-300">
          {book.genre} / {book.language}
        </span>
        <span className="text-xs font-mono text-stone-400">{book.wordCount.toLocaleString()} words</span>
      </div>
    </div>
  );
}
