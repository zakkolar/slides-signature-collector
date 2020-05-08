/**
 MIT License

 Copyright (c) 2020 Zak Kolar (https://zak.io)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 **/

function resetLink(){
  deleteProperty(PROPERTIES.APP_LINK);
}
function doGet(e) {

  const url = ScriptApp.getService().getUrl().split("/");
  if(url[url.length-1] === "exec"){
    setProperty(PROPERTIES.APP_LINK, ScriptApp.getService().getUrl());
  }



  if(getClosed()){

    return showClosed();
  }



  return showPage('webapp/Signature', 'Signature Collector');


}

function showClosed(){
  return showPage('webapp/Closed','Signatures closed');
}

function showPage(file, title) {


  var template = HtmlService.createTemplateFromFile(file);


  return template.evaluate().setTitle(title).addMetaTag("viewport","width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no");


}



function getSignaturePrefix(){
  return 'Signature for ';
}


function getSignatureLabel(name){
  return getSignaturePrefix()+name;
}

function getSlide(){

  var slideshow = SlidesApp.getActivePresentation();
  var slide = slideshow.getSlides()[0];

  return slide;
}

function getPresentation(){


  return SlidesApp.getActivePresentation();

}




function splitPostData(e){
  var data = e.postData.contents;
  var entries = data.split('&');
  var returnData = {};
  for(var i=0; i<entries.length; i++){
   var entry = entries[i].split('=');
    returnData[decodeURIComponent(entry[0].replace(/\+/g, '%20'))] = decodeURIComponent(entry[1].replace(/\+/g, '%20'));
  }
  return returnData;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}


function doPost(e){


    if(getClosed()){
      return showClosed();
    }

    var slide = getSlide();

    var presentation = getPresentation();

    var post = splitPostData(e);

    // @ts-ignore
    var newSignatureData = decodeURIComponent(post.imageData).replace('data:image/png;base64,', '');


    var decoded = Utilities.base64Decode(newSignatureData);

    // @ts-ignore
    const blob = Utilities.newBlob(decoded, MimeType.PNG);

    // @ts-ignore
    var image = slide.insertImage(blob);

    // @ts-ignore
    image.setLeft(Math.min(Math.random() * presentation.getPageWidth(), presentation.getPageWidth() - image.getWidth()));
    // @ts-ignore
    image.setTop(Math.min(Math.random() * presentation.getPageHeight(), presentation.getPageHeight() - image.getHeight()));

    // @ts-ignore
    image.setTitle(getSignatureLabel(post.name));

   return  showPage('webapp/Thanks', 'Thanks for submitting!');


}

function onOpen(e){
  SlidesApp.getUi().createMenu('Signature Collector')
      .addItem('Show submitted names','showNameList')
      .addItem('Settings','showSidebar')
      .addToUi();
}

function showSidebar(){
  const html = HtmlService.createTemplateFromFile('addon/Sidebar')
      .evaluate()
      .setTitle('Signature Collector')
      .setWidth(300);

  SlidesApp.getUi()
      .showSidebar(html);
}

function showNameList(){
  const html = HtmlService.createTemplateFromFile('addon/SignatureList')
      .evaluate()
      .setWidth(600);

  SlidesApp.getUi()
      .showModalDialog(html,'Submitted Names');
}

function getSignatureList(){
  const slide = getSlide();

  const images = slide.getImages();
  const prefix = getSignaturePrefix();

  const names = [];

  for(let image of images){
    const description = image.getTitle();
    if(description.indexOf(prefix)>-1){
      const name = description.replace(prefix, "");
      console.log(name);
      names.push(name);
    }
  }

  return names.sort();
}

enum PROPERTIES  {
  SIGNATURE_PAGE_DESCRIPTION= 'SIGNATURE_PAGE_DESCRIPTION',
  THANK_YOU_PAGE_DESCRIPTION = 'THANK_YOU_PAGE_DESCRIPTION',
  CLOSED = 'CLOSED',
  CLOSED_PAGE_MESSAGE = 'CLOSED_PAGE_MESSAGE',
  APP_LINK = 'APP_LINK'
}

function getProperty(key, defaultValue){
  return PropertiesService.getDocumentProperties().getProperty(key) || defaultValue;
}

function deleteProperty(key){
  PropertiesService.getDocumentProperties().deleteProperty(key);
}

function setProperty(key, value){
  PropertiesService.getDocumentProperties().setProperty(key, value);
}

function getSignaturePageDescription(){
  return getProperty(PROPERTIES.SIGNATURE_PAGE_DESCRIPTION, "Fill out the form below to add your signature.");
}

function getThankYouPageDescription(){
  return getProperty(PROPERTIES.THANK_YOU_PAGE_DESCRIPTION, "Your signature has been saved. You can now close this website. Thanks for signing!");
}

function getClosedPageDescription(){
  return getProperty(PROPERTIES.CLOSED_PAGE_MESSAGE, "Signatures are not currently being accepted.");
}

function getClosed(){
  return getProperty(PROPERTIES.CLOSED, false);
}

function getSignaturePageUrl(){
  return getProperty(PROPERTIES.APP_LINK, null);
}

function saveSettings(settings){
  if(settings.signaturePageDescription){
    setProperty(PROPERTIES.SIGNATURE_PAGE_DESCRIPTION, settings.signaturePageDescription);
  }

  if(settings.thankYouPageDescription){
    setProperty(PROPERTIES.THANK_YOU_PAGE_DESCRIPTION, settings.thankYouPageDescription);
  }

  if(settings.closedPageDescription){
    setProperty(PROPERTIES.CLOSED_PAGE_MESSAGE, settings.closedPageDescription);
  }

  if(!settings.enableSignatureCollection){
    setProperty(PROPERTIES.CLOSED,'true');
  }
  else{
    deleteProperty(PROPERTIES.CLOSED)
  }


}
