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

    const supabase = SupabaseService.createServiceClient();

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

    // Create the template
    const { data: template, error } = await supabase
      .from('response_templates')
      .insert({
        name: input.name,
        content: input.content,
        team_id: input.team_id,
        created_by: user.id,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/templates')
    return { template }
  } catch (error) {
    console.error('Error creating template:', error)
    return { error: error instanceof Error ? error.message : 'Failed to create template' }
  }
}

export async function updateTemplate(input: UpdateTemplateInput) {
  try {
    // Get the current user using AuthService
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = SupabaseService.createServiceClient();

    // Get the current template
    const { data: currentTemplate, error: templateError } = await supabase
      .from('response_templates')
      .select('team_id')
      .eq('id', input.id)
      .single()

    if (templateError || !currentTemplate) {
      throw new Error('Template not found')
    }

    // Verify user has access to the team
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select()
      .eq('team_id', currentTemplate.team_id)
      .eq('user_id', user.id)
      .single()

    if (teamError || !teamMember) {
      throw new Error('You do not have access to update this template')
    }

    // Update the template
    const { data: template, error } = await supabase
      .from('response_templates')
      .update({
        ...(input.name && { name: input.name }),
        ...(input.content && { content: input.content }),
        ...(input.team_id && { team_id: input.team_id }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/templates')
    return { template }
  } catch (error) {
    console.error('Error updating template:', error)
    return { error: error instanceof Error ? error.message : 'Failed to update template' }
  }
}

export async function deleteTemplate(id: string) {
  try {
    // Get the current user using AuthService
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = SupabaseService.createServiceClient();

    // Get the current template
    const { data: currentTemplate, error: templateError } = await supabase
      .from('response_templates')
      .select('team_id')
      .eq('id', id)
      .single()

    if (templateError || !currentTemplate) {
      throw new Error('Template not found')
    }

    // Verify user has access to the team
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select()
      .eq('team_id', currentTemplate.team_id)
      .eq('user_id', user.id)
      .single()

    if (teamError || !teamMember) {
      throw new Error('You do not have access to delete this template')
    }

    // Delete the template
    const { error } = await supabase
      .from('response_templates')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    revalidatePath('/templates')
    return { success: true }
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

    const supabase = SupabaseService.createServiceClient();

    // Get the template
    const { data: template, error } = await supabase
      .from('response_templates')
      .select(`
        *,
        team:teams (
          id,
          name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    // Verify user has access to the team
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select()
      .eq('team_id', template.team_id)
      .eq('user_id', user.id)
      .single()

    if (teamError || !teamMember) {
      throw new Error('You do not have access to view this template')
    }

    return { template }
  } catch (error) {
    console.error('Error getting template:', error)
    return { error: error instanceof Error ? error.message : 'Failed to get template' }
  }
}

export async function listTemplates(teamId?: string) {
  try {
    // Get the current user using AuthService
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = SupabaseService.createServiceClient();

    // Get user's teams if no teamId provided
    let teamIds: string[] = []
    if (teamId) {
      teamIds = [teamId]
    } else {
      const { data: teams, error: teamsError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)

      if (teamsError) {
        throw teamsError
      }

      teamIds = teams.map(t => t.team_id)
    }

    // Get templates for the teams
    const { data: templates, error } = await supabase
      .from('response_templates')
      .select(`
        *,
        team:teams (
          id,
          name
        )
      `)
      .in('team_id', teamIds)
      .order('name')

    if (error) {
      throw error
    }

    return { templates }
  } catch (error) {
    console.error('Error listing templates:', error)
    return { error: error instanceof Error ? error.message : 'Failed to list templates' }
  }
}

export async function incrementUsageCount(id: string) {
  try {
    const supabase = SupabaseService.createServiceClient();

    const { error } = await supabase.rpc('increment_template_usage', {
      template_id: id
    })

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error incrementing template usage count:', error)
    return { error: error instanceof Error ? error.message : 'Failed to increment usage count' }
  }
} 