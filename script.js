function cameraButton(){
    document.getElementById("cameraUpload").click();
}

function scanButton(){
    document.getElementById("loading").style.visibility="visible";
    var receipt = document.getElementById("receipt-img");
    Tesseract.recognize(receipt)
        .progress(console.log)
        .then(findLineItems)
        .catch(e => console.log(e));
}

function splitButton(){
    
}

function applyStyles(elem,styles){
    for(var property in styles){
        elem.style[property] = styles[property];
    }
}

function focusOnLineElement(elemID){
    var lineObject = document.getElementById(elemID);
    lineObject.visibility = "visible";
    var focusedElems = document.getElementsByClassName("focus");
    var numFocusedElems = focusedElems.length;
    for(var i = 0; i < numFocusedElems; i++){
        focusedElems[i].classList.remove("focus");
    }
    lineObject.classList.add("focus");
}

function findLineItems(tessarectResult){
    var receipt = document.getElementById("receipt-img");
    var scale_x = parseFloat(receipt.naturalWidth);
    var scale_y = parseFloat(receipt.naturalWidth / receipt.width * document.getElementById("mid").clientHeight);
    document.getElementById("loading").style.visibility="hidden"
    var result = [];
    console.log(tessarectResult);
    for(var i = 0; i < tessarectResult.lines.length; i++){
        var line = tessarectResult.lines[i];
        var lineObject = {};
        if(line.text.includes("$")){
            var lineComponents = line.text.split("$");
            lineObject = {  "desc":lineComponents[0],
                            "cost":"$" + String(lineComponents[1]),
                            "stylings":{
                                    "left":String(100*line.bbox.x0/scale_x) + "%",
                                    "top":String(100*line.bbox.y0/scale_y) + "%",
                                    "width":String(100*(line.bbox.x1 - line.bbox.x0)/scale_x) + "%",
                                    "height":String(100*(line.bbox.y1 - line.bbox.y0)/scale_y) + "%"
                                }
            };
        } else{
            lineObject = {  "desc":line.text,
                            "cost":"$??",
                            "stylings":{
                                    "left":String(100*line.bbox.x0/scale_x) + "%",
                                    "top":String(100*line.bbox.y0/scale_y) + "%",
                                    "width":String(100*(line.bbox.x1 - line.bbox.x0)/scale_x) + "%",
                                    "height":String(100*(line.bbox.y1 - line.bbox.y0)/scale_y) + "%"
                                }
            };
        }
        var l = new LineItem(lineObject.cost,lineObject.desc,mainReceipt);
        l.render("scan-view",lineObject.stylings);
        mainReceipt.addLineItem(l);
        result.push(lineObject);
        if(lineObject.cost == "$??") { l.hide(); }
    }  
    if(result.length == 0){
        console.log("Could not read any line items with money in this receipt");
    }
    console.log(result);
}

function readImage(){
    var preview = document.getElementById("receipt-img");
    var file    = document.getElementById('cameraUpload').files[0];
    var reader  = new FileReader();
    
    reader.onloadend = function () {
        preview.src = reader.result;
        scanButton();
    };
        
    if (file) {
        reader.readAsDataURL(file);
    } else {
    preview.src = "";
  }
  
}


//OOP STUFF
class Receipt{
    constructor(){
        this.image = null;
        this.lineItems = [];
        this.people = [];
    }
    
    addLineItem(l){
        this.lineItems.push(l);
    }
    
    addPerson(p){
        this.people.push(p);
    }
    
}

class LineItem{
    constructor(cost,desc,receipt){
        if(cost.typeof == "String" && cost[0] == "$"){
            this.cost = parseFloat(cost.slice(1));
        } else{
            this.cost = parseFloat(cost);
        }
        this.desc = desc;
        this.splits = [];
        this.receipt = receipt;
        this.owner = null;
        this.HTMLObject = null;
    }
    
    assignTo(person){
        if(this.owner){
            var index = this.owner.lineItems.indexOf(this);
            this.owner.lineItems.pop(index);
        }
        this.owner = person;
        person.lineItems.push(this);
    }
    
    split(ways){
        for(var i = 0; i < ways; i++){
            var tmp = new LineItem(this.desc + "-" + String(i+1),this.cost / ways)
            this.splits.push(tmp)
        }
    }
    
    render(target, stylings){
        var lineObject = document.createElement("div");
        lineObject.classList.add("lineItem");
        applyStyles(lineObject,stylings);
        
        var desc = document.createElement("span");
        desc.classList.add("desc");
        desc.innerHTML = this.desc;
        
        var cost = document.createElement("span");
        cost.classList.add("cost");
        cost.innerHTML = "$" + String(this.cost);
        
        var overlay = document.getElementById(target);
        overlay.appendChild(lineObject);
        lineObject.appendChild(desc);
        lineObject.appendChild(cost);
        lineObject.setAttribute("onClick","focusOnLineElement(this.id)");
        lineObject.id = this.desc;
        this.HTMLObject = lineObject;
    }
    
    hide(){
        this.HTMLObject.style.visibility = "hidden";
    }
    
    unhide(){
        this.HTMLObject.style.visibility = "visible";
    }
}

class Person{
    constructor(name){
        this.name = name;
        this.totalOwed = 0;
        this.lineItems = [];    
    }
    
    updateAmountOwed(){
        this.totalOwed = this.lineItems.reduce((a,b)=>a+b.cost,0);
        return this.totalOwed;
    }
}

var mainReceipt = new Receipt();
