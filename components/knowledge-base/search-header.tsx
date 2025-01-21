import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchHeader() {
  return (
    <div className="bg-card p-8 rounded-lg shadow mb-8">
      <h2 className="text-xl font-medium text-center mb-4">
        How can we help you today?
      </h2>
      <div className="max-w-2xl mx-auto relative">
        <Search className="absolute left-3 top-3 text-muted-foreground w-5 h-5" />
        <Input className="pl-10" placeholder="Search articles..." />
      </div>
    </div>
  );
} 