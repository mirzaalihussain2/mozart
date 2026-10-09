// Remix step 2 genres (CfRemix2.dc.html), in design order, with their stroke icons.

export type Genre = { name: string; icon: string };

export const GENRES: Genre[] = [
  { name: "Electronic", icon: "M2 12h3l2-6 4 12 3-9 2 3h6" },
  { name: "Pop punk", icon: "M13 2L4 14h7l-1 8 9-12h-7z" },
  {
    name: "Bollywood",
    icon: "M5 6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5-3.1-2.5-7-2.5S5 4.6 5 6zM5 6v11c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M7 8.2l3 10.6M17 8.2l-3 10.6",
  },
  { name: "Drill", icon: "M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" },
  { name: "Jazz", icon: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" },
  { name: "Country", icon: "M2 15c3 2.5 17 2.5 20 0M6 15.5C6 10 7.5 6 12 6s6 4 6 9.5M9 11h6" },
  {
    name: "Lo-fi",
    icon: "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM10 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM18 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18l1.5-3h5L16 18",
  },
  { name: "Metal", icon: "M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-4 9-2-1-3-3-3-3-1 2-2 4-2 6 0 4 3 7 7 7z" },
  {
    name: "Afrobeats",
    icon: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  },
  { name: "Classical", icon: "M10 21a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM13 18V3c2 1 6 2 6 6" },
  {
    name: "K-pop",
    icon: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z",
  },
  {
    name: "Disco",
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M4 7h16M4 17h16M12 2c-3 3-4 6.5-4 10s1 7 4 10M12 2c3 3 4 6.5 4 10s-1 7-4 10",
  },
];
