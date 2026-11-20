export type PublicUser = {
  id: number;
  username: string;
  name: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
};

export type Game = {
  id: number;
  title: string;
  platform: string;
  coverUrl: string | null;
  playtimeHours: number | null;
  notes: string | null;
  tags: string[];
  suggestedByName: string | null;
  createdAt: string;
};

export type GameWithVotes = Game & {
  voteCount: number;
  hasVoted: boolean;
};

export type Review = {
  id: number;
  rating: number;
  body: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
};

export type Assignment = {
  id: number;
  month: string;
  createdAt: string;
  game: Game;
  reviews: Review[];
  reviewCount: number;
  averageRating: number | null;
  myReview: Review | null;
};

export type DashboardData = {
  month: string;
  current: Assignment | null;
  upcoming: Array<{ month: string; game: Game }>;
  backlog: GameWithVotes[];
  recentReviews: Array<
    Review & { gameTitle: string; gameId: number; month: string }
  >;
  stats: { members: number; games: number; played: number; votes: number };
};

export type GameDetail = {
  game: Game;
  assignment: { id: number; month: string; reviewCount: number } | null;
  reviews: Review[];
  voteCount: number;
  hasVoted: boolean;
  openMonth: string;
};

export type MonthDetail = Assignment & { canReview: boolean };

export type PlayedMonth = {
  month: string;
  game: Game;
  reviewCount: number;
  averageRating: number | null;
  latestReview: Review | null;
};

export type PickData = {
  backlog: GameWithVotes[];
  current: Assignment | null;
  nextMonth: string;
};
