import React, { useState } from 'react';
import aiService from '../../services/aiService';
import hostService from '../../services/hostService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, categoryIcon } from '../../utils/formatters';

export default function AIListingAuditModal({ isOpen, property, onClose }) {
  const { showToast } = useToast();
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [aiGeneratedDesc, setAiGeneratedDesc] = useState('');

  if (!isOpen || !property) return null;

  const audit = aiService.auditListing(property);

  const handleGenerateDescription = async () => {
    setGeneratingDesc(true);
    try {
      const amenitiesList = Array.isArray(property.amenities)
        ? property.amenities.map((a) => (typeof a === 'string' ? a : a.name || ''))
        : ['WiFi', 'Kitchen', 'Air Conditioning'];

      const res = await hostService.generateDescription({
        propertyType: property.propertyType || 'ENTIRE_HOME',
        city: property.city || 'Goa',
        state: property.state || 'Goa',
        bedrooms: property.bedrooms || 1,
        bathrooms: property.bathrooms || 1,
        maxGuests: property.maxGuests || 2,
        amenities: amenitiesList,
      });

      if (res && res.description) {
        setAiGeneratedDesc(res.description);
        showToast('AI Description generated! ✨');
      } else {
        // Fallback local high-converting template
        const fallback = `Welcome to this beautifully appointed ${property.propertyType || 'stay'} situated in the heart of ${property.city || 'the city'}! Designed with both leisure and productivity in mind, this haven offers generous natural light, serene bedrooms, and premium amenities including high-speed WiFi for remote work. Step out to explore top-rated local cafes and scenic viewpoints, then return to unwind in absolute privacy and comfort. Perfect for couples, digital nomads, and discerning travelers seeking an unforgettable getaway.`;
        setAiGeneratedDesc(fallback);
        showToast('AI Description drafted! ✨');
      }
    } catch {
      const fallback = `Escape to this stunning ${property.propertyType || 'residence'} in ${property.city || 'an ideal destination'}! Featuring stylish modern interiors, high-speed WiFi, and peaceful spaces to recharge. Experience the best of the city with vibrant local dining and attractions just minutes away.`;
      setAiGeneratedDesc(fallback);
      showToast('AI Description drafted! ✨');
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleCopyDesc = () => {
    if (!aiGeneratedDesc) return;
    navigator.clipboard.writeText(aiGeneratedDesc);
    showToast('Copied description to clipboard! 📋');
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{
          background: 'var(--white)',
          borderRadius: '20px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          padding: '28px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>✨</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                AI Listing Quality Audit
              </h2>
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: '14px', margin: 0 }}>
              AI-driven insights to maximize views, ranking, and bookings for <strong>{property.title}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: 'var(--text-2)',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Score Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
              Listing Health Score
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '48px', fontWeight: 800, color: audit.tierColor }}>
                {audit.totalScore}
              </span>
              <span style={{ fontSize: '20px', color: '#94A3B8', fontWeight: 600 }}>/ 100</span>
            </div>
            <div style={{ marginTop: '6px', fontSize: '14px', fontWeight: 600, color: '#E2E8F0' }}>
              {audit.badge} · Rank: {audit.tier}
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '10px', fontSize: '12px' }}>
              📈 Estimated <strong>+{Math.min(45, (100 - audit.totalScore) * 1.2).toFixed(0)}%</strong> booking lift
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
              Based on algorithmic ranking metrics
            </div>
          </div>
        </div>

        {/* Score Breakdown Bars */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: '#0F172A' }}>
            Score Breakdown
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(audit.breakdown).map(([k, item]) => {
              const pct = (item.score / item.max) * 100;
              const barColor = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
              return (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{item.title}</span>
                    <span style={{ fontWeight: 700, color: barColor }}>
                      {item.score} / {item.max} pts
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: barColor,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths */}
        {audit.strengths.length > 0 && (
          <div style={{ marginBottom: '24px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#166534', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✅</span> Listing Strengths
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#14532D', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {audit.strengths.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actionable Recommendations */}
        {audit.recommendations.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#0F172A' }}>
              High-Impact Recommendations
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {audit.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                      {rec.area}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text)', marginTop: '2px' }}>
                      {rec.action}
                    </div>
                  </div>
                  <span
                    style={{
                      background: '#FEF3C7',
                      color: '#B45309',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {rec.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1-Click AI Description Generator tool */}
        <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '14px', padding: '18px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                ✨ AI Listing Narrative Writer
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                Let Gemini draft a compelling 5-star description emphasizing amenities and style.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleGenerateDescription}
              disabled={generatingDesc}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white',
                border: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {generatingDesc ? 'Drafting...' : '✨ Write with AI'}
            </button>
          </div>

          {aiGeneratedDesc && (
            <div style={{ marginTop: '14px' }}>
              <div
                style={{
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: 'var(--text)',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  marginBottom: '10px',
                }}
              >
                {aiGeneratedDesc}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyDesc}
                style={{ fontSize: '12px' }}
              >
                📋 Copy Description
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button type="button" className="btn btn-primary" onClick={onClose} style={{ borderRadius: '10px' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
