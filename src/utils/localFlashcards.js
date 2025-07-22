export function generateLocalFlashcards(text, cardCount = 8) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  const words = text.split(/\s+/).filter(w => w.length > 3);
  
  const flashcards = [];
  
  if (sentences.length > 0) {
    flashcards.push({
      question: "Apa isi utama dari materi ini?",
      answer: sentences[0].trim() + (sentences.length > 1 ? '...' : '')
    });
  }
  
  if (paragraphs.length > 0) {
    const mainParagraph = paragraphs[0].trim();
    flashcards.push({
      question: "Jelaskan lebih lanjut tentang materi ini",
      answer: mainParagraph.length > 150 ? mainParagraph.substring(0, 150) + '...' : mainParagraph
    });
    
    if (paragraphs.length > 1) {
      const secondParagraph = paragraphs[1].trim();
      flashcards.push({
        question: "Apa informasi tambahan yang terdapat dalam materi?",
        answer: secondParagraph.length > 150 ? secondParagraph.substring(0, 150) + '...' : secondParagraph
      });
    }
  }
  
  const uniqueWords = [...new Set(words)]; // Remove duplicates
  const keywords = uniqueWords
    .filter(word => word.length > 4) 
    .slice(0, 5);
    
  if (keywords.length > 0) {
    flashcards.push({
      question: `Apa yang dimaksud dengan kata kunci: ${keywords.join(', ')}?`,
      answer: "Kata-kata penting yang terdapat dalam materi pembelajaran ini"
    });
  }
  
  if (text.toLowerCase().includes('sejarah') || text.toLowerCase().includes('tahun')) {
    flashcards.push({
      question: "Peristiwa penting apa yang disebutkan dalam materi ini?",
      answer: "Materi ini membahas beberapa peristiwa penting dalam sejarah"
    });
  }
  
  if (text.toLowerCase().includes('rumus') || text.toLowerCase().includes('hitung')) {
    flashcards.push({
      question: "Bagaimana cara menerapkan rumus yang disebutkan?",
      answer: "Rumus dapat diterapkan dengan memahami konteks dan variabel yang terlibat"
    });
  }
  
  flashcards.push(
    {
      question: "Bagaimana cara memahami materi ini dengan baik?",
      answer: "Dengan membaca dan memahami setiap bagian secara bertahap, serta mencoba menerapkan konsep yang dipelajari"
    },
    {
      question: "Apa manfaat mempelajari materi ini?",
      answer: "Menambah pengetahuan dan pemahaman tentang topik yang dibahas, serta mengembangkan kemampuan analisis"
    },
    {
      question: "Kapan sebaiknya materi ini dipelajari?",
      answer: "Secara rutin dan konsisten untuk hasil yang optimal, dengan fokus pada pemahaman konsep dasar terlebih dahulu"
    }
  );
  
  return flashcards.slice(0, cardCount);
}