import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { WardrobeGrid } from "@/components/wardrobe/WardrobeGrid";
import { WardrobeFilters } from "@/components/wardrobe/WardrobeFilters";
import { useWardrobe } from "@/hooks/useWardrobe";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MetadataForm } from "@/components/wardrobe/MetadataForm";
import type { WardrobeItem, WardrobeFilters as WardrobeFiltersType, WardrobeItemMetadata } from "@/types/wardrobe";

const Wardrobe = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<WardrobeFiltersType>({});
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  
  const { items, isLoading, deleteItem, updateItem, markWorn } = useWardrobe(filters);

  const handleEdit = (item: WardrobeItem) => {
    setEditingItem(item);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItem(id);
    }
  };

  const handleUpdateMetadata = (metadata: WardrobeItemMetadata) => {
    if (editingItem) {
      updateItem({ id: editingItem.id, updates: metadata });
      setEditingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 pb-8 border-b border-foreground/10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.4em] mb-4 text-foreground/40">Inventory</p>
          <h1 className="text-5xl font-medium tracking-tight">Wardrobe.</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate("/dashboard/wardrobe/upload")}
        >
          UPLOAD
        </Button>
      </div>

      <WardrobeFilters filters={filters} onFiltersChange={setFilters} />

      <WardrobeGrid
        items={items}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkWorn={markWorn}
      />

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the metadata for this wardrobe item
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <MetadataForm
              metadata={{
                name: editingItem.name,
                category: editingItem.category,
                type: editingItem.type,
                color: editingItem.color,
                season: editingItem.season,
                notes: editingItem.notes,
                tags: editingItem.tags,
              }}
              onChange={handleUpdateMetadata}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wardrobe;
