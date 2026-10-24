import type { LocalizedText } from '@/types';

/**
 * SAMPLE CONTENT — these are illustrative placeholder reviews written for the
 * demo, not real customer feedback. The UI labels them as samples. Replace with
 * verified reviews from a review backend before publishing.
 */
export interface SampleReview {
  id: string;
  name: string;
  city: LocalizedText;
  rating: number;
  text: LocalizedText;
}

export const sampleReviews: SampleReview[] = [
  {
    id: 's1',
    name: 'Sample A.',
    city: { uz: 'Toshkent', ru: 'Ташкент', en: 'Tashkent' },
    rating: 5,
    text: {
      uz: 'Narxlarni bir joyda solishtirish va depozitni oldindan bilish juda qulay boʻldi.',
      ru: 'Очень удобно сравнить цены в одном месте и заранее знать размер депозита.',
      en: 'Handy to compare prices in one place and know the deposit in advance.',
    },
  },
  {
    id: 's2',
    name: 'Sample B.',
    city: { uz: 'Samarqand', ru: 'Самарканд', en: 'Samarkand' },
    rating: 4,
    text: {
      uz: 'Hisob-kitob kunlar qanday hisoblanishini aniq tushuntirib berdi.',
      ru: 'Калькулятор понятно объяснил, как считаются сутки аренды.',
      en: 'The calculator clearly explained how rental days are counted.',
    },
  },
  {
    id: 's3',
    name: 'Sample C.',
    city: { uz: 'Toshkent', ru: 'Ташкент', en: 'Tashkent' },
    rating: 5,
    text: {
      uz: 'Kvitansiyani PDF qilib yuklab olib, provayderga yubordim.',
      ru: 'Скачал расчёт в PDF и отправил прокатчику.',
      en: 'I downloaded the estimate as a PDF and sent it to the provider.',
    },
  },
];
