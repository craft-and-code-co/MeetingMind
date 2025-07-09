const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  storeApiKey: (apiKey) => ipcRenderer.invoke('store-api-key', apiKey),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  updateTrayMenu: (state) => ipcRenderer.invoke('update-tray-menu', state),
  onTrayToggleRecording: (callback) => ipcRenderer.on('tray-toggle-recording', callback),
  
  // Audio capture APIs
  startAudioCapture: () => ipcRenderer.invoke('start-audio-capture'),
  stopAudioCapture: () => ipcRenderer.invoke('stop-audio-capture'),
  
  // File system APIs
  saveFile: (path, content) => ipcRenderer.invoke('save-file', path, content),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
});