export type Speaker = "PRO" | "CON" | "MOD";

type Props = {
  speaking: Speaker | null;
  proText: string;
  modText: string;
  conText: string;
  topic: string;
};

export default function Stage({ speaking, proText, modText, conText, topic }: Props) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card
        label="PRO"
        colorClass="text-green-400 border-green-400"
        imgSrc="/pro.png"
        active={speaking === "PRO"}
        text={proText}
      />
      <Card
        label="MODERATOR"
        colorClass="text-purple-400 border-purple-400"
        imgSrc="/mod.png"
        active={speaking === "MOD"}
        text={modText}
      />
      <Card
        label="CON"
        colorClass="text-red-400 border-red-400"
        imgSrc="/con.png"
        active={speaking === "CON"}
        text={conText}
      />
      {topic && (
        <div className="col-span-3 text-center mt-4">
          Now debating: <b>{topic}</b>
        </div>
      )}
    </div>
  );
}

function Card({
  label,
  colorClass,
  imgSrc,
  active,
  text,
}: {
  label: string;
  colorClass: string;
  imgSrc: string;
  active: boolean;
  text: string;
}) {
  return (
    <div
      className={[
        "p-4 rounded border bg-gray-800",
        active ? colorClass.replace("text-", "border-") : "border-gray-700",
      ].join(" ")}
    >
      <h2 className={`font-bold ${colorClass}`}>{label}</h2>
      <img src={imgSrc} alt={label} className="mx-auto mb-3" />
      <Balloon active={active} text={text} />
    </div>
  );
}

function Balloon({ active, text }: { active: boolean; text: string }) {
  return (
    <div
      className={[
        "relative w-full min-h-[74px] rounded-lg px-4 py-3",
        "border shadow-[0_8px_20px_rgba(0,0,0,0.45)]",
        active ? "border-current" : "border-gray-600",
      ].join(" ")}
    >
      <p className="leading-relaxed text-sm transition-all">
        {text || <span className="opacity-60">…waiting…</span>}
      </p>
    </div>
  );
}
