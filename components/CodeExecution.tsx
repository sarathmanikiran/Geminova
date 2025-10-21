
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

interface CodeExecutionProps {
  language: string;
  code: string;
}

const SUPPORTED_LANGUAGES = ['javascript', 'js', 'html', 'css'];

export const CodeExecution: React.FC<CodeExecutionProps> = ({ language, code }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isSupported = SUPPORTED_LANGUAGES.includes(language.toLowerCase());

  useEffect(() => {
    if (!isModalOpen) return;

    const handleMessage = (event: MessageEvent) => {
      // Basic security check
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }
      
      const { type, payload } = event.data;
      if (type === 'console') {
        const formattedPayload = payload.map((p: any) => {
            try {
                if (typeof p === 'object' && p !== null) return JSON.stringify(p, null, 2);
                return String(p);
            } catch {
                return '[Unserializable Object]';
            }
        }).join(' ');
        setConsoleOutput(prev => [...prev, formattedPayload]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isModalOpen]);

  if (!isSupported) {
    return null;
  }

  const getIframeContent = () => {
    const sanitizedCode = code.replace(/<\/script>/g, '<\\/script>');

    switch (language.toLowerCase()) {
      case 'html':
        return sanitizedCode;
      case 'css':
        return `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { background-color: #111; color: #eee; font-family: sans-serif; padding: 1rem; }
                ${sanitizedCode}
              </style>
            </head>
            <body>
              <h1>Styled Heading</h1>
              <p>This is a paragraph styled by the provided CSS. It includes <strong>strong</strong> and <em>emphasized</em> text.</p>
              <button class="styled-button">Styled Button</button>
              <div class="styled-div">This is a styled div.</div>
            </body>
          </html>
        `;
      case 'javascript':
      case 'js':
        return `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { 
                  background-color: #111; 
                  color: #eee; 
                  font-family: monospace; 
                  padding: 1rem; 
                  font-size: 14px;
                }
                .error { color: #f87171; }
              </style>
            </head>
            <body>
              <script>
                const originalLog = console.log;
                const originalError = console.error;

                console.log = (...args) => {
                  window.parent.postMessage({ type: 'console', payload: args }, '*');
                  originalLog.apply(console, args);
                };
                
                console.error = (...args) => {
                  const errorMsg = args.map(arg => arg instanceof Error ? arg.message : arg).join(' ');
                  window.parent.postMessage({ type: 'console', payload: ['[ERROR]', errorMsg] }, '*');
                  originalError.apply(console, args);
                };

                window.addEventListener('error', event => {
                    console.error(event.message);
                });

                try {
                  ${sanitizedCode}
                } catch (e) {
                  console.error(e);
                }
              </script>
            </body>
          </html>
        `;
      default:
        return '';
    }
  };
  
  const openModal = () => {
    setConsoleOutput([]);
    setIsModalOpen(true);
  }

  return (
    <>
      <button onClick={openModal} className="flex items-center gap-1 hover:text-white rounded-md p-1 transition-all transform hover:scale-105 hover:shadow-glow-accent active:scale-95">
        <Icons.Terminal className="w-4 h-4" />
        <span className="text-xs">Run</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="bg-background-dark rounded-lg shadow-xl w-full max-w-3xl h-[80vh] border border-glass-border flex flex-col animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-glass-border flex justify-between items-center flex-shrink-0">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Icons.Terminal className="w-5 h-5" />
                Code Playground ({language})
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-white/10 transition-all transform hover:scale-110 active:scale-95">
                <Icons.Close className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <iframe
                  ref={iframeRef}
                  srcDoc={getIframeContent()}
                  title="Code Execution Sandbox"
                  sandbox="allow-scripts"
                  className="w-full h-full border-0 flex-1 bg-gray-900"
                />
                {language.toLowerCase().startsWith('js') && (
                    <div className="flex-shrink-0 h-1/3 border-t border-glass-border flex flex-col">
                        <h3 className="text-sm font-semibold p-2 bg-gray-800/60">Console</h3>
                        <div className="flex-1 p-2 bg-black overflow-y-auto font-mono text-sm">
                            {consoleOutput.length === 0 ? (
                                <p className="text-gray-500 italic">Console output will appear here...</p>
                            ) : (
                                consoleOutput.map((line, index) => (
                                    <pre key={index} className={`whitespace-pre-wrap ${line.startsWith('[ERROR]') ? 'text-red-400' : 'text-gray-300'}`}>&gt; {line}</pre>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
