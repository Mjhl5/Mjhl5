import { useState } from 'react';
import { useStore } from '../lib/store';
import MatchGame, { type MatchPair } from './MatchGame';
import { Btn, Card } from './ui';

interface Props { title: string; makePairs: () => MatchPair[]; leftLabel?: string; rightLabel?: string; onExit: () => void }

export default function MatchTrainer({ title, makePairs, leftLabel, rightLabel, onExit }: Props) {
  const { answer } = useStore();
  const [pairs, setPairs] = useState(makePairs);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState({ right: 0, total: 0 });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center gap-3">
        <Btn variant="ghost" size="sm" onClick={onExit}>✕</Btn>
        <div className="flex-1 text-sm font-semibold text-slate-500">{title} · Runde {round} · {score.right}/{score.total} richtig</div>
      </div>
      <Card className="animate-fadein">
        <MatchGame key={round} pairs={pairs} leftLabel={leftLabel} rightLabel={rightLabel}
          onDone={(res) => {
            res.forEach((r) => r.pair.itemId && answer({ itemId: r.pair.itemId, correct: r.correct, given: r.given, expected: r.pair.right, confusedWith: r.correct ? undefined : r.given || undefined }));
            setScore((s) => ({ right: s.right + res.filter((r) => r.correct).length, total: s.total + res.length }));
            // falsche Paare kommen in der nächsten Runde garantiert wieder
            const wrong = res.filter((r) => !r.correct).map((r) => r.pair);
            const next = makePairs().filter((p) => !wrong.some((w) => w.left === p.left));
            setPairs([...wrong, ...next].slice(0, Math.max(pairs.length, wrong.length)));
            setRound((r) => r + 1);
          }} />
      </Card>
    </div>
  );
}
