var GoogleAuth;
var SCOPE = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file'];
var SCOPE = 'https://www.googleapis.com/auth/drive';
var CLIENT_ID = '813919428941-hbams7vd9hr8uhrai1hqk3ufkvsuhgi8.apps.googleusercontent.com';

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    var discoveryUrl = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
    gapi.client.init({
        'clientId': CLIENT_ID,
        'discoveryDocs': [discoveryUrl],
        'scope': SCOPE
    }).then(function () {
        GoogleAuth = gapi.auth2.getAuthInstance();
        GoogleAuth.isSignedIn.listen(updateSigninStatus);
        var user = GoogleAuth.currentUser.get();
        setSigninStatus();
        $('#sign-in-or-out-button').click(function () {
            handleAuthClick();
        });
        $('#revoke-access-button').click(function () {
            revokeAccess();
        });
    });
}

function handleAuthClick() {
    if (GoogleAuth.isSignedIn.get()) {
        GoogleAuth.signOut();
    } else {
        GoogleAuth.signIn();
    }
}

function revokeAccess() {
    GoogleAuth.disconnect();
}

function hide(id) {
    $("#" + id).css("display", "hidden");
}
function show(id) {
    $("#" + id).css("display", "flex");
}

function activateScreen(screenId) {
    var screens = ["editor", "commands", "login", "filepicker", "wait"];
    screens.forEach(function (screen) {
        if (screen == screenId) {
            $('#' + screenId).css("display", "flex");
        } else {
            $('#' + screen).css("display", "none");
        }
    });
}
function setSigninStatus(isSignedIn) {
    var user = GoogleAuth.currentUser.get();
    var isAuthorized = user.hasGrantedScopes(SCOPE);
    if (isAuthorized) {
        $("#fixed").css("display", "flex");
        $("#logout").css("display", "flex");
        loadPicker();
        activateScreen("filepicker");
        $('#sign-in-message').html('Sign out');
        $('#revoke-access-button').css('display', 'inline-block');
    } else {
        $("#fixed").css("display", "none");
        activateScreen("login");
        $("#logout").css("display", "none");
        $('#sign-in-message').html('Sign In/Authorize');
        $('#revoke-access-button').css('display', 'none');
    }
}

function updateSigninStatus(isSignedIn) {
    setSigninStatus();
}

function openFile(fileId) {
    theEditor.value = "";
    notify_editing();
    activateScreen("editor");
    var contentRequest = gapi.client.drive.files.get({
        fileId: fileId,
        supportsTeamDrives: true,
        alt: 'media'
    }).then(function (content) {
        gapi.client.request({
            path: '/drive/v3/files/' + fileId,
            method: 'GET',
        }).then(function (response) {
            const name = JSON.parse(response.body)["name"];
            document.getElementById("edit_filename").value = name;
        });
        theEditor.value = content.body;
        theEditor.addEventListener("input", function (event) {            
            editorUpdated();
        });        
        // theEditor.focus();
        currentFile = fileId;
        updateWordCount();
    });
}

function updateWordCount() {
    if (threading) {        
        threading.postMessage(["calculate", theEditor.value]);
    } else {
        document.getElementById("wc").innerText = "word count: " + theEditor.getValue().split(/\s+/).length;
    }
}


function editorUpdated() {
    document.getElementById("save_button").setAttribute("class", "button_se");
    $("#save_message").text(" save");
    updateWordCount();
}

function createFile() {
    const fileName = document.getElementById("file_name").value;
    gapi.client.drive.files.create({
        'name': fileName,
        'parents': [currentFolder],
        "mimeType": "text/plain"
    }).then(function (response) {
        currentFile = JSON.parse(response.body)["id"];
        openFile(currentFile);
    });
}

function saveFile() {
    const fileContent = theEditor.value;
    $("#save_message").text(" saving...");
    $("#save_icon").removeClass("fa-save");
    $("#save_icon").addClass("fa-spinner");
    $("#save_icon").addClass("fa fa-spin");
    fileId = currentFile;
    gapi.client.request({
        path: '/upload/drive/v3/files/' + fileId,
        method: 'PATCH',
        headers: {
            "Content-Type": "text/plain",
            "Content-Length": fileContent.length
        },
        params: {
            "uploadType": 'media',
        },
        body: fileContent
    }).then(function (response) {
        const fileName = document.getElementById("edit_filename").value;
        gapi.client.request({
            path: '/drive/v3/files/' + fileId,
            method: 'PATCH',
            body: {
                name: fileName
            }
        }).then(function (response2) {
            document.getElementById("save_button").setAttribute("class", "button_inactive");
            $("#save_message").text(" saved");
            $("#save_icon").removeClass("fa-spinner");
            $("#save_icon").removeClass("fa-spin");
            $("#save_icon").addClass("fa-save");
            // theEditor.focus();
        });
    });
}

function makeSubElement(parent, tag, value, className){
    var child = document.createElement(tag);
    parent.appendChild(child);
    child.innerText = value;
    child.classList.add(className);
    return child;    
}

function formatDate(date){
    return  moment(date).format('lll');
}
function loadPicker(folderId) {
    notify_stop_editing();
    document.getElementById("edit_filename").value = "";
    theEditor.value = "";
    activateScreen("filepicker");
    var filesHolder = document.getElementById("files_holder");
    var filesHeader = document.getElementById("files_header");
    if (!folderId) {
        folderId = currentFolder;
    } else {
        currentFolder = folderId;
    }
    var currentFolderName = document.getElementById("currentFolderName");
    currentFolderName.innerHTML = "";
    if (folderId != "root") {
        var currentFolderText = document.createElement("span");
        currentFolderName.appendChild(currentFolderText);
        currentFolderText.innerText = folderNames[folderId];
    }
    var folderIdToRecurse = folderId;
    var previousParentLink = currentFolderText;
    while (parents[folderIdToRecurse] != folderIdToRecurse) {
        if (parents[folderIdToRecurse] != "root") {
            var parentLink = document.createElement("button");
            parentLink.setAttribute("class", "breadcrumb");
            parentLink.setAttribute("onclick", "loadPicker('" + parents[folderIdToRecurse] + "')");
            var parentText = document.createElement("span");
            parentLink.appendChild(parentText);
            parentText.innerText = folderNames[parents[folderIdToRecurse]];
            var divider = document.createElement("span");
            divider.innerText = "/ ";
            currentFolderName.insertBefore(parentLink, previousParentLink);
            currentFolderName.insertBefore(divider, previousParentLink);
        }
        folderIdToRecurse = parents[folderIdToRecurse];
        previousParentLink = parentLink;
    }
    const headersHTML = filesHeader.innerHTML;
    filesHolder.innerHTML = headersHTML;
    gapi.client.drive.files.list({
        'pageSize': 1000,
        'fields': "files(id, name, createdTime, modifiedTime, mimeType)",
        'orderBy': "folder desc,name",
        'q': "trashed = false and '" + folderId + "' in parents and (mimeType = 'application/vnd.google-apps.folder' or mimeType='text/plain')"
    }).then(function (response) {
        var files = response.result.files;
        if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var card = document.createElement("div");
                var icon = document.createElement("span");
                card.appendChild(icon);
                makeSubElement(card, "span", file.name, "file_info");
                if (file.mimeType == "application/vnd.google-apps.folder") {
                    card.setAttribute("class", "folder");
                    folderNames[file.id] = file.name;
                    icon.innerHTML = "<span class='far fa-folder'></span>"
                    icon.classList.add("file_icon");
                    card.setAttribute("onclick", "loadPicker('" + file.id + "')");
                    card.classList.add("folder");
                    filesHolder.appendChild(card);
                    parents[file.id] = folderId;
                    makeSubElement(card, "span", formatDate(file.createdTime), "file_info");
                    makeSubElement(card, "span", formatDate(file.modifiedTime), "file_info");
                } else {
                    card.setAttribute("class", "file");
                    icon.classList.add("file_icon");
                    icon.innerHTML = "<span class='far fa-file-alt'></span>"
                    card.setAttribute("onclick", "openFile('" + file.id + "')");
                    filesHolder.appendChild(card);
                    makeSubElement(card, "span", formatDate(file.createdTime), "file_info");
                    makeSubElement(card, "span", formatDate(file.modifiedTime), "file_info");
                }
            }
        } else {
            // No files found
        }
    });
}
