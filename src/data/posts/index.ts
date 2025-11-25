import { testPost } from './test';
import { post8 } from './post-8';
import { post7 } from './post-7';
import { post1 } from './post-1';
import { post2 } from './post-2';
import { post3 } from './post-3';
import { post4 } from './post-4';
import { post5 } from './post-5';
import { post6 } from './post-6';
import type { BlogPost } from '../blogPosts';

// Automatski prikupi sve postove
export const allPosts: BlogPost[] = [
  testPost,
  post8,
  post7,
  post1,
  post2,
  post3,
  post4,
  post5,
  post6,
].sort((a, b) => b.id - a.id); // Sortiraj po ID-u opadajuće
