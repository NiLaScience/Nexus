'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type Skill = {
  id: string;
  name: string;
  description: string | null;
};

export type AgentSkill = {
  skill: Skill;
  proficiency_level: 'beginner' | 'intermediate' | 'expert';
};

export async function getSkillsAction() {
  try {
    const supabase = await createClient();

    const { data: skills, error } = await supabase
      .from("skills")
      .select("*")
      .order("name");

    if (error) throw error;

    return { skills, error: null };
  } catch (error) {
    console.error("Error fetching skills:", error);
    return { skills: [], error: (error as Error).message };
  }
}

export async function getAgentSkillsAction(userId: string) {
  try {
    const supabase = await createClient();

    const { data: agentSkills, error } = await supabase
      .from("agent_skills")
      .select(`
        proficiency_level,
        skill:skill_id(*)
      `)
      .eq("user_id", userId);

    if (error) throw error;

    return { agentSkills, error: null };
  } catch (error) {
    console.error("Error fetching agent skills:", error);
    return { agentSkills: [], error: (error as Error).message };
  }
}

export async function addSkillAction(data: { name: string; description?: string }) {
  try {
    const supabase = await createClient();

    const { data: skill, error } = await supabase
      .from("skills")
      .insert({
        name: data.name,
        description: data.description,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/settings");
    return { skill, error: null };
  } catch (error) {
    console.error("Error adding skill:", error);
    return { skill: null, error: (error as Error).message };
  }
}

export async function addAgentSkillAction(data: { 
  userId: string; 
  skillId: string; 
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
}) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("agent_skills")
      .insert({
        user_id: data.userId,
        skill_id: data.skillId,
        proficiency_level: data.proficiencyLevel,
      });

    if (error) throw error;

    revalidatePath("/settings");
    return { error: null };
  } catch (error) {
    console.error("Error adding agent skill:", error);
    return { error: (error as Error).message };
  }
}

export async function removeAgentSkillAction(data: { userId: string; skillId: string }) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("agent_skills")
      .delete()
      .eq("user_id", data.userId)
      .eq("skill_id", data.skillId);

    if (error) throw error;

    revalidatePath("/settings");
    return { error: null };
  } catch (error) {
    console.error("Error removing agent skill:", error);
    return { error: (error as Error).message };
  }
}

export async function updateAgentSkillAction(data: { 
  userId: string; 
  skillId: string; 
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
}) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("agent_skills")
      .update({
        proficiency_level: data.proficiencyLevel,
      })
      .eq("user_id", data.userId)
      .eq("skill_id", data.skillId);

    if (error) throw error;

    revalidatePath("/settings");
    return { error: null };
  } catch (error) {
    console.error("Error updating agent skill:", error);
    return { error: (error as Error).message };
  }
} 