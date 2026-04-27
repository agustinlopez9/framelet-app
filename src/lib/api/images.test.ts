import { describe, expect, it } from 'vitest';
import { UploadValidationError, validateFile, MAX_IMAGE_BYTES } from './images';

function makeFile(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('validateFile', () => {
  it('accepts a valid JPEG', () => {
    expect(() => validateFile(makeFile('a.jpg', 'image/jpeg', 1024))).not.toThrow();
  });
  it('accepts a valid PNG', () => {
    expect(() => validateFile(makeFile('a.png', 'image/png', 1024))).not.toThrow();
  });
  it('accepts a valid WebP', () => {
    expect(() => validateFile(makeFile('a.webp', 'image/webp', 1024))).not.toThrow();
  });
  it('rejects unsupported types', () => {
    expect(() => validateFile(makeFile('a.gif', 'image/gif', 1024))).toThrow(UploadValidationError);
  });
  it('rejects files over 10MB', () => {
    expect(() => validateFile(makeFile('a.jpg', 'image/jpeg', MAX_IMAGE_BYTES + 1))).toThrow(
      UploadValidationError,
    );
  });
});
