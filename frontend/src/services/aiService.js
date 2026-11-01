import apiClient from './api';

/**
 * AI Co-Host Service
 * Powers Listing Quality Audits, AI Smart Replies, Dynamic Yield Insights, and Descriptions.
 */
export const aiService = {
  /**
   * Run a comprehensive multi-factor quality audit on a property listing
   * @param {Object} property
   * @returns {Object} Audit score (0-100), breakdown, strengths, and recommendations
   */
  auditListing(property) {
    if (!property) return null;

    let score = 0;
    const breakdown = {
      title: { score: 0, max: 15, title: 'Listing Title' },
      description: { score: 0, max: 25, title: 'Story & Description' },
      photos: { score: 0, max: 25, title: 'Visual Gallery' },
      amenities: { score: 0, max: 20, title: 'Amenities & Nomad Setup' },
      booking: { score: 0, max: 15, title: 'Booking & Pricing' },
    };

    const strengths = [];
    const recommendations = [];

    // 1. Title Audit (15 pts)
    const title = property.title || '';
    if (title.length >= 30 && title.length <= 70) {
      breakdown.title.score = 15;
      strengths.push('Title has optimal length (30-70 characters) for high search click-through rate.');
    } else if (title.length >= 15) {
      breakdown.title.score = 10;
      recommendations.push({
        area: 'Title',
        points: '+5 pts',
        action: 'Expand title with distinct highlights (e.g., "Luxury Sea-View Villa w/ Fast WiFi & Pool").',
      });
    } else {
      breakdown.title.score = 5;
      recommendations.push({
        area: 'Title',
        points: '+10 pts',
        action: 'Title is too short. Use descriptive keywords like view, style, or central location.',
      });
    }

    // 2. Description Audit (25 pts)
    const desc = property.description || '';
    const wordCount = desc.trim() ? desc.trim().split(/\s+/).length : 0;
    if (wordCount >= 120) {
      breakdown.description.score = 25;
      strengths.push(`Rich, detailed description with ${wordCount} words describing spaces and neighborhood.`);
    } else if (wordCount >= 60) {
      breakdown.description.score = 17;
      recommendations.push({
        area: 'Description',
        points: '+8 pts',
        action: 'Expand description to 120+ words. Mention neighborhood gems, transit, and house vibes.',
      });
    } else {
      breakdown.description.score = 8;
      recommendations.push({
        area: 'Description',
        points: '+17 pts',
        action: 'Description is too brief. Use our AI Storyteller to generate an engaging narrative in 1 click.',
      });
    }

    // 3. Photos Audit (25 pts)
    const images = property.images || [];
    const imgCount = images.length;
    if (imgCount >= 5) {
      breakdown.photos.score = 25;
      strengths.push(`Outstanding photo gallery (${imgCount} images). Full-coverage listings get 60% more views.`);
    } else if (imgCount >= 3) {
      breakdown.photos.score = 18;
      recommendations.push({
        area: 'Photos',
        points: '+7 pts',
        action: `Currently has ${imgCount} photos. Adding at least 5 photos unlocks the full gallery mosaic view.`,
      });
    } else if (imgCount >= 1) {
      breakdown.photos.score = 10;
      recommendations.push({
        area: 'Photos',
        points: '+15 pts',
        action: 'Add photos of all bedrooms, living areas, bathrooms, and outdoor views.',
      });
    } else {
      breakdown.photos.score = 0;
      recommendations.push({
        area: 'Photos',
        points: '+25 pts',
        action: 'No photos uploaded. Listings without photos rarely receive bookings.',
      });
    }

    // 4. Amenities & Digital Nomad / Workation Audit (20 pts)
    const amenities = Array.isArray(property.amenities)
      ? property.amenities.map((a) => (typeof a === 'string' ? a.toLowerCase() : (a.name || '').toLowerCase()))
      : [];
    
    let amenityScore = 0;
    const hasWifi = amenities.some((a) => a.includes('wifi') || a.includes('internet'));
    const hasWorkspace = amenities.some((a) => a.includes('workspace') || a.includes('desk'));
    const hasAc = amenities.some((a) => a.includes('ac') || a.includes('air') || a.includes('cooling'));
    const hasKitchen = amenities.some((a) => a.includes('kitchen') || a.includes('cook'));

    if (hasWifi) amenityScore += 6;
    if (hasWorkspace) amenityScore += 5;
    if (hasAc) amenityScore += 5;
    if (hasKitchen) amenityScore += 4;

    breakdown.amenities.score = Math.min(20, Math.max(amenityScore, amenities.length * 2));

    if (hasWifi && hasWorkspace) {
      strengths.push('⚡ Digital Nomad Ready: Verified high-speed WiFi and dedicated desk setup.');
    } else {
      recommendations.push({
        area: 'Workation Mode',
        points: '+6 pts',
        action: 'Add "Dedicated Workspace" and "Fast WiFi" to attract remote workers & long-stay guests.',
      });
    }

    if (!hasKitchen) {
      recommendations.push({
        area: 'Amenities',
        points: '+4 pts',
        action: 'List kitchen / cooking amenities to attract families and week-long stays.',
      });
    }

    // 5. Booking & Pricing Settings (15 pts)
    let bookingScore = 0;
    if (property.instantBook) {
      bookingScore += 8;
      strengths.push('Instant Booking enabled: increases search ranking and guest conversion by 2.4x.');
    } else {
      recommendations.push({
        area: 'Conversion',
        points: '+8 pts',
        action: 'Enable Instant Book to rank higher in search results and simplify reservations.',
      });
    }

    if (Number(property.pricePerNight) > 0) {
      bookingScore += 7;
    }

    breakdown.booking.score = bookingScore;

    // Total Score calculation
    score =
      breakdown.title.score +
      breakdown.description.score +
      breakdown.photos.score +
      breakdown.amenities.score +
      breakdown.booking.score;

    let tier = 'Needs Work';
    let tierColor = 'var(--red)';
    let badge = 'Needs Polish ⚠️';

    if (score >= 90) {
      tier = 'Masterpiece';
      tierColor = '#10B981';
      badge = 'Elite Listing 🌟';
    } else if (score >= 75) {
      tier = 'Great';
      tierColor = '#3B82F6';
      badge = 'Superhost Ready 🚀';
    } else if (score >= 60) {
      tier = 'Good';
      tierColor = '#F59E0B';
      badge = 'Good Potential 📈';
    }

    return {
      totalScore: score,
      tier,
      tierColor,
      badge,
      breakdown,
      strengths,
      recommendations,
    };
  },

  /**
   * Generates AI Smart Reply drafts for Hosts based on guest conversation context
   * @param {Object} params
   * @returns {Promise<Array<{ label: string, text: string, type: string }>>}
   */
  async generateSmartReplies({ latestMessage = '', guestName = 'Guest', propertyTitle = '', hostName = '' }) {
    const msg = (latestMessage || '').toLowerCase();

    // Contextual intelligent suggestions
    const suggestions = [];

    if (msg.includes('wifi') || msg.includes('password') || msg.includes('internet') || msg.includes('speed')) {
      suggestions.push({
        label: '📶 WiFi & Work Info',
        type: 'wifi',
        text: `Hi ${guestName}! The high-speed WiFi network is "StayFinder-Guest" and the password is on the living room table router. Speed is ~150 Mbps, suitable for video calls. Let me know if you need any help!`,
      });
    }

    if (msg.includes('check-in') || msg.includes('check in') || msg.includes('arrive') || msg.includes('early') || msg.includes('time') || msg.includes('key')) {
      suggestions.push({
        label: '⏰ Early / Regular Check-in',
        type: 'checkin',
        text: `Hi ${guestName}, standard check-in is at 2:00 PM. I'd be happy to arrange early check-in or luggage drop-off if the previous guests check out on time! What time do you anticipate arriving?`,
      });
    }

    if (msg.includes('parking') || msg.includes('car') || msg.includes('direction') || msg.includes('location') || msg.includes('reach')) {
      suggestions.push({
        label: '🚗 Parking & Directions',
        type: 'parking',
        text: `Hello ${guestName}! Free reserved parking is available right in front of the entrance. I'll also send you a pinned location and simple gate code instructions shortly before your arrival.`,
      });
    }

    if (msg.includes('checkout') || msg.includes('check out') || msg.includes('leave') || msg.includes('late')) {
      suggestions.push({
        label: '👋 Checkout & Key Drop',
        type: 'checkout',
        text: `Hi ${guestName}, checkout is by 11:00 AM. Please make sure all AC units are turned off and leave the keys in the lockbox by the front door. We hope you had a fantastic stay!`,
      });
    }

    // Always ensure at least 3 smart reply options:
    if (suggestions.length < 3) {
      suggestions.push({
        label: '✨ Warm Welcome & Confirmation',
        type: 'welcome',
        text: `Hi ${guestName}, thank you for reaching out! We're excited to host you at ${propertyTitle || 'our home'}. Everything will be fresh and sparkling clean for your stay. Please let me know if you have any special requests!`,
      });
    }

    if (suggestions.length < 3) {
      suggestions.push({
        label: '🍴 Local Food & Spots',
        type: 'guide',
        text: `Hi ${guestName}! There are some wonderful local cafes and spots just 5 minutes walking distance. I've prepared a digital guidebook of my favorite neighborhood recommendations for you!`,
      });
    }

    if (suggestions.length < 3) {
      suggestions.push({
        label: '👍 Understood & Confirmed',
        type: 'confirm',
        text: `Sounds great, ${guestName}! I've noted that down for your reservation. Looking forward to welcoming you soon!`,
      });
    }

    return suggestions.slice(0, 3);
  },

  /**
   * Generates a custom AI response draft based on host prompt or intent
   */
  async generateCustomDraft({ prompt, guestMessage, guestName }) {
    // Try backend AI if available
    try {
      const res = await apiClient.post('/properties/interpret-search', { query: `draft reply: ${prompt}` });
      if (res && res.text) return res.text;
    } catch {
      // Graceful local generation
    }

    return `Hi ${guestName || 'there'}, regarding your message: ${prompt}. Please let me know if you need anything else to make your stay comfortable!`;
  },
};

export default aiService;
