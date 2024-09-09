// Copyright 2019-2024 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { html_base } from './parse_links';

// THE LINK REGEX
const regexPattern2 = /polkadotlink:\/\/[A-Za-z0-9]{46}/g; // Note the 'g' flag for global matching

//var regex_links = "polkadotlink\:\/\/[A-Z-a-z-0-9]{46}"

// import { chrome } from '@polkadot/extension-inject/chrome';
/// polkadotlink://QmPLVqWgEoNBjyTPBKw5prq6uuU1id2Wr39QWmpmyafEpF ipfs test
// $ polkadotlink://QmRUxiaLQj8MtZeM6uiLiRMR3fyLeFcMzSrCq8NGtPPzZW

const processedLinksCache = new Set<string>();


export function replaceLinksInTextNodes(node: Node) {
  console.log(`replaceLinksInTextNodes called`);
  console.log(`node type is: `, node.nodeType);
  console.log(`node object: `, node);
  console.log(`node text object: `, node?.textContent);

  if (node.nodeType === Node.TEXT_NODE) {
    const textNode = node as Text;
    const parentNode = textNode.parentNode;

    if (parentNode && textNode.textContent) {
      const matches = textNode.textContent.match(regexPattern2);

      if (matches) {
        console.log(`replace strings `);

        // Create a document fragment to hold new elements
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        matches.forEach((match) => {
          // Get the HTML string from get_link_data
          const linkData = get_link_data(match);
          if (processedLinksCache.has(match)) {
            console.log(`Skipping already processed link: ${match}`);
            return; // Skip already processed matches
          }

          // Mark the link as processed by adding it to the cache
          processedLinksCache.add(match);
          // Insert text before the match
          const beforeText = textNode.textContent!.substring(lastIndex, textNode.textContent!.indexOf(match, lastIndex));
          if (beforeText) {
            fragment.appendChild(document.createTextNode(beforeText));
          }

          // Create a span to insert HTML safely
          const tempSpan = document.createElement('span');
          tempSpan.insertAdjacentHTML('beforeend', linkData);
          fragment.appendChild(tempSpan);

          lastIndex = textNode.textContent!.indexOf(match, lastIndex) + match.length;
        });

        // Append remaining text after the last match
        const remainingText = textNode.textContent!.substring(lastIndex);
        if (remainingText) {
          fragment.appendChild(document.createTextNode(remainingText));
        }

        // Replace the original text node with the new fragment
        parentNode.replaceChild(fragment, textNode);
      }
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // Iterate through child nodes
    node.childNodes.forEach(replaceLinksInTextNodes);
  }
}

// Function to get data from the link
function get_link_data(link: string): string {
 // const link_result = link;
  // query_linkdat(link);
  const logo = 'image_link';
  const title = 'Donate $DOT now';
  const button_text = 'Create Transaction';
   var basen = html_base(logo, title, button_text);

  return basen;//`<h3>Link detected: ${link_result}</h3>`;
}