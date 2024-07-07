chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'setAlternateRealityMode') {
    setAlternateRealityMode(request.enabled);
  }
});

async function setAlternateRealityMode(enabled) {
  console.log('setAlternateRealityMode called with enabled:', enabled);
  if (enabled) {
    const textNodes = getVisibleTextNodes(document.body);
    console.log('Visible text nodes retrieved:', textNodes);

    const originalTexts = textNodes.map(node => node.nodeValue);
    console.log('Original texts saved');

    // Replace all visible text content with "Loading..."
    textNodes.forEach(node => node.nodeValue = 'Loading...');

    const canCreate = await window.ai.canCreateTextSession();
    console.log('Can create session:', canCreate);

    if (canCreate !== "no") {
      const session = await window.ai.createTextSession();
      console.log('AI session created');

      const processTextNode = async (node, originalText) => {
        const prompt = `Rewrite the following text to create an absurd, alternate reality version while keeping the same number of words and style. Here are some examples:

        The quick brown fox jumps over the lazy dog.
        An absurd version of this text is: The hasty violet fox hops over the sleepy log.<ctrl23>

        She sells sea shells by the sea shore.
        An absurd version of this text is: She vends ocean orbs by the ocean floor.<ctrl23>

        ${originalText}
        An absurd version of this text is:`;

        try {
          let result = await session.prompt(prompt);
          console.log('AI response received:', result);

          // Remove words within ** **
          result = result.replace(/\*\*[^**]+\*\*/g, '').trim();

          // Truncate the AI response to match the length of the original text
          const originalLength = originalText.split(' ').length;
          let truncatedResult = originalText//result.split(' ').slice(0, originalLength).join(' ');

          // Subtract the last three characters and replace with ...
          // if (truncatedResult.length > 3) {
          //   truncatedResult = truncatedResult.slice(0, -3) + "...";
          // }

          console.log('Processed AI response:', truncatedResult);

          // Create a new text node with the AI response and replace the original node
          const newNode = document.createTextNode(truncatedResult);
          node.parentNode.replaceChild(newNode, node);
        } catch (error) {
          console.error('Error during AI session:', error);
          node.nodeValue = originalText;  // Revert to original text if there's an error
        }
      };

      // Process text nodes sequentially to handle rate limits better
      for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        const originalText = originalTexts[i];
        await processTextNode(node, originalText);
      }

      // Close the session
      await session.destroy();
      console.log('AI session closed');
    }
  } else {
    console.log('Reloading page to restore original content');
    window.location.reload();
  }
}

function getVisibleTextNodes(node) {
  const textNodes = [];
  const nonVisibleTags = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'HEAD', 'META', 'LINK']);

  function recurse(currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE && currentNode.nodeValue.trim() !== '' && isVisible(currentNode) && currentNode.nodeValue.trim().split(/\s+/).length >= 8) {
      textNodes.push(currentNode);
    } else {
      for (const childNode of currentNode.childNodes) {
        if (!nonVisibleTags.has(childNode.nodeName)) {
          recurse(childNode);
        }
      }
    }
  }

  function isVisible(node) {
    return !!(node.parentElement.offsetWidth || node.parentElement.offsetHeight || node.parentElement.getClientRects().length);
  }

  recurse(node);
  console.log('Visible text nodes collected:', textNodes);
  return textNodes;
}
