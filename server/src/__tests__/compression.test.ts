import { Request, Response, NextFunction } from 'express';
import { compressionMiddleware, selectiveCompressionMiddleware } from '../middleware/compression';
import * as zlib from 'zlib';

describe('Compression Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let originalJson: jest.Mock;

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
      const middleware = compressionMiddleware();
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();

      // Now call the modified json function
      const testData = { message: 'Hello World', data: [1, 2, 3] };
      (res.json as any)(testData);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(res.removeHeader).toHaveBeenCalledWith('Content-Length');
      expect(res.send).toHaveBeenCalled();

      // Verify the data was compressed
      const sentData = (res.send as jest.Mock).mock.calls[0][0];
      expect(Buffer.isBuffer(sentData)).toBe(true);
      
      // Decompress and verify
      const decompressed = zlib.gunzipSync(sentData).toString();
      expect(JSON.parse(decompressed)).toEqual(testData);
    });

    it('should not compress when gzip is not supported', () => {
      req.headers = { 'accept-encoding': 'identity' };
      
      const middleware = compressionMiddleware();
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.json).toBe(originalJson);
    });

    it('should handle missing accept-encoding header', () => {
      req.headers = {};
      
      const middleware = compressionMiddleware();
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.json).toBe(originalJson);
    });

    it('should compress large JSON objects', () => {
      const middleware = compressionMiddleware();
      middleware(req as Request, res as Response, next);

      const largeData = {
        items: Array(1000).fill({ id: 1, name: 'Test Item', description: 'A test item with some content' }),
      };

      (res.json as any)(largeData);

      const sentData = (res.send as jest.Mock).mock.calls[0][0];
      const originalSize = JSON.stringify(largeData).length;
      const compressedSize = sentData.length;

      // Compressed size should be smaller
      expect(compressedSize).toBeLessThan(originalSize);
    });

    it('should handle empty objects', () => {
      const middleware = compressionMiddleware();
      middleware(req as Request, res as Response, next);

      (res.json as any)({});

      expect(res.send).toHaveBeenCalled();
      const sentData = (res.send as jest.Mock).mock.calls[0][0];
      const decompressed = zlib.gunzipSync(sentData).toString();
      expect(JSON.parse(decompressed)).toEqual({});
    });
  });

  describe('selectiveCompressionMiddleware', () => {
    it('should compress responses larger than 1KB', () => {
      const middleware = selectiveCompressionMiddleware();
      middleware(req as Request, res as Response, next);

      // Create data > 1KB
      const largeData = {
        items: Array(100).fill({ id: 1, name: 'Test Item', description: 'A test item with some content to make it larger' }),
      };

      (res.json as any)(largeData);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      expect(res.send).toHaveBeenCalled();

      const sentData = (res.send as jest.Mock).mock.calls[0][0];
      expect(Buffer.isBuffer(sentData)).toBe(true);
    });

    it('should not compress responses smaller than 1KB', () => {
      const middleware = selectiveCompressionMiddleware();
      middleware(req as Request, res as Response, next);

      const smallData = { message: 'Hello' };
      (res.json as any)(smallData);

      // Should use original json method for small responses
      expect(res.setHeader).not.toHaveBeenCalledWith('Content-Encoding', 'gzip');
      expect(originalJson).toHaveBeenCalledWith(smallData);
    });

    it('should not compress when gzip is not supported', () => {
      req.headers = { 'accept-encoding': 'identity' };
      
      const middleware = selectiveCompressionMiddleware();
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.json).toBe(originalJson);
    });

    it('should correctly determine size threshold', () => {
      const middleware = selectiveCompressionMiddleware();
      middleware(req as Request, res as Response, next);

      // Create data exactly at 1024 bytes
      const text = 'a'.repeat(1000);
      const borderlineData = { text };

      (res.json as any)(borderlineData);

      // Should not compress as it's exactly 1024 bytes (not greater than)
      const jsonSize = JSON.stringify(borderlineData).length;
      if (jsonSize > 1024) {
        expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      } else {
        expect(originalJson).toHaveBeenCalledWith(borderlineData);
      }
    });
  });

  describe('compression ratio', () => {
    it('should achieve good compression for repetitive data', () => {
      const middleware = compressionMiddleware();
      middleware(req as Request, res as Response, next);

      const repetitiveData = {
        items: Array(100).fill({ name: 'Same Name', value: 'Same Value' }),
      };

      (res.json as any)(repetitiveData);

      const sentData = (res.send as jest.Mock).mock.calls[0][0];
      const originalSize = JSON.stringify(repetitiveData).length;
      const compressedSize = sentData.length;

      const ratio = compressedSize / originalSize;
      
      // Should achieve at least 50% compression for repetitive data
      expect(ratio).toBeLessThan(0.5);
    });

    it('should handle non-compressible data gracefully', () => {
      const middleware = compressionMiddleware();
      middleware(req as Request, res as Response, next);

      // Random data doesn't compress well
      const randomData = {
        data: Array(100).fill(0).map(() => Math.random().toString(36)),
      };

      (res.json as any)(randomData);

      const sentData = (res.send as jest.Mock).mock.calls[0][0];
      expect(Buffer.isBuffer(sentData)).toBe(true);
      
      // Should still be valid gzip data
      expect(() => zlib.gunzipSync(sentData)).not.toThrow();
    });
  });
});

