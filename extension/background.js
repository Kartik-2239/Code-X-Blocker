let socket = null;
const port = 3000;
function connect() {  
  const sitesToBlock = ["https://twitter.com/*", "https://x.com/*"];
  fetch(`http://localhost:${port}/current-status`).then(response => response.json()).then(data => {
    const action = data.status === 'blocked' ? 'block' : 'unblock';
    chrome.tabs.query({ url: sitesToBlock }, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { action: 'event', data: JSON.stringify({ data: action }) }).catch(() => {});
      }
    });
  });

  socket = new WebSocket(`ws://localhost:${port}/ws`);

  socket.onopen = () => {
    console.log('WebSocket opened');
  };

  socket.onmessage = (event) => {
    console.log('Background got:', event.data);
    chrome.tabs.query({ url: sitesToBlock }, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { action: 'event', data: event.data }).catch(() => {});
      }
    });
  };

  socket.onclose = () => {
    console.log('WebSocket closed, reconnecting in 3s...');
    setTimeout(connect, 3000);
  };

  socket.onerror = () => {
    console.error('WebSocket error');
  };
}

setInterval(() => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send('ping');
  }
}, 20000);

connect();
