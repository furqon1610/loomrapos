import type { CSSProperties, ReactNode } from "react";
import type { ReceiptSettings } from "@/lib/receipt";
import {
  buildReceiptModel,
  type Block,
  type ReceiptData,
  type ReceiptStore,
} from "@/lib/receipt-layout";

export type { ReceiptData, ReceiptStore };

function renderBlock(b: Block, key: number): ReactNode {
  switch (b.kind) {
    case "logo":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={b.url}
          alt=""
          className="mx-auto mb-1.5 block h-auto max-w-full"
          style={{ width: `${b.sizePct}%` }}
        />
      );
    case "title":
      return (
        <p key={key} className="text-center text-[14px] font-bold">
          {b.text}
        </p>
      );
    case "center":
      return (
        <p
          key={key}
          className={`whitespace-pre-line text-center ${b.small ? "text-[10px] text-[#7183a0]" : ""}`}
        >
          {b.text}
        </p>
      );
    case "text":
      return (
        <p key={key} className={b.gapBefore ? "mt-1.5" : ""}>
          {b.text}
        </p>
      );
    case "row":
      return (
        <div key={key} className={`flex justify-between gap-3 ${b.bold ? "text-[13px] font-bold" : ""}`}>
          <span>{b.left}</span>
          <span className="text-right">{b.right}</span>
        </div>
      );
  }
}

/** Dipakai sama persis untuk pratinjau pengaturan dan struk transaksi sungguhan. */
export default function ReceiptView({
  store,
  settings,
  data,
}: {
  store: ReceiptStore;
  settings: ReceiptSettings;
  data: ReceiptData;
}) {
  const sections = buildReceiptModel(store, settings, data);

  return (
    <div
      style={{ "--paper-mm": settings.paper_width } as CSSProperties}
      className="mx-auto w-[calc(var(--paper-mm)*4.4px)] bg-white p-4 font-mono text-[12px] leading-[18px] text-[#102a4c] shadow-[0_15px_50px_rgba(51,133,200,0.10)] print:w-[calc(var(--paper-mm)*1mm)] print:p-1 print:shadow-none"
    >
      {sections.length === 0 ? (
        <p className="py-6 text-center text-[#7183a0]">Struk kosong. Centang minimal satu isi struk.</p>
      ) : (
        sections.map((section, i) => (
          <div key={i}>
            {i > 0 && <div className="my-2.5 border-t border-dashed border-[#9aabc0]" />}
            <div className="space-y-0.5">{section.map(renderBlock)}</div>
          </div>
        ))
      )}
    </div>
  );
}
