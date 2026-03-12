import { GoogleGenAI, Type } from '@google/genai';
import type { BookForm, Chapter } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateOutline(form: BookForm, idea: string): Promise<Partial<Chapter>[]> {
  const model = 'gemini-2.5-flash';

  const prompt = `Create a detailed table of contents for a ${form.genre} book titled "${form.title}" in ${form.language}.
Chapters: ${form.numChapters}
Concept: ${idea}
Writing Style: ${form.writingStyle}

Return a JSON array of objects, each with "number", "title", and "summary" (a one-sentence description). Exactly ${form.numChapters} chapters.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            number: { type: Type.INTEGER },
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ['number', 'title', 'summary'],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error('Failed to parse outline', e);
    return Array.from({ length: form.numChapters }, (_, i) => ({
      number: i + 1,
      title: `Chapter ${i + 1}`,
      summary: 'Continuing the narrative...',
    }));
  }
}

export async function generateChapterContent(
  ch: Partial<Chapter>,
  form: BookForm,
  idea: string,
  previousContext = '',
): Promise<string> {
  const model = 'gemini-2.5-flash';

  const systemInstruction = `You are a world-class ${form.genre} author writing in ${form.language}. Your writing style is ${form.writingStyle}.
You write dense, rich, highly professional literary prose.
Every paragraph must be detailed, atmospheric, and immersive.
Absolutely NO bullet points, NO headers, NO markdown formatting.
Just pure, high-quality professional prose.`;

  const parts: string[] = [];
  const totalParts = 3;

  for (let i = 1; i <= totalParts; i += 1) {
    const prompt = `Write PART ${i} of 3 for Chapter ${ch.number}: "${ch.title}" of the book "${form.title}".
Book Premise: ${idea}
Chapter Summary: ${ch.summary}

${
  i === 1
    ? previousContext
      ? `Context from previous chapters: ${previousContext.slice(-2000)}`
      : ''
    : `Context from previous parts: ${parts.join('\n\n').slice(-3000)}`
}

STRICT REQUIREMENTS for PART ${i}:
- Write at least 1200 words for this part.
- Use ${form.language} only.
- Maintain a ${form.writingStyle} tone.
- ${i < totalParts ? 'Do NOT end the chapter. This is a continuation.' : 'Bring the chapter to a powerful and professional conclusion.'}
- Do NOT include the chapter title or number.
- Focus on deep narrative depth, sensory details, and professional pacing.`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.75,
      },
    });

    parts.push(response.text || '');
  }

  return parts.join('\n\n');
}
