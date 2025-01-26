"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TeamManagement } from "./team-management";
import CustomizationTab from "./customization-tab";
import { getSkillsAction, addSkillAction } from "@/app/actions/skills.server";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Wrench, MessageSquare, Settings } from "lucide-react";
import Link from "next/link";

interface Skill {
  id: string;
  name: string;
  description?: string;
}

export function AdminTab() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSkills() {
    try {
      const { skills: skillsData, error } = await getSkillsAction();
      if (error) throw error;
      setSkills(skillsData || []);
    } catch (err) {
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSkills();
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Teams
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Skills
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="customization" className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Customization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <div className="bg-card p-6 rounded-lg shadow">
            <TeamManagement />
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <div className="bg-card p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Skills Management</h2>
              <AddSkillDialog onSkillAdded={fetchSkills} />
            </div>

            <div className="space-y-4">
              {loading ? (
                <div>Loading skills...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <h3 className="font-medium">{skill.name}</h3>
                      {skill.description && (
                        <p className="text-sm text-muted-foreground">
                          {skill.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="bg-card p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-medium">Response Templates</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your team&apos;s response templates for quick and consistent replies
                </p>
              </div>
              <Button asChild>
                <Link href="/templates">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Manage Templates
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customization">
          <div className="bg-card p-6 rounded-lg shadow">
            <CustomizationTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AddSkillDialog({ onSkillAdded }: { onSkillAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const { error } = await addSkillAction({ name, description });

    setLoading(false);
    if (error) {
      toast.error("Failed to add skill");
    } else {
      toast.success("Skill added successfully");
      setOpen(false);
      onSkillAdded();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add New Skill</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Skill</DialogTitle>
          <DialogDescription>
            Create a new skill that agents can add to their profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Skill Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 