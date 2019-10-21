const net = require("net"); //creates TCP/IP servers & clients
const path = require('path');
const fs = require('fs');

const HTTP_STATUS_CODES = {100:"Continue", 200:"OK", 302:"Found", 404:"Not Found", 500:"Internal Server Error"};
const MIME_TYPES ={jpeg:"image/jpeg",jpg:"image/jpeg",png:"image/png",html:"text/html",css:"text/css",txt:"text/plain"};

const getExtension = function(fileName){
    const fileSplit = fileName.split(".");
    const len = fileSplit.length;
    if (len < 2 || fileSplit[len - 1] === ".") {
        return "";
    }
    return fileSplit[len - 1].toLowerCase();
};

const getMIMEType = function(fileName) {
    const extension = getExtension(fileName);
    const type = MIME_TYPES["" + extension];
    if (type === undefined) {
        return "";
    }
    return type;
};

class Request {
    constructor(s){
        const requestParts = s.split(' ');
        this.method = requestParts[0];
        this.path = requestParts[1];
	}
}

//////// copy

module.exports = {
    HTTP_STATUS_CODES: HTTP_STATUS_CODES,
    MIME_TYPES: MIME_TYPES,
    getExtension: getExtension,
    getMIMEType: getMIMEType,
    Request,
    App,
    Response,
    static: serveStatic,
  };