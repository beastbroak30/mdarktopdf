'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';

const defaultMarkdown = `# Welcome to MDark! 🌙

A **free** and **simple** Markdown to PDF converter.

## Features

- ✨ Real-time preview
- 📄 Export to PDF
- 🎨 Beautiful dark theme
- 💚 Pastel green aesthetics

## How to Use

1. Type your markdown in the left panel
2. See the preview update in real-time
3. Click "Download PDF" when ready

### Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');
\`\`\`

### Lists

**Unordered:**
- Item 1
- Item 2
- Item 3

**Ordered:**
1. First
2. Second
3. Third

### Blockquote

> "The best way to predict the future is to invent it."
> - Alan Kay

### Table

| Feature | Status |
|---------|--------|
| Preview | ✅ |
| PDF Export | ✅ |
| Dark Theme | ✅ |

---

**Try editing this markdown or write your own!**
`;

const FONT_OPTIONS = [
  { name: 'Sans-serif', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Nunito', value: 'Nunito, sans-serif' },
];

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value);
  const [showHelp, setShowHelp] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [pdfDarkMode, setPdfDarkMode] = useState(false);
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  // Check system preference and load usage count on mount
  useEffect(() => {
    // Check system preference for dark mode
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);

      // Load usage count from localStorage
      const stored = localStorage.getItem('mdark-usage-count');
      const count = stored ? parseInt(stored, 10) : 0;
      setUsageCount(count);
    }
  }, []);

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Increment usage count
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mdark-usage-count', newCount.toString());
      }

      // Create a clone of the preview element for PDF generation
      const element = previewRef.current.cloneNode(true) as HTMLElement;
      
      // Apply PDF styling based on user selection
      if (pdfDarkMode) {
        // Dark mode PDF: black background with white text
        element.style.backgroundColor = '#000000';
        element.style.color = '#ffffff';
      } else {
        // Light mode PDF: white background with black text (default)
        element.style.backgroundColor = '#ffffff';
        element.style.color = '#000000';
      }
      element.style.padding = '40px';
      
      // Override all text colors
      const allElements = element.querySelectorAll('*');
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.color = pdfDarkMode ? '#ffffff' : '#000000';
        
        // Update borders to grey
        if (htmlEl.style.borderColor) {
          htmlEl.style.borderColor = '#999999';
        }
        
        // Update table borders
        if (htmlEl.tagName === 'TH' || htmlEl.tagName === 'TD') {
          htmlEl.style.borderColor = '#999999';
        }
        
        // Update blockquote border
        if (htmlEl.tagName === 'BLOCKQUOTE') {
          htmlEl.style.borderLeftColor = '#999999';
        }
        
        // Update code blocks
        if (htmlEl.tagName === 'CODE' || htmlEl.tagName === 'PRE') {
          if (pdfDarkMode) {
            htmlEl.style.backgroundColor = '#2d2d2d';
            htmlEl.style.color = '#ffffff';
          } else {
            htmlEl.style.backgroundColor = '#f5f5f5';
            htmlEl.style.color = '#000000';
          }
        }
      });
      
      // Temporarily append to document for rendering
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.width = previewRef.current.offsetWidth + 'px';
      document.body.appendChild(element);
      
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: pdfDarkMode ? '#000000' : '#ffffff',
        logging: false,
        useCORS: true,
      });
      
      // Remove the temporary element
      document.body.removeChild(element);

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      // Add image to PDF
      pdf.addImage(
        imgData,
        'PNG',
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      // Save PDF
      pdf.save('markdown-document.pdf');
      setShowPdfOptions(false);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-[#0a1f1a] via-[#0a0a0a] to-[#1a3a2e]' 
        : 'bg-gradient-to-br from-[#e8f5e9] via-[#f1f8f4] to-[#c8e6c9]'
    }`}>
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`border-b backdrop-blur-sm sticky top-0 z-10 ${
          darkMode 
            ? 'border-[#2d5a45] bg-[#0a0a0a]/80' 
            : 'border-[#a8d5ba] bg-white/80'
        }`}
      >
        <div className="container mx-auto px-3 py-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <h1 className={`text-2xl font-bold ${darkMode ? 'gradient-text' : 'text-[#1a3a2e]'}`}>
              MDark
            </h1>
            <div className={`text-xs px-3 py-1 rounded-full ${
              darkMode 
                ? 'bg-[#1a3a2e] text-[#a8d5ba]' 
                : 'bg-[#a8d5ba] text-[#1a3a2e]'
            }`}>
              👥 {usageCount.toLocaleString()} users
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className={`px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${
                darkMode
                  ? 'bg-[#1a3a2e] text-[#a8d5ba] border-[#2d5a45] focus:ring-[#3a7356]'
                  : 'bg-white text-[#1a3a2e] border-[#a8d5ba] focus:ring-[#a8d5ba]'
              }`}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.name} value={font.value}>
                  {font.name}
                </option>
              ))}
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-1.5 text-sm rounded-lg font-semibold transition-all shadow-lg ${
                darkMode
                  ? 'bg-gradient-to-r from-[#2d5a45] to-[#3a7356] text-[#c5e8c1] hover:from-[#3a7356] hover:to-[#4a8b67]'
                  : 'bg-gradient-to-r from-[#a8d5ba] to-[#81c784] text-[#1a3a2e] hover:from-[#81c784] hover:to-[#66bb6a]'
              }`}
              title="Toggle theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHelp(true)}
              className={`px-4 py-1.5 text-sm rounded-lg font-semibold transition-all shadow-lg ${
                darkMode
                  ? 'bg-gradient-to-r from-[#2d5a45] to-[#3a7356] text-[#c5e8c1] hover:from-[#3a7356] hover:to-[#4a8b67]'
                  : 'bg-gradient-to-r from-[#a8d5ba] to-[#81c784] text-[#1a3a2e] hover:from-[#81c784] hover:to-[#66bb6a]'
              }`}
            >
              📋 Help
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPdfOptions(true)}
              disabled={isGenerating}
              className={`px-4 py-1.5 text-sm rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode
                  ? 'bg-gradient-to-r from-[#2d5a45] to-[#3a7356] text-[#c5e8c1] hover:from-[#3a7356] hover:to-[#4a8b67]'
                  : 'bg-gradient-to-r from-[#a8d5ba] to-[#81c784] text-[#1a3a2e] hover:from-[#81c784] hover:to-[#66bb6a]'
              }`}
            >
              📄 PDF
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-3 py-4">
        {/* Error Notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-3 bg-red-900/50 border border-red-700 rounded-md p-3 flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <p className="text-red-200">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-200 hover:text-white transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[calc(100vh-100px)]"
        >
          {/* Editor Panel */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col"
          >
            <div className="bg-[#1a1a1a]/90 rounded-2xl border border-[#2d5a45]/50 overflow-hidden shadow-2xl flex flex-col h-full">
              <div className="bg-gradient-to-r from-[#1a3a2e] to-[#2d5a45] px-3 py-2 border-b border-[#2d5a45]/30 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#a8d5ba]">
                  ✏️ Editor
                </h2>
                <a
                  href="https://github.com/beastbroak30"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#2d5a45] to-[#3a7356] text-[#c5e8c1] rounded-lg text-xs font-medium hover:from-[#3a7356] hover:to-[#4a8b67] transition-all shadow-sm"
                >
                  Made with ❤️ by beastbroak30
                </a>
              </div>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                style={{ fontFamily: selectedFont }}
                className="flex-1 w-full p-3 bg-transparent text-[#ededed] resize-none focus:outline-none text-sm"
                placeholder="Type your markdown here..."
                spellCheck={false}
              />
            </div>
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col"
          >
            <div className="bg-[#1a1a1a]/90 rounded-2xl border border-[#2d5a45]/50 overflow-hidden shadow-2xl flex flex-col h-full">
              <div className="bg-gradient-to-r from-[#1a3a2e] to-[#2d5a45] px-3 py-2 border-b border-[#2d5a45]/30">
                <h2 className="text-base font-semibold text-[#a8d5ba]">
                  👁️ Preview
                </h2>
              </div>
              <div
                ref={previewRef}
                style={{ fontFamily: selectedFont }}
                className="flex-1 p-4 overflow-auto markdown-preview text-[#ededed] bg-[#0a0a0a] text-sm"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    code({ inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="border-t border-[#2d5a45] bg-[#0a0a0a]/80 backdrop-blur-sm mt-4"
      >
        <div className="container mx-auto px-3 py-2 text-center">
          <a
            href="https://github.com/beastbroak30"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#a8d5ba] text-xs hover:text-[#c5e8c1] transition-colors"
          >
            Made with ❤️ by beastbroak30
          </a>
        </div>
      </motion.footer>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-gradient-to-br from-[#c5e8c1] to-[#b4d4d3] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#a8d5ba] to-[#b4d4d3] px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-[#0a1f1a]">📋 Markdown Help</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-[#0a1f1a] hover:text-[#1a3a2e] text-3xl font-bold transition-colors leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] text-[#0a1f1a]">
                {/* Headers Section */}
                <div className="mb-6 bg-white/50 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-[#1a3a2e]">📋 Headers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold mb-2 text-[#2d5a45]">Markdown</p>
                      <pre className="bg-white/70 rounded-lg p-3 text-sm overflow-x-auto">
{`# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6`}
                      </pre>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-[#2d5a45]">Result</p>
                      <div className="bg-white/70 rounded-lg p-3 text-sm space-y-1">
                        <h1 className="text-2xl font-bold">Heading 1</h1>
                        <h2 className="text-xl font-bold">Heading 2</h2>
                        <h3 className="text-lg font-bold">Heading 3</h3>
                        <h4 className="text-base font-bold">Heading 4</h4>
                        <h5 className="text-sm font-bold">Heading 5</h5>
                        <h6 className="text-xs font-bold">Heading 6</h6>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Formatting Section */}
                <div className="mb-6 bg-white/50 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-[#1a3a2e]">✨ Text Formatting</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold mb-2 text-[#2d5a45]">Markdown</p>
                      <pre className="bg-white/70 rounded-lg p-3 text-sm overflow-x-auto">
{`**Bold text**
*Italic text*
~~Strikethrough~~
\`Inline code\`
> Blockquote
---
Horizontal rule above`}
                      </pre>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-[#2d5a45]">Result</p>
                      <div className="bg-white/70 rounded-lg p-3 text-sm space-y-2">
                        <p><strong>Bold text</strong></p>
                        <p><em>Italic text</em></p>
                        <p><del>Strikethrough</del></p>
                        <p><code className="bg-gray-200 px-1 rounded">Inline code</code></p>
                        <blockquote className="border-l-4 border-[#2d5a45] pl-3 italic">Blockquote</blockquote>
                        <hr className="border-gray-400" />
                        <p>Horizontal rule above</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lists Section */}
                <div className="mb-6 bg-white/50 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-[#1a3a2e]">📝 Lists</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold mb-2 text-[#2d5a45]">Markdown</p>
                      <pre className="bg-white/70 rounded-lg p-3 text-sm overflow-x-auto">
{`• Unordered list
  • Nested item
  • Another nested item

1. Ordered list
2. Second item
   1. Nested ordered item
   2. Another nested item

- [ ] Task list
- [x] Completed task
- [ ] Uncompleted task`}
                      </pre>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-[#2d5a45]">Result</p>
                      <div className="bg-white/70 rounded-lg p-3 text-sm space-y-2">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Unordered list
                            <ul className="list-disc list-inside ml-4">
                              <li>Nested item</li>
                              <li>Another nested item</li>
                            </ul>
                          </li>
                        </ul>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Ordered list</li>
                          <li>Second item
                            <ol className="list-decimal list-inside ml-4">
                              <li>Nested ordered item</li>
                              <li>Another nested item</li>
                            </ol>
                          </li>
                        </ol>
                        <ul className="space-y-1">
                          <li>☐ Task list</li>
                          <li>☑ Completed task</li>
                          <li>☐ Uncompleted task</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Tips Section */}
                <div className="bg-white/50 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-[#1a3a2e]">💡 Quick Tips</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-[#2d5a45] font-bold">•</span>
                      <span>Use two spaces at the end of a line for a line break</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2d5a45] font-bold">•</span>
                      <span>Escape special characters with backslash: \*, \#, \[, \]</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2d5a45] font-bold">•</span>
                      <span>Leave empty lines between different elements for better formatting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2d5a45] font-bold">•</span>
                      <span>Use Preview pane to see how your markdown will look</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2d5a45] font-bold">•</span>
                      <span>Auto-save keeps your work safe every 15 seconds</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
