document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggle');
  let isEnabled = false;
  console.log('DOM fully loaded and parsed');

  toggleButton.addEventListener('click', async () => {
    isEnabled = !isEnabled;
    toggleButton.textContent = isEnabled ? 'Disable Wormhole' : 'Enable Wormhole';
    console.log('Toggle button clicked. Enabled:', isEnabled);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Active tab retrieved:', tab);

    try {
      await chrome.tabs.sendMessage(tab.id, { message: 'setAlternateRealityMode', enabled: isEnabled });
    } catch (error) {
      console.error('Error sending message to content script:', error);
    }
  });
});
