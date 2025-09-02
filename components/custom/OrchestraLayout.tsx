import { Seat } from '@/components/custom/Seat';
import type { TPart, TSeating } from '@/types/seating';

type OrchestraLayoutProps = {
  seatingChart: TSeating[];
  parts: TPart[];
};

const sections = {
  Strings: ['1st Violin', '2nd Violin', 'Viola', 'Violoncello', 'Contrabass'],
  Woodwinds: ['Flute', 'Oboe', 'Clarinet', 'Bassoon'],
  Brass: ['Horn', 'Trumpet', 'Trombone', 'Tuba'],
  Percussion: ['Timpani', 'Percussion'],
  Others: ['Piano', 'Harp', 'Other'],
};

export function OrchestraLayout({ seatingChart, parts }: OrchestraLayoutProps) {
  const renderSection = (sectionName: keyof typeof sections) => {
    const sectionParts = parts.filter((p) =>
      sections[sectionName].includes(p.name),
    );

    if (sectionParts.length === 0) return null;

    return (
      <div key={sectionName} className="mb-6">
        <h3 className="text-base font-semibold mb-3 border-b pb-1">
          {sectionName}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sectionParts.map((part) => (
            <div key={part._id}>
              <h4 className="font-medium text-xs mb-2">{part.name}</h4>
              <div className="flex flex-col gap-1.5">
                {seatingChart
                  .filter((seat) => seat.partId === part._id)
                  .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
                  .map((seat) => (
                    <Seat key={seat._id} seat={seat} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-muted/30 p-2 md:p-4 rounded-lg h-full overflow-y-auto">
      {Object.keys(sections).map((sectionName) =>
        renderSection(sectionName as keyof typeof sections),
      )}
    </div>
  );
}
