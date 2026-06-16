import React from 'react';

const COLORS = ['#3B5BDB','#0CA678','#F59F00','#F03E3E','#8B5CF6','#EC4899','#06B6D4','#84CC16'];

function colorFor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

export default function Avatar({ name = '', photo, size = 'md', style: extraStyle }) {
  const sizeMap = { sm: 32, md: 40, lg: 56, xl: 72 };
  const px = sizeMap[size] || 40;
  const fontSize = px * 0.36;
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  if (photo) return (
    <img 
      src={photo} 
      alt={name}
      className="rounded-full object-cover shrink-0 shadow-sm border border-slate-100 hover:scale-105 transition-transform duration-200"
      style={{ width: px, height: px, ...extraStyle }} 
    />
  );

  return (
    <div 
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm border border-white hover:scale-105 transition-transform duration-200"
      style={{
        width: px,
        height: px,
        background: colorFor(name),
        fontSize,
        ...extraStyle
      }}
    >
      {initials || '?'}
    </div>
  );
}