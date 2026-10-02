import { describe, it, expect } from 'vitest';
import { renderMarkdownHtml, renderSimpleMarkdown, MarkdownContent } from '@/components/ui/MarkdownEditor';

describe('Markdown Processing & Rendering Tests', () => {
  it('should render headings into h1, h2, h3, h4, h5, h6 HTML elements', () => {
    const md = '# Main Architecture\n## Subsystem\n### Detail Component\n#### Fourth Level\n##### Fifth Level\n###### Sixth Level';
    const html = renderMarkdownHtml(md);
    expect(html).toContain('<h1>Main Architecture</h1>');
    expect(html).toContain('<h2>Subsystem</h2>');
    expect(html).toContain('<h3>Detail Component</h3>');
    expect(html).toContain('<h4>Fourth Level</h4>');
    expect(html).toContain('<h5>Fifth Level</h5>');
    expect(html).toContain('<h6>Sixth Level</h6>');
  });

  it('should render bold, italic, and strikethrough typography', () => {
    const md = 'This has **bold words**, *italic emphasis*, and ~~strikethrough~~.';
    const html = renderMarkdownHtml(md);
    expect(html).toContain('<strong>bold words</strong>');
    expect(html).toContain('<em>italic emphasis</em>');
    expect(html).toContain('<del>strikethrough</del>');
  });

  it('should render unordered bullet and ordered numbered lists properly', () => {
    const md = '- Item Alpha\n- Item Beta\n\n1. First Step\n2. Second Step';
    const html = renderMarkdownHtml(md);
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Item Alpha</li>');
    expect(html).toContain('<li>Item Beta</li>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>First Step</li>');
    expect(html).toContain('<li>Second Step</li>');
  });

  it('should render task lists with checkboxes', () => {
    const md = '- [x] Completed milestone\n- [ ] Upcoming task';
    const html = renderMarkdownHtml(md);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('Completed milestone');
    expect(html).toContain('Upcoming task');
  });

  it('should render inline code and fenced code blocks with language indicators', () => {
    const md = 'Use `const x = 1;` in logic.\n\n```typescript\nfunction test() {\n  return true;\n}\n```';
    const html = renderMarkdownHtml(md);
    expect(html).toContain('<code>const x = 1;</code>');
    expect(html).toContain('<pre><code');
    expect(html).toContain('language-typescript');
    expect(html).toContain('function test()');
  });

  it('should render blockquotes and hyperlinks with proper attributes', () => {
    const md = '> Engineered for 99.99% uptime\n\nRead more at [Documentation](https://docs.example.com).';
    const html = renderMarkdownHtml(md);
    expect(html).toContain('<blockquote>');
    expect(html).toContain('Engineered for 99.99% uptime');
    expect(html).toContain('<a href="https://docs.example.com"');
    expect(html).toContain('Documentation</a>');
  });

  it('should render markdown tables with columns and data cells', () => {
    const md = '| Service | Turnaround | Tier |\n| :--- | :---: | ---: |\n| Web App | 2 Weeks | Enterprise |\n| API Gateway | 1 Week | Growth |';
    const html = renderMarkdownHtml(md);
    expect(html).toContain('<table');
    expect(html).toContain('Service');
    expect(html).toContain('Turnaround');
    expect(html).toContain('Web App');
    expect(html).toContain('2 Weeks');
    expect(html).toContain('API Gateway');
  });

  it('should render horizontal rules and line breaks', () => {
    const md = 'Paragraph One\n\n---\n\nParagraph Two';
    const html = renderMarkdownHtml(md);
    expect(html).toContain('<hr>');
    expect(html).toContain('Paragraph One');
    expect(html).toContain('Paragraph Two');
  });

  it('should render markdown images', () => {
    const md = '![Architecture Diagram](https://example.com/diagram.png)';
    const html = renderMarkdownHtml(md);
    expect(html).toContain('<img');
    expect(html).toContain('src="https://example.com/diagram.png"');
    expect(html).toContain('alt="Architecture Diagram"');
  });

  it('should sanitize dangerous HTML tags against XSS vulnerabilities', () => {
    const malicious = '<script>alert("xss")</script>\n\n<img src="x" onerror="alert(1)" />\n\n<a href="javascript:alert(1)">Click</a>\n\n**Valid Content**';
    const html = renderMarkdownHtml(malicious);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('<strong>Valid Content</strong>');
  });

  it('should gracefully handle empty, null, undefined, or whitespace inputs without errors', () => {
    expect(renderMarkdownHtml('')).toBe('');
    expect(renderMarkdownHtml('   \n\t  ')).toBe('');
    // @ts-expect-error test non-string inputs
    expect(renderMarkdownHtml(null)).toBe('');
    // @ts-expect-error test non-string inputs
    expect(renderMarkdownHtml(undefined)).toBe('');
    // @ts-expect-error test non-string inputs
    expect(renderMarkdownHtml(12345)).toBe('');
  });

  it('should export renderSimpleMarkdown and MarkdownContent components for universal usage', () => {
    expect(typeof renderSimpleMarkdown).toBe('function');
    expect(typeof MarkdownContent).toBe('function');

    const simpleResult = renderSimpleMarkdown('# Specifications');
    expect(simpleResult).toBeDefined();
  });
});
