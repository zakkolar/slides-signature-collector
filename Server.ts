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




function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}


function saveSignature(name, imageData){


    if(getClosed()){
      return showClosed();
    }

    var slide = getSlide();

    var presentation = getPresentation();

    // @ts-ignore
    var newSignatureData = imageData.replace('data:image/png;base64,', '');


    var decoded = Utilities.base64Decode(newSignatureData);

    // @ts-ignore
    const blob = Utilities.newBlob(decoded, MimeType.PNG);

    // @ts-ignore
    var image = slide.insertImage(blob);



    // @ts-ignore
    image.setTitle(getSignatureLabel(name));

    const maxHeight = 80;

    if(image.getHeight()>maxHeight){
      const newHeight = maxHeight;
      const currentHeight = image.getHeight();
      const currentWidth = image.getWidth();

      const newWidth = newHeight / currentHeight * currentWidth;

      image.setWidth(newWidth);
      image.setHeight(newHeight);
    }

    // @ts-ignore
    image.setLeft(Math.min(Math.random() * presentation.getPageWidth(), presentation.getPageWidth() - image.getWidth()));
    // @ts-ignore
    image.setTop(Math.min(Math.random() * presentation.getPageHeight(), presentation.getPageHeight() - image.getHeight()));


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

function deleteSignature(objectId){
    const slide = getSlide();
    slide.getPageElementById(objectId).remove();
}

function getSignatureImage(objectId){
  const slide = getSlide();
  const signatures = slide.getImages();
  for(let signature of signatures) {
    if(signature.getObjectId() === objectId){
      const description = signature.getTitle();

        const image = `data:image/png;base64,${Utilities.base64Encode(signature.getBlob().getBytes())}`;

        return {
          image: image,
          alt: description
        };

    }
  }

  return objectId;

}

function getSignatureList(){
  const slide = getSlide();

  const signatures = slide.getImages();
  const prefix = getSignaturePrefix();

  const names = [];

  for(let signature of signatures){

    const description = signature.getTitle();



    const objectId = signature.getObjectId();


    if(description.indexOf(prefix)>-1){
      const name = description.replace(prefix, "");

      const obj = {
        name: name,
        objectId: objectId,
      }



      names.push(obj);
    }
  }

  return names.sort((a, b) => (a.name > b.name) ? 1 : -1);
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
