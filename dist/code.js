"use strict";
/**
 * code.gs: The main entry point for the Google Apps Script Web App.
 * Contains the 'doGet' hook and the exposed functions for the client.
 */
/**
 * doGet: Standard GAS hook that serves the HTML interface.
 * We perform an early authorization check here to prevent unauthorized
 * domain users from even loading the application shell.
 */
function doGet() {
    const activeUserEmail = Session.getActiveUser().getEmail();
    // Check domain restriction
    const isAuthorizedDomain = activeUserEmail.toLowerCase().endsWith('@walpole.k12.ma.us');
    if (!isAuthorizedDomain) {
        console.warn('Unauthorized domain access attempt:', activeUserEmail);
        return HtmlService.createHtmlOutputFromFile('forbidden')
            .setTitle('Access Denied')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    return HtmlService.createHtmlOutputFromFile('index');
}
function getDataFromServer() {
    const activeUserEmail = Session.getActiveUser().getEmail();
    let user = getUser(activeUserEmail);
    if (!user) {
        // If domain is authorized but user not in DB, treat as Guest
        user = {
            email: activeUserEmail,
            name: activeUserEmail.split('@')[0],
            role: 'Guest',
            schools: [],
        };
    }
    const data = getDataFromAppSheet(user);
    return {
        requests: data.requests,
        schools: data.schools,
        user: {
            role: user.role,
            email: user.email,
            schools: user.schools,
            name: user.name,
        },
    };
}
function addRequest(requestData) {
    return addRequestToServer(requestData);
}
function saveRequest(requestData) {
    return saveDataToServer(requestData);
}
function uploadFile(base64Data, fileName, mimeType) {
    return uploadFileToDrive(base64Data, fileName, mimeType);
}
function getUsersData() {
    const activeUserEmail = Session.getActiveUser().getEmail();
    const user = getUser(activeUserEmail);
    if (!user || user.role !== 'Admin') {
        throw new Error('Unauthorized: Admin access required.');
    }
    return getUsers();
}
function saveUser(userData, action) {
    const activeUserEmail = Session.getActiveUser().getEmail();
    const user = getUser(activeUserEmail);
    if (!user || user.role !== 'Admin') {
        throw new Error('Unauthorized: Admin access required.');
    }
    return saveUserToAppSheet(userData, action);
}
