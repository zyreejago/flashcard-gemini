// Improved PDF text extraction with multiple strategies
export async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const arrayBuffer = e.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      
      try {
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) {
          throw new Error('PDF.js library tidak tersedia');
        }
        
        pdfjsLib.getDocument({data: uint8Array}).promise.then(async (pdf) => {
          let fullText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
          }
          
          fullText = fullText
            .replace(/\s+/g, ' ') // Normalisasi spasi
            .trim();
          
          if (fullText.length < 20) {
            reject(new Error('PDF tidak mengandung teks yang dapat dibaca. Pastikan PDF berisi teks, bukan hanya gambar atau PDF terenkripsi.'));
          } else {
            resolve(fullText);
          }
        }).catch(error => {
          console.error('PDF.js error:', error);
          
          // Fallback ke metode ekstraksi alternatif jika PDF.js gagal
          fallbackExtraction(uint8Array, resolve, reject);
        });
      } catch (error) {
        console.error('PDF extraction error:', error);
        
        // Fallback ke metode ekstraksi alternatif
        fallbackExtraction(uint8Array, resolve, reject);
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(new Error('Gagal membaca file PDF. Coba gunakan file PDF lain atau input manual.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Fungsi ekstraksi fallback jika PDF.js gagal
function fallbackExtraction(uint8Array, resolve, reject) {
  try {
    const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
    const pdfString = decoder.decode(uint8Array);
    
    // Metode 1: Ekstrak teks dari objek PDF dengan format standar
    const textBlocks = pdfString.match(/BT[\s\S]*?ET/g) || [];
    let extractedText = '';
    
    textBlocks.forEach(block => {
      // Ekstrak teks dari blok BT...ET dengan regex yang lebih baik
      const blockText = block.match(/\(([^\)\(]*)\)/g) || [];
      blockText.forEach(match => {
        const cleanText = match.replace(/[\(\)]/g, '');
        if (cleanText.length > 0) {
          extractedText += cleanText + ' ';
        }
      });
    });
    
    if (extractedText.length > 100) {
      resolve(extractedText);
      return;
    }
    
    // Metode 2: Cari format Q&A
    const qaMatches = pdfString.match(/Q:\s*(.*?)\s*A:\s*(.*?)(?=Q:|$)/gs) || [];
    
    if (qaMatches.length > 0) {
      // PDF has Q&A structure - extract directly
      let qaText = '';
      qaMatches.forEach(match => {
        const qMatch = match.match(/Q:\s*(.*?)\s*A:/s);
        const aMatch = match.match(/A:\s*(.*?)(?=Q:|$)/s);
        
        if (qMatch && qMatch[1] && aMatch && aMatch[1]) {
          qaText += `Q: ${qMatch[1].trim()}\nA: ${aMatch[1].trim()}\n\n`;
        }
      });
      
      if (qaText.length > 50) {
        resolve(qaText);
        return;
      }
    }
    
    // Metode 3: Ekstrak teks dari objek stream
    const streamMatches = pdfString.match(/stream([\s\S]*?)endstream/g) || [];
    let streamText = '';
    
    streamMatches.forEach(match => {
      const streamContent = match.replace(/stream|endstream/g, '');
      // Cari teks yang dapat dibaca dalam stream
      const readableText = streamContent.match(/[a-zA-Z0-9\u00C0-\u00FF][a-zA-Z0-9\u00C0-\u00FF\s.,;:!?'"\-]{3,}/gu) || [];
      readableText.forEach(t => {
        if (t.length > 3) {
          streamText += t + ' ';
        }
      });
    });
    
    if (streamText.length > 100) {
      resolve(streamText);
      return;
    }
    
    // Metode 4: Ekstrak teks dari tanda kurung
    const textMatches = pdfString.match(/\(([^\)\(]*)\)/g) || [];
    let parenthesesText = '';
    
    textMatches.forEach(match => {
      const cleanText = match.replace(/[\(\)]/g, '');
      if (cleanText.length > 0) {
        parenthesesText += cleanText + ' ';
      }
    });
    
    if (parenthesesText.length > 50) {
      resolve(parenthesesText);
      return;
    }
    
    // Fallback terakhir: coba ekstrak teks yang dapat dibaca
    const fallbackText = pdfString.match(/[a-zA-Z0-9\u00C0-\u00FF][a-zA-Z0-9\u00C0-\u00FF\s.,!?;:\-]{5,}/gu) || [];
    const finalText = fallbackText.join(' ').substring(0, 5000);
    
    if (finalText.length > 20) {
      resolve(finalText);
    } else {
      reject(new Error('PDF tidak mengandung teks yang dapat dibaca. Pastikan PDF berisi teks, bukan hanya gambar atau PDF terenkripsi.'));
    }
  } catch (error) {
    console.error('Fallback extraction error:', error);
    reject(new Error('Gagal membaca file PDF. Coba gunakan file PDF lain atau input manual.'));
  }
}