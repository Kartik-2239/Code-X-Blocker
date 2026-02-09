console.log('X Blocker loaded on:', window.location.href);

let blocked = false;

function showBlock() {
  if (document.getElementById('x-blocker-overlay')) return;
  blocked = true;
  const overlay = document.createElement('div');
  overlay.id = 'x-blocker-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:999999;display:flex;align-items:center;justify-content:center;';
  const box = document.createElement('div');
  box.style.cssText = 'background:#fff;padding:40px 60px;border-radius:12px;text-align:center;font-family:sans-serif;';
  box.innerHTML = `<h2 style="margin:0 0 8px;font-size:24px; color:red;">CODE-X-BLOCKER</h2><p style="margin:0;color:#666;font-size:16px;">No codex session is active.</p>`;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

var removeBlock = () => {
  blocked = false;
  const overlay = document.getElementById('x-blocker-overlay');
  if (overlay) overlay.remove();
}

showBlock();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Raw message from background:', JSON.stringify(message));
  if (message.action === 'event') {
    let parsed;
    try {
      parsed = JSON.parse(message.data);
    } catch {
      parsed = message;
    }
    const command = parsed.data || message.data;
    if (command === 'unblock') {
      removeBlock();
    } else if (command === 'block') {
      showBlock();
    }
  }
});