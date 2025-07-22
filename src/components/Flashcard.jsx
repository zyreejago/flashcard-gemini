import { useState } from 'react';
import './Flashcard.css';

function Flashcard({ flashcard }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFlip();
    }
  };

  return (
    <div 
      className={`flashcard ${isFlipped ? 'flipped' : ''}`}
      onClick={handleFlip}
      onKeyPress={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`Flashcard: ${isFlipped ? 'showing answer' : 'showing question'}. Press to flip.`}
    >
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <div className="flashcard-content">
            <h3>Pertanyaan</h3>
            <p>{flashcard.question}</p>
          </div>
          <div className="flip-hint">
            <span>Klik untuk jawaban</span>
            <span className="flip-icon">🔄</span>
          </div>
        </div>
        <div className="flashcard-back">
          <div className="flashcard-content">
            <h3>Jawaban</h3>
            <p>{flashcard.answer}</p>
          </div>
          <div className="flip-hint">
            <span>Klik untuk pertanyaan</span>
            <span className="flip-icon">🔄</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Flashcard;
