'use client';

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { addTicketRatingAction, getTicketRatingAction } from "@/app/actions/tickets/rating.server";
import { useEffect } from "react";

interface TicketRatingProps {
  ticketId: string;
  status: string;
  customerId: string;
}

export function TicketRating({ ticketId, status, customerId }: TicketRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canRate, setCanRate] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        // Get the rating
        const { rating } = await getTicketRatingAction(ticketId);
        setExistingRating(rating);
        
        // If there's a rating, the user can rate if they're the customer or an admin
        // This logic is now handled server-side in the action
        setCanRate(true);
      } catch (error) {
        console.error('Error loading rating:', error);
        toast({
          title: "Error",
          description: "Failed to load rating data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [ticketId, customerId, toast]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (status !== "resolved") {
    return null;
  }

  if (!canRate) {
    return null;
  }

  if (existingRating) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Rating</div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < existingRating.rating
                  ? "fill-primary text-primary"
                  : "fill-muted text-muted"
              }`}
            />
          ))}
        </div>
        {existingRating.comment && (
          <div className="text-sm text-muted-foreground">
            {existingRating.comment}
          </div>
        )}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await addTicketRatingAction(ticketId, rating, comment);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Thank you for your feedback!",
      });
      // Refresh the rating
      const { rating: newRating } = await getTicketRatingAction(ticketId);
      setExistingRating(newRating);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        How would you rate this support interaction?
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            className="p-1 hover:scale-110 transition-transform"
            onMouseEnter={() => setHoveredRating(i + 1)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(i + 1)}
          >
            <Star
              className={`w-5 h-5 ${
                i < (hoveredRating || rating)
                  ? "fill-primary text-primary"
                  : "fill-muted text-muted"
              }`}
            />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Additional comments (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="h-24"
      />
      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Rating"}
      </Button>
    </div>
  );
} 