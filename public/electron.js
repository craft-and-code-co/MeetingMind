const { app, BrowserWindow, ipcMain, safeStorage, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs').promises;

let mainWindow;
let tray;

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
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#f9fafb'
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

// System tray setup
function createTray() {
  // Create a simple icon for the tray
  const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'MeetingMind',
      type: 'normal',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Start Recording',
      type: 'normal',
      id: 'record',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('tray-toggle-recording');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      type: 'normal',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('MeetingMind');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// Update tray menu based on recording state
ipcMain.handle('update-tray-menu', (event, { isRecording }) => {
  if (tray) {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'MeetingMind',
        type: 'normal',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: isRecording ? 'Stop Recording' : 'Start Recording',
        type: 'normal',
        id: 'record',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('tray-toggle-recording');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        type: 'normal',
        click: () => {
          app.quit();
        }
      }
    ]);
    
    tray.setContextMenu(contextMenu);
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

// Prevent the app from quitting when all windows are closed on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
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