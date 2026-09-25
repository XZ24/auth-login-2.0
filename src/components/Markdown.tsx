import { Fragment, ReactNode } from 'react'

interface MarkdownProps {
  content: string
}

// Render inline markdown: **bold**, *italic*, `code`.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Tokenise on bold, italic and inline code.
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t-${i}`}>{text.slice(lastIndex, match.index)}</Fragment>,
      )
    }
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-slate-800">
          {token.slice(2, -2)}
        </strong>,
      )
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={`${keyPrefix}-c-${i}`}
          className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-[0.85em] font-mono"
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else {
      nodes.push(
        <em key={`${keyPrefix}-i-${i}`} className="italic">
          {token.slice(1, -1)}
        </em>,
      )
    }
    lastIndex = match.index + token.length
    i++
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}-t-${i}`}>{text.slice(lastIndex)}</Fragment>)
  }
  return nodes
}

type ListItem = { indent: number; ordered: boolean; marker: string; text: string }

// Split a pipe-delimited table row into trimmed cells, dropping the
// leading/trailing pipes.
function splitRow(line: string): string[] {
  let t = line.trim()
  if (t.startsWith('|')) t = t.slice(1)
  if (t.endsWith('|')) t = t.slice(0, -1)
  return t.split('|').map((c) => c.trim())
}

// A GFM table separator row, e.g. |---|:--:|.
function isSeparatorRow(line: string): boolean {
  const t = line.trim()
  return t.includes('-') && t.includes('|') && /^[\s|:-]+$/.test(t)
}

const hasTrailingPipe = (line: string) => /\|\s*$/.test(line)

// Minimal, dependency-free markdown renderer for the LLM briefing.
// Supports headings (#..######), bold/italic/code, ordered & unordered
// lists (with indentation), horizontal rules, tables and paragraphs.
export function Markdown({ content }: MarkdownProps) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let listBuffer: ListItem[] = []
  let key = 0

  const flushList = () => {
    if (listBuffer.length === 0) return
    const items = listBuffer
    listBuffer = []
    blocks.push(
      <ul key={`list-${key++}`} className="space-y-1 my-2">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex gap-2 text-sm text-slate-600 leading-relaxed"
            style={{ paddingLeft: `${item.indent * 1.25}rem` }}
          >
            <span className="text-slate-400 select-none shrink-0">
              {item.ordered ? item.marker : '•'}
            </span>
            <span className="min-w-0">{renderInline(item.text, `li-${key}-${idx}`)}</span>
          </li>
        ))}
      </ul>,
    )
  }

  // Render the content of a single table cell. Cells may contain multiple
  // lines (bullet lists, paragraphs) when the model emits multi-line tables,
  // so fall back to a recursive render in that case.
  const renderCell = (text: string, keyPrefix: string): ReactNode => {
    if (/\n/.test(text) || /^\s*[-*+]\s+/m.test(text)) {
      return <Markdown content={text} />
    }
    return renderInline(text, keyPrefix)
  }

  // Parse a table starting at `start` (header row; `start + 1` is the
  // separator). Returns the index of the last consumed line.
  const parseTable = (start: number): number => {
    flushList()
    const header = splitRow(lines[start])
    const cols = header.length
    const rows: string[][] = []
    let i = start + 2
    let open = false // last row's final cell awaits continuation lines

    while (i < lines.length) {
      const l = lines[i]
      const trimmed = l.trim()

      if (trimmed.startsWith('|')) {
        rows.push(splitRow(l))
        open = !hasTrailingPipe(l)
        i++
        continue
      }

      // Headings and horizontal rules always terminate the table.
      if (/^(#{1,6})\s+/.test(trimmed) || /^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) break

      // Continuation line belonging to the previous row's last cell.
      if (open && rows.length > 0) {
        const row = rows[rows.length - 1]
        row[row.length - 1] += `\n${l}`
        if (hasTrailingPipe(l)) {
          open = false
          row[row.length - 1] = row[row.length - 1].replace(/\|\s*$/, '').replace(/\s+$/, '')
        }
        i++
        continue
      }

      // Anything else ends the table.
      break
    }

    const tableKey = key++
    blocks.push(
      <div key={`table-${tableKey}`} className="my-3 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              {header.map((cell, c) => (
                <th
                  key={c}
                  className="px-3 py-2 align-top font-semibold text-slate-700 bg-slate-50"
                >
                  {renderCell(cell, `th-${tableKey}-${c}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-b border-slate-100 align-top">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-3 py-2 align-top text-slate-600">
                    {renderCell(row[c] ?? '', `td-${tableKey}-${r}-${c}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    )

    return i - 1
  }

  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index]
    const line = raw.replace(/\s+$/, '')

    if (line.trim() === '') {
      flushList()
      continue
    }

    // Table: a pipe row immediately followed by a separator row.
    if (
      line.trim().startsWith('|') &&
      index + 1 < lines.length &&
      isSeparatorRow(lines[index + 1])
    ) {
      index = parseTable(index)
      continue
    }

    // Horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushList()
      blocks.push(<hr key={`hr-${key++}`} className="my-4 border-slate-200" />)
      continue
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      flushList()
      const level = heading[1].length
      const text = heading[2]
      const sizes: Record<number, string> = {
        1: 'text-lg font-bold text-slate-800 mt-4 mb-2',
        2: 'text-base font-bold text-slate-800 mt-4 mb-2',
        3: 'text-sm font-semibold text-slate-800 mt-3 mb-1.5 uppercase tracking-wide',
        4: 'text-sm font-semibold text-slate-700 mt-3 mb-1',
        5: 'text-sm font-medium text-slate-700 mt-2 mb-1',
        6: 'text-xs font-medium text-slate-500 mt-2 mb-1',
      }
      blocks.push(
        <p key={`h-${key++}`} className={sizes[level]}>
          {renderInline(text, `h-${index}`)}
        </p>,
      )
      continue
    }

    // Ordered list item
    const ordered = /^(\s*)(\d+)[.)]\s+(.*)$/.exec(line)
    if (ordered) {
      const indent = Math.floor(ordered[1].replace(/\t/g, '  ').length / 2)
      listBuffer.push({ indent, ordered: true, marker: `${ordered[2]}.`, text: ordered[3] })
      continue
    }

    // Unordered list item
    const unordered = /^(\s*)[-*+]\s+(.*)$/.exec(line)
    if (unordered) {
      const indent = Math.floor(unordered[1].replace(/\t/g, '  ').length / 2)
      listBuffer.push({ indent, ordered: false, marker: '•', text: unordered[2] })
      continue
    }

    // Paragraph
    flushList()
    blocks.push(
      <p key={`p-${key++}`} className="text-sm text-slate-600 leading-relaxed my-2">
        {renderInline(line, `p-${index}`)}
      </p>,
    )
  }

  flushList()

  return <div>{blocks}</div>
}
