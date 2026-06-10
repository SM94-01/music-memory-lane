import a1 from "@/assets/album-1.jpg";
import a2 from "@/assets/album-2.jpg";
import a3 from "@/assets/album-3.jpg";
import a4 from "@/assets/album-4.jpg";
import a5 from "@/assets/album-5.jpg";
import a6 from "@/assets/album-6.jpg";
import a7 from "@/assets/album-7.jpg";
import a8 from "@/assets/album-8.jpg";

export type Album = {
  id: string;
  title: string;
  artist: string;
  year: number;
  cover: string;
  avgRating: number;
  genre: string;
};

export const albums: Album[] = [
  { id: "blue-rev", title: "Blue Rev", artist: "Alvvays", year: 2022, cover: a1, avgRating: 4.2, genre: "Indie Rock" },
  { id: "the-overload", title: "The Overload", artist: "Yard Act", year: 2022, cover: a2, avgRating: 4.0, genre: "Post-Punk" },
  { id: "promises", title: "Promises", artist: "Floating Points", year: 2021, cover: a3, avgRating: 4.5, genre: "Jazz" },
  { id: "souvlaki", title: "Souvlaki", artist: "Slowdive", year: 1993, cover: a4, avgRating: 4.7, genre: "Shoegaze" },
  { id: "unknown-pleasures", title: "Unknown Pleasures", artist: "Joy Division", year: 1979, cover: a5, avgRating: 4.8, genre: "Post-Punk" },
  { id: "to-pimp", title: "To Pimp a Butterfly", artist: "Kendrick Lamar", year: 2015, cover: a6, avgRating: 4.9, genre: "Hip-Hop" },
  { id: "for-emma", title: "For Emma, Forever Ago", artist: "Bon Iver", year: 2007, cover: a7, avgRating: 4.4, genre: "Folk" },
  { id: "untrue", title: "Untrue", artist: "Burial", year: 2007, cover: a8, avgRating: 4.6, genre: "Electronic" },
];

export const getAlbum = (id: string) => albums.find((a) => a.id === id);

export type Activity = {
  id: string;
  user: string;
  action: "listened to" | "rated" | "reviewed" | 'saved to "Vinyl Wishlist"';
  albumId: string;
  rating?: number;
  review?: string;
  likes: number;
  comments: number;
  time: string;
};

export const feed: Activity[] = [
  {
    id: "1", user: "Marcus", action: "listened to", albumId: "the-overload",
    rating: 5, review: "A razor-sharp post-punk debut that actually has something to say about modern Britain. Essential.",
    likes: 24, comments: 4, time: "2h",
  },
  {
    id: "2", user: "Elena", action: 'saved to "Vinyl Wishlist"', albumId: "promises",
    likes: 12, comments: 1, time: "5h",
  },
  {
    id: "3", user: "Sasha", action: "reviewed", albumId: "souvlaki",
    rating: 5, review: "Still the gold standard for shoegaze. Every guitar is a memory.",
    likes: 41, comments: 8, time: "1d",
  },
  {
    id: "4", user: "Theo", action: "listened to", albumId: "to-pimp",
    rating: 5, likes: 33, comments: 6, time: "1d",
  },
];

export const diary = [
  {
    month: "October 2024", current: true,
    entries: [
      { albumId: "souvlaki", rating: 5, date: "12 Oct" },
      { albumId: "the-overload", rating: 4, date: "08 Oct" },
      { albumId: "promises", rating: 5, date: "03 Oct" },
    ],
  },
  {
    month: "September 2024", current: false,
    entries: [
      { albumId: "unknown-pleasures", rating: 5, date: "28 Sep" },
      { albumId: "for-emma", rating: 4, date: "14 Sep" },
    ],
  },
  {
    month: "August 2024", current: false,
    entries: [
      { albumId: "blue-rev", rating: 4, date: "22 Aug" },
      { albumId: "untrue", rating: 5, date: "11 Aug" },
    ],
  },
];

export const profile = {
  handle: "Archivist_01",
  name: "Jamie Rivera",
  identity: "Post-Punk Purist",
  bio: "Cataloging the records that built me. Friends with taste over algorithms.",
  stats: { tracked: 1248, reviews: 312, followers: 489, following: 217 },
  topAlbums: ["souvlaki", "unknown-pleasures", "the-overload", "untrue"],
  topGenres: ["Post-Punk", "Shoegaze", "Electronic"],
  topArtists: ["The Cure", "Slowdive", "Burial"],
};

export const toListen = ["promises", "for-emma", "blue-rev"];
