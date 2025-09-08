import { Seat } from '@/components/custom/Seat';
import type { Id } from '@/convex/_generated/dataModel';
import type { TPart, TSeating } from '@/types/seating';

type OrchestraLayoutProps = {
  seatingChart: TSeating[];
  parts: TPart[];
  isSwapMode?: boolean;
  onSeatClick?: (seatId: Id<'seatings'>) => void;
  firstSeatToSwap?: Id<'seatings'> | null;
};

// 楽器のセクション分け
const sections = {
  Percussion: ['Timpani', 'Percussion'],
  Brass: ['Horn', 'Trumpet', 'Trombone', 'Tuba'],
  Woodwinds: [
    'Piccolo',
    'Flute',
    'Oboe',
    'English Horn',
    'Clarinet in Eb',
    'Clarinet in Bb & A',
    'Clarinet',
    'Bass Clarinet',
    'Bassoon',
    'Contrabassoon',
  ],
  Others: ['Piano', 'Harp', 'Celesta', 'Other'],
  Strings: [
    '1st Violin',
    '2nd Violin',
    'Viola',
    'Violoncello',
    'Cello',
    'Contrabass',
  ],
};

// 各セクションの表示順
const sectionOrder: (keyof typeof sections)[] = [
  'Percussion',
  'Brass',
  'Woodwinds',
  'Others',
  'Strings',
];

export function OrchestraLayout({
  seatingChart,
  parts,
  isSwapMode,
  onSeatClick,
  firstSeatToSwap,
}: OrchestraLayoutProps) {
  // セクションごとに座席をグループ化
  const seatsBySection = (sectionName: keyof typeof sections) => {
    const sectionParts = parts.filter((p) =>
      sections[sectionName].includes(p.name),
    );
    const sectionPartIds = new Set(sectionParts.map((p) => p._id));
    return seatingChart.filter((seat) => sectionPartIds.has(seat.partId));
  };

  // 弦楽器のプルト描画
  const renderStringPult = (pultSeats: TSeating[]) => {
    return (
      <div className="flex gap-1">
        {pultSeats.map((seat) => (
          <div key={seat._id} className="w-1/2">
            <Seat
              seat={seat}
              isSwapMode={isSwapMode}
              onClick={onSeatClick}
              isSelected={seat._id === firstSeatToSwap}
            />
          </div>
        ))}
      </div>
    );
  };

  // 弦楽器セクションの描画
  const renderStringSection = () => {
    const stringParts = parts.filter((p) => sections.Strings.includes(p.name));
    return (
      <div className="grid grid-cols-5 gap-4">
        {stringParts.map((part) => {
          const seatsForPart = seatingChart.filter(
            (s) => s.partId === part._id,
          );
          const pults: { [key: number]: TSeating[] } = {};
          seatsForPart.forEach((seat) => {
            if (seat.number) {
              if (!pults[seat.number]) pults[seat.number] = [];
              // isFrontOfPlutでソートして「表」「裏」の順を保証
              pults[seat.number].push(seat);
              pults[seat.number].sort((a, b) =>
                a.isFrontOfPlut === b.isFrontOfPlut
                  ? 0
                  : a.isFrontOfPlut
                    ? -1
                    : 1,
              );
            }
          });
          return (
            <div key={part._id} className="flex flex-col gap-2">
              <h4 className="text-center font-semibold text-xs text-muted-foreground">
                {part.name}
              </h4>
              <div className="flex flex-col gap-1.5">
                {Object.values(pults).map((pult, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: 静的な配列のためOK
                  <div key={i}>{renderStringPult(pult)}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 弦楽器以外のセクション描画
  const renderOtherSections = (sectionName: keyof typeof sections) => {
    const seats = seatsBySection(sectionName);
    if (seats.length === 0) return null;
    return (
      <div className="flex flex-wrap items-end justify-center gap-2">
        {seats.map((seat) => (
          <div key={seat._id} className="w-24">
            <Seat
              seat={seat}
              isSwapMode={isSwapMode}
              onClick={onSeatClick}
              isSelected={seat._id === firstSeatToSwap}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-muted/30 p-2 md:p-4 rounded-lg h-full overflow-y-auto relative flex flex-col justify-end">
      {/* Stage SVG Background */}
      <svg
        className="absolute inset-0 w-full h-full text-border"
        preserveAspectRatio="none"
        viewBox="0 0 400 200"
      >
        <title>Stage</title>
        <path
          d="M 50 190 Q 200 140 350 190 L 380 30 Q 200 0 20 30 Z"
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeOpacity="0.5"
        />
      </svg>

      {/* Seating Layout */}
      <div className="relative z-10 flex flex-col gap-4 p-4">
        {sectionOrder.map((sectionName) => {
          if (sectionName === 'Strings') {
            return <div key={sectionName}>{renderStringSection()}</div>;
          } else {
            return (
              <div key={sectionName}>{renderOtherSections(sectionName)}</div>
            );
          }
        })}
        <div className="text-center mt-4 text-xs text-muted-foreground">
          指揮者
        </div>
      </div>
    </div>
  );
}
