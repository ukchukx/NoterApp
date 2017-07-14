let observableModule = require("data/observable");
let Observable = observableModule.Observable;
let ObservableArray = require("data/observable-array").ObservableArray;
let cameraModule = require("nativescript-camera");
let view = require("ui/core/view");
let uiEnums = require("ui/enums");
let animation = require("ui/animation");
let appSettings = require("application-settings");
let fs = require("file-system");
let imageSource = require("image-source");

let pageArray = new ObservableArray();
const pageData = new Observable();
pageData.set('notes', pageArray);

let page; let notesArr = []; 
let currentIndex = -1;

exports.pageLoaded = function(args) {
  cameraModule.requestPermissions();

  page = args.object; 
  pageData.set('showForm', true); 
  let newNoteTitle = appSettings.getString('newNoteTitle', ''); 
  let notes = appSettings.getString('notes', '');

  if(!notes){    
    notes = [
      {
        index: 0,
        title: '100 push ups'
      },
      {
        index: 1,
        title: '100 sit ups'
      },
      {
        index: 2,
        title: '100 squats'
      },
      {
        index: 3,
        title: '10km running'
      }
    ].map(n => Object.assign(n, {photo: null, show_photo: false}));
  
  } else {
    notes = JSON.parse(notes);
  }
  
  notesArr = notes;
  if(!pageArray.length){
    currentIndex = notes.length;
    notes.forEach((item) => {
      pageArray.push(item);
    });
  }

  pageData.set('itemTitle', newNoteTitle);
  page.bindingContext = pageData;

  view.getViewById(page, 'form').animate({
    translate: { x: 0, y: 160 },    
    duration: 800,
  });
};

exports.newNote = function() {
  let showForm = pageData.get('showForm');
  let topPosition = (showForm) ? -160 : 160; 
  let listVisibility = (showForm) ? 1 : 0;
 
  view.getViewById(page, 'list').animate({
    opacity: listVisibility,
    duration: 400 
  });
 
  view.getViewById(page, 'form').animate({
    translate: { x: 0, y: topPosition },    
    duration: 800,
  });
 
  pageData.set('showForm', !showForm);
};

exports.btnLoaded = function (args) {
  let btn = args.object;
  btn.android.setFocusable(false);
};

exports.openCamera = function() {
  appSettings.setString('newNoteTitle', pageData.get('itemTitle'));
  cameraModule.takePicture({width: 300, height: 300, keepAspectRatio: true})
  .then(function(imageAsset) {   
    let fName = `img_${(new Date().getTime() / 1000)}.jpg`;
    let filepath = fs.path.join(fs.knownFolders.documents().path, fName);
    
    imageSource.fromAsset(imageAsset)
    .then((imgSource) => {
      imgSource.saveToFile(filepath, uiEnums.ImageFormat.jpeg);
    });
  console.log(imageSource.fromFile(filepath));
     
    appSettings.setString('newNotePhoto', filepath);
    pageData.set('attachmentImg', filepath);
 
  });
};

exports.saveNote = function() {   
  let newNoteTitle = pageData.get('itemTitle');
  let newNotePhoto = pageData.get('attachmentImg');
 
  currentIndex += 1;
  let newIndex = currentIndex;
  
  let newItem = {
    index: newIndex,
    title: newNoteTitle,
    photo: newNotePhoto,
    show_photo: newNotePhoto && newNotePhoto.length !== 0
  };
 
  notesArr.push(newItem);
  pageArray.push(newItem);
  
  appSettings.setString('notes', JSON.stringify(notesArr));
  
  appSettings.setNumber('currentIndex', newIndex);
 
  appSettings.remove('newNoteTitle');
  appSettings.remove('newNotePhoto');
 
  pageData.set('showForm', false);
  pageData.set('itemTitle', '');
  pageData.set('attachmentImg', null);
   
  view.getViewById(page, 'list').animate({
    opacity: 1,
    duration: 400 
  });
 
  view.getViewById(page, 'form').animate({
      translate: { x: 0, y: -160 },    
      duration: 800,
  }); 
};

exports.deleteNote = function(args){   
  let target = args.object; 
  let idx = notesArr.map(n => n.index).indexOf(target.index);
  notesArr.splice(idx, 1);
  pageArray.splice(idx, 1); 
  appSettings.setString('notes', JSON.stringify(notesArr));
};
/*
These could help in the AndroidManifest.xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
<uses-permission android:name="android.permission.CAMERA"/>
*/