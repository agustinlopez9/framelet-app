import { describe, expect, it } from 'vitest';
import {
  UploadValidationError,
  validateFile,
  MAX_IMAGE_BYTES,
  deriveTitleFromFilename,
} from './images';

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

describe('deriveTitleFromFilename', () => {
  it('strips a single trailing extension', () => {
    expect(deriveTitleFromFilename('photo.jpg')).toBe('photo');
    expect(deriveTitleFromFilename('photo.JPEG')).toBe('photo');
  });

  it('replaces underscores and dashes with spaces', () => {
    expect(deriveTitleFromFilename('red_ferrari-2024.JPG')).toBe('red ferrari 2024');
  });

  it('collapses runs of whitespace and trims', () => {
    expect(deriveTitleFromFilename('  spaced   out  .png')).toBe('spaced out');
  });

  it('keeps a name with no extension as-is (sanitised)', () => {
    expect(deriveTitleFromFilename('untitled')).toBe('untitled');
  });

  it('handles dotfile-style names (no extension to strip)', () => {
    expect(deriveTitleFromFilename('.hidden')).toBe('.hidden');
  });
});
