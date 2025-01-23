'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type ResponseTemplate = {
  id: string
  name: string
  content: string
  team_id: string | null
  created_by: string
  usage_count: number
  created_at: string
  updated_at: string
}

export type CreateTemplateInput = {
  name: string
  content: string
  team_id?: string
}

export type UpdateTemplateInput = {
  id: string
  name?: string
  content?: string
  team_id?: string
}

export async function createTemplate(input: CreateTemplateInput) {
  try {
    const supabase = await createClient()

    // Get the current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    const { data: template, error } = await supabase
      .from('response_templates')
      .insert({
        name: input.name,
        content: input.content,
        team_id: input.team_id || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/templates')
    return { template, error: null }
  } catch (error) {
    console.error('Error creating template:', error)
    return { template: null, error: 'Failed to create template' }
  }
}

export async function updateTemplate(input: UpdateTemplateInput) {
  try {
    const supabase = await createClient()

    const updates: Partial<ResponseTemplate> = {}
    if (input.name) updates.name = input.name
    if (input.content) updates.content = input.content
    if ('team_id' in input) updates.team_id = input.team_id || null

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
    return { template: null, error: 'Failed to update template' }
  }
}

export async function deleteTemplate(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('response_templates')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/templates')
    return { error: null }
  } catch (error) {
    console.error('Error deleting template:', error)
    return { error: 'Failed to delete template' }
  }
}

export async function getTemplate(id: string) {
  try {
    const supabase = await createClient()

    const { data: template, error } = await supabase
      .from('response_templates')
      .select()
      .eq('id', id)
      .single()

    if (error) throw error

    return { template, error: null }
  } catch (error) {
    console.error('Error fetching template:', error)
    return { template: null, error: 'Failed to fetch template' }
  }
}

export async function listTemplates(teamId?: string) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('response_templates')
      .select()
      .order('name')

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const { data: templates, error } = await query

    if (error) throw error

    return { templates, error: null }
  } catch (error) {
    console.error('Error listing templates:', error)
    return { templates: null, error: 'Failed to list templates' }
  }
}

export async function incrementUsageCount(id: string) {
  try {
    const supabase = await createClient()

    const { data: template, error } = await supabase.rpc('increment_template_usage', {
      template_id: id
    })

    if (error) throw error

    return { template, error: null }
  } catch (error) {
    console.error('Error incrementing usage count:', error)
    return { template: null, error: 'Failed to increment usage count' }
  }
} 