import { getProgress } from '@/lib/utils/formatMoney';

interface TitleInfo {
  name: string;
  min_points: number;
}

interface Props {
  points: number;
  currentTitleMinPoints: number;
  nextTitle: TitleInfo | null;
}

export function TitleProgress({ points, currentTitleMinPoints, nextTitle }: Props) {
  if (!nextTitle) {
    return (
      <div className="title-progress-wrap">
        <p className="profile-empty">Высший статус достигнут</p>
      </div>
    );
  }

  const range = nextTitle.min_points - currentTitleMinPoints;
  const earned = points - currentTitleMinPoints;
  const percent = getProgress(earned, range);
  const remaining = nextTitle.min_points - points;

  return (
    <div className="title-progress-wrap">
      <div className="title-progress-labels">
        <span className="title-progress-current">{points.toLocaleString('ru-RU')} баллов</span>
        <span className="title-progress-next">{nextTitle.name}: {nextTitle.min_points.toLocaleString('ru-RU')}</span>
      </div>
      <div className="progress">
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="title-progress-hint">
        Ещё {remaining.toLocaleString('ru-RU')} баллов до «{nextTitle.name}»
      </p>
    </div>
  );
}
