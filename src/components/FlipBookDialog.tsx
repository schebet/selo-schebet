import { forwardRef, useMemo, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BlogPost } from "@/data/blogPosts";

interface FlipBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost;
}

interface PageProps {
  children: React.ReactNode;
  className?: string;
}

const Page = forwardRef<HTMLDivElement, PageProps>(({ children, className = "" }, ref) => (
  <div ref={ref} className={`bg-card border border-border shadow-soft ${className}`}>
    <div className="h-full w-full p-6 md:p-8 overflow-hidden flex flex-col">{children}</div>
  </div>
));
Page.displayName = "Page";

// Split HTML text blocks into chunks so book pages are not too tall.
const buildPages = (post: BlogPost): React.ReactNode[] => {
  const pages: React.ReactNode[] = [];

  // Cover
  pages.push(
    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
      <img
        src={post.imageUrl}
        alt={post.title}
        className="w-full h-1/2 object-cover rounded-md mb-4"
      />
      <h2 className="text-2xl md:text-3xl font-bold text-gradient-primary">{post.title}</h2>
      <p className="text-sm text-muted-foreground italic">{post.author} · {post.date}</p>
    </div>
  );

  // Excerpt
  pages.push(
    <div className="flex items-center justify-center h-full">
      <p className="text-lg md:text-xl italic text-foreground leading-relaxed">{post.excerpt}</p>
    </div>
  );

  // Content blocks
  post.content.forEach((block) => {
    if (block.type === "text" && block.html) {
      // Split long HTML by paragraphs into chunks of ~2 paragraphs per page
      const parts = block.html.split(/(?=<h[1-6]|<p|<ul|<ol|<blockquote)/i).filter(Boolean);
      for (let i = 0; i < parts.length; i += 2) {
        const chunk = parts.slice(i, i + 2).join("");
        pages.push(
          <div
            className="prose prose-sm max-w-none dark:prose-invert overflow-y-auto h-full"
            dangerouslySetInnerHTML={{ __html: chunk }}
          />
        );
      }
    } else if (block.type === "image") {
      pages.push(
        <figure className="h-full flex flex-col items-center justify-center gap-3">
          <img
            src={block.src}
            alt={block.alt || ""}
            className="max-h-[80%] w-auto object-contain rounded-md"
          />
          {block.caption && (
            <figcaption className="text-xs text-muted-foreground italic text-center">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    } else if (block.type === "quote") {
      pages.push(
        <blockquote className="h-full flex flex-col justify-center border-l-4 border-primary pl-6 italic">
          <p className="text-lg md:text-xl mb-3">{block.quoteText}</p>
          {block.quoteAuthor && (
            <footer className="text-sm text-muted-foreground not-italic">— {block.quoteAuthor}</footer>
          )}
        </blockquote>
      );
    }
  });

  // Back cover
  pages.push(
    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
      <h3 className="text-2xl font-bold text-gradient-primary">Kraj</h3>
      <p className="text-sm text-muted-foreground">Selo Šebet · {post.category}</p>
    </div>
  );

  // Ensure even page count for proper book spread
  if (pages.length % 2 !== 0) {
    pages.push(<div className="h-full" />);
  }

  return pages;
};

export const FlipBookDialog = ({ open, onOpenChange, post }: FlipBookDialogProps) => {
  const pages = useMemo(() => buildPages(post), [post]);
  const bookRef = useRef<{ pageFlip: () => { flipNext: () => void; flipPrev: () => void } }>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Responsive sizing
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const pageWidth = isMobile ? 320 : 400;
  const pageHeight = isMobile ? 480 : 560;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-center">{post.title} — Flipbook</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-full">
            {/* @ts-expect-error - react-pageflip types are loose */}
            <HTMLFlipBook
              ref={bookRef}
              width={pageWidth}
              height={pageHeight}
              size="stretch"
              minWidth={280}
              maxWidth={500}
              minHeight={400}
              maxHeight={700}
              showCover={true}
              mobileScrollSupport={true}
              onFlip={(e: { data: number }) => setCurrentPage(e.data)}
              className="mx-auto"
            >
              {pages.map((content, idx) => (
                <Page key={idx}>{content}</Page>
              ))}
            </HTMLFlipBook>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bookRef.current?.pageFlip().flipPrev()}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prethodna
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage + 1} / {pages.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bookRef.current?.pageFlip().flipNext()}
              disabled={currentPage >= pages.length - 1}
            >
              Sledeća <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
