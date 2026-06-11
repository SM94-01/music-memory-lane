import a1 from "@/assets/album-1.jpg";
import a2 from "@/assets/album-2.jpg";
import a3 from "@/assets/album-3.jpg";
import a4 from "@/assets/album-4.jpg";
import a5 from "@/assets/album-5.jpg";
import a6 from "@/assets/album-6.jpg";
import a7 from "@/assets/album-7.jpg";
import a8 from "@/assets/album-8.jpg";

export const mockCovers: Record<string, string> = {
  "blue-rev": a1,
  "the-overload": a2,
  promises: a3,
  souvlaki: a4,
  "unknown-pleasures": a5,
  "to-pimp": a6,
  "for-emma": a7,
  untrue: a8,
};

export const mockAlbums = [
  { id: "blue-rev", title: "Blue Rev", artist: "Alvvays", year: 2022, genre: "Indie Rock" },
  { id: "the-overload", title: "The Overload", artist: "Yard Act", year: 2022, genre: "Post-Punk" },
  { id: "promises", title: "Promises", artist: "Floating Points", year: 2021, genre: "Jazz" },
  { id: "souvlaki", title: "Souvlaki", artist: "Slowdive", year: 1993, genre: "Shoegaze" },
  { id: "unknown-pleasures", title: "Unknown Pleasures", artist: "Joy Division", year: 1979, genre: "Post-Punk" },
  { id: "to-pimp", title: "To Pimp a Butterfly", artist: "Kendrick Lamar", year: 2015, genre: "Hip-Hop" },
  { id: "for-emma", title: "For Emma, Forever Ago", artist: "Bon Iver", year: 2007, genre: "Folk" },
  { id: "untrue", title: "Untrue", artist: "Burial", year: 2007, genre: "Electronic" },
];

export function mockCoverFor(key: string): string | undefined {
  return mockCovers[key];
}
export function getMockAlbum(key: string) {
  return mockAlbums.find((a) => a.id === key);
}

export const GENRES = [
  "Alternative", "Ambient", "Blues", "Classical", "Country", "Dance", "Drum and Bass", "Dub",
  "Electronic", "Experimental", "Folk", "Funk", "Garage", "Grunge", "Hip-Hop", "House",
  "Indie Pop", "Indie Rock", "Industrial", "Jazz", "Krautrock", "Lo-Fi", "Metal", "Minimal",
  "New Wave", "Noise", "Pop", "Post-Punk", "Post-Rock", "Progressive", "Psychedelic", "Punk",
  "R&B", "Reggae", "Rock", "Shoegaze", "Soul", "Soundtrack", "Synthwave", "Techno", "Trip-Hop", "World",
];
