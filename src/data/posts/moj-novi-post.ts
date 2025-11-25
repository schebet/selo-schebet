// src/data/posts/moj-novi-post.ts
import slika777Srcset from "@/assets/photos/777.JPG?w=640;768;1024;1280;1920&format=webp&quality=85&as=srcset";
import slika777Url from "@/assets/photos/777.JPG?w=1024&format=webp&quality=85";
import type { BlogPost } from "../blogPosts";

export const post-11: BlogPost = {
  id: 11, // obavezno jedinstven broj za svaki post
  title: "Naslov mog teksta",
  author: "Ime i prezime novinara",
  date: "2025-11-25", // format YYYY-MM-DD
  image: slika777,       // responsive slika
  imageUrl: slika777Url, // fallback URL
  imageSrcSet: slika777Srcset,
  ogImage: "/og-images/777.jpg",
  content: `
    Ovde ide glavni tekst objave.
    Može biti običan string ili Markdown formatiran tekst
    (naslovi, liste, linkovi, citati).
  `,
  tags: ["politika", "kultura", "intervju"], // opcionalno: ključne reči
};

