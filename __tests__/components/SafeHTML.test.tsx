import { render, screen } from '@testing-library/react';
import { SafeHTML } from '@/components/ui/SafeHTML';
import '@testing-library/jest-dom';

describe('SafeHTML Component', () => {
  it('renders clean HTML without sanitization', () => {
    const html = '<strong>Hello World</strong>';
    render(<SafeHTML html={html} />);
    const strongElement = screen.getByText('Hello World');
    expect(strongElement.tagName).toBe('STRONG');
  });

  it('sanitizes malicious script tags (XSS protection)', () => {
    const maliciousHtml = '<script>alert("xss")</script><p>Safe Content</p>';
    const { container } = render(<SafeHTML html={maliciousHtml} />);
    expect(container.innerHTML).not.toContain('<script>');
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  it('sanitizes malicious attributes', () => {
    const maliciousHtml = '<img src="x" onerror="alert(\'xss\')" /><span>Text</span>';
    const { container } = render(<SafeHTML html={maliciousHtml} />);
    expect(container.innerHTML).not.toContain('onerror');
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('applies custom classNames', () => {
    render(<SafeHTML html="<p>Test</p>" className="custom-class" />);
    const div = screen.getByText('Test').parentElement;
    expect(div).toHaveClass('custom-class');
  });

  it('uses a custom HTML tag when provided', () => {
    render(<SafeHTML html="Test Custom Tag" tag="section" />);
    const section = screen.getByText('Test Custom Tag', { selector: 'section' });
    expect(section).toBeInTheDocument();
    expect(section.tagName).toBe('SECTION');
  });
});
