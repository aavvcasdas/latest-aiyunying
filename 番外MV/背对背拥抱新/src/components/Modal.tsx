import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

export function Modal({ title, eyebrow, onClose, children, wide = false }: { title: string; eyebrow?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); }
      if (e.key === 'Tab') {
        const nodes = dialog.current?.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]');
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey, true); previous?.focus(); };
  }, []);

  return createPortal(
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div className={`modal ${wide ? 'modal-wide' : ''}`} ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.22 }}>
        <div className="modal-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={titleId}>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭弹窗"><X size={21} /></button></div>
        {children}
      </motion.div>
    </motion.div>, document.body,
  );
}