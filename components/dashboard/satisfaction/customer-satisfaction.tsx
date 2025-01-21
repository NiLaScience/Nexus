import { Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const RATINGS = [
  { rating: 5, count: 28 },
  { rating: 4, count: 12 },
  { rating: 3, count: 4 },
  { rating: 2, count: 2 },
  { rating: 1, count: 1 },
];

export function CustomerSatisfaction() {
  const totalRatings = RATINGS.reduce((sum, { count }) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Satisfaction</CardTitle>
        <CardDescription>Recent ratings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {RATINGS.map((rating) => (
            <div key={rating.rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-24">
                {Array.from({ length: rating.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-primary text-primary"
                  />
                ))}
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${(rating.count / totalRatings) * 100}%`,
                  }}
                />
              </div>
              <div className="w-12 text-sm text-muted-foreground">{rating.count}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 