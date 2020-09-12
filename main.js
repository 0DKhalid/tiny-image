const path = require('path');
const os = require('os');
const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const log = require('electron-log');
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminMozjpeg = require('imagemin-mozjpeg');
const slash = require('slash');

const IS_DEVELOPMENT_MODE = false;

let mainWindow;

const imagesDist = path.join(os.homedir(), 'tinyImage');

//compress image handler
async function compressImage(imagePath, quality) {
  const pngquantQuality = quality / 100;
  try {
    const file = await imagemin([slash(imagePath)], {
      destination: imagesDist,
      plugins: [
        imageminMozjpeg({ quality }),
        imageminPngquant({
          quality: [pngquantQuality, pngquantQuality]
        })
      ]
    });
    log.info(file);
    shell.openPath(imagesDist);
  } catch (err) {
    log.warn(err);
  }
}

//App Menu
const menu = [
  {
    label: 'Tiny Image',
    submenu: [
      {
        label: 'إغلاق',
        role: 'quit'
      },
      {
        label: 'Github',
        click() {
          shell.openExternal('https://github.com/0DKhalid/tiny-image');
        }
      }
    ]
  }
];

//listen for image compress event and handle it
ipcMain.on('image-compress', async (e, { path, quality }) => {
  try {
    await compressImage(path, quality);
    e.sender.send('compress-done', {
      successMsg: 'لقد تم تقليل حجم الصورة بنجاح وحفظها في هذا المسار',
      dist: imagesDist
    });
  } catch (err) {
    log.warn(err);
  }
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('./rendrer/index.html');

  mainWindow.Menu;

  if (IS_DEVELOPMENT_MODE) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', () => {
    mainWindow = null;
    app.quit();
  });
}

app.whenReady().then(() => {
  createMainWindow();
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
