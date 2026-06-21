import { extractErrorMessage } from './extract-error.util';

describe('extractErrorMessage', () => {
  it('returns a fallback message for empty or unknown errors', () => {
    expect(extractErrorMessage(null)).toBe('Something went wrong');
    expect(extractErrorMessage('plain failure')).toBe('Something went wrong');
  });

  it('returns a connection message for status 0', () => {
    expect(extractErrorMessage({ status: 0 })).toBe('Cannot connect to server');
  });

  it('prefers nested API error messages', () => {
    expect(
      extractErrorMessage({
        status: 400,
        error: { message: 'Student ID is required' },
      }),
    ).toBe('Student ID is required');
  });

  it('parses stringified API error messages', () => {
    expect(
      extractErrorMessage({
        status: 400,
        error: '{"message":"Access code expired"}',
      }),
    ).toBe('Access code expired');
  });

  it('falls back to status messages when no API message exists', () => {
    expect(extractErrorMessage({ status: 401 })).toBe('Unauthorized access');
    expect(extractErrorMessage({ status: 404 })).toBe('Resource not found');
    expect(extractErrorMessage({ status: 500 })).toBe('Internal server error');
  });
});
