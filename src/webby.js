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

class Response {
    constructor(socket, statusCode, version) {
        this.sock = socket;
        this.headers = {};
        this.body = null;
        if (version === undefined) {
            this.version = "HTTP/1.1";
        }
        else {
            this.version = version;
        }
        if (statusCode === undefined) {
            this.statusCode = 200;
        }
        else {
            this.statusCode = statusCode;
        }
    }

    set(name, value) {
        this.headers[name] = value;
    }

    end() {
        this.sock.end();
    }

    statusLineToString() {
        let resString = "";
        resString += this.version;
        resString += " ";
        resString += this.statusCode;
        resString += " ";
        resString += HTTP_STATUS_CODES[this.statusCode];
        resString += "\r\n";
        return resString;
    }

    headersToString() {
        let headerString = "";
        for (const key in this.headers) {
            headerString += key;
            headerString += ": ";
            headerString += this.headers[key];
            headerString += "\r\n";
        }
        return headerString;
    }

    status(statusCode) {
        this.statusCode = statusCode;
        return this;
    }

    send(body) {
        this.body = body;
        let s = '';
        let statusLine;
        let contentTypes;
        if (Object.prototype.hasOwnProperty.call(this.headers, 'Content-Type')) {
           statusLine = this.statusLineToString();
           contentTypes = this.headersToString();
        }
        else {
           this.headers['Content-Type'] = 'text/html';
           statusLine = this.statusLineToString();
           contentTypes = this.headersToString();
        }
        s = `${statusLine}`;
        s += `${contentTypes}\r\n`;
        this.sock.write(s);
        this.sock.write(body);
        this.sock.end();
    }
}

class App {
    constructor() { // creates App object (web server & web application running on that server)
        this.server = net.createServer((sock) => {
            this.handleConnection(sock);
        }); //use handleConnection as the argument to the net module's createServer so that it's called when a client connects
        this.routes = {};
        this.middleware = null;
    }

    normalizePath(path) { //path for http://foo.bar/baz/qux is /baz/qux
        let normalPath = "";
        let idx = 0;
        while (idx <= path.length - 1) {
            const curr = path.charAt(idx);
            if (idx < path.length - 1) {
                const nxt = path.charAt(idx + 1);
                if ((curr === "/" && /^[a-zA-Z()]+$/.test(nxt)) || /^[a-zA-Z()]+$/.test(curr)) {
                    normalPath += curr;
                    idx++;
                }
                else { // not "/A" or "A" --> special character
                    break;
                }
            }
            else {
                if (/^[a-zA-Z()]+$/.test(curr)) {
                    normalPath += curr;
                }
                idx++;
            }
        }
        return normalPath.toLowerCase();
    }

    createRouteKey(method, path) { //method (get/post) + " " + normalizePath(path)
        const routeKey = method.toUpperCase() + " " + this.normalizePath(path);
        return routeKey;
    }

    get(path, cb) {
		this.routes[this.createRouteKey("GET", path)] = cb;
    }

    use(cb) {
        this.middleware = cb;
    }

    listen(port, host) {
        this.server.listen(port, host);
    }

    handleConnection(sock) {
        sock.on("data", binaryData => { //"data" = read data....// binaryData = buffer object 
            //(you can call toString on a Buffer object which assumes utf-8)
            this.handleRequest(sock, binaryData);
        });
    }

    handleRequest(sock, binaryData) { // called when socket receives data from the client
        //this is where your app will create Request and Response objects and 
        //determine whether or not it should call the middleware function
        //req: (built from binaryData) that represents the incoming request 
        //res
        //middleware function: if it's been set (not null)
        const reqString = binaryData + "";
        const req = new Request(reqString);
        const res = new Response(sock);
        if (this.middleware !== null) {
            this.middleware(req,res, () => {
                this.processRoutes(req,res);
            });
        }
        else { //calls route handling function that matches key if middleware is not set
            this.processRoutes(req,res);
        }
    }

    processRoutes(req,res){ // http request and response
        const method = req.method;
        const path = req.path;
        const routeKey = this.createRouteKey(method,path);
        
        if (Object.prototype.hasOwnProperty.call(this.routes, routeKey)) {
			this.routes[routeKey](req, res);
		}
		else{
            let res2;
            res2 = new Response(res.sock,404);
		}
	}
}


const serveStatic = function(basePath){
    return (req, res, next) => {
        const fn = path.join(basePath, req.path.replace(/\\/g, "/")).replace(/\\/g, "/");
        console.log(fn);
        fs.readFile(fn, (err, data) => {
            if (err) {
                next();
            }
            else {
                console.log("FOUND IT", err);
                res.set('Content-Type', this.getMIMEType(this.getExtension(fn)));
                res.send(data);
            }
            // next();
        });
    };
};

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