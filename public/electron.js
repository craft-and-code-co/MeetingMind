const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs').promises;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 }
  });

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../build/index.html'),
    protocol: 'file:',
    slashes: true
  });

  // Handle loading with retry for development
  const loadURL = async () => {
    try {
      await mainWindow.loadURL(startUrl);
    } catch (error) {
      if (process.env.ELECTRON_START_URL) {
        console.log('Waiting for React dev server...');
        setTimeout(() => loadURL(), 1000);
      } else {
        console.error('Failed to load app:', error);
      }
    }
  };

  loadURL();

  // Open DevTools in development
  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.openDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for secure API key storage
const getKeyPath = () => path.join(app.getPath('userData'), 'api-key.enc');

ipcMain.handle('store-api-key', async (event, apiKey) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption not available on this system');
    }
    
    const encrypted = safeStorage.encryptString(apiKey);
    await fs.writeFile(getKeyPath(), encrypted);
    return true;
  } catch (error) {
    console.error('Failed to store API key:', error);
    throw error;
  }
});

ipcMain.handle('get-api-key', async () => {
  try {
    const keyPath = getKeyPath();
    const encrypted = await fs.readFile(keyPath);
    return safeStorage.decryptString(encrypted);
  } catch (error) {
    // Key doesn't exist yet
    return null;
  }
});

// Audio capture handlers
const { desktopCapturer } = require('electron');

let audioStream = null;
let mediaRecorder = null;
let audioChunks = [];

ipcMain.handle('start-audio-capture', async () => {
  try {
    // Request audio permission
    const sources = await desktopCapturer.getSources({ 
      types: ['window', 'screen'],
      fetchWindowIcons: true 
    });
    
    // For now, we'll capture from the entire system
    // In production, you might want to let users select a source
    mainWindow.webContents.send('audio-capture-started');
    return true;
  } catch (error) {
    console.error('Failed to start audio capture:', error);
    throw error;
  }
});

ipcMain.handle('stop-audio-capture', async () => {
  try {
    mainWindow.webContents.send('audio-capture-stopped');
    // Return a mock path for now - actual implementation would save the audio
    const audioPath = path.join(app.getPath('userData'), 'recordings', `recording-${Date.now()}.webm`);
    return audioPath;
  } catch (error) {
    console.error('Failed to stop audio capture:', error);
    throw error;
  }
});

// File system handlers
ipcMain.handle('save-file', async (event, filePath, content) => {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    return true;
  } catch (error) {
    console.error('Failed to save file:', error);
    throw error;
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Failed to read file:', error);
    throw error;
  }
});