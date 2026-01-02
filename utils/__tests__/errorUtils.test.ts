import { isTechnicalError, sanitizeErrorMessage, getActionErrorMessage } from '../errorUtils';

describe('errorUtils', () => {
  describe('isTechnicalError', () => {
    it('should identify technical error messages', () => {
      expect(isTechnicalError('Error: Something went wrong')).toBe(true);
      expect(isTechnicalError('TypeError: Cannot read property')).toBe(true);
      expect(isTechnicalError('Failed to fetch')).toBe(true);
      expect(isTechnicalError('CORS error')).toBe(true);
      expect(isTechnicalError('at Object.fetch')).toBe(true);
    });

    it('should not identify user-friendly messages as technical', () => {
      expect(isTechnicalError('Invalid email or password')).toBe(false);
      expect(isTechnicalError('Please try again later')).toBe(false);
      expect(isTechnicalError('Your session has expired')).toBe(false);
    });

    it('should handle empty or null messages', () => {
      expect(isTechnicalError('')).toBe(false);
      expect(isTechnicalError(null as any)).toBe(false);
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should handle 401 errors with appropriate message', () => {
      const error = {
        response: { status: 401 }
      };
      const message = sanitizeErrorMessage(error, { action: 'fetch data' });
      expect(message).toContain('session');
    });

    it('should handle 404 errors', () => {
      const error = {
        response: { status: 404 }
      };
      const message = sanitizeErrorMessage(error);
      expect(message).toContain('not found');
    });

    it('should handle 500 errors', () => {
      const error = {
        response: { status: 500 }
      };
      const message = sanitizeErrorMessage(error);
      expect(message).toContain('Server error');
    });

    it('should handle network errors', () => {
      const error = {
        message: 'Failed to fetch',
        isNetworkError: true
      };
      const message = sanitizeErrorMessage(error);
      expect(message).toContain('connect');
    });

    it('should use backend message if user-friendly', () => {
      const error = {
        response: {
          data: {
            message: 'This offer is no longer available'
          }
        }
      };
      const message = sanitizeErrorMessage(error);
      expect(message).toBe('This offer is no longer available');
    });

    it('should filter out technical backend messages', () => {
      const error = {
        response: {
          data: {
            message: 'Error: TypeError at line 42'
          }
        }
      };
      const message = sanitizeErrorMessage(error, { action: 'save data' });
      expect(message).not.toContain('TypeError');
      expect(message).toContain('save data');
    });

    it('should use default message when provided', () => {
      const error = { 
        message: 'Error: Technical error at line 42' // Technical error that will be filtered
      };
      const message = sanitizeErrorMessage(error, { 
        defaultMessage: 'Custom default message' 
      });
      expect(message).toBe('Custom default message');
    });

    it('should handle auth action errors specifically', () => {
      const error = {
        response: { status: 401 }
      };
      const message = sanitizeErrorMessage(error, { action: 'sign in' });
      expect(message).toContain('email or password');
    });
  });

  describe('getActionErrorMessage', () => {
    it('should return appropriate message for fetch action', () => {
      const message = getActionErrorMessage('fetch', 'offers');
      expect(message).toContain('load');
      expect(message).toContain('offers');
    });

    it('should return appropriate message for create action', () => {
      const message = getActionErrorMessage('create', 'offer');
      expect(message).toContain('create');
      expect(message).toContain('offer');
    });

    it('should return appropriate message for update action', () => {
      const message = getActionErrorMessage('update', 'profile');
      expect(message).toContain('update');
      expect(message).toContain('profile');
    });

    it('should return appropriate message for delete action', () => {
      const message = getActionErrorMessage('delete', 'item');
      expect(message).toContain('delete');
      expect(message).toContain('item');
    });

    it('should return appropriate message for order action', () => {
      const message = getActionErrorMessage('order', 'food');
      expect(message).toContain('order');
    });
  });
});

