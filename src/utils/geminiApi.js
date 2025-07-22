const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

export async function generateFlashcardsWithGemini(text, cardCount = 8) {
  try {
    const hasQAFormat = text.match(/Q:\s*.*?\s*A:\s*.*?(?=Q:|$)/gs);
    
    let promptText;
    if (hasQAFormat) {
      promptText = `Berikut adalah teks dalam format Q&A. Ubah menjadi array JSON flashcard dengan struktur [{"question": "pertanyaan", "answer": "jawaban"}]. PENTING: Pertanyaan dan jawaban HARUS SAMA PERSIS seperti dalam teks asli, tanpa perubahan atau ringkasan. HANYA berikan JSON array, tanpa teks tambahan atau penjelasan:\n\n${text}`;
    } else {
      promptText = `Buatlah ${cardCount} flashcard dari teks berikut. PENTING: Gunakan teks asli sebanyak mungkin, jangan meringkas atau mengubah konten asli. Untuk jawaban, gunakan kutipan langsung dari teks asli.\n\nFlashcard harus mencakup konsep-konsep penting, definisi, dan informasi kunci dari teks. Pastikan pertanyaan bervariasi (definisi, penjelasan, perbandingan, dll) dan jawaban menggunakan teks asli (tanpa diringkas).\n\nFormat response sebagai JSON array dengan struktur: [{"question": "pertanyaan", "answer": "jawaban"}].\n\nPastikan pertanyaan dan jawaban dalam bahasa Indonesia, relevan dengan materi, dan membantu pemahaman. HANYA berikan JSON array, tanpa teks tambahan atau penjelasan:\n\n${text.substring(0, 3000)}`;
    }
    
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptText
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    const generatedText = data.candidates[0].content.parts[0].text;
    
    const jsonMatch = generatedText.match(/\[.*\]/s);
    if (jsonMatch) {
      try {
        const flashcards = JSON.parse(jsonMatch[0]);
        if (Array.isArray(flashcards) && flashcards.length > 0) {
          return flashcards.filter(card => card.question && card.answer);
        }
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
      }
    }
    
    return createFallbackFlashcards(text);
    
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return createFallbackFlashcards(text);
  }
}

function createFallbackFlashcards(text, cardCount = 8) {
  const qaMatches = text.match(/Q:\s*(.*?)\s*A:\s*(.*?)(?=Q:|$)/gs);
  
  if (qaMatches && qaMatches.length > 0) {
    const flashcards = [];
    
    qaMatches.forEach(match => {
      const qMatch = match.match(/Q:\s*(.*?)\s*A:/s);
      const aMatch = match.match(/A:\s*(.*?)(?=Q:|$)/s);
      
      if (qMatch && qMatch[1] && aMatch && aMatch[1]) {
        flashcards.push({
          question: qMatch[1].trim(),
          answer: aMatch[1].trim()
        });
      }
    });
    
    if (flashcards.length > 0) {
      return flashcards;
    }
  }
  
  const listItems = text.match(/([\d\w][\d\w\.\)]+)\s+([^\d\w\n][^\n]{10,})/g) || [];
  if (listItems.length >= 3) {
    const flashcards = [];
    listItems.slice(0, 8).forEach(item => {
      const match = item.match(/([\d\w][\d\w\.\)]+)\s+([^\n]{10,})/);
      if (match && match[2]) {
        const content = match[2];
        flashcards.push({
          question: `Jelaskan tentang ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
          answer: content
        });
      }
    });
    
    if (flashcards.length >= 3) {
      return flashcards;
    }
  }
  
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  const flashcards = [];
  
  if (paragraphs.length > 0) {
    flashcards.push({
      question: "Apa topik utama dari materi ini?", 
      answer: paragraphs[0]
    });
    
    if (paragraphs.length > 1) {
      flashcards.push({
        question: "Apa informasi penting lainnya dalam materi ini?",
        answer: paragraphs[1]
      });
    }
  }
  
  if (sentences.length > 2) {
    const importantSentences = sentences.slice(0, 3);
    flashcards.push({
      question: "Sebutkan poin-poin penting dari teks", 
      answer: importantSentences.join('. ')
    });
  }
  
  if (text.length > 100) {
    const sections = [];
    
    const textLength = text.length;
    const sectionSize = Math.min(300, Math.floor(textLength / 3));
    
    if (sectionSize > 50) {
      for (let i = 0; i < 3; i++) {
        const start = i * sectionSize;
        const end = Math.min(start + sectionSize, textLength);
        if (start < textLength) {
          sections.push(text.substring(start, end));
        }
      }
      
      sections.forEach((section, index) => {
        flashcards.push({
          question: `Bagian ${index + 1} dari materi:`,
          answer: section
        });
      });
    }
  }
  
  if (flashcards.length < 3) {
    flashcards.push(
      { 
        question: "Bagaimana cara menerapkan pengetahuan ini?", 
        answer: "Dengan memahami konsep dasar dan mengaplikasikannya dalam konteks yang relevan"
      },
      {
        question: "Apa manfaat mempelajari materi ini?",
        answer: "Menambah pengetahuan dan keterampilan dalam bidang yang dibahas"
      }
    );
  }
  
  return flashcards.slice(0, cardCount); 
}