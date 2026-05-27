import type { ReactNode } from 'react';

interface Props {
  fullName: string;
  points: number;
  titleName: string | null;
  avatarSlot: ReactNode;
}

export function ProfileHero({ fullName, points, titleName, avatarSlot }: Props) {
  return (
    <div className="profile-hero">
      <div className="profile-avatar-wrap">{avatarSlot}</div>
      <div className="profile-hero-info">
        <h1 className="profile-title">{fullName}</h1>
        {titleName && <span className="profile-title-badge">{titleName}</span>}
        <p className="profile-points">&#9733; {points.toLocaleString('ru-RU')} баллов</p>
      </div>
    </div>
  );
}
