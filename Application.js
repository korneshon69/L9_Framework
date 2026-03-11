const http = require('http');
const EventEmitter = require('events');

class Application {
    constructor() {
        this.emitter = new EventEmitter();
        this.server = this._createServer();
        this.middlewares = [];
    }

    use(middleware) {
        this.middlewares.push(middleware);
    }

    get(path, handler) { this._addRoute('GET', path, handler); }
    post(path, handler) { this._addRoute('POST', path, handler); }
    put(path, handler) { this._addRoute('PUT', path, handler); }
    patch(path, handler) { this._addRoute('PATCH', path, handler); }
    delete(path, handler) { this._addRoute('DELETE', path, handler); }

    _addRoute(method, path, handler) {
        this.emitter.on(this._getRouteMask(path, method), (req, res) => {
            handler(req, res);
        });
    }

    _getRouteMask(path, method) {
        return `[${path}]:[${method}]`;
    }

    _createServer() {
        return http.createServer((req, res) => {
            let body = "";
            
            req.on('data', (chunk) => {
                body += chunk.toString();
            });

            req.on('end', () => {
                if (body) {
                    try { req.body = JSON.parse(body); } 
                    catch { req.body = body; }
                }

                res.status = (code) => {
                    res.statusCode = code;
                    return res;
                };

                res.send = (data) => {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end(data);
                };

                res.json = (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                };

                const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
                req.query = Object.fromEntries(parsedUrl.searchParams);
                req.params = {}; 
                const pathname = parsedUrl.pathname;

                let index = 0;

                const next = () => {
                    try {
                        if (index < this.middlewares.length) {
                            const middleware = this.middlewares[index++];
                            middleware(req, res, next);
                        } else {
                            const emitted = this.emitter.emit(this._getRouteMask(pathname, req.method), req, res);
                            if (!emitted) {
                                res.status(404).send(`Cannot ${req.method} ${pathname}`);
                            }
                        }
                    } catch (err) {
                        console.error('SERVER ERROR:', err);
                        res.status(500).json({
                            message: "Internal Server Error",
                            error: err.message
                        });
                    }
                };

                next();
            });
        });
    }

    listen(port, callback) {
        this.server.listen(port, callback);
    }
}

module.exports = Application;