export type AnnouncementSettings = { enabled: boolean; text: string };
export type HeroSettings = {
  eyebrow: string;
  titleA: string;
  titleB: string;
  titleC: string;
  subtitle: string;
};
export type AboutSettings = {
  heading: string;
  paragraphs: string[];
  bullets: string[];
};
export type ContactSettings = {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  hours: string;
};
export type SocialSettings = {
  instagram: string;
  facebook: string;
  tripadvisor: string;
};

export type ImageSettings = {
  hero: string;
  about: string;
  permit: string;
  cta: string;
};

export type SiteSettings = {
  announcement: AnnouncementSettings;
  hero: HeroSettings;
  about: AboutSettings;
  contact: ContactSettings;
  social: SocialSettings;
  images: ImageSettings;
};

export const defaultSettings: SiteSettings = {
  announcement: {
    enabled: true,
    text: "Free hotel delivery around Nuwara Eliya · Hill-country 24/7 roadside assist · No hidden fees",
  },
  hero: {
    eyebrow: "Nuwara Eliya · Tea Country · Est. 2018",
    titleA: "RENT.",
    titleB: "RIDE.",
    titleC: "ROAM.",
    subtitle:
      "Scooters, motorbikes, tuk-tuks and SUVs — collect the keys in Nuwara Eliya and chase tea-green switchbacks, cloud forests and sunrise at World's End, entirely at your own pace.",
  },
  about: {
    heading: "A rental crew that actually rides the hills",
    paragraphs: [
      "Ceylon Ride Co. started in a tin-roofed garage just off Gregory Lake with three battered scooters and one belief: the best way to meet Nuwara Eliya is from the saddle, not a tour-bus window.",
      "Eight years on, ours is the youngest fleet in the hills — serviced in-house by certified mechanics, tracked by our roadside crew, and handed over with the mist-season route intel only locals carry.",
    ],
    bullets: [
      "Newest fleet in the hills — every bike under 3 years old",
      "Hill-country rescue: one call, any bend, any hour",
      "Transparent pricing — insurance & helmets always included",
      "Free rain gear & cold-morning layers with every rental",
    ],
  },
  contact: {
    email: "hello@ceylonride.co",
    phone: "+94 77 555 0134",
    whatsapp: "+94 77 555 0134",
    address: "17 Park Road, Nuwara Eliya 22200, Sri Lanka",
    hours: "Open daily · 6:30 – 20:00",
  },
  social: {
    instagram: "https://instagram.com/ceylonride",
    facebook: "https://facebook.com/ceylonride",
    tripadvisor: "https://tripadvisor.com/ceylonride",
  },
  images: {
    hero: "/img/hero.jpg",
    about: "/img/about.jpg",
    permit: "/img/permit.jpg",
    cta: "/img/cta.jpg",
  },
};
