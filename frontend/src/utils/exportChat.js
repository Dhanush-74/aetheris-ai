/**
 * Chat export utility for Aetheris AI
 * Supports Markdown (.md), Plain Text (.txt), and PDF (via browser print dialog)
 */

const downloadFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

export const exportToMarkdown = (conversationTitle = 'Aetheris_Chat', messages = []) => {
  const safeTitle = (conversationTitle || 'Aetheris_Chat').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toLocaleDateString();

  let md = `# ${conversationTitle || 'Aetheris AI Conversation'}\n`;
  md += `*Exported on ${dateStr} via Aetheris AI*\n\n---\n\n`;

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? '👤 User' : '🤖 Aetheris AI';
    const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : '';
    
    md += `### ${role} ${time ? `(${time})` : ''}\n\n`;

    if (msg.attachments && msg.attachments.length > 0) {
      md += `*Attached Files:* ${msg.attachments.map(a => `\`${a.name || 'file'}\``).join(', ')}\n\n`;
    }

    md += `${msg.content}\n\n---\n\n`;
  });

  downloadFile(`${safeTitle}.md`, md, 'text/markdown;charset=utf-8');
};

export const exportToText = (conversationTitle = 'Aetheris_Chat', messages = []) => {
  const safeTitle = (conversationTitle || 'Aetheris_Chat').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toLocaleString();

  let txt = `===========================================================\n`;
  txt += `  AETHERIS AI - CONVERSATION EXPORT\n`;
  txt += `  Title: ${conversationTitle || 'Untitled Chat'}\n`;
  txt += `  Date:  ${dateStr}\n`;
  txt += `===========================================================\n\n`;

  messages.forEach((msg, idx) => {
    const role = msg.role === 'user' ? 'YOU' : 'AETHERIS AI';
    const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : '';
    txt += `[${idx + 1}] ${role} ${time ? `(${time})` : ''}\n`;
    txt += `-`.repeat(50) + `\n`;
    if (msg.attachments && msg.attachments.length > 0) {
      txt += `Attachments: ${msg.attachments.map(a => a.name || 'file').join(', ')}\n`;
    }
    txt += `${msg.content}\n\n`;
  });

  downloadFile(`${safeTitle}.txt`, txt, 'text/plain;charset=utf-8');
};

export const exportToPDF = (conversationTitle = 'Aetheris_Chat', messages = []) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export chat as PDF');
    return;
  }

  const safeTitle = conversationTitle || 'Aetheris AI Conversation';
  const dateStr = new Date().toLocaleString();

  const messagesHtml = messages
    .map((msg) => {
      const isUser = msg.role === 'user';
      const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : '';
      const escapedContent = (msg.content || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');

      let attachmentsHtml = '';
      if (msg.attachments && msg.attachments.length > 0) {
        attachmentsHtml = `
          <div class="attachments">
            <strong>Attachments:</strong>
            ${msg.attachments
              .map((att) => {
                if (att.mimeType && att.mimeType.startsWith('image/')) {
                  return `<div class="attachment-img"><img src="${att.url || att.data || ''}" alt="${att.name}" style="max-height:160px;border-radius:6px;margin-top:6px;"/></div>`;
                }
                return `<span class="attachment-badge">📎 ${att.name || 'File'}</span>`;
              })
              .join(' ')}
          </div>
        `;
      }

      return `
        <div class="message ${isUser ? 'user-message' : 'ai-message'}">
          <div class="meta">
            <span class="role">${isUser ? '👤 You' : '🤖 Aetheris AI'}</span>
            <span class="time">${time}</span>
          </div>
          <div class="content">${escapedContent}</div>
          ${attachmentsHtml}
        </div>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${safeTitle} - Aetheris AI</title>
        <style>
          @page {
            margin: 1.5cm;
            size: A4 portrait;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 14px;
            line-height: 1.6;
          }
          .header {
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 24px;
          }
          .header h1 {
            margin: 0;
            font-size: 22px;
            color: #0369a1;
          }
          .header .subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .message {
            margin-bottom: 18px;
            padding: 12px 16px;
            border-radius: 8px;
            page-break-inside: avoid;
          }
          .user-message {
            background-color: #f0f9ff;
            border-left: 4px solid #0284c7;
          }
          .ai-message {
            background-color: #f8fafc;
            border-left: 4px solid #6366f1;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 6px;
            color: #64748b;
          }
          .role {
            font-weight: 700;
            color: #0f172a;
          }
          .content {
            font-size: 13.5px;
            color: #334155;
            word-break: break-word;
          }
          .attachments {
            margin-top: 8px;
            font-size: 12px;
            color: #475569;
          }
          .attachment-badge {
            display: inline-block;
            background: #e2e8f0;
            padding: 2px 8px;
            border-radius: 4px;
            margin-right: 6px;
            font-family: monospace;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${safeTitle}</h1>
          <div class="subtitle">Generated by Aetheris AI • ${dateStr}</div>
        </div>
        ${messagesHtml}
        <div class="footer">
          Aetheris AI — Intelligent Neural Assistant powered by Google Gemini
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
