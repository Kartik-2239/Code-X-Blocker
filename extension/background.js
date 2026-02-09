let socket = null;

function connect() {
  fetch('http://localhost:3000/current-status').then(response => response.json()).then(data => {
    const action = data.status === 'blocked' ? 'block' : 'unblock';
    chrome.tabs.query({ url: ['*://twitter.com/*', '*://x.com/*'] }, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { action: 'event', data: JSON.stringify({ data: action }) }).catch(() => {});
      }
    });
  });

  socket = new WebSocket('ws://localhost:3000/ws');

  socket.onopen = () => {
    console.log('WebSocket opened');
  };

  socket.onmessage = (event) => {
    console.log('Background got:', event.data);
    chrome.tabs.query({ url: ['*://twitter.com/*', '*://x.com/*'] }, (tabs) => {
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
