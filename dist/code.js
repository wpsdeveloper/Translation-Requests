"use strict";
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
    const user = getUser(activeUserEmail);
    console.log('Active user email:', activeUserEmail);
    console.log('User object:', user);
    if (!user) {
        return HtmlService.createHtmlOutputFromFile('forbidden')
            .setTitle('Access Denied')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    return HtmlService.createHtmlOutputFromFile('index');
}
function getDataFromServer() {
    const activeUserEmail = Session.getActiveUser().getEmail();
    const user = getUser(activeUserEmail);
    if (!user) {
        throw new Error('Unauthorized');
    }
    const data = getDataFromAppSheet(user);
    return {
        requests: data.requests,
        schools: data.schools,
        user: {
            role: user.role,
            email: user.email,
            schools: user.schools,
            name: user.name
        }
    };
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
