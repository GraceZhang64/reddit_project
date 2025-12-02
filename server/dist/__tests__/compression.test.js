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
const compression_1 = require("../middleware/compression");
const zlib = __importStar(require("zlib"));
describe('Compression Middleware', () => {
    let req;
    let res;
    let next;
    let originalJson;
    beforeEach(() => {
        originalJson = jest.fn();
        req = {
            headers: {
                'accept-encoding': 'gzip',
            },
        };
        res = {
            json: originalJson,
            setHeader: jest.fn(),
            removeHeader: jest.fn(),
            send: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });
    describe('compressionMiddleware', () => {
        it('should compress JSON responses when gzip is supported', () => {
            const middleware = (0, compression_1.compressionMiddleware)();
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            // Now call the modified json function
            const testData = { message: 'Hello World', data: [1, 2, 3] };
            res.json(testData);
            expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
            expect(res.removeHeader).toHaveBeenCalledWith('Content-Length');
            expect(res.send).toHaveBeenCalled();
            // Verify the data was compressed
            const sentData = res.send.mock.calls[0][0];
            expect(Buffer.isBuffer(sentData)).toBe(true);
            // Decompress and verify
            const decompressed = zlib.gunzipSync(sentData).toString();
            expect(JSON.parse(decompressed)).toEqual(testData);
        });
        it('should not compress when gzip is not supported', () => {
            req.headers = { 'accept-encoding': 'identity' };
            const middleware = (0, compression_1.compressionMiddleware)();
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.json).toBe(originalJson);
        });
        it('should handle missing accept-encoding header', () => {
            req.headers = {};
            const middleware = (0, compression_1.compressionMiddleware)();
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.json).toBe(originalJson);
        });
        it('should compress large JSON objects', () => {
            const middleware = (0, compression_1.compressionMiddleware)();
            middleware(req, res, next);
            const largeData = {
                items: Array(1000).fill({ id: 1, name: 'Test Item', description: 'A test item with some content' }),
            };
            res.json(largeData);
            const sentData = res.send.mock.calls[0][0];
            const originalSize = JSON.stringify(largeData).length;
            const compressedSize = sentData.length;
            // Compressed size should be smaller
            expect(compressedSize).toBeLessThan(originalSize);
        });
        it('should handle empty objects', () => {
            const middleware = (0, compression_1.compressionMiddleware)();
            middleware(req, res, next);
            res.json({});
            expect(res.send).toHaveBeenCalled();
            const sentData = res.send.mock.calls[0][0];
            const decompressed = zlib.gunzipSync(sentData).toString();
            expect(JSON.parse(decompressed)).toEqual({});
        });
    });
    describe('selectiveCompressionMiddleware', () => {
        it('should compress responses larger than 1KB', () => {
            const middleware = (0, compression_1.selectiveCompressionMiddleware)();
            middleware(req, res, next);
            // Create data > 1KB
            const largeData = {
                items: Array(100).fill({ id: 1, name: 'Test Item', description: 'A test item with some content to make it larger' }),
            };
            res.json(largeData);
            expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
            expect(res.send).toHaveBeenCalled();
            const sentData = res.send.mock.calls[0][0];
            expect(Buffer.isBuffer(sentData)).toBe(true);
        });
        it('should not compress responses smaller than 1KB', () => {
            const middleware = (0, compression_1.selectiveCompressionMiddleware)();
            middleware(req, res, next);
            const smallData = { message: 'Hello' };
            res.json(smallData);
            // Should use original json method for small responses
            expect(res.setHeader).not.toHaveBeenCalledWith('Content-Encoding', 'gzip');
            expect(originalJson).toHaveBeenCalledWith(smallData);
        });
        it('should not compress when gzip is not supported', () => {
            req.headers = { 'accept-encoding': 'identity' };
            const middleware = (0, compression_1.selectiveCompressionMiddleware)();
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.json).toBe(originalJson);
        });
        it('should correctly determine size threshold', () => {
            const middleware = (0, compression_1.selectiveCompressionMiddleware)();
            middleware(req, res, next);
            // Create data exactly at 1024 bytes
            const text = 'a'.repeat(1000);
            const borderlineData = { text };
            res.json(borderlineData);
            // Should not compress as it's exactly 1024 bytes (not greater than)
            const jsonSize = JSON.stringify(borderlineData).length;
            if (jsonSize > 1024) {
                expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
            }
            else {
                expect(originalJson).toHaveBeenCalledWith(borderlineData);
            }
        });
    });
    describe('compression ratio', () => {
        it('should achieve good compression for repetitive data', () => {
            const middleware = (0, compression_1.compressionMiddleware)();
            middleware(req, res, next);
            const repetitiveData = {
                items: Array(100).fill({ name: 'Same Name', value: 'Same Value' }),
            };
            res.json(repetitiveData);
            const sentData = res.send.mock.calls[0][0];
            const originalSize = JSON.stringify(repetitiveData).length;
            const compressedSize = sentData.length;
            const ratio = compressedSize / originalSize;
            // Should achieve at least 50% compression for repetitive data
            expect(ratio).toBeLessThan(0.5);
        });
        it('should handle non-compressible data gracefully', () => {
            const middleware = (0, compression_1.compressionMiddleware)();
            middleware(req, res, next);
            // Random data doesn't compress well
            const randomData = {
                data: Array(100).fill(0).map(() => Math.random().toString(36)),
            };
            res.json(randomData);
            const sentData = res.send.mock.calls[0][0];
            expect(Buffer.isBuffer(sentData)).toBe(true);
            // Should still be valid gzip data
            expect(() => zlib.gunzipSync(sentData)).not.toThrow();
        });
    });
});
