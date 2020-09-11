const electron = require('electron');
const { ipcRenderer } = electron;
const { dialog } = electron.remote;

function fixedEncodeURI(str) {
  return encodeURI(str)
    .replace(/[!'()]/g, escape)
    .replace(/\*/g, '%2A');
}

//select dom elements
const dropZone = document.querySelector('.drop-zone'),
  fileInput = document.querySelector('input[type=file]'),
  thumb = document.querySelector('.drop-zone__thumb'),
  dropZoneText = document.querySelector('.drop-zone__text'),
  btn = document.querySelector('.btn'),
  loader = document.querySelector('img[alt=loader]'),
  slider = document.querySelector('.slidecontainer input[type=range]'),
  sliderValue = document.querySelector('.slidecontainer h1');

// set slide value to h1 element
sliderValue.innerText = slider.value;
//update slide value when slider move
slider.addEventListener('input', () => (sliderValue.innerText = slider.value));

// show and hide selected image thumb
function toggleThumb(path) {
  if (path) {
    // if type of slected image currect do this
    dropZoneText.style.display = 'none';
    thumb.style.display = 'block';
    btn.disabled = false;
    thumb.style.backgroundImage = `url(${fixedEncodeURI(path)})`;
  } else {
    //if not do this
    btn.disabled = true;

    dropZoneText.style.display = 'block';
    thumb.style.display = 'none';
  }
}

//listen when image is draged over drop zone
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZoneText.innerText =
    'قم بالسحب وإفلات الصورة هنا أو قم بالضغط لأختيار الصورة';
  dropZoneText.style.color = '#a69eb0';
  dropZone.classList.add('drag-over');
});

//listen when user drag out of drop zone or drag end
['dragleave', 'dragend'].forEach((type) => {
  dropZone.addEventListener(type, () => {
    dropZone.classList.remove('drag-over');
  });
});

//listen when image drop on drop zone
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();

  // check for file type
  if (e.dataTransfer.files[0].type.match(/png|jpg|jpeg/g)) {
    //assign dropped  files to hidden files input
    fileInput.files = e.dataTransfer.files;
    //if file type is coorect do this
    dropZone.classList.remove('drag-over');
    toggleThumb(fileInput.files[0].path);
  } else {
    // if not do this
    fileInput.value = '';
    dropZone.classList.remove('drag-over');
    toggleThumb();
    //hint for user if his/her select not supported type file
    dropZoneText.innerText = '(.png, .jpg) نوع الملف غير مدعوم الصور المدعومة ';
    dropZoneText.style.color = '#FF4F6B';
  }
});

// listen for click event on drop zone and tied that click with hidden input file
dropZone.addEventListener('click', () => {
  fileInput.click();
});

// listen for change event on fileInput hidden and call toggleThumb function to show selected image on thumb element
fileInput.addEventListener('change', () => {
  if (fileInput.files[0].path) {
    toggleThumb(fileInput.files[0].path);
  }
});

//handle image compression
function imageCompression() {
  if (fileInput.files[0]) {
    btn.hidden = true;
    loader.hidden = false;
    ipcRenderer.send('image-compress', {
      path: fileInput.files[0].path,
      quality: +slider.value
    });
  } else {
    alert('حدث حطأ الرجاء التأكد من اختيار الصورة');
  }
}

//listen for image compress done
ipcRenderer.on('compress-done', (e, { successMsg, dist }) => {
  btn.hidden = false;
  loader.hidden = true;
  fileInput.value = '';
  thumb.style.display = 'none';
  dropZoneText.style.display = 'block';
  btn.disabled = true;
  dialog.showMessageBox({
    title: 'تمت العملية بنجاح',
    message: successMsg,
    detail: dist,
    buttons: ['موافق']
  });
});

//listen for click on btn
btn.addEventListener('click', imageCompression);
