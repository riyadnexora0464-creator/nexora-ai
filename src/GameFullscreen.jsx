
import { useEffect, useRef, useState } from 'react';
import './GameFullscreen.css';

export default function GameFullscreen({ children, title = 'Game' }) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function updateFullscreen() {
      setIsFullscreen(
        document.fullscreenElement === containerRef.current
      );
    }

    document.addEventListener('fullscreenchange', updateFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreen);
    };
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === containerRef.current) {
        await document.exitFullscreen();
      } else {
        await containerRef.current?.requestFullscreen();
      }
    } catch (error) {
      console.error('Could not open fullscreen mode:', error);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`game-fullscreen-shell ${
        isFullscreen ? 'is-fullscreen' : ''
      }`}
    >
      <div className="game-fullscreen-toolbar">
        <span>{title}</span>

        <button
          type="button"
          className="game-fullscreen-button"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? '✕ Exit Full Screen' : '⛶ Play Full Screen'}
        </button>
      </div>

      <div className="game-fullscreen-content">
        {children}
      </div>
    </div>
  );
}
