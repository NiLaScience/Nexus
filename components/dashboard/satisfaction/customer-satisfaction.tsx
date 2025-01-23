import { Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCustomerSatisfactionStatsAction } from "@/app/actions/tickets/rating.server";
import { Suspense } from "react";

async function CustomerSatisfactionContent() {
  const { distribution, totalRatings, averageRating, error } = await getCustomerSatisfactionStatsAction();

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Error loading satisfaction data
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalRatings} total ratings
        </div>
        <div className="text-sm text-muted-foreground">
          {averageRating.toFixed(1)} average
        </div>
      </div>
      {distribution.map((rating) => (
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
                width: `${totalRatings > 0 ? (rating.count / totalRatings) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="w-12 text-sm text-muted-foreground">{rating.count}</div>
        </div>
      ))}
    </div>
  );
}

export function CustomerSatisfaction() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Satisfaction</CardTitle>
        <CardDescription>Recent ratings</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div>Loading satisfaction data...</div>}>
          <CustomerSatisfactionContent />
        </Suspense>
      </CardContent>
    </Card>
  );
} 