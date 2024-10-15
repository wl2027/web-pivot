chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'elementSelected') {
        chrome.storage.local.set({
            [`selectedElement${message.elemNumber}`]: message.element
        });
    }
});
