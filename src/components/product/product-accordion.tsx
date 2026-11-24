"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

type AccordionItem = {
  title: string;
  content: React.ReactNode;
};

type Props = {
  items: AccordionItem[];
};

function AccordionRow({ title, content }: AccordionItem) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-light-beige">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-[10px] tracking-[0.18em] text-soft-black">
          {title}
        </span>
        {open ? (
          <Minus size={14} className="shrink-0 text-muted-grey" />
        ) : (
          <Plus size={14} className="shrink-0 text-muted-grey" />
        )}
      </button>

      {open && (
        <div className="pb-5 text-xs leading-7 text-muted-grey">
          {content}
        </div>
      )}
    </div>
  );
}

export default function ProductAccordion({ items }: Props) {
  return (
    <div className="border-t border-light-beige">
      {items.map((item) => (
        <AccordionRow key={item.title} {...item} />
      ))}
    </div>
  );
}
