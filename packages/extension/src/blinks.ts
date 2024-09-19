// Copyright 2019-2024 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { html_base } from './parse_links';

// THE LINK REGEX
const regexPattern2 = /polkadotlink:\/\/[A-Za-z0-9]{46}/g; // Note the 'g' flag for global matching

//var regex_links = "polkadotlink\:\/\/[A-Z-a-z-0-9]{46}"

// import { chrome } from '@polkadot/extension-inject/chrome';
/// polkadotlink://QmPLVqWgEoNBjyTPBKw5prq6uuU1id2Wr39QWmpmyafEpF ipfs test
// $ polkadotlink://QmRUxiaLQj8MtZeM6uiLiRMR3fyLeFcMzSrCq8NGtPPzZW


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

         // Create a container div
         const container = document.createElement('div');
         container.className = 'my-react-app-container'; // Add a class for styling if needed
 
        //  // Load the Vite app
        //  loadViteApp(container);
 
        //  // Replace the link element with the container
        //  if (element.parentNode) {
        //    element.parentNode.replaceChild(container, element);
        //  } else {
        //    console.warn('Element has no parent node:', element);
        //  }
 
        //  return; 

        const iframeSrc = createIframeSrc(linkText);

        if (iframeSrc !== null) {
          // Create the iframe element
          const iframe = document.createElement('iframe');
          iframe.src = iframeSrc;
          iframe.width = '100%';
          iframe.height = '100%';
          iframe.style.border = 'none';
          // we want iframe minHeight to be 500px
          iframe.style.minHeight = '700px';
          // // we want to grab specific elements from the iframe
          // iframe.onload = function() {
          //    const iframeDoc = iframe.contentDocument;
          //    const iframeBody = iframeDoc.body;
          //     const iframeTitle = iframeDoc.title;



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


export function replaceLinksInTextNodes(node: Node) {
  console.log(`replaceLinksInTextNodes called`);
  console.log(`node type is: `, node.nodeType);
  console.log(`node object: `, node);
  console.log(`node text object: `, node?.textContent);

  if (node.nodeType === Node.TEXT_NODE) {
    const textNode = node;
    const parentNode = textNode.parentNode;

    if (parentNode && textNode.textContent) {
      const matches = textNode.textContent.match(blinkLinkPattern);

      if (matches) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        matches.forEach((match) => {
          if (processedLinksCache.has(match)) {
            return;
          }

          processedLinksCache.add(match);

          const textContent = textNode.textContent!; 
          const index = textContent.indexOf(match, lastIndex);
          const beforeText = textContent.substring(lastIndex, index);

          if (beforeText) {
            fragment.appendChild(document.createTextNode(beforeText));
          }

          // iFrmae
          const iframeSrc = createIframeSrc(match);

          if (iframeSrc !== null) {
            // Create the iFrame element
            const iframe = document.createElement('iframe');
            iframe.src = iframeSrc;
            iframe.width = '100%'; // Adjust as needed
            iframe.height = '500px'; // Adjust as needed
            iframe.style.border = 'none';
          
            fragment.appendChild(iframe);
          } else {
            // If parsing failed, just append the original text
            fragment.appendChild(document.createTextNode(match));
          }
          
          lastIndex = index + match.length;
        });

        // Append remaining text after the last match
        const remainingText = textNode.textContent.substring(lastIndex);
        if (remainingText) {
          fragment.appendChild(document.createTextNode(remainingText));
        }

        // Replace the original text node with the new fragment
        parentNode.replaceChild(fragment, textNode);
      }
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    node.childNodes.forEach(replaceLinksInTextNodes);
  }
}

function createIframeSrc(link: string): string | null {
  // Parse the link to extract parameters
console.log('createIframeSrc called');
  const parsedLink = parseBlinkLink(link);
  if (parsedLink) {
    console.log('Using Parsed link:', parsedLink);
    const { chain, blockNumber, txIndex } = parsedLink;
  return `https://blink.bagpipes.io/#/${chain}:${blockNumber}:${txIndex}`;
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
