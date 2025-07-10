const { app, BrowserWindow, ipcMain, safeStorage, Tray, Menu, nativeImage, Notification, powerMonitor, shell } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs').promises;
const { exec } = require('child_process');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    title: 'MeetingMind',
    backgroundColor: '#f9fafb',
    show: false, // Don't show until ready
    vibrancy: 'sidebar' // macOS vibrancy effect
  });

  // Set the app icon in the dock (macOS)
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'logo.png'));
  }

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

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

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
  // Use the favicon.ico for the tray icon
  const iconPath = path.join(__dirname, 'favicon.ico');
  const icon = nativeImage.createFromPath(iconPath);
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
      label: '🔴 Start Recording',
      type: 'normal',
      id: 'record',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('tray-toggle-recording');
        }
      }
    },
    {
      label: 'Dashboard',
      type: 'normal',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('navigate-to', '/dashboard');
        }
      }
    },
    {
      label: 'Settings',
      type: 'normal',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('navigate-to', '/settings');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Recent Recordings',
      type: 'submenu',
      submenu: [
        {
          label: 'View All Recordings',
          type: 'normal',
          click: () => {
            if (mainWindow) {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('navigate-to', '/recordings');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'No recent recordings',
          type: 'normal',
          enabled: false
        }
      ]
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

// Update tray menu and icon based on recording state
ipcMain.handle('update-tray-menu', (event, { isRecording }) => {
  if (tray) {
    // Update tray icon to show recording state
    const iconPath = path.join(__dirname, 'favicon.ico');
    const icon = nativeImage.createFromPath(iconPath);
    
    // On macOS, we can overlay a recording indicator
    if (process.platform === 'darwin' && isRecording) {
      // Create a red dot overlay for recording state
      const overlayPath = path.join(__dirname, 'favicon.ico'); // Using same icon for now
      const overlayIcon = nativeImage.createFromPath(overlayPath);
      tray.setImage(overlayIcon);
    } else {
      tray.setImage(icon);
    }
    
    // Update tooltip to show recording state
    tray.setToolTip(isRecording ? 'MeetingMind - Recording' : 'MeetingMind');
    
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
        label: isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording',
        type: 'normal',
        id: 'record',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('tray-toggle-recording');
          }
        }
      },
      {
        label: 'Dashboard',
        type: 'normal',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('navigate-to', '/dashboard');
          }
        }
      },
      {
        label: 'Settings',
        type: 'normal',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('navigate-to', '/settings');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Recent Recordings',
        type: 'submenu',
        submenu: [
          {
            label: 'View All Recordings',
            type: 'normal',
            click: () => {
              if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.show();
                mainWindow.focus();
                mainWindow.webContents.send('navigate-to', '/recordings');
              }
            }
          },
          { type: 'separator' },
          {
            label: 'No recent recordings',
            type: 'normal',
            enabled: false
          }
        ]
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

// Create native application menu bar
function createApplicationMenu() {
  const template = [
    {
      label: 'MeetingMind',
      submenu: [
        {
          label: 'About MeetingMind',
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('navigate-to', '/settings');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Hide MeetingMind',
          accelerator: 'CmdOrCtrl+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'CmdOrCtrl+Alt+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Recording',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('tray-toggle-recording');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Open Dashboard',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            if (mainWindow) {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('navigate-to', '/dashboard');
            }
          }
        },
        {
          label: 'Open Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('navigate-to', '/settings');
            }
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            if (mainWindow) {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('navigate-to', '/dashboard');
            }
          }
        },
        {
          label: 'Recordings',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            if (mainWindow) {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('navigate-to', '/recordings');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.reloadIgnoringCache();
            }
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          role: 'resetzoom'
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          role: 'zoomin'
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          role: 'zoomout'
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'Ctrl+Cmd+F',
          role: 'togglefullscreen'
        }
      ]
    },
    {
      label: 'Recording',
      submenu: [
        {
          label: '🔴 Start Recording',
          accelerator: 'CmdOrCtrl+R',
          id: 'start-recording',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('tray-toggle-recording');
            }
          }
        },
        {
          label: '⏹️ Stop Recording',
          accelerator: 'CmdOrCtrl+S',
          id: 'stop-recording',
          visible: false,
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('tray-toggle-recording');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Open Audio Settings',
          click: () => {
            if (mainWindow) {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('navigate-to', '/settings');
            }
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        { type: 'separator' },
        {
          label: 'Bring All to Front',
          role: 'front'
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: () => {
            shell.openExternal('https://meetingmind.app/docs');
          }
        },
        {
          label: 'Support',
          click: () => {
            shell.openExternal('https://meetingmind.app/support');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Update application menu based on recording state
ipcMain.handle('update-application-menu', (event, { isRecording }) => {
  const menu = Menu.getApplicationMenu();
  if (menu) {
    const recordingMenu = menu.getMenuItemById('start-recording');
    const stopRecordingMenu = menu.getMenuItemById('stop-recording');
    
    if (recordingMenu && stopRecordingMenu) {
      recordingMenu.visible = !isRecording;
      stopRecordingMenu.visible = isRecording;
    }
  }
  
  // Update window title to show recording state
  if (mainWindow) {
    mainWindow.setTitle(isRecording ? 'MeetingMind - Recording' : 'MeetingMind');
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  createApplicationMenu();
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

// Meeting detection handlers
let meetingDetectionInterval = null;
let lastDetectedMeetings = new Set();

ipcMain.handle('start-meeting-detection', async () => {
  if (meetingDetectionInterval) {
    clearInterval(meetingDetectionInterval);
  }
  
  meetingDetectionInterval = setInterval(async () => {
    try {
      const detectedMeetings = await detectRunningMeetings();
      
      // Check for new meetings
      detectedMeetings.forEach(meeting => {
        if (!lastDetectedMeetings.has(meeting.id)) {
          // New meeting detected
          showMeetingDetectedNotification(meeting);
          lastDetectedMeetings.add(meeting.id);
        }
      });
      
      // Remove ended meetings
      const currentMeetingIds = new Set(detectedMeetings.map(m => m.id));
      for (const meetingId of lastDetectedMeetings) {
        if (!currentMeetingIds.has(meetingId)) {
          lastDetectedMeetings.delete(meetingId);
        }
      }
      
      // Send update to renderer
      mainWindow.webContents.send('meeting-detection-update', detectedMeetings);
    } catch (error) {
      console.error('Meeting detection error:', error);
    }
  }, 10000); // Check every 10 seconds
  
  return true;
});

ipcMain.handle('stop-meeting-detection', async () => {
  if (meetingDetectionInterval) {
    clearInterval(meetingDetectionInterval);
    meetingDetectionInterval = null;
  }
  lastDetectedMeetings.clear();
  return true;
});

// Native notification handler
ipcMain.handle('show-notification', async (event, options) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon || path.join(__dirname, 'logo.png'),
      sound: options.sound || 'default',
      actions: options.actions || []
    });
    
    notification.show();
    
    // Handle click
    notification.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
      mainWindow.webContents.send('notification-clicked', options.tag);
    });
    
    return true;
  }
  return false;
});

async function detectRunningMeetings() {
  const meetings = [];
  
  try {
    // Check for running meeting applications on macOS
    const runningApps = await getRunningApplications();
    
    // Check for common meeting apps
    const meetingApps = [
      { name: 'zoom.us', displayName: 'Zoom' },
      { name: 'Microsoft Teams', displayName: 'Microsoft Teams' },
      { name: 'Google Chrome', displayName: 'Chrome (possible Google Meet)' },
      { name: 'Safari', displayName: 'Safari (possible meeting)' },
      { name: 'Slack', displayName: 'Slack' },
      { name: 'Discord', displayName: 'Discord' }
    ];
    
    meetingApps.forEach(app => {
      if (runningApps.includes(app.name)) {
        meetings.push({
          id: app.name,
          platform: app.displayName,
          confidence: app.name.includes('zoom') ? 0.9 : 0.7,
          isActive: true
        });
      }
    });
    
    // Check for specific meeting processes
    const meetingProcesses = await checkMeetingProcesses();
    meetings.push(...meetingProcesses);
    
  } catch (error) {
    console.error('Error detecting meetings:', error);
  }
  
  return meetings;
}

function getRunningApplications() {
  return new Promise((resolve, reject) => {
    exec('ps aux | grep -v grep', (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      
      const processes = stdout.split('\n').map(line => {
        const parts = line.trim().split(/\s+/);
        return parts.slice(10).join(' '); // Process name and args
      });
      
      resolve(processes);
    });
  });
}

async function checkMeetingProcesses() {
  const meetings = [];
  
  try {
    // Check for Zoom processes
    const zoomCheck = await checkProcess('zoom');
    if (zoomCheck) {
      meetings.push({
        id: 'zoom-process',
        platform: 'Zoom',
        confidence: 0.95,
        isActive: true
      });
    }
    
    // Check for Teams processes
    const teamsCheck = await checkProcess('Teams');
    if (teamsCheck) {
      meetings.push({
        id: 'teams-process',
        platform: 'Microsoft Teams',
        confidence: 0.95,
        isActive: true
      });
    }
    
  } catch (error) {
    console.error('Error checking meeting processes:', error);
  }
  
  return meetings;
}

function checkProcess(processName) {
  return new Promise((resolve) => {
    exec(`pgrep -f ${processName}`, (error, stdout) => {
      resolve(!error && stdout.trim().length > 0);
    });
  });
}

function showMeetingDetectedNotification(meeting) {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: 'Meeting Detected',
      body: `${meeting.platform} meeting detected. Click to start recording.`,
      icon: path.join(__dirname, 'logo.png'),
      sound: 'default',
      actions: [
        { type: 'button', text: 'Start Recording' },
        { type: 'button', text: 'Dismiss' }
      ]
    });
    
    notification.show();
    
    notification.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
      mainWindow.webContents.send('meeting-detected-notification-clicked', meeting);
    });
    
    notification.on('action', (event, index) => {
      if (index === 0) { // Start Recording
        mainWindow.webContents.send('start-recording-from-notification', meeting);
      }
    });
  }
}

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