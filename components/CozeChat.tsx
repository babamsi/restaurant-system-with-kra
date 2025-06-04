"use client"

import { useEffect, useRef, useState } from 'react'
import { useDialog } from '@/contexts/dialog-context'
import { useTheme } from 'next-themes'

declare global {
  interface Window {
    CozeWebSDK: any;
  }
}

export function CozeChat() {
  const chatInstanceRef = useRef<any>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const { isAnyDialogOpen } = useDialog();
  let isInitialized = false;
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // Cleanup function to remove existing instances
    const cleanup = () => {
      if (chatInstanceRef.current) {
        chatInstanceRef.current.destroy();
        chatInstanceRef.current = null;
      }
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
      isInitialized = false;
      document.removeEventListener('touchstart', (e) => {
        if (!isInitialized) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, { capture: true });
    };

    // Initialize chat
    const initializeChat = () => {
      cleanup(); // Clean up any existing instance first

      // Don't initialize if a dialog is open
      if (isAnyDialogOpen) {
        return;
      }

      const script = document.createElement('script');
      script.src = "https://sf-cdn.coze.com/obj/unpkg-va/flow-platform/chat-app-sdk/1.0.0-beta.4/libs/oversea/index.js";
      script.async = true;
      
      script.onload = () => {
        const isMobile = window.innerWidth <= 768;
        
        // Add small delay to ensure proper initialization
        setTimeout(() => {
          isInitialized = true;
        }, 500);

        if (isMobile) {
          chatInstanceRef.current = new window.CozeWebSDK.WebChatClient({
            config: {
              bot_id: '7441099876152213512',
            },
            userInfo: {
              id: '123',
              nickname: 'Guest',
            },
            componentProps: {
              title: 'Chat with Maamul Assistant',
            },
            ui: {
              base: {
                icon: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-RH7bWss7VNcPmS97hkgV9QF1tfhPTm.png',
                layout: 'mobile',
                zIndex: 9999,
                size: 'full',
                style: {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '100%',
                  maxHeight: '100vh',
                  margin: 0,
                  padding: 0,
                  border: 'none',
                  borderRadius: 0,
                  overflow: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  '-webkit-tap-highlight-color': 'transparent',
                }
              },
              input: {
                style: {
                  fontSize: '16px',
                  padding: '12px',
                  appearance: 'none',
                  '-webkit-appearance': 'none',
                  borderRadius: '24px',
                }
              },
              asstBtn: {
                isNeed: true,
                style: {
                  position: 'fixed',
                  bottom: '16px',
                  right: '16px',
                  zIndex: 9998,
                  margin: 0,
                  padding: 0,
                  WebkitTapHighlightColor: 'transparent',
                }
              },
              chatBox: {
                style: {
                  paddingBottom: '60px',
                }
              },
              footer: {
                isShow: true,
                expressionText: 'Powered by {{name}}',
                linkvars: {
                  name: {
                    text: 'Ubax',
                    link: 'https://ubax.ai'
                  }
                }
              }
            },
            events: {
              onOpen: () => {
                setIsChatOpen(true);
                document.body.style.overflow = 'hidden';
              },
              onClose: () => {
                setIsChatOpen(false);
                document.body.style.overflow = '';
              },
            },
          });
        } else {
          chatInstanceRef.current = new window.CozeWebSDK.WebChatClient({
            config: {
              bot_id: '7441099876152213512',
            },
            userInfo: {
              id: '123',
              nickname: 'Guest',
            },
            componentProps: {
              title: 'Chat with Maamul Assistant',
            },
            ui: {
              base: {
                icon: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-xMYvHbYvBex04bXjWwxGNzCrCW40qd.png',
                layout: 'pc',
                zIndex: 1000,
                size: 'small',
                style: {
                  position: 'fixed',
                  bottom: 0,
                  right: 0,
                  height: 'auto',
                  width: 'auto',
                  maxHeight: 'none',
                  margin: 0,
                  padding: 0,
                  border: 'none',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }
              },
              asstBtn: {
                isNeed: true,
                style: {
                  position: 'fixed',
                  bottom: '32px',
                  right: '32px',
                  zIndex: 999,
                  margin: 0,
                  padding: 0
                }
              },
              footer: {
                isShow: true,
                expressionText: 'Powered by {{name}}',
                linkvars: {
                  name: {
                    text: 'Ubax',
                    link: 'https://ubax.ai'
                  }
                }
              }
            },
          });
        }
      };

      scriptRef.current = script;
      document.body.appendChild(script);
    };

    // Handle resize events
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        initializeChat();
      }, 250);
    };

    // Initial setup
    initializeChat();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Add meta tag for mobile
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    document.head.appendChild(viewportMeta);


    // Cleanup on unmount
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      cleanup();
      document.head.removeChild(viewportMeta);
    };
  }, [isAnyDialogOpen]); // Re-run effect when dialog state changes

  useEffect(() => {
    const handleBodyOverflow = () => {
      if (window.innerWidth <= 768) {
        document.body.style.overflow = isChatOpen ? 'hidden' : '';
      }
    };

    handleBodyOverflow();
    window.addEventListener('resize', handleBodyOverflow);

    return () => {
      window.removeEventListener('resize', handleBodyOverflow);
      document.body.style.overflow = '';
    };
  }, [isChatOpen]);

  // Don't render anything if a dialog is open
  if (isAnyDialogOpen) {
    return null;
  }

  return (
    <>
      <div id="position_demo" className="fixed right-3 bottom-3 sm:right-6 sm:bottom-6" />
      {isChatOpen && window.innerWidth <= 768 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" 
          onClick={() => chatInstanceRef.current?.close()}
        />
      )}
    </>
  );
}
