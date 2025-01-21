const CATEGORIES = [
  { name: "General", count: 15 },
  { name: "Tickets", count: 8 },
  { name: "Troubleshooting", count: 12 },
  { name: "Account", count: 6 },
  { name: "Billing", count: 9 },
] as const;

export function CategoriesSidebar() {
  return (
    <div className="bg-card p-4 rounded-lg shadow">
      <h3 className="font-medium mb-3">Categories</h3>
      <div className="space-y-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.name}
            className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex justify-between items-center text-sm"
          >
            {category.name}
            <span className="text-muted-foreground text-xs">
              {category.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
} 