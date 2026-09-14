import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  theme?: 'light' | 'dark';
  showSubtitle?: boolean;
}

export const Logo: React.FC<Props> = ({
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-[72px] sm:w-[78px]',
    md: 'w-[96px] sm:w-[112px]',
    lg: 'w-[138px] sm:w-[160px]',
    hero: 'w-[145px] sm:w-[165px]',
  }[size];

  return (
    <div className="flex items-center justify-center select-none">
      <img
        src="/logo1.png"
        alt="100 Vozes da Cidade - Vitória do Xingu"
        className={`${sizeClasses} h-auto object-contain`}
        draggable={false}
      />
    </div>
  );
};