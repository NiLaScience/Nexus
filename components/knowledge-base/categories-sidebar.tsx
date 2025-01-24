'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { updateCategory, deleteCategory } from '@/app/actions/articles/articles.server';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

interface CategoriesSidebarProps {
  categories: Category[];
  isAdmin?: boolean;
}

export function CategoriesSidebar({ categories, isAdmin }: CategoriesSidebarProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const router = useRouter();

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const formData = new FormData();
    formData.append('name', editName);

    await updateCategory(editingCategory.id, formData);
    setEditingCategory(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    router.refresh();
  };

  return (
    <>
      <div className="bg-card p-4 rounded-lg shadow">
        <h3 className="font-medium mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded hover:bg-muted group"
            >
              <button className="flex-1 text-left px-2 py-1.5 text-sm">
                {category.name}
              </button>
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(category)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium">
                  Category Name
                </label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g., Getting Started"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button type="submit">Update Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 