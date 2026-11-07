import { asc } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers, bikes, blogPosts, bookings, testimonials } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { pickupLocations } from "@/lib/utils";

function iso(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * 86400000).toISOString().slice(0, 10);
}

const fleetData = [
  {
    name: "Urban Glide 125",
    slug: "urban-glide-125",
    category: "scooter",
    tagline: "The town-to-lake hopper",
    description:
      "Twist-and-go freedom for Gregory Lake loops, strawberry-farm runs and café stops around town. The Urban Glide sips fuel, shrugs at cold mornings and swallows a full-face helmet under the seat.",
    engineCc: 125,
    transmission: "Automatic",
    seats: 2,
    luggage: "Under-seat box + rear rack",
    pricePerDay: 9,
    deposit: 100,
    features: ["USB charger", "Phone holder", "Top box", "Two helmets", "Full insurance"],
    imageUrl: "/img/bikes/pcx.jpg",
    featured: true,
    sortOrder: 1,
  },
  {
    name: "Trail Blazer 150",
    slug: "trail-blazer-150",
    category: "motorbike",
    tagline: "Dirt-curious dual sport",
    description:
      "A lightweight dual-sport that laughs at gravel tea-estate tracks, mist-soaked climbs and monsoon puddles. Tall stance, forgiving clutch, knobby tyres — built for the byroads above 1,800 metres.",
    engineCc: 150,
    transmission: "Manual · 5-speed",
    seats: 2,
    luggage: "Soft pannier rails",
    pricePerDay: 14,
    deposit: 150,
    features: ["Dual-sport tyres", "Crash bars", "Phone mount", "Tool kit", "Full insurance"],
    imageUrl: "/img/bikes/trail.jpg",
    featured: false,
    sortOrder: 2,
  },
  {
    name: "Coastal Scrambler 250",
    slug: "coastal-scrambler-250",
    category: "motorbike",
    tagline: "Retro looks, hill-country soul",
    description:
      "Our most photographed bike. The Scrambler pairs classic lines with a torquey 250 single that pulls happily up every tea-country switchback. Sounds like adventure, rides like a slow tea-estate morning.",
    engineCc: 250,
    transmission: "Manual · 5-speed",
    seats: 2,
    luggage: "Leather side bags",
    pricePerDay: 22,
    deposit: 200,
    features: ["Retro bench seat", "LED conversion", "Side bags", "Two helmets", "Full insurance"],
    imageUrl: "/img/bikes/scrambler.jpg",
    featured: true,
    sortOrder: 3,
  },
  {
    name: "Horizon ADV 500",
    slug: "horizon-adv-500",
    category: "motorbike",
    tagline: "The long-haul legend",
    description:
      "For riders pushing beyond the hills. A 471cc twin with hard panniers, tall screen and heated grips for 5am Horton Plains runs. Nuwara Eliya to Ella and back without a single complaint.",
    engineCc: 500,
    transmission: "Manual · 6-speed",
    seats: 2,
    luggage: "3 hard cases included",
    pricePerDay: 39,
    deposit: 400,
    features: ["Hard panniers + top case", "Tall windscreen", "Heated grips", "12V + USB", "Full insurance"],
    imageUrl: "/img/bikes/adv.jpg",
    featured: true,
    sortOrder: 4,
  },
  {
    name: "Tuk-Tuk Voyager",
    slug: "tuk-tuk-voyager",
    category: "tuktuk",
    tagline: "Drive the icon yourself",
    description:
      "Yes, you can drive it. Our Voyager tuk-tuks get a full safety kit, rain curtains for the mist, and a 90-minute driving lesson on quiet backroads before handover. The best story you'll take home from the hills.",
    engineCc: 200,
    transmission: "Manual · 4-speed",
    seats: 3,
    luggage: "Rear cargo deck + roof rack",
    pricePerDay: 18,
    deposit: 150,
    features: ["Driving lesson included", "Rain curtains", "Bluetooth speaker", "Cool box", "Full insurance"],
    imageUrl: "/img/bikes/tuktuk.jpg",
    featured: true,
    sortOrder: 5,
  },
  {
    name: "Island Cruiser SUV",
    slug: "island-cruiser-suv",
    category: "car",
    tagline: "Family-sized exploration",
    description:
      "Heated seats, fog lamps and a boot that swallows four backpacks — perfect for families chasing waterfalls between Ramboda and Haputale, or anyone who fancies the hills without the helmet hair.",
    engineCc: 1500,
    transmission: "Automatic",
    seats: 5,
    luggage: "420L boot",
    pricePerDay: 58,
    deposit: 500,
    features: ["Full AC + heating", "Reverse camera", "Apple CarPlay", "Child seat on request", "Full insurance"],
    imageUrl: "/img/bikes/suv.jpg",
    featured: false,
    sortOrder: 6,
  },
];

const testimonialData = [
  ["Sophie Marchetti", "France", 5, "Two weeks on the Scrambler between Pedro Estate and the Horton Plains road — the bike never missed a beat and their mist-season route notes were pure gold.", "Coastal Scrambler 250"],
  ["Jonas Weber", "Germany", 5, "Booked the tuk-tuk for ten days. The driving lesson had me confident in an hour; the crew even drove out with a spare key near Ramboda Falls at 9pm. Legends.", "Tuk-Tuk Voyager"],
  ["Amelia Hart", "United Kingdom", 5, "Scooter was basically new, helmets and rain gear included, and they delivered it to our guesthouse before breakfast. This is how every rental should work.", "Urban Glide 125"],
  ["Diego Ramírez", "Spain", 4, "ADV 500 ate up the full tea-country loop — 700 km of switchbacks, zero issues. Deposit returned the same hour I dropped the keys.", "Horizon ADV 500"],
  ["Mark Chen", "Singapore", 5, "Pending approval demo: pickup at Nanu Oya station was smooth and the bike condition excellent.", "Trail Blazer 150"],
] as const;

/** Idempotently seed the database — safe to call on every request. */
export async function seedIfEmpty() {
  const bikeCount = await db.$count(bikes);

  if (bikeCount === 0) {
    await db.insert(bikes).values(fleetData);
    const fleet = await db
      .select({ id: bikes.id, pricePerDay: bikes.pricePerDay })
      .from(bikes)
      .orderBy(asc(bikes.sortOrder));

    await db.insert(testimonials).values(
      testimonialData.map(([name, country, rating, content, bikeName], i) => ({
        name,
        country,
        rating,
        content,
        bikeName,
        approved: i < 4,
      })),
    );

    const people = [
      "Elena Rossi", "Tom Becker", "Priya Nair", "Lucas Silva", "Hannah Kim", "Omar Farouk",
      "Ingrid Olsen", "Sam Turner", "Chloe Dubois", "Ravi Patel", "Marta Kowalska", "Ben Carter",
      "Aya Tanaka", "Felix Braun", "Nina Petrov", "Jack Wilson",
    ];
    const statuses = [
      "completed", "completed", "confirmed", "completed", "pending", "completed", "confirmed",
      "completed", "completed", "active", "cancelled", "completed", "confirmed", "completed",
      "pending", "completed",
    ];

    let ref = 1000;
    await db.insert(bookings).values(
      people.map((person, i) => {
        const bike = fleet[i % fleet.length];
        const startOffset = -22 + i * 2;
        const days = 3 + (i % 5);
        ref += 7;
        return {
          reference: `CR-${ref}`,
          bikeId: bike.id,
          customerName: person,
          email: `${person.toLowerCase().replace(/\s/g, ".")}@example.com`,
          phone: `+94 7${i} 555 0${10 + i}`,
          pickupDate: iso(startOffset),
          returnDate: iso(startOffset + days),
          pickupLocation: pickupLocations[i % pickupLocations.length],
          licenseCountry: ["Italy", "Germany", "India", "Brazil", "South Korea"][i % 5],
          partySize: 1 + (i % 3),
          message: "",
          totalDays: days,
          totalPrice: days * bike.pricePerDay,
          status: statuses[i],
        };
      }),
    );
  }

  const postCount = await db.$count(blogPosts);
  if (postCount === 0) {
    await db.insert(blogPosts).values([
      {
        title: "The Tea Country Loop: 46km that beat every bus tour",
        slug: "tea-country-loop-46km",
        excerpt:
          "Pedro Estate at dawn, a waterfall picnic at Lovers Leap, and the grassland silence of Moon Plains — our favourite half-day ride out of Nuwara Eliya, turn by turn.",
        coverImage: "/img/about.jpg",
        category: "Routes",
        tags: ["Day ride", "Beginner friendly", "Tea estates"],
        readMinutes: 6,
        published: true,
        featured: true,
        content: `There is a moment, about eleven minutes after you leave our garage on Park Road, where the town noise simply stops. The road tilts upward, the air drops three degrees, and suddenly you are riding through corridors of waist-high tea bushes with pickers waving from the slope above you.

## Start early — the mist has a schedule

Leave by 6:30am. The cloud that swallows these hills usually rolls in around 10am and by noon you will be riding inside a grey tunnel. Early starts also mean empty roads: no buses, no lorries, just you and the occasional tuk-tuk ferrying tea leaf.

## Stop 1 — Pedro Tea Estate

Four kilometres out of town, the Pedro factory has been running since 1885. The tour costs almost nothing and takes thirty minutes, but the real reason to stop is the terrace behind the shop: a cup of unblended BOP and a view across the whole valley you just climbed.

## Stop 2 — Lovers Leap Falls

Park at the trailhead and walk the last ten minutes. The fall is thin but tall, and the pool at the base is bitterly cold — which is the point, after a climb with the engine warm between your knees.

## Stop 3 — Moon Plains

This is the one people remember. A short, rough track lifts you onto open grassland at 2,000 metres with sambar deer grazing and a horizon that, on a clear day, reaches all the way to Adam's Peak.

- Total distance: 46 km
- Riding time: around 2.5 hours
- Best bike: anything — the Urban Glide 125 handles it fine
- Bring: a windproof layer, more than you think you need

Ride it slowly. The whole point of renting your own wheels here is that nobody is waiting for you in a minibus.`,
      },
      {
        title: "Riding in the mist: how to handle Nuwara Eliya weather",
        slug: "riding-in-the-mist",
        excerpt:
          "Visibility drops to ten metres in about ninety seconds up here. Eight hard-won habits from our mechanics and guides for riding hill-country cloud safely.",
        coverImage: "/img/cta.jpg",
        category: "Safety",
        tags: ["Safety", "Weather", "Hill country"],
        readMinutes: 5,
        published: true,
        featured: false,
        content: `Nuwara Eliya sits at 1,868 metres. That altitude is exactly why the tea grows, why the nights are cold, and why the weather can change faster than anywhere else on the island.

## Mist is not rain — treat it differently

Rain reduces grip. Mist reduces *information*. You can have perfect tyre grip and still be in real danger because you cannot see the bend, the dog, or the oncoming lorry.

## The eight habits

1. **Ride on the left edge line.** It is your handrail when the world turns white.
2. **Low beam only.** High beam reflects off water droplets straight back into your eyes.
3. **Hazard lights on** when visibility drops under about twenty metres.
4. **Wipe your visor with a bare thumb** every minute — mist builds a film fast.
5. **Brake earlier and lighter** than instinct says; painted lines get greasy.
6. **Horn before blind bends.** Everyone here does it. It is communication, not aggression.
7. **Never stop on the road** to take a photo. Find a pull-off, even if it costs you the shot.
8. **If it closes in completely, stop for tea.** It usually clears within forty minutes.

## What we give you

Every Ceylon Ride rental includes rain gear and an anti-fog visor wipe, and we brief you each morning on the day's mist window before you ride out. If the weather genuinely turns, call us — we would far rather come and get you than have you push on.`,
      },
      {
        title: "Permit, licence, police: the paperwork, explained simply",
        slug: "sri-lanka-riding-paperwork",
        excerpt:
          "What you actually need to legally ride a motorbike or tuk-tuk in Sri Lanka — and how we handle the Automobile Association endorsement for you before you arrive.",
        coverImage: "/img/permit.jpg",
        category: "Guides",
        tags: ["Permits", "Legal", "Planning"],
        readMinutes: 4,
        published: true,
        featured: false,
        content: `The rules here are simpler than the internet suggests, but they are real and the police do check, particularly on the Nuwara Eliya–Ella road.

## What you need

- Your home country driving licence (motorcycle category for bikes over 50cc)
- An International Driving Permit from the 1949 convention
- A Sri Lankan recognition permit endorsed by the Automobile Association of Ceylon

That third item is the one travellers miss. Without it, your IDP alone is not sufficient and your insurance can be challenged after an accident.

## How we handle it

Send us photographs of your licence and IDP when you book. We lodge the endorsement with the AA and it is ready for collection with your keys. It costs $40 and takes about 48 hours.

## At a checkpoint

Be polite, switch the engine off, remove your helmet, and hand over the documents together in a plastic sleeve. Ninety-nine times out of a hundred you will be waved on in under two minutes.

## One honest warning

Ride within the law and within your ability. Hospitals here are good but distant from the hills, and an uninsured rider is an expensive problem. Everything we rent includes comprehensive cover — keep it that way by keeping your paperwork straight.`,
      },
    ]);
  }

  const adminCount = await db.$count(adminUsers);
  if (adminCount === 0) {
    const email = (process.env.ADMIN_EMAIL || "admin@ceylonride.co").trim().toLowerCase();
    const name = (process.env.ADMIN_NAME || "Fleet Manager").trim();
    const password = process.env.ADMIN_PASSWORD || "rideadmin123";
    await db.insert(adminUsers).values({
      email,
      name,
      passwordHash: hashPassword(password),
    });
    if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === "production") {
      console.warn("ADMIN_PASSWORD is not configured; using the sandbox fallback. Set it before public launch.");
    }
  }
}
