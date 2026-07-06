import React from 'react';

export default function UserAvatar({ user, size = 32, showName = false, className = '' }) {
  if (!user) return null;
  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: user.avatarColor || '#6366f1',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: Math.max(10, size * 0.36),
    fontWeight: 700,
    fontFamily: 'inherit',
    flexShrink: 0,
    userSelect: 'none',
  };

  if (showName) {
    return (
      <div className={`user-avatar-with-name ${className}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user.avatarBase64 ? (
          <img src={user.avatarBase64} alt={user.name} style={{ ...style, objectFit: 'cover', background: 'transparent' }} title={user.name} />
        ) : (
          <div style={style} title={user.name}>{initials}</div>
        )}
        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{user.name}</span>
      </div>
    );
  }

  return user.avatarBase64 ? (
    <img src={user.avatarBase64} alt={user.name} className={`user-avatar ${className}`} style={{ ...style, objectFit: 'cover', background: 'transparent' }} title={user.name} />
  ) : (
    <div className={`user-avatar ${className}`} style={style} title={user.name}>{initials}</div>
  );
}
