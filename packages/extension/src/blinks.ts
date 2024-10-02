// Copyright 2019-2024 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0


const blinkLinkPattern = /(https?:\/\/)?(www\.)?blink\.bagpipes\.io\/#\/[a-z]+:[0-9]+:[0-9]+/i;
const processedLinksCache = new Set();

interface ParsedLink {
  chain: string;
  blockNumber: number;
  txIndex: number;
}

export function replaceLinksInAnchors(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;

    if (element.tagName === 'A') {
      // Extract the full text content of the <a> element
      const linkText = getFullTextContent(element);
      console.log('Extracted link text:', linkText);

      if (blinkLinkPattern.test(linkText)) {
        console.log('Link text matches blinkLinkPattern:', linkText);

        if (processedLinksCache.has(linkText)) {
          console.log('Link already processed:', linkText);
          return;
        }

        processedLinksCache.add(linkText);
        console.log('Processing blink link:', linkText);

        const iframeSrc = createIframeSrc(linkText);

        if (iframeSrc !== null) {
          // Create the iframe element
          const iframe = document.createElement('iframe');
          iframe.src = iframeSrc;
          // iframe.width = '700px'; 
          iframe.style.border = 'none';
          iframe.style.borderRadius = '15px';
          iframe.style.backgroundColor = 'black';
          iframe.style.minHeight = '600px'; 
          iframe.style.minWidth = '600px'; 
          // lets allow overflow scroll Y axis
          iframe.style.overflowY = 'scroll';
          iframe.style.overflowX = 'scroll';
          iframe.setAttribute('allow', 'clipboard-write');
          iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');

          // iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

          // Function to handle iframe postMessage
          const sendMessageToIframe = () => {
            if (iframe.contentWindow) {
              iframe.contentWindow.postMessage(
                { type: 'TEST_RESPONSE', payload: 'Hello from Parent' },
                'http://localhost:5173' || 'https://blink.bagpipes.io' || 'https://x.com'
              );
            } else {
              console.warn('iframe.contentWindow is not available, retrying...');
              setTimeout(sendMessageToIframe, 100); // Retry after 100ms if contentWindow is not ready
            }
          };

          // Listen for messages from the iframe
          window.addEventListener('message', (event) => {
            if (event.origin !== 'http://localhost:5173' || 'https://blink.bagpipes.io'  || 'https://x.com') {
              console.warn(`Ignored message from origin: ${event.origin}`);
              return;
            }
          
            const { type, payload } = event.data;
            console.log('Received message from iframe:', type, payload);

            switch (type) {
              case 'WALLET_CONNECT_RESPONSE':
                console.log('Handling wallet connect response:', payload);
                break;
              
              case 'TEST_MESSAGE':
                console.log('Test message received from iframe:', payload);
                sendMessageToIframe();  // Safely send a message back to iframe
                break;

              default:
                console.warn('Unhandled message type:', type);
            }
          });

          // Dynamically adjust the iframe height based on the content of .blinkMiniAppContainer
          iframe.onload = function() {
            try {
              const iframeWindow = iframe.contentWindow;
              const iframeDoc = iframeWindow ? iframeWindow.document : null;              
              if (iframeDoc) {
                    const blinkMiniAppContainer = iframeDoc.querySelector('.blinkMiniAppContainer');

              if (blinkMiniAppContainer) {
                const containerHeight = blinkMiniAppContainer.scrollHeight;
                iframe.style.height = containerHeight + 'px'; // Adjust height dynamically
                console.log('Adjusted iframe height to:', containerHeight + 'px');
              } else {
                console.warn('No .blinkMiniAppContainer found in the iframe.');
              }
            } else {
              console.error('iframe.contentDocument or contentWindow is null.');
            }
            } catch (error) {
              console.error('Error accessing iframe content:', error);
            }
          };

          console.log('Replacing link with iframe:', iframeSrc);

          if (element.parentNode) {
            element.parentNode.replaceChild(iframe, element);
          } else {
            console.warn('Element has no parent node:', element);
          }
          return; // Exit after replacing the link
        } else {
          console.log('Failed to parse link:', linkText);
        }
      }
    } else {
      // Recursively check child nodes
      node.childNodes.forEach(replaceLinksInAnchors);
    }
  }
}




function getFullTextContent(element: HTMLElement): string {
  let text = '';

  element.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      text += getFullTextContent(child as HTMLElement);
    }
  });

  return text;
}


function loadViteApp(container: HTMLElement) {
  // Fetch the Vite-generated index.html
  fetch(chrome.runtime.getURL('blinks-app/index.html'))
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.text();
    })
    .then(html => {
      console.log('Fetched index.html successfully');

      // Create a new DOM parser to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract the content from the <body> of the index.html
      const appContent = doc.querySelector('body')?.innerHTML;
      console.log('App content:', appContent);

      // Insert the app content into the container
      if (appContent) {
        container.innerHTML = appContent;
      } else {
        console.error('App content is empty or undefined');
      }

      // Extract and inject all <script> elements
      const scripts = doc.querySelectorAll('script');
      scripts.forEach(script => {
        const scriptSrc = script.getAttribute('src');
        if (scriptSrc) {
          console.log('Injecting script:', scriptSrc);
          const newScript = document.createElement('script');
          newScript.src = chrome.runtime.getURL(`blinks-app/${scriptSrc}`);
          newScript.type = 'module'; // Ensure the script is treated as a module
          document.head.appendChild(newScript);
        } else {
          console.warn('Script element found with no src attribute');
        }
      });

      // Extract and inject all <link> elements for CSS
      const styles = doc.querySelectorAll('link[rel="stylesheet"]');
      styles.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref) {
          console.log('Injecting stylesheet:', linkHref);
          const newLink = document.createElement('link');
          newLink.rel = 'stylesheet';
          newLink.href = chrome.runtime.getURL(`blinks-app/${linkHref}`);
          document.head.appendChild(newLink);
        } else {
          console.warn('Link element found with no href attribute');
        }
      });

      // Inject any necessary .wasm files
      injectWasmFiles();
    })
    .catch(error => console.error('Failed to load Vite app:', error));
}



function createIframeSrc(link: string): string | null {
  // Parse the link to extract parameters
console.log('createIframeSrc called');
  const parsedLink = parseBlinkLink(link);
  if (parsedLink) {
    console.log('Using Parsed link:', parsedLink);
    const { chain, blockNumber, txIndex } = parsedLink;
  return `https://blink.bagpipes.io/#/post/${chain}:${blockNumber}:${txIndex}?miniAppView=true`;
  } else {
    console.log('Error parsing link');
    return null;
  }
}

function parseBlinkLink(link: string): ParsedLink | null {
  try {
    console.log('Parsing link:', link);
    const url = new URL(link);
    const hash = url.hash;
    console.log('URL hash:', hash);

    const hashContent = hash.startsWith('#/') ? hash.substring(2) : hash.substring(1);
    console.log('Hash content:', hashContent);

    const [chainPart, blockNumberStr, txIndexStr] = hashContent.split(':');

    if (!chainPart || !blockNumberStr || !txIndexStr) {
      throw new Error('Invalid link format');
    }

    return {
      chain: chainPart,
      blockNumber: parseInt(blockNumberStr, 10),
      txIndex: parseInt(txIndexStr, 10),
    };
  } catch (e) {
    console.error('Error parsing link:', e);
    return null;
  }
}





// Function to inject WASM files
function injectWasmFiles() {
  const wasmFiles = [
    'hydra_dx_wasm_bg-BPeGNIMQ.wasm',
    'hydra_dx_wasm_bg-Dc7IKe9x.wasm',
    'hydra_dx_wasm_bg-Do9STVnj.wasm',
    'hydra_dx_wasm_bg-Dp6tEp4Y.wasm',
    'hydra_dx_wasm_bg-oxJqfi97.wasm',
  ];

  wasmFiles.forEach(wasmFile => {
    // Use fetch to ensure we can access the WASM file
    fetch(chrome.runtime.getURL(`blinks-app/assets/${wasmFile}`))
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load WASM file: ${wasmFile}`);
        }
        console.log(`WASM file ${wasmFile} loaded successfully`);
      })
      .catch(error => console.error('Error loading WASM file:', error));
  });
}
