const CATEGORIES = [
  { name: "General", count: 15 },
  { name: "Tickets", count: 8 },
  { name: "Troubleshooting", count: 12 },
  { name: "Account", count: 6 },
  { name: "Billing", count: 9 },
] as const;

export function CategoriesSidebar() {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-medium mb-3">Categories</h3>
      <div className="space-y-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.name}
            className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 flex justify-between items-center text-sm"
          >
            {category.name}
            <span className="text-gray-500 text-xs">
              {category.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
} 