"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressionMiddleware = compressionMiddleware;
exports.selectiveCompressionMiddleware = selectiveCompressionMiddleware;
const zlib = __importStar(require("zlib"));
function compressionMiddleware() {
    return (req, res, next) => {
        // Check if client accepts gzip encoding
        const acceptEncoding = req.headers['accept-encoding'] || '';
        if (!acceptEncoding.includes('gzip')) {
            return next();
        }
        // Only compress JSON responses
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            // Set compression headers
            res.setHeader('Content-Encoding', 'gzip');
            res.removeHeader('Content-Length'); // Will be recalculated
            // Compress the JSON
            const jsonString = JSON.stringify(body);
            const compressed = zlib.gzipSync(jsonString);
            // Send compressed response
            res.setHeader('Content-Type', 'application/json');
            return res.send(compressed);
        };
        next();
    };
}
/**
 * Simple compression for large responses only (> 1KB)
 */
function selectiveCompressionMiddleware() {
    return (req, res, next) => {
        const acceptEncoding = req.headers['accept-encoding'] || '';
        if (!acceptEncoding.includes('gzip')) {
            return next();
        }
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            const jsonString = JSON.stringify(body);
            // Only compress if response is larger than 1KB
            if (jsonString.length > 1024) {
                res.setHeader('Content-Encoding', 'gzip');
                res.removeHeader('Content-Length');
                const compressed = zlib.gzipSync(jsonString);
                res.setHeader('Content-Type', 'application/json');
                return res.send(compressed);
            }
            // Send uncompressed for small responses
            return originalJson(body);
        };
        next();
    };
}
