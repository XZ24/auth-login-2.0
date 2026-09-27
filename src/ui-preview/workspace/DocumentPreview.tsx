import { useEffect, useRef } from 'react'
import { FileText, X } from '@phosphor-icons/react'
import { Badge, Button, PreviewIcon } from '../components/primitives'
import { shortDate, type ClaimDocument } from './model'

export function DocumentPreview({ document, onClose }: { document: ClaimDocument; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return <dialog ref={dialog} className="ws-document-dialog" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }} aria-labelledby="document-preview-title">
    <div className="ws-dialog-head"><div><span className="pv-eyebrow">DOCUMENT PREVIEW</span><h2 id="document-preview-title">{document.name}</h2></div><Button onClick={onClose} aria-label="Close document preview"><PreviewIcon icon={X} /></Button></div>
    <div className="ws-dialog-meta"><Badge>{document.status}</Badge><span>{document.source}</span>{document.date && <span>{shortDate(document.date)}</span>}</div>
    {document.dataUrl ? document.mime?.startsWith('image/') ? <img className="ws-document-image" src={document.dataUrl} alt={document.name} /> : <iframe title={`Preview ${document.name}`} className="ws-document-frame" sandbox="" src={document.dataUrl} /> : <article className="ws-sample-document"><div className="ws-sample-letterhead"><PreviewIcon icon={FileText} size="illustration" /><span>TRAVEL CLAIMS <small>SYNTHETIC DOCUMENT</small></span></div><h3>{document.kind}</h3><div>{document.summary}</div><p className="ws-document-stamp">Sample content for design review · not an original document</p></article>}
    <div className="ws-dialog-footer"><span>{document.dataUrl ? 'Local file preview. No file was uploaded to a server.' : 'Illustrative preview of the mock attachment.'}</span><Button onClick={onClose}>Done</Button></div>
  </dialog>
}
