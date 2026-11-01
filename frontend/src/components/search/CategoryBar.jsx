import React from 'react';
import { CATEGORIES } from '../../utils/constants';

export default function CategoryBar({ selectedCategory, onSelectCategory }) {
  return (
    <div className="cat-bar">
      {CATEGORIES.map((cat) => {
        const isActive = (selectedCategory || '') === cat.key;
        return (
          <div
            key={cat.key || 'ALL'}
            className={`cat-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.key)}
          >
            <div className="cat-icon">{cat.icon}</div>
            <div className="cat-label">{cat.label}</div>
          </div>
        );
      })}
    </div>
  );
}
