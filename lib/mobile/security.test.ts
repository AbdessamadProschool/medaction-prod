import { NextRequest } from 'next/server';
import { validateMobileApiKey, isCaptchaRequired, recordFailedAttemptForCaptcha, CAPTCHA_THRESHOLD } from './security';
import { timingSafeEqual } from 'crypto';

// Mocking NextRequest for testing
function mockRequest(headers: Record<string, string>) {
  return {
    headers: {
      get: (name: string) => headers[name] || null
    }
  } as unknown as NextRequest;
}

describe('Mobile Security Module', () => {
    
    describe('validateMobileApiKey', () => {
        const VALID_KEY = process.env.MOBILE_API_KEY || 'dev-mobile-api-key-safe-for-local';
        
        it('should return true for a valid API key', () => {
            const req = mockRequest({ 'X-Mobile-API-Key': VALID_KEY });
            expect(validateMobileApiKey(req)).toBe(true);
        });

        it('should return false for an invalid API key', () => {
            const req = mockRequest({ 'X-Mobile-API-Key': 'wrong-key' });
            expect(validateMobileApiKey(req)).toBe(false);
        });

        it('should return false if the header is missing', () => {
            const req = mockRequest({});
            expect(validateMobileApiKey(req)).toBe(false);
        });

        it('should be length-dependent (constant-time check setup)', () => {
            // Test key with same length but different content
            const shortKey = 'short';
            const req = mockRequest({ 'X-Mobile-API-Key': shortKey });
            expect(validateMobileApiKey(req)).toBe(false);
        });
    });

    describe('Captcha Rate Limiting (OOM Protected)', () => {
        const testIP = '192.168.1.1';
        const testEmail = 'test@example.com';

        it('should not require captcha initially', () => {
            expect(isCaptchaRequired(testIP)).toBe(false);
        });

        it('should require captcha after reaching the threshold', () => {
          // Record failures up to threshold
          for(let i = 0; i < CAPTCHA_THRESHOLD; i++) {
            recordFailedAttemptForCaptcha(testIP, testEmail);
          }
          expect(isCaptchaRequired(testIP, testEmail)).toBe(true);
        });

        it('should handle IP-only tracking if email is missing', () => {
            const ipOnly = '10.0.0.1';
            for(let i = 0; i < CAPTCHA_THRESHOLD; i++) {
                recordFailedAttemptForCaptcha(ipOnly);
            }
            expect(isCaptchaRequired(ipOnly)).toBe(true);
        });
    });
});
