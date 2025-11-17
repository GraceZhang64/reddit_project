/**
 * Response compression middleware using gzip
 * Reduces payload size for faster transmission
 */
import { Request, Response, NextFunction } from 'express';
import * as zlib from 'zlib';

export function compressionMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if client accepts gzip encoding
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    if (!acceptEncoding.includes('gzip')) {
      return next();
    }

    // Only compress JSON responses
    const originalJson = res.json.bind(res);
    
    res.json = function(body: any) {
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
export function selectiveCompressionMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    if (!acceptEncoding.includes('gzip')) {
      return next();
    }

    const originalJson = res.json.bind(res);
    
    res.json = function(body: any) {
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

