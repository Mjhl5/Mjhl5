import { LAENDER } from '../data/laender';

const K = 2.6;
const px = (lon: number) => (lon + 170) * K;
const py = (lat: number) => (80 - lat) * K;
const W = 350 * K;
const H = 136 * K;

// stark vereinfachte (schematische) Umrisse der Kontinente [lon, lat]
const SHAPES: number[][][] = [
  // Nordamerika
  [[-168, 66], [-162, 70], [-140, 70], [-120, 72], [-95, 72], [-80, 73], [-62, 68], [-60, 56], [-55, 50], [-66, 44], [-70, 41], [-76, 35], [-81, 31], [-80, 25], [-82, 27], [-84, 30], [-90, 29], [-97, 26], [-97, 21], [-94, 18], [-90, 21], [-87, 21], [-88, 16], [-84, 15], [-83, 10], [-79, 9], [-80, 7], [-85, 10], [-92, 14], [-96, 16], [-105, 20], [-106, 23], [-112, 29], [-117, 32], [-121, 35], [-124, 40], [-124, 48], [-130, 55], [-140, 60], [-150, 60], [-158, 57], [-165, 60]],
  // Grönland
  [[-55, 60], [-44, 60], [-20, 70], [-20, 78], [-60, 79], [-70, 77], [-56, 70]],
  // Südamerika
  [[-79, 9], [-72, 12], [-62, 11], [-52, 5], [-50, 0], [-35, -5], [-35, -9], [-39, -15], [-41, -22], [-48, -26], [-53, -34], [-58, -38], [-65, -42], [-68, -50], [-69, -55], [-74, -52], [-74, -42], [-71, -30], [-70, -18], [-76, -14], [-81, -6], [-80, 0], [-78, 7]],
  // Eurasien
  [[-9, 37], [-9, 43], [-2, 43.5], [-4, 48], [2, 51], [5, 53], [8, 57], [10, 54], [12, 56], [11, 59], [5, 58], [5, 62], [14, 68], [20, 70], [30, 71], [40, 67], [45, 68], [60, 70], [70, 73], [80, 73], [100, 77], [113, 74], [130, 72], [140, 72], [160, 70], [180, 68], [180, 65], [170, 60], [163, 56], [156, 51], [155, 59], [143, 59], [137, 54], [141, 48], [135, 43], [130, 42], [129, 35], [126, 37], [125, 40], [121, 40], [122, 31], [120, 26], [115, 22], [108, 21], [106, 18], [109, 12], [105, 9], [100, 13], [102, 6], [104, 1], [100, 3], [98, 8], [98, 16], [94, 17], [92, 22], [88, 22], [80, 15], [77, 8], [73, 17], [72, 22], [67, 25], [57, 25], [56, 27], [52, 28], [48, 30], [50, 26], [56, 26], [57, 23], [59, 22], [55, 17], [44, 12], [43, 16], [39, 22], [35, 28], [34, 31], [35, 36], [30, 36], [27, 37], [26, 40], [23, 40], [22, 37], [20, 40], [19, 42], [13, 45.5], [12, 44], [16, 41], [18, 40], [16, 38], [15.5, 40], [12, 42], [10, 44], [7, 43.5], [3, 43], [3, 41.5], [0, 39], [-2, 37], [-5.5, 36]],
  // Afrika
  [[-17, 21], [-16, 28], [-10, 30], [-6, 36], [0, 36], [10, 37], [11, 33], [20, 31], [30, 31], [32, 30], [35, 24], [38, 18], [43, 12], [51, 12], [51, 10], [44, 2], [40, -3], [39, -8], [40, -15], [35, -24], [33, -28], [28, -33], [20, -35], [18, -32], [15, -27], [12, -18], [13, -10], [12, -5], [9, -1], [9, 4], [4, 6], [-4, 5], [-8, 4], [-13, 8], [-17, 14]],
  [[44, -16], [50, -15], [47, -25], [44, -23]], // Madagaskar
  // Australien
  [[114, -22], [122, -18], [130, -12], [137, -12], [136, -15], [141, -12], [143, -11], [146, -19], [153, -25], [151, -34], [146, -39], [140, -38], [135, -35], [131, -31], [124, -34], [115, -34], [113, -26]],
  [[95, 5], [98, 4], [106, -6], [104, -6], [96, 3]], // Sumatra
  [[105, -6], [114, -7], [114, -8.5], [106, -7.5]], // Java
  [[109, 2], [117, 7], [119, 1], [116, -4], [110, -3]], // Borneo
  [[119, 1], [125, 1], [121, -1], [123, -5], [120, -5]], // Sulawesi
  [[131, -1], [141, -3], [150, -10], [143, -9], [138, -8]], // Neuguinea
  [[120, 18], [122, 18], [124, 13], [126, 7], [125, 6], [122, 7], [121, 12], [120, 15]], // Philippinen
  [[130, 31], [135, 34], [140, 36], [142, 40], [141, 45], [140, 42], [136, 37], [131, 34]], // Japan
  [[-5, 50], [1, 51], [0, 53], [-3, 56], [-5, 58], [-6, 56], [-3, 54], [-5, 52]], // GB
  [[-10, 52], [-6, 52], [-6, 55], [-10, 54]], // Irland
  [[172, -34], [178, -38], [174, -41], [167, -46], [171, -44]], // NZ
  [[-24, 64], [-14, 64], [-14, 66], [-22, 66.5]], // Island
];

/** Verschiebung der Nummern, damit sich nahe Länder nicht überdecken (in px) */
const OFFSET: Record<number, [number, number]> = {
  9: [-20, 14], 13: [8, -16], 2: [10, -14], 12: [-6, 14], 8: [-14, -10], 5: [10, 12], 3: [-12, -6], 17: [0, -14], 19: [0, -12], 20: [14, 0], 7: [0, 10], 11: [-12, -8], 15: [0, 0],
};

const path = (pts: number[][]) => 'M' + pts.map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join('L') + 'Z';

interface Props {
  highlight?: number;
  onPick?: (nr: number) => void;
  showNames?: boolean;
  status?: Record<number, 'ok' | 'bad' | undefined>;
  disabled?: boolean;
}

export default function WorldMap({ highlight, onPick, showNames, status, disabled }: Props) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-sky-100/70 dark:border-slate-800 dark:bg-slate-900">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full select-none" role="img" aria-label="Schematische Weltkarte mit Nummern">
        {SHAPES.map((s, i) => (
          <path key={i} d={path(s)} className="fill-emerald-200 stroke-emerald-400 dark:fill-slate-700 dark:stroke-slate-600" strokeWidth={1} />
        ))}
        {LAENDER.map((L) => {
          const x = px(L.lon), y = py(L.lat);
          const [dx, dy] = OFFSET[L.nr] ?? [0, 0];
          const hl = highlight === L.nr;
          const st = status?.[L.nr];
          const fill = hl ? 'fill-rose-500' : st === 'ok' ? 'fill-emerald-500' : st === 'bad' ? 'fill-rose-400' : 'fill-indigo-600 dark:fill-indigo-500';
          const clickable = !!onPick && !disabled;
          return (
            <g key={L.nr} onClick={clickable ? () => onPick!(L.nr) : undefined} className={clickable ? 'cursor-pointer' : ''}>
              {(dx || dy) ? <line x1={x} y1={y} x2={x + dx} y2={y + dy} className="stroke-slate-500" strokeWidth={1} /> : null}
              <circle cx={x} cy={y} r={2.5} className="fill-slate-700 dark:fill-slate-300" />
              <circle cx={x + dx} cy={y + dy} r={hl ? 13 : 10} className={`${fill} ${hl ? 'animate-pulse' : ''} stroke-white`} strokeWidth={1.5} />
              {clickable && <circle cx={x + dx} cy={y + dy} r={18} fill="transparent" />}
              <text x={x + dx} y={y + dy + 3.8} textAnchor="middle" className="pointer-events-none fill-white font-bold" fontSize={hl ? 12 : 10.5}>{L.nr}</text>
              {showNames && (
                <text x={x + dx} y={y + dy + 22} textAnchor="middle" className="pointer-events-none fill-slate-800 dark:fill-slate-200" fontSize={9.5} fontWeight={600}>{L.land}</text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="px-3 pb-2 text-[11px] text-slate-500">Schematische Karte (vereinfacht, nicht maßstabsgetreu). Nummern wie auf dem Arbeitsblatt.</p>
    </div>
  );
}
