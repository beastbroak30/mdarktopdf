'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';

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
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Create a clone of the preview element for PDF generation
      const element = previewRef.current;
      
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0a0a0a',
        logging: false,
        useCORS: true,
      });

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
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f1a] via-[#0a0a0a] to-[#1a3a2e]">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="border-b border-[#2d5a45] bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="container mx-auto px-3 py-2 flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold gradient-text">
            MDark
          </h1>
          <div className="flex items-center gap-3">
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="px-3 py-1.5 text-sm bg-[#1a3a2e] text-[#a8d5ba] border border-[#2d5a45] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3a7356]"
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
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-4 py-1.5 text-sm bg-gradient-to-r from-[#2d5a45] to-[#3a7356] text-[#c5e8c1] rounded-md font-semibold hover:from-[#3a7356] hover:to-[#4a8b67] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-[#c5e8c1] border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                '📄 PDF'
              )}
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
            <div className="bg-[#1a1a1a]/90 rounded-md border border-[#2d5a45] overflow-hidden shadow-xl flex flex-col h-full">
              <div className="bg-[#1a3a2e] px-3 py-2 border-b border-[#2d5a45] flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#a8d5ba]">
                  ✏️ Editor
                </h2>
                <a
                  href="https://github.com/beastbroak30"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#2d5a45] to-[#3a7356] text-[#c5e8c1] rounded text-xs font-medium hover:from-[#3a7356] hover:to-[#4a8b67] transition-all shadow-sm"
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
            <div className="bg-[#1a1a1a]/90 rounded-md border border-[#2d5a45] overflow-hidden shadow-xl flex flex-col h-full">
              <div className="bg-[#1a3a2e] px-3 py-2 border-b border-[#2d5a45]">
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
    </div>
  );
}
