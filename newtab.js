function insertVisitedSites (mostVisitedURL) {
    var linkdiv = document.getElementById('most-visited-list');

    for (var i = 0; i < mostVisitedURL.length; i++) {
        var toplink = linkdiv.appendChild(document.createElement('a'))
        toplink.href = mostVisitedURL[i].url;

        var list = toplink.appendChild(document.createElement('li'))

        var favico_img = list.appendChild(document.createElement('img'));
        // getFaviconHref(url, favico_img);
        favico_img.style.float = "left";
        favico_img.className = "favico_img";
        favIconUrl = "chrome://favicon/" +
            mostVisitedURL[i].url;
        favico_img.src = favIconUrl;
        // var data = chrome.embeddedSearch.newTabPage.getMostVisitedItemData(10);
        // console.log(data);

        var text = list.appendChild(document.createElement('p'));
        // link.href = mostVisitedURL[i].url;
        text.appendChild(document.createTextNode((mostVisitedURL[i].title)));
        text.className = "truncated";

        var cleardiv = list.appendChild(document.createElement('div'));
        cleardiv.style.clear = "both";
    }
}

function throttle(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : Date.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = Date.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
        // console.log("Too recent!");
      }
      return result;
    };
  };

function checkDoesArrayExist (checkarr, checkarr2) {
    if (!checkarr2) return true;
    if (checkarr2.length == 0) return true;
    for (var i=0; i < checkarr2.length; i++) {
        if (checkarr2[i].length !== checkarr.length) continue;
        windowLoop:
        for (var j = checkarr2[i].length; j--;) {
            for (var k = 2; k--;){
                if (checkarr2[i][j][k] !== checkarr[j][k]) break windowLoop;
            }
            if (j == 0) return false;
        }
    }
    return true;
}

var limit = 60 / chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_MINUTE * 1000;

var syncChromeStorage = throttle(function() {

    // if (SavedTabsLib.write_in_progress == true) {
    //     TriggerSync();    
    //     return;
    // }

    var jsonArrayToSync = LZString.compressToBase64(JSON.stringify(SavedTabsLib.saved_url_array));
    // console.log('Array length to sync ' + jsonArrayToSync.length);
    var j = 0;
    var storageObj = {};

    while(jsonArrayToSync.length > 0) {
        var index = "TabsKey_" + j++;
        var subStrLength = chrome.storage.sync.QUOTA_BYTES_PER_ITEM - index.length - 10;
        var segment = jsonArrayToSync.substr(0, subStrLength);
        storageObj[index] = segment;
        jsonArrayToSync = jsonArrayToSync.substr(subStrLength);
    }

    var jsonArrayToSync = LZString.compressToBase64(JSON.stringify(SavedTabsLib.saved_favico_array));
    // console.log('Array length to sync ' + jsonArrayToSync.length);
    var k = 0;

    while(jsonArrayToSync.length > 0) {
        var index = "FavKey_" + k++;
        var subStrLength = chrome.storage.sync.QUOTA_BYTES_PER_ITEM - index.length - 10;
        var segment = jsonArrayToSync.substr(0, subStrLength);
        storageObj[index] = segment;
        jsonArrayToSync = jsonArrayToSync.substr(subStrLength);
    }

    var storedlength =  JSON.stringify(storageObj).length;

    if (storedlength > chrome.storage.sync.QUOTA_BYTES - 1000) return;

    console.log('Stored arrays length is ' + storedlength);

    chrome.storage.sync.get(null, function callback(items) { 
        total_storage = items;
        // console.log(total_storage);
    
        var j = 0;
        var m = 0;
        var index = "TabsKey_0" 
        var keysToDelete = [];
        while(index in total_storage) {
            keysToDelete[m] = index; 
            var index = "TabsKey_" + j++;
            m++;
        }
        var k = 0;
        var index2 = "FavKey_0" 
        while(index2 in total_storage) {
            keysToDelete[m] = index2; 
            var index2 = "FavKey_" + k++;
            m++;
        }

        chrome.storage.sync.remove(keysToDelete, function callback() {

            chrome.storage.sync.set(storageObj, function() {
                // console.log('Success!');
                updateTabLinks(SavedTabsLib.saved_url_array,SavedTabsLib.saved_favico_array,false);
                updateProgress(storageObj);
            });

            // chrome.storage.sync.get(null, function callback(items) { console.log(items) });

        });

    });
}, limit);

function updateProgress(obj) {
    var prog = document.getElementById("progressbar");
    var setwidth = JSON.stringify(obj).length / chrome.storage.sync.QUOTA_BYTES;
    // var setwidth = .9; //used to test
    if (setwidth < .5) prog.style.background = "green";
    else if (setwidth < .8) prog.style.background = "orange";
    else prog.style.background = "red";
    setwidth = 100 * setwidth + '%';
    prog.style.width = setwidth;
    SavedTabsLib.progwidth = setwidth;
}

function openWindow (that) {
    // console.log('click');
    var parent = that.parentElement.parentElement;

    var windowArrayToOpen = [];
    // console.log(that.childElementCount);
    for (var i=0; (parent=parent.previousSibling); i++);
    if (SavedTabsLib.deb_open_progress[i] > 0) return; 
    if (checkDoesArrayExist(SavedTabsLib.saved_url_array[i], SavedTabsLib.url_array)) {
    if (i > -1) {
    for (var j=0; j < SavedTabsLib.saved_url_array[i].length; j++) {
        windowArrayToOpen.push(SavedTabsLib.saved_url_array[i][j][0]);
    }
    var windowCreatedID;
    chrome.windows.create(
        {url: windowArrayToOpen, focused: true}, function(window) {
            for (var j=0; j < SavedTabsLib.saved_url_array[i].length; j++) {
                if(SavedTabsLib.saved_url_array[i][j][2] == 1) {
                   var tabToPin = window.tabs[j].id;
                   chrome.tabs.update(tabToPin, {pinned: true});
                }
            }
            console.log(window);
        });
    // console.log(windowArrayToOpen);
    }

    } else {
        SavedTabsLib.deb_open_progress[i] = 1;
        const start = window.performance.now();
        const duration = SavedTabsLib.deb_duration;
        that.style.visibility = "visible";
        that.innerHTML = "Already Open!";
        
        window.requestAnimationFrame(function fadeIn (now) {
            const progress = now - start;
            that.style.opacity = ((duration - progress) / duration) ;
            // console.log(progress + " " + duration);

            if (progress < duration) {
                window.requestAnimationFrame(fadeIn);
            } else {
                that.innerHTML = "Open";
                that.removeAttribute("style");
                SavedTabsLib.deb_open_progress[i] = 0;
            }
        });

    }

    
    // console.log(i);
}

function removeFromSavedSites (that) {
    // console.log('click');
    var parent = that.parentElement.parentElement;

    var s_array = SavedTabsLib.saved_url_array;
    var array = SavedTabsLib.url_array;

    var s_f_array = SavedTabsLib.saved_favico_array;
    var f_array = SavedTabsLib.favico_array;

    var favicos_still_present = [];

    // var windowArrayToRemove = [];
    // console.log(that.childElementCount);
    for (var i=0; (parent=parent.previousSibling); i++);
    if (i > -1) {
    s_array.splice(i,1);
    }

    for (var i = 0; i < s_array.length; i++) {
        for (var j = 0; j < s_array[i].length; j++) {
            if (!favicos_still_present.includes(s_array[i][j][3])) {
                favicos_still_present.push(s_array[i][j][3]); 
            }
        } 
    }

    var temp_f_array = s_f_array.slice();

    for (var i = temp_f_array.length; i--;) {
        if (!favicos_still_present.includes(i)) {
            temp_f_array.splice(i,1);
        }
    }

    for (var i = 0; i < s_array.length; i++) {
        for (var j = 0; j < s_array[i].length; j++) {
            s_array[i][j][3] = temp_f_array.indexOf(s_f_array[s_array[i][j][3]]);
        } 
    }

    SavedTabsLib.saved_favico_array = temp_f_array;
    SavedTabsLib.saved_url_array = s_array;

    var limit = 60 / chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_MINUTE * 1000;
    syncChromeStorage();
    
    // console.log(i);
}

function addToSavedSites (that) {
    // console.log('click');
    var parent = that.parentElement.parentElement;

    var s_array = SavedTabsLib.saved_url_array;
    var array = SavedTabsLib.url_array;

    var s_f_array = SavedTabsLib.saved_favico_array;
    var f_array = SavedTabsLib.favico_array;

    if (!s_f_array) {
        s_f_array = [];
        s_f_array.push("chrome://favicon/1");
    }
    
    if (!s_array) {
        s_array = [];
    }

    // var orig_parent = parent;

    var windowArrayToSave = [];
    // console.log(that.childElementCount);
    for (var i=0; (parent=parent.previousSibling); i++);
    // if (orig_parent.hasAttribute("data-isWorking")) return; 
    if (SavedTabsLib.deb_add_progress[i] > 0) return; 
    if (checkDoesArrayExist(array[i], s_array)) {
        
        for (var j=0; j < array[i].length; j++){
            var f_index = s_f_array.indexOf(f_array[array[i][j][3]]);
            if (f_index > -1) {
                array[i][j][3] = f_index; 
            } else {
                f_index = s_f_array.push(f_array[array[i][j][3]]);
                array[i][j][3] = f_index - 1; 
            }
        }
        s_array.push(array[i]);

        SavedTabsLib.saved_url_array = s_array;

    var limit = 60 / chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_MINUTE * 1000;
    syncChromeStorage();

    } else {
        // orig_parent.setAttribute("data-isWorking","1");
        SavedTabsLib.deb_add_progress[i] = 1;
        const start = window.performance.now();
        const duration = SavedTabsLib.deb_duration;
        that.style.visibility = "visible";
        that.innerHTML = "Already Saved!";
        
        window.requestAnimationFrame(function fadeIn (now) {
            const progress = now - start;
            that.style.opacity = ((duration - progress) / duration) ;
            // console.log(progress + " " + duration);

            if (progress < duration) {
                window.requestAnimationFrame(fadeIn);
            } else {
                that.innerHTML = "Save";
                that.removeAttribute("style");
                // orig_parent.removeAttribute("data-isWorking");
                SavedTabsLib.deb_add_progress[i] = 0;
            }
        });

    }

    // console.log(i);
}

function updateTabLinks (array, f_array, saveDelete){

    if (!array || !f_array) return;

    var idString = (saveDelete) ? 
        'current-tabs-master-box' : 'saved-tabs-master-box';
    var RightBoxClass = (saveDelete) ? 'hoversave' : 'hoverdelete';
    var RightBoxText = (saveDelete) ? 'Save' : 'X' ;
    var Listener = (saveDelete) ? function() {
        addToSavedSites(this);}  : function() {
        removeFromSavedSites(this);
    };

 var linkdiv = document.getElementById(idString);
 linkdiv.innerHTML = "";

    for (var i = 0; i < array.length; i++) {
        var ul_list = linkdiv.appendChild(document.createElement('ul'))
        ul_list.className = "tabsList"
        var firstlist = ul_list.appendChild(document.createElement('li'))
        firstlist.className = "windowLink";
        var windowtext = firstlist.appendChild(document.createElement('p'));
        windowtext.style.float = "left";

        var savetext = firstlist.appendChild(document.createElement('p'));
        savetext.appendChild(document.createTextNode(RightBoxText));
        savetext.className = RightBoxClass;

        if (!saveDelete) {
        var opentext = firstlist.appendChild(document.createElement('p'));
        opentext.appendChild(document.createTextNode('Open'));
        opentext.className = "hoveropen";
        opentext.addEventListener("click", function() {openWindow(this);});
        }
        
        var cleardiv = firstlist.appendChild(document.createElement('div'));
        cleardiv.style.clear = "both";

        var WindowCountString = (array[i].length == 1) ? 
            "1 Tab" : array[i].length + " Tabs";
        // windowtext.appendChild(document.createTextNode(
        //     "Window " + (i+1) + " - " + WindowCountString
        // ));
        windowtext.appendChild(document.createTextNode(WindowCountString));

        savetext.addEventListener("click", Listener);


        for (var j = 0; j < array[i].length; j++) {

            var url = new URL(array[i][j][0]);

            var toplink = ul_list.appendChild(document.createElement('a'))
            toplink.href = url;

            var list = toplink.appendChild(document.createElement('li'))
            list.className = "dropdown";

            var url = new URL(array[i][j][0]);
            var domain = url.hostname;

            var favico_index = array[i][j][3];

            var favico_img = list.appendChild(document.createElement('img'));
            // getFaviconHref(url, favico_img);
            favico_img.style.float = "left";
            favico_img.className = "favico_img";
            favico_img.src = f_array[favico_index];

            var text = list.appendChild(document.createElement('a'));
            text.href = array[i][j][0];
            if (array[i][j][2] == 1) {
            text.appendChild(document.createTextNode(("📌 " + array[i][j][1])));
            }
            else {
            text.appendChild(document.createTextNode((array[i][j][1])));
            }
            text.className = "truncated";
            // link.style.float = "right";
            var cleardiv = list.appendChild(document.createElement('div'));
            cleardiv.style.clear = "both";
        }
    }
}

function checkUrl(urlToCheck) {
    var greatSuspenderCheck = "suspended.html#ttl";
    if (urlToCheck.indexOf(greatSuspenderCheck) !== -1) {
        return urlToCheck.substr(urlToCheck.lastIndexOf("&uri=") + 5,urlToCheck.length);
    }
    else return urlToCheck;
}

// var getFaviconHref = function(urlToCheck, imgToSet){
//     var favicon = undefined;
//     var httpRequest = new XMLHttpRequest()
//     httpRequest.open("HEAD", urlToCheck)
//     httpRequest.onload = function (data) {
//         console.log(httpRequest.responseText);
//         if (this.readyState == this.DONE) {
//         var favicon = this.querySelector("[rel*='icon']");
//         // imgToSet.href = favicon.href;
//         console.log(favicon);
//         }
//     }
//     httpRequest.send()

//     // var nodeList = document.getElementsByTagName("link");
//     // for (var i = 0; i < nodeList.length; i++)
//     // {
//     //     if((nodeList[i].getAttribute("rel") == "icon")||(nodeList[i].getAttribute("rel") == "shortcut icon"))
//     //     {
//     //         favicon = nodeList[i].getAttribute("href");
//     //     }
//     // }
//     // return favicon;        
// }

//This isn't really working, maybe reevaluate someday
// function EliminateBase64FavIco() {
//     for (var i = 0; i < SavedTabsLib.url_array.length; i++) {
//         for (var j = 0; j < SavedTabsLib.url_array[i].length; j++) {
//             var baseurl = SavedTabsLib.url_array[i][j][0];
//             var urlToCheck = SavedTabsLib.favico_array[SavedTabsLib.url_array[i][j][3]]; 
//             if (typeof urlToCheck == 'undefined') continue;
//             var base64check = "png;base64";
//             if (urlToCheck.indexOf(base64check) !== -1) {
//                 var url = new URL(baseurl);
//                 var domain = url.hostname;    
//                 var domainsplit = domain.split('.');
//                 var middledomain = domainsplit[domainsplit.length - 2];
//                 var foundindex = SavedTabsLib.favico_array.findIndex(a =>a.includes(domain));
//                 if (foundindex > -1) SavedTabsLib.url_array[i][j][3] = foundindex;
//             }
//         }
//     }
// }

function checkFavIco(urlToCheck, baseurl) {

    if (typeof urlToCheck == 'undefined') return 0;
    if (urlToCheck.length === 0) return 0;

    // Irrelevant now that 0 is always the undefined favico
    // if (SavedTabsLib.favico_array.length == 0) {
    //     var newFavIco = SavedTabsLib.favico_array.push(urlToCheck);
    //     return newFavIco - 1;
    // }

    // var base64check = "png;base64";
    // if (urlToCheck.indexOf(base64check) !== -1) {
    //     var url = new URL(baseurl);
    //     var domain = url.hostname;    
    //     var foundindex = SavedTabsLib.favico_array.findIndex(a =>a.includes(domain));
    //     if (foundindex > -1) return foundindex;
    // }

    for (var i = 0; i < SavedTabsLib.favico_array.length; i++){
        if (urlToCheck == SavedTabsLib.favico_array[i]) return i;
    }

    var newFavIco = SavedTabsLib.favico_array.push(urlToCheck);
    return newFavIco - 1;
}

var SavedTabsLib = {
    saved_favico_array: [],
    favico_array: [],
    url_array: [],
    saved_url_array: [],
    deb_duration: 1500,
    deb_add_progress: [],
    deb_open_progress: [],
    progwidth: 0,
    write_in_progress: false,
    timeout_write: 0,
};

chrome.topSites.get(insertVisitedSites);

SavedTabsLib.favico_array = ["chrome://favicon/1"];
SavedTabsLib.saved_favico_array = ["chrome://favicon/1"];

var RefreshCurrent = throttle(function() {

// SavedTabsLib.favico_array = [];
// SavedTabsLib.saved_favico_array = [];
// SavedTabsLib.saved_url_array = [];


chrome.tabs.query({}, function (tabs) {
    SavedTabsLib.url_array = [];
    tabs.forEach(function(tab) {
        // var url = new URL(tab.url);
        // var domain = url.hostname;
        var found = false;
        for (var i = 0; i < SavedTabsLib.url_array.length; i++){
            if (SavedTabsLib.url_array[i].ID == tab.windowId) {
                // var tablength = SavedTabsLib.url_array[i].push([tab.url,tab.title]);
                var urlToUse = checkUrl(tab.url);
                var favico_index = checkFavIco(tab.favIconUrl,urlToUse); // }

                if (tab.pinned == true) SavedTabsLib.url_array[i].push([urlToUse,tab.title,1,favico_index]);
                else SavedTabsLib.url_array[i].push([urlToUse,tab.title,0,favico_index]);

                // if (tab.pinned == true) SavedTabsLib.url_array[i].push([urlToUse,tab.title,1]);
                // else SavedTabsLib.url_array[i].push([urlToUse,tab.title,0]);
                found = true;
            }
        }
        if (found == false || SavedTabsLib.url_array.length == 0){
            var newlength = SavedTabsLib.url_array.push([]);
            SavedTabsLib.url_array[newlength - 1].ID = tab.windowId;
            // var newtablength = SavedTabsLib.url_array[newlength - 1].push([tab.url,tab.title])
                var urlToUse = checkUrl(tab.url);
                var favico_index = checkFavIco(tab.favIconUrl,urlToUse); // }

            if (tab.pinned == true) SavedTabsLib.url_array[newlength - 1].push([urlToUse,tab.title,1,favico_index]);
            else SavedTabsLib.url_array[newlength - 1].push([urlToUse,tab.title,0,favico_index]);

            // if (tab.pinned == true) SavedTabsLib.url_array[newlength - 1].push([urlToUse,tab.title,1]);
            // else SavedTabsLib.url_array[newlength - 1].push([urlToUse,tab.title,0]);
        }
    });

    // EliminateBase64FavIco();

console.log("Current URL array length " + JSON.stringify(SavedTabsLib.url_array).length);
console.log("Current favico array length " + JSON.stringify(SavedTabsLib.favico_array).length);
updateTabLinks(SavedTabsLib.url_array,SavedTabsLib.favico_array,true);
// console.log("current refreshed");
}); 
},5000);

function RefreshSaved() {

var total_storage = {};
chrome.storage.sync.get(null, function callback(items) { 
    total_storage = items;
    // console.log(total_storage);
   
    var j = 0;
    var index = "TabsKey_0" 
    var json_saved_array = "";
    while(index in total_storage) {
        json_saved_array = json_saved_array.concat(total_storage[index]);
        j = j+1;
        var index = "TabsKey_" + j;
    }

    var k = 0;
    var index = "FavKey_0" 
    var json_favico_saved_array = "";
    while(index in total_storage) {
        json_favico_saved_array = json_favico_saved_array.concat(total_storage[index]);
        k = k+1;
        var index = "FavKey_" + k;
    }

    if (json_favico_saved_array) {
        SavedTabsLib.saved_favico_array = JSON.parse(LZString.decompressFromBase64(json_favico_saved_array));
    } else {
        SavedTabsLib.saved_favico_array = [];
    }

    if (json_saved_array) {
        SavedTabsLib.saved_url_array = JSON.parse(LZString.decompressFromBase64(json_saved_array));

        updateTabLinks(SavedTabsLib.saved_url_array,SavedTabsLib.saved_favico_array,false);

        // console.log('Stored arrays length is ' + JSON.stringify(total_storage).length);
    } else {
        SavedTabsLib.saved_url_array = [];
    }
        updateProgress(total_storage);
 });
}

RefreshCurrent();
RefreshSaved();

document.addEventListener('visibilitychange', function() {
    RefreshCurrent();
});
    // chrome.storage.sync.get(null, function callback(items) { console.log(items) });
// console.log(total_storage);

chrome.storage.onChanged.addListener(function callback(){
    throttle(RefreshSaved(),100);
    // RefreshSaved();
});

chrome.tabs.onUpdated.addListener(function callback(tabId, info){
    if (info.status === 'complete') RefreshCurrent();
    // RefreshCurrent();
});

chrome.tabs.onRemoved.addListener(function callback(){
    // throttle(RefreshCurrent(),1000);
    RefreshCurrent();
});


var LZString=function(){function o(o,r){if(!t[o]){t[o]={};for(var n=0;n<o.length;n++)t[o][o.charAt(n)]=n}return t[o][r]}var r=String.fromCharCode,n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",t={},i={compressToBase64:function(o){if(null==o)return"";var r=i._compress(o,6,function(o){return n.charAt(o)});switch(r.length%4){default:case 0:return r;case 1:return r+"===";case 2:return r+"==";case 3:return r+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(e){return o(n,r.charAt(e))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(o){return null==o?"":""==o?null:i._decompress(o.length,16384,function(r){return o.charCodeAt(r)-32})},compressToUint8Array:function(o){for(var r=i.compress(o),n=new Uint8Array(2*r.length),e=0,t=r.length;t>e;e++){var s=r.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null===o||void 0===o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;t>e;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(o){return null==o?"":i._compress(o,6,function(o){return e.charAt(o)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(n){return o(e,r.charAt(n))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(o,r,n){if(null==o)return"";var e,t,i,s={},p={},u="",c="",a="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<o.length;i+=1)if(u=o.charAt(i),Object.prototype.hasOwnProperty.call(s,u)||(s[u]=f++,p[u]=!0),c=a+u,Object.prototype.hasOwnProperty.call(s,c))a=c;else{if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++),s[c]=f++,a=String(u)}if(""!==a){if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==r-1){d.push(n(m));break}v++}return d.join("")},decompress:function(o){return null==o?"":""==o?null:i._decompress(o.length,32768,function(r){return o.charCodeAt(r)})},_decompress:function(o,n,e){var t,i,s,p,u,c,a,l,f=[],h=4,d=4,m=3,v="",w=[],A={val:e(0),position:n,index:1};for(i=0;3>i;i+=1)f[i]=i;for(p=0,c=Math.pow(2,2),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(t=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 2:return""}for(f[3]=l,s=l,w.push(l);;){if(A.index>o)return"";for(p=0,c=Math.pow(2,m),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(l=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 2:return w.join("")}if(0==h&&(h=Math.pow(2,m),m++),f[l])v=f[l];else{if(l!==d)return null;v=s+s.charAt(0)}w.push(v),f[d++]=s+v.charAt(0),h--,s=v,0==h&&(h=Math.pow(2,m),m++)}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module&&(module.exports=LZString);