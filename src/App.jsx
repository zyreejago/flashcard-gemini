import { useState } from 'react';
import Flashcard from './components/Flashcard';
import { extractTextFromPDF } from './utils/pdfUtils';
import { generateFlashcardsWithGemini } from './utils/geminiApi';
import { generateLocalFlashcards } from './utils/localFlashcards';
import './App.css';

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentCard, setCurrentCard] = useState(0);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [useLocalGeneration, setUseLocalGeneration] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [cardCount, setCardCount] = useState(8);

  const handleFileChange = (event) => {
    setPdfFile(event.target.files[0]);
    setError('');
    setShowManualInput(false);
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called'); 
    if (!pdfFile && !manualText.trim()) {
      console.log('No file or text provided'); 
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let extractedText = '';
      
      if (manualText.trim()) {
        extractedText = manualText.trim();
        console.log('Using manual text:', extractedText.substring(0, 100));
      } else {
        console.log('Extracting text from PDF'); 
        extractedText = await extractTextFromPDF(pdfFile);
        console.log('Extracted text:', extractedText.substring(0, 100)); 
      }
      
      if (!extractedText || extractedText.trim().length < 20) {
        throw new Error('Teks tidak cukup untuk membuat flashcard. Minimal 20 karakter diperlukan.');
      }

      let generatedFlashcards;
      
      if (useLocalGeneration) {
        console.log('Using local generation'); // Debug log
        generatedFlashcards = generateLocalFlashcards(extractedText, cardCount);
      } else {
        try {
          console.log('Trying Gemini API'); 
          generatedFlashcards = await generateFlashcardsWithGemini(extractedText, cardCount);
          console.log('Gemini API success:', generatedFlashcards); 
        } catch (apiError) {
          console.log('Gemini API failed, using local generation:', apiError);
          generatedFlashcards = generateLocalFlashcards(extractedText, cardCount);
          setUseLocalGeneration(true);
        }
      }
      
      console.log('Generated flashcards:', generatedFlashcards);
      setFlashcards(generatedFlashcards);
      setCurrentCard(0);
    } catch (error) {
      console.error('Error in handleSubmit:', error); 
      setError(error.message || 'Terjadi kesalahan saat memproses. Coba gunakan input manual.');
      if (!showManualInput) {
        setShowManualInput(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const resetGame = () => {
    setFlashcards([]);
    setPdfFile(null);
    setCurrentCard(0);
    setError('');
    setShowManualInput(false);
    setManualText('');
  };

  const toggleManualInput = () => {
    setShowManualInput(!showManualInput);
    setError('');
  };

  // Komponen Welcome Page
  const WelcomePage = () => (
    <div className="welcome-page">
      <div className="welcome-content">
        <h1>Welcome to SPARK</h1>
        <p>Knowledge Ignited By Science-Driven Learning</p>
        <button onClick={() => setShowWelcome(false)} className="start-btn">
          Mulai Belajar
        </button>
      </div>
    </div>
  );

  return (
    <div className={`App ${flashcards.length > 0 ? 'has-flashcards' : ''} ${showManualInput ? 'manual-input-active' : ''} ${loading ? 'loading-state' : ''}`}>
      {showWelcome ? (
        <WelcomePage />
      ) : (
        <>
          
          
          <header className="App-header">
            <h1 className="spark-title">SPARK</h1>
            <p className="spark-subtitle">Knowledge Ignited By Science-Driven Learning</p>
            
            {useLocalGeneration && (
              <div className="info-message">
                ℹ️ Menggunakan generator lokal (Gemini API tidak tersedia)
              </div>
            )}
            
            {flashcards.length === 0 && (
              <div className="upload-section">
                {!showManualInput ? (
                  <>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                    <div className="card-count-selector">
                      <label htmlFor="card-count">Jumlah Flashcard:</label>
                      <input 
                        type="number" 
                        id="card-count" 
                        min="1" 
                        max="20" 
                        value={cardCount} 
                        onChange={(e) => setCardCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 8)))} 
                        disabled={loading}
                      />
                    </div>
                    <div className="button-group">
                      <button 
                        onClick={handleSubmit} 
                        disabled={!pdfFile || loading}
                        className="generate-btn"
                      >
                        {loading ? '🔄 Memproses...' : '🧪 Generate dari PDF'}
                      </button>
                      <button 
                        onClick={toggleManualInput}
                        className="manual-btn"
                        disabled={loading}
                      >
                        📝 Input Manual
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="Masukkan teks materi pembelajaran di sini...\n\nContoh: Materi tentang fotosintesis, sejarah Indonesia, rumus matematika, dll."
                      className="manual-input"
                      rows={8}
                      disabled={loading}
                    />
                    <div className="card-count-selector">
                      <label htmlFor="card-count-manual">Jumlah Flashcard:</label>
                      <input 
                        type="number" 
                        id="card-count-manual" 
                        min="1" 
                        max="20" 
                        value={cardCount} 
                        onChange={(e) => setCardCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 8)))} 
                        disabled={loading}
                      />
                    </div>
                    <div className="button-group">
                      <button 
                        onClick={handleSubmit} 
                        disabled={!manualText.trim() || loading}
                        className="generate-btn"
                      >
                        {loading ? '🔄 Memproses...' : '⚗️ Generate Flashcards'}
                      </button>
                      <button 
                        onClick={toggleManualInput}
                        className="manual-btn"
                        disabled={loading}
                      >
                        📄 Kembali ke PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}
          </header>
          
          <main className="flashcard-container">
            {flashcards.length > 0 && (
              <>
                <div className="game-controls">
                  <button onClick={prevCard} disabled={flashcards.length <= 1}>⬅️ Sebelumnya</button>
                  <span className="card-counter">
                    {currentCard + 1} / {flashcards.length}
                  </span>
                  <button onClick={nextCard} disabled={flashcards.length <= 1}>Selanjutnya ➡️</button>
                </div>
                
                <Flashcard flashcard={flashcards[currentCard]} />
                
                <div className="game-actions">
                  <button onClick={resetGame} className="reset-btn">
                    🧪 Buat Flashcard Baru
                  </button>
                </div>
              </>
            )}
          </main>
          
          <div className="lab-decorations">
            <div className="lab-item beaker">🧪</div>
            <div className="lab-item flask">🧫</div>
            <div className="lab-item microscope">🔬</div>
            <div className="lab-item atom">⚛️</div>
            <div className="lab-item warning">☢️</div>
            <div className="lab-item danger">⚠️</div>
            <div className="lab-item experiment">🧠</div>
            <div className="lab-item scientist">👩‍🔬</div>
          </div>
          
          <div className="lab-equipment">
            <div className="lab-equipment-item"></div>
            <div className="lab-equipment-item"></div>
            <div className="lab-equipment-item"></div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;