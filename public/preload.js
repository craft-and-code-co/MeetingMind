const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  storeApiKey: (apiKey) => ipcRenderer.invoke('store-api-key', apiKey),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  updateTrayMenu: (state) => ipcRenderer.invoke('update-tray-menu', state),
  updateApplicationMenu: (state) => ipcRenderer.invoke('update-application-menu', state),
  onTrayToggleRecording: (callback) => {
    ipcRenderer.on('tray-toggle-recording', callback);
    return () => ipcRenderer.removeListener('tray-toggle-recording', callback);
  },
  onNavigateTo: (callback) => {
    ipcRenderer.on('navigate-to', callback);
    return () => ipcRenderer.removeListener('navigate-to', callback);
  },
  
  // Audio capture APIs
  startAudioCapture: () => ipcRenderer.invoke('start-audio-capture'),
  stopAudioCapture: () => ipcRenderer.invoke('stop-audio-capture'),
  
  // Meeting detection APIs
  startMeetingDetection: () => ipcRenderer.invoke('start-meeting-detection'),
  stopMeetingDetection: () => ipcRenderer.invoke('stop-meeting-detection'),
  onMeetingDetectionUpdate: (callback) => {
    ipcRenderer.on('meeting-detection-update', callback);
    return () => ipcRenderer.removeListener('meeting-detection-update', callback);
  },
  onMeetingDetectedNotificationClicked: (callback) => {
    ipcRenderer.on('meeting-detected-notification-clicked', callback);
    return () => ipcRenderer.removeListener('meeting-detected-notification-clicked', callback);
  },
  onStartRecordingFromNotification: (callback) => {
    ipcRenderer.on('start-recording-from-notification', callback);
    return () => ipcRenderer.removeListener('start-recording-from-notification', callback);
  },
  
  // Native notifications
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  onNotificationClicked: (callback) => {
    ipcRenderer.on('notification-clicked', callback);
    return () => ipcRenderer.removeListener('notification-clicked', callback);
  },
  
  // File system APIs
  saveFile: (path, content) => ipcRenderer.invoke('save-file', path, content),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
});