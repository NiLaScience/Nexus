'use server'

import { SupabaseService } from '@/services/supabase'
import { AuthService } from '@/services/auth'
import { revalidatePath } from 'next/cache'

export type ResponseTemplate = {
  id: string
  name: string
  content: string
  team_id: string
  created_by: string
  usage_count: number
  created_at: string
  updated_at: string
}

export type CreateTemplateInput = {
  name: string
  content: string
  team_id: string
}

export type UpdateTemplateInput = {
  id: string
  name?: string
  content?: string
  team_id?: string
}

export async function createTemplate(input: CreateTemplateInput) {
  try {
    // Get the current user using AuthService
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = await SupabaseService.createClientWithCookies();

    // Verify user has access to the team
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select()
      .eq('team_id', input.team_id)
      .eq('user_id', user.id)
      .single()

    if (teamError || !teamMember) {
      throw new Error('You do not have access to create templates for this team')
    }

    const { data: template, error } = await supabase
      .from('response_templates')
      .insert({
        name: input.name,
        content: input.content,
        team_id: input.team_id,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/templates')
    return { template, error: null }
  } catch (error) {
    console.error('Error creating template:', error)
    return { template: null, error: error instanceof Error ? error.message : 'Failed to create template' }
  }
}

export async function updateTemplate(input: UpdateTemplateInput) {
  try {
    // Get the current user using AuthService
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = await SupabaseService.createClientWithCookies();

    const updates: Partial<ResponseTemplate> = {}
    if (input.name) updates.name = input.name
    if (input.content) updates.content = input.content
    if ('team_id' in input && input.team_id) {
      // Verify user has access to the new team
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select()
        .eq('team_id', input.team_id)
        .eq('user_id', user.id)
        .single()

      if (teamError || !teamMember) {
        throw new Error('You do not have access to move templates to this team')
      }

      updates.team_id = input.team_id
    }

    const { data: template, error } = await supabase
      .from('response_templates')
      .update(updates)
      .eq('id', input.id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/templates')
    return { template, error: null }
  } catch (error) {
    console.error('Error updating template:', error)
    return { template: null, error: error instanceof Error ? error.message : 'Failed to update template' }
  }
}

export async function deleteTemplate(id: string) {
  try {
    // Get the current user using AuthService
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = await SupabaseService.createClientWithCookies();

    // Verify user has access to the template's team
    const { data: template, error: templateError } = await supabase
      .from('response_templates')
      .select('team_id')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select()
      .eq('team_id', template.team_id)
      .eq('user_id', user.id)
      .single();

    if (teamError || !teamMember) {
      throw new Error('You do not have access to delete this template');
    }

    const { error } = await supabase
      .from('response_templates')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/templates')
    return { error: null }
  } catch (error) {
    console.error('Error deleting template:', error)
    return { error: error instanceof Error ? error.message : 'Failed to delete template' }
  }
}

export async function getTemplate(id: string) {
  try {
    // Get the current user using AuthService
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = await SupabaseService.createClientWithCookies();

    const { data: template, error } = await supabase
      .from('response_templates')
      .select(`
        *,
        team:teams(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Verify user has access to the template's team
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select()
      .eq('team_id', template.team_id)
      .eq('user_id', user.id)
      .single();

    if (teamError || !teamMember) {
      throw new Error('You do not have access to view this template');
    }

    return { template, error: null }
  } catch (error) {
    console.error('Error fetching template:', error)
    return { template: null, error: error instanceof Error ? error.message : 'Failed to fetch template' }
  }
}

export async function listTemplates(teamId?: string) {
  try {
    // Get the current user using AuthService
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = await SupabaseService.createClientWithCookies();

    let query = supabase
      .from('response_templates')
      .select(`
        *,
        team:teams(id, name)
      `)
      .order('name')

    if (teamId) {
      // Verify user has access to the team
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select()
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (teamError || !teamMember) {
        throw new Error('You do not have access to view templates for this team');
      }

      query = query.eq('team_id', teamId)
    } else {
      // Only show templates from teams the user is a member of
      const { data: teams, error: teamsError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      if (teamsError) throw teamsError;

      query = query.in('team_id', teams.map(t => t.team_id));
    }

    const { data: templates, error } = await query

    if (error) throw error

    return { templates, error: null }
  } catch (error) {
    console.error('Error listing templates:', error)
    return { templates: null, error: error instanceof Error ? error.message : 'Failed to list templates' }
  }
}

export async function incrementUsageCount(id: string) {
  try {
    // Get the current user using AuthService
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = await SupabaseService.createClientWithCookies();

    // Verify user has access to the template's team
    const { data: template, error: templateError } = await supabase
      .from('response_templates')
      .select('team_id')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select()
      .eq('team_id', template.team_id)
      .eq('user_id', user.id)
      .single();

    if (teamError || !teamMember) {
      throw new Error('You do not have access to use this template');
    }

    const { data: updatedTemplate, error } = await supabase
      .rpc('increment_template_usage', { template_id: id })
      .single()

    if (error) throw error

    return { template: updatedTemplate, error: null }
  } catch (error) {
    console.error('Error incrementing template usage count:', error)
    return { template: null, error: error instanceof Error ? error.message : 'Failed to increment usage count' }
  }
} 