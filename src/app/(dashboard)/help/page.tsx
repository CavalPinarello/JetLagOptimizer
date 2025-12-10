'use client';

import { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  Sun,
  Moon,
  Pill,
  Coffee,
  Utensils,
  Dumbbell,
  Clock,
  Plane,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'General',
    question: 'How does JetLagOptimizer work?',
    answer:
      'JetLagOptimizer uses evidence-based circadian science to create personalized adjustment protocols. We estimate your internal clock timing based on your chronotype assessment, then calculate the optimal timing of light exposure, meals, exercise, and supplements to shift your circadian rhythm to match your destination timezone.',
  },
  {
    category: 'General',
    question: 'Why do I need to take a chronotype assessment?',
    answer:
      'Your chronotype (whether you are a morning or evening person) significantly affects when your circadian markers like DLMO and CBTmin occur. These markers determine when interventions like light exposure will advance or delay your clock. Without this information, recommendations would be generic rather than personalized.',
  },
  {
    category: 'General',
    question: 'How accurate are the DLMO estimates?',
    answer:
      'Our DLMO estimates are based on validated research correlating MEQ scores and sleep timing with laboratory measurements. While clinical DLMO measurement requires blood or saliva samples in controlled conditions, our estimates are typically within 30-60 minutes of actual values for most users.',
  },
  {
    category: 'Light',
    question: 'What is the "phase response curve" for light?',
    answer:
      'The Phase Response Curve (PRC) describes how light affects your circadian clock depending on when you see it. Light in the hours after your CBTmin (core body temperature minimum) advances your clock, making you sleepy earlier. Light before CBTmin delays your clock, making you sleepy later. This is why timing matters more than duration.',
  },
  {
    category: 'Light',
    question: 'How bright does light need to be?',
    answer:
      'For circadian effects, aim for 2,500-10,000 lux. Direct outdoor sunlight provides 10,000-100,000 lux even on cloudy days. Indoor lighting is typically only 300-500 lux. Light boxes designed for circadian adjustment provide 10,000 lux. Blue-enriched light is most effective, but broad-spectrum white light works well.',
  },
  {
    category: 'Light',
    question: 'Should I use blue light blocking glasses?',
    answer:
      'Yes, during your "light avoidance" windows. Blue light (480nm) is the most potent circadian signal. Wearing blue-light blocking (orange/red) glasses in the evening or during your delay window can prevent unwanted phase shifts. Look for glasses that block wavelengths below 530nm.',
  },
  {
    category: 'Melatonin',
    question: 'When should I take melatonin?',
    answer:
      'Melatonin for circadian shifting (not just sleep) should be taken 4-6 hours before your target bedtime. The melatonin PRC is roughly opposite to light: afternoon/evening melatonin advances your clock, while morning melatonin delays it. Lower doses (0.3-0.5mg) are often more effective for shifting than higher sleep doses.',
  },
  {
    category: 'Melatonin',
    question: 'What dose of melatonin is best?',
    answer:
      'For circadian shifting, research suggests 0.3-0.5mg is optimal. Higher doses (3-10mg) can cause grogginess and may actually be less effective for shifting. The goal is to mimic your natural melatonin rise, not overwhelm receptors. Always consult a healthcare provider before starting supplementation.',
  },
  {
    category: 'Travel',
    question: 'Is eastward or westward travel harder?',
    answer:
      'Eastward travel is generally harder because it requires phase advancing (going to sleep earlier), which works against our natural >24-hour circadian period. Most people can delay (westward) at about 1.5h/day but only advance (eastward) at about 1h/day without interventions.',
  },
  {
    category: 'Travel',
    question: 'Should I start adjusting before my trip?',
    answer:
      'Yes, if practical. Pre-departure adjustment can reduce the burden at your destination. For trips with >6 hours of shift, starting 2-3 days early with 30-60 minutes of daily shift can make a significant difference. Our protocols include pre-departure days when appropriate.',
  },
  {
    category: 'Travel',
    question: 'What about very long trips (>12 hours)?',
    answer:
      'For timezone shifts >12 hours, it may be faster to delay rather than advance (or vice versa) depending on the direction. Our algorithm automatically calculates whether advancing or delaying is optimal based on the total shift required.',
  },
  {
    category: 'Interventions',
    question: 'Why are meal times important?',
    answer:
      'Peripheral clocks in your liver, gut, and other organs are strongly influenced by meal timing. Eating at consistent times aligned with your target schedule helps synchronize these clocks with your central clock (SCN). Breakfast is particularly important as a morning zeitgeber.',
  },
  {
    category: 'Interventions',
    question: 'How does exercise affect circadian rhythm?',
    answer:
      'Exercise is a non-photic zeitgeber that can shift circadian phase. Morning exercise tends to advance the clock, while evening exercise can delay it. The effect is smaller than light but can reinforce other interventions. Avoid intense exercise close to bedtime as it can impair sleep.',
  },
  {
    category: 'Interventions',
    question: 'What about caffeine?',
    answer:
      'Caffeine blocks adenosine receptors, promoting alertness but also potentially disrupting circadian adjustment if consumed too late. Our protocols recommend a caffeine cutoff 6-8 hours before target bedtime. Strategic morning caffeine can help maintain alertness during the adjustment period.',
  },
];

const categories = ['General', 'Light', 'Melatonin', 'Travel', 'Interventions'];

const glossary = [
  { term: 'DLMO', definition: 'Dim Light Melatonin Onset - the time when melatonin levels begin rising under dim light conditions, typically 2 hours before habitual sleep onset.' },
  { term: 'CBTmin', definition: 'Core Body Temperature minimum - the nadir of the daily body temperature rhythm, typically occurring 2-3 hours before habitual wake time.' },
  { term: 'SCN', definition: 'Suprachiasmatic Nucleus - the master circadian clock in the brain, located in the hypothalamus.' },
  { term: 'Zeitgeber', definition: 'German for "time-giver" - environmental cues that synchronize internal clocks, including light, meals, exercise, and social activities.' },
  { term: 'Phase Advance', definition: 'Shifting the circadian clock earlier (going to sleep and waking earlier). Required for eastward travel.' },
  { term: 'Phase Delay', definition: 'Shifting the circadian clock later (going to sleep and waking later). Required for westward travel.' },
  { term: 'PRC', definition: 'Phase Response Curve - describes how the magnitude and direction of circadian shift depends on the timing of a stimulus (like light or melatonin).' },
  { term: 'Chronotype', definition: "An individual's natural preference for sleep/wake timing. Morning types ('larks') have earlier circadian phases than evening types ('owls')." },
  { term: 'MEQ', definition: 'Morningness-Eveningness Questionnaire - a validated 19-item assessment used to determine chronotype.' },
  { term: 'Peripheral Clocks', definition: 'Circadian oscillators in organs and tissues (liver, gut, muscles) that can be influenced by local cues like meals and exercise.' },
];

function Accordion({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left font-medium hover:text-primary transition-colors"
      >
        {question}
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-muted-foreground">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState<string>('General');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filteredFaqs = faqs.filter((faq) => faq.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Help & FAQ</h1>
        <p className="text-muted-foreground">
          Learn about circadian science and how to use JetLagOptimizer
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Sun, label: 'Light Therapy', desc: 'Understanding light timing' },
          { icon: Pill, label: 'Melatonin', desc: 'Supplementation guide' },
          { icon: Clock, label: 'Your Rhythm', desc: 'Circadian markers explained' },
          { icon: Plane, label: 'Travel Tips', desc: 'Pre & post-flight advice' },
        ].map(({ icon: Icon, label, desc }) => (
          <Card
            key={label}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => {
              const cat = label === 'Light Therapy' ? 'Light' :
                         label === 'Melatonin' ? 'Melatonin' :
                         label === 'Your Rhythm' ? 'General' : 'Travel';
              setActiveCategory(cat);
            }}
          >
            <CardContent className="pt-6">
              <Icon className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-medium">{label}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Select a category to explore common questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenQuestion(null);
                }}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="divide-y">
            {filteredFaqs.map((faq) => (
              <Accordion
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
                isOpen={openQuestion === faq.question}
                onToggle={() =>
                  setOpenQuestion(
                    openQuestion === faq.question ? null : faq.question
                  )
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Glossary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Glossary
          </CardTitle>
          <CardDescription>
            Key terms used in circadian science
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {glossary.map(({ term, definition }) => (
              <div key={term} className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-primary">{term}</p>
                <p className="text-sm text-muted-foreground">{definition}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scientific References */}
      <Card>
        <CardHeader>
          <CardTitle>Scientific References</CardTitle>
          <CardDescription>
            Key research papers informing our algorithms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-3">
            <p className="text-muted-foreground">
              JetLagOptimizer is built on peer-reviewed circadian research from 2015-2025. Key sources include:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span>
                  Burgess & Eastman (2008). Human tau in short days and long days. <em>J Biol Rhythms</em>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span>
                  Sack et al. (2007). Circadian rhythm sleep disorders. <em>Sleep</em>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span>
                  Revell & Eastman (2005). Phase response to melatonin. <em>Sleep Med Rev</em>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span>
                  Horne & Östberg (1976). MEQ questionnaire validation. <em>Int J Chronobiol</em>.
                </span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              Full bibliography available in our technical documentation.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Need More Help?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is here to assist you with any questions.
            </p>
            <Button variant="outline">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
