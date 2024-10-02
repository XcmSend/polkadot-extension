// Copyright 2019-2024 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Message } from '@polkadot/extension-base/types';

import { MESSAGE_ORIGIN_CONTENT, MESSAGE_ORIGIN_PAGE, PORT_CONTENT } from '@polkadot/extension-base/defaults';
import { ensurePortConnection } from '@polkadot/extension-base/utils/portUtils';
import { chrome } from '@polkadot/extension-inject/chrome';
import { replaceLinksInAnchors } from './blinks';


let port: chrome.runtime.Port | undefined;
console.log('Beetle Web3 Extension Content Script Injected on:', window.location.href);


function onPortMessageHandler (data: Message['data']): void {
  window.postMessage({ ...data, origin: MESSAGE_ORIGIN_CONTENT }, '*');
}

function onPortDisconnectHandler (): void {
  port = undefined;
}

const portConfig = {
  onPortDisconnectHandler,
  onPortMessageHandler,
  portName: PORT_CONTENT
};


// window.addEventListener('message', async (event) => {
//   if (event.source !== window) return;

//   const { type } = event.data;
//   if (type === 'GET_ACCOUNTS') {
//     // Use window.injectedWeb3 to get accounts
//     const accounts = await getAccountsFromInjectedWeb3();
//     event.source.postMessage({ type: 'ACCOUNTS', payload: { accounts } }, '*');
//   }
// });

// async function getAccountsFromInjectedWeb3() {
//   const extensions = await web3Enable('Your App');
//   const allAccounts = await web3Accounts();
//   return allAccounts;
// }

// all messages from the page, pass them to the extension
window.addEventListener('message', ({ data, source }: Message): void => {
  // only allow messages from our window, by the inject
  if (source !== window || data.origin !== MESSAGE_ORIGIN_PAGE) {
    return;
  }


  
  ensurePortConnection(port, portConfig).then((connectedPort) => {
    connectedPort.postMessage(data);
    port = connectedPort;
  }).catch((error) => console.error(`Failed to send message: ${(error as Error).message}`));
});

// inject our data injector
const script = document.createElement('script');

script.src = chrome.runtime.getURL('page.js');

script.onload = (): void => {
  // remove the injecting tag when loaded
  if (script.parentNode) {
    script.parentNode.removeChild(script);
  }
};

// Listen for messages from the extension and relay to the page
chrome.runtime.onConnect.addListener((connectedPort) => {
  connectedPort.onMessage.addListener((message) => {
    window.postMessage({ ...message, origin: MESSAGE_ORIGIN_CONTENT }, '*');
  });

  connectedPort.onDisconnect.addListener(onPortDisconnectHandler);
});



// Function to initialize link replacement
function initializeLinkReplacement() {
  console.log('Initializing link replacement');

  replaceLinksInAnchors(document.body);

  // Set up MutationObserver to handle dynamically added content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        replaceLinksInAnchors(node);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Wait for the DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    initializeLinkReplacement();
  });
} else {
  // DOM is already loaded
  console.log('DOM already loaded');
  initializeLinkReplacement();
}