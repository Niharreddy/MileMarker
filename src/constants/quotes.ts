export type Quote = {
  text: string;
  author: string;
};

/** Short, widely-attributed travel/memory quotes shown on the welcome screen. */
export const TRAVEL_QUOTES: Quote[] = [
  { text: "The world is a book, and those who do not travel read only one page.", author: "Saint Augustine" },
  { text: "We travel not to escape life, but for life not to escape us.", author: "Unknown" },
  { text: "Memory is the diary we all carry about with us.", author: "Oscar Wilde" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { text: "To travel is to live.", author: "Hans Christian Andersen" },
  { text: "The journey, not the arrival, matters.", author: "T.S. Eliot" },
];

export function getRandomQuote(): Quote {
  const index = Math.floor(Math.random() * TRAVEL_QUOTES.length);
  // Safe: index is always within [0, TRAVEL_QUOTES.length).
  return TRAVEL_QUOTES[index]!;
}
