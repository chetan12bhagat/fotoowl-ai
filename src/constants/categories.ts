import { CategoryInfo } from '../types/photo';

/**
 * Eight realistic photography categories for FotoOwl.AI.
 * Ordered per specifications:
 * 1. Weddings
 * 2. Engagements
 * 3. Birthday Parties
 * 4. Corporate Events
 * 5. Music Festivals
 * 6. Sports
 * 7. School Events
 * 8. Travel & Celebrations
 */
export const PHOTO_CATEGORIES: CategoryInfo[] = [
  {
    id: 'weddings',
    title: 'Weddings',
    subtitle: 'Ceremonies, mandap rituals & candid nuptial celebrations',
    imageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop',
    countLabel: '1.2k+ Moments',
    tags: ['wedding', 'weddings', 'marriage', 'bride', 'groom', 'nuptial', 'mandap', 'ceremony', 'reception', 'candid', 'love', 'couple'],
  },
  {
    id: 'engagements',
    title: 'Engagements',
    subtitle: 'Ring exchanges, pre-wedding sessions & couple portraits',
    imageUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop',
    countLabel: '510+ Moments',
    tags: ['engagement', 'engagements', 'ring', 'couple', 'pre-wedding', 'portrait', 'romance', 'proposal', 'pair'],
  },
  {
    id: 'birthday_parties',
    title: 'Birthday Parties',
    subtitle: 'Cake cutting, joyful milestones & family celebrations',
    imageUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800&auto=format&fit=crop',
    countLabel: '730+ Moments',
    tags: ['birthday', 'birthdays', 'party', 'parties', 'cake', 'celebration', 'kids', 'milestone', 'family', 'bday'],
  },
  {
    id: 'corporate_events',
    title: 'Corporate Events',
    subtitle: 'Executive summits, keynote addresses & award galas',
    imageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
    countLabel: '420+ Moments',
    tags: ['corporate', 'business', 'summit', 'conference', 'keynote', 'executive', 'award', 'gala', 'office', 'company', 'seminar'],
  },
  {
    id: 'music_festivals',
    title: 'Music Festivals',
    subtitle: 'Electrifying mainstages, live bands & festival crowds',
    imageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    countLabel: '730+ Moments',
    tags: ['music', 'festival', 'festivals', 'concert', 'concerts', 'band', 'stage', 'dj', 'crowd', 'live', 'show', 'edm', 'gig'],
  },
  {
    id: 'sports',
    title: 'Sports',
    subtitle: 'Championship athletics, football matches & victory moments',
    imageUrl:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop',
    countLabel: '670+ Moments',
    tags: ['sports', 'sport', 'football', 'soccer', 'athlete', 'athletes', 'athletic', 'athletics', 'championship', 'match', 'game', 'fitness', 'run', 'tournament'],
  },
  {
    id: 'school_events',
    title: 'School Events',
    subtitle: 'Graduation ceremonies, annual days & sports meets',
    imageUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
    countLabel: '390+ Moments',
    tags: ['school', 'college', 'graduation', 'university', 'annual day', 'students', 'education', 'convocation', 'campus', 'degree'],
  },
  {
    id: 'travel_celebrations',
    title: 'Travel & Celebrations',
    subtitle: 'Destination retreats, outdoor soirees & scenic gatherings',
    imageUrl:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
    countLabel: '560+ Moments',
    tags: ['travel', 'vacation', 'celebration', 'destination', 'holiday', 'trip', 'outdoor', 'scenic', 'nature', 'landscape', 'journey', 'tour'],
  },
];
