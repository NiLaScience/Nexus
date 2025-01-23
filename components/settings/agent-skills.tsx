'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSkillsAction, getAgentSkillsAction, addAgentSkillAction, removeAgentSkillAction, updateAgentSkillAction } from "@/app/actions/skills.server";
import { toast } from "sonner";

export function AgentSkills({ userId }: { userId: string }) {
  const [skills, setSkills] = useState<any[]>([]);
  const [agentSkills, setAgentSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      const [skillsResult, agentSkillsResult] = await Promise.all([
        getSkillsAction(),
        getAgentSkillsAction(userId)
      ]);

      if (skillsResult.error || agentSkillsResult.error) {
        throw new Error(skillsResult.error || agentSkillsResult.error || "Failed to fetch data");
      }

      setSkills(skillsResult.skills || []);
      setAgentSkills(agentSkillsResult.agentSkills || []);
    } catch (err) {
      setError((err as Error).message);
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [userId]);

  if (loading) {
    return <div>Loading skills...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const availableSkills = skills.filter(
    (skill) => !agentSkills.find((as: any) => as.skill.id === skill.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Skills</h2>
        <AddAgentSkillDialog 
          userId={userId} 
          availableSkills={availableSkills} 
          onSkillAdded={fetchData} 
        />
      </div>

      <div className="space-y-4">
        {agentSkills.map((agentSkill: any) => (
          <div
            key={agentSkill.skill.id}
            className="flex items-center justify-between p-2 bg-muted rounded-lg"
          >
            <div>
              <div className="font-medium">{agentSkill.skill.name}</div>
              <div className="text-sm text-muted-foreground">
                {agentSkill.proficiency_level}
              </div>
            </div>
            <div className="flex gap-2">
              <UpdateSkillDialog
                userId={userId}
                skillId={agentSkill.skill.id}
                currentLevel={agentSkill.proficiency_level}
                onSkillUpdated={fetchData}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (!confirm("Are you sure you want to remove this skill?")) return;
                  const { error } = await removeAgentSkillAction({ 
                    userId, 
                    skillId: agentSkill.skill.id 
                  });
                  if (error) {
                    toast.error("Failed to remove skill");
                  } else {
                    toast.success("Skill removed successfully");
                    fetchData();
                  }
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddAgentSkillDialog({ 
  userId, 
  availableSkills,
  onSkillAdded 
}: { 
  userId: string; 
  availableSkills: any[];
  onSkillAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [proficiencyLevel, setProficiencyLevel] = useState<'beginner' | 'intermediate' | 'expert'>('beginner');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSkill) return;
    
    setLoading(true);
    const { error } = await addAgentSkillAction({ 
      userId, 
      skillId: selectedSkill,
      proficiencyLevel 
    });

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
        <Button>Add Skill</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Skill</DialogTitle>
          <DialogDescription>
            Add a skill to your profile with your proficiency level.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="skill">Skill</Label>
            <Select
              value={selectedSkill}
              onValueChange={setSelectedSkill}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a skill" />
              </SelectTrigger>
              <SelectContent>
                {availableSkills.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id}>
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="level">Proficiency Level</Label>
            <Select
              value={proficiencyLevel}
              onValueChange={(value: any) => setProficiencyLevel(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedSkill}>
              {loading ? "Adding..." : "Add Skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UpdateSkillDialog({ 
  userId, 
  skillId,
  currentLevel,
  onSkillUpdated 
}: { 
  userId: string; 
  skillId: string;
  currentLevel: 'beginner' | 'intermediate' | 'expert';
  onSkillUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proficiencyLevel, setProficiencyLevel] = useState<'beginner' | 'intermediate' | 'expert'>(currentLevel);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const { error } = await updateAgentSkillAction({ 
      userId, 
      skillId,
      proficiencyLevel 
    });

    setLoading(false);
    if (error) {
      toast.error("Failed to update skill");
    } else {
      toast.success("Skill updated successfully");
      setOpen(false);
      onSkillUpdated();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Update</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Skill Level</DialogTitle>
          <DialogDescription>
            Update your proficiency level for this skill.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="level">Proficiency Level</Label>
            <Select
              value={proficiencyLevel}
              onValueChange={(value: any) => setProficiencyLevel(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 