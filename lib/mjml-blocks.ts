// Comms Desk email block editor -> MJML. Each block type maps to a small,
// pre-designed MJML template snippet (the actual "make it look pro" work,
// done once here rather than per-email) so Kaci never touches raw MJML/HTML.

export type Block =
  | { id: string; type: 'hero'; heading: string; subheading: string; imageUrl: string }
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'image'; url: string; alt: string }
  | { id: string; type: 'button'; label: string; url: string }
  | { id: string; type: 'divider' }
  | { id: string; type: 'quote'; text: string; attribution: string }

const BRAND_COLOR = '#1f2937'
const ACCENT_COLOR = '#2563eb'
const FONT = 'Georgia, serif'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function blockToMjml(block: Block): string {
  switch (block.type) {
    case 'hero':
      return `
        <mj-section background-color="${BRAND_COLOR}" padding="40px 24px">
          <mj-column>
            ${block.imageUrl ? `<mj-image src="${block.imageUrl}" alt="" padding-bottom="16px" />` : ''}
            <mj-text align="center" color="#ffffff" font-size="26px" font-family="${FONT}" font-weight="bold">
              ${escapeXml(block.heading)}
            </mj-text>
            ${block.subheading ? `<mj-text align="center" color="#d1d5db" font-size="16px" font-family="${FONT}">${escapeXml(block.subheading)}</mj-text>` : ''}
          </mj-column>
        </mj-section>`
    case 'text':
      return `
        <mj-section padding="16px 24px">
          <mj-column>
            <mj-text font-size="16px" line-height="1.6" font-family="${FONT}" color="#1f2937">
              ${block.content}
            </mj-text>
          </mj-column>
        </mj-section>`
    case 'image':
      return `
        <mj-section padding="8px 24px">
          <mj-column>
            <mj-image src="${block.url}" alt="${escapeXml(block.alt)}" />
          </mj-column>
        </mj-section>`
    case 'button':
      return `
        <mj-section padding="16px 24px">
          <mj-column>
            <mj-button background-color="${ACCENT_COLOR}" color="#ffffff" font-size="16px" border-radius="6px" href="${block.url}">
              ${escapeXml(block.label)}
            </mj-button>
          </mj-column>
        </mj-section>`
    case 'divider':
      return `
        <mj-section padding="8px 24px">
          <mj-column>
            <mj-divider border-color="#e5e7eb" border-width="1px" />
          </mj-column>
        </mj-section>`
    case 'quote':
      return `
        <mj-section background-color="#f9fafb" padding="24px">
          <mj-column border-left="4px solid ${ACCENT_COLOR}" padding-left="16px">
            <mj-text font-style="italic" font-size="17px" font-family="${FONT}" color="#374151">
              ${escapeXml(block.text)}
            </mj-text>
            ${block.attribution ? `<mj-text font-size="14px" color="#6b7280">— ${escapeXml(block.attribution)}</mj-text>` : ''}
          </mj-column>
        </mj-section>`
  }
}

export function blocksToMjml(blocks: Block[]): string {
  const sections = blocks.map(blockToMjml).join('\n')
  return `
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="${FONT}" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#ffffff">
    ${sections}
  </mj-body>
</mjml>`
}

export function newBlock(type: Block['type']): Block {
  const id = crypto.randomUUID()
  switch (type) {
    case 'hero':
      return { id, type, heading: 'Heading', subheading: '', imageUrl: '' }
    case 'text':
      return { id, type, content: 'Write your message here...' }
    case 'image':
      return { id, type, url: '', alt: '' }
    case 'button':
      return { id, type, label: 'Learn More', url: '' }
    case 'divider':
      return { id, type }
    case 'quote':
      return { id, type, text: '', attribution: '' }
  }
}
