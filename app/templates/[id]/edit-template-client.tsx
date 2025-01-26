'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Trash } from 'lucide-react'
import { getTemplate, updateTemplate, deleteTemplate } from '@/app/actions/response-templates'
import { getTeamsAction } from '@/app/actions/teams.server'
import dynamic from 'next/dynamic'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface Team {
  id: string
  name: string
}

export function EditTemplateClient({ id }: { id: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTemplate() {
      try {
        const [templateResult, teamsResult] = await Promise.all([
          getTemplate(id),
          getTeamsAction()
        ])

        if (templateResult.error) {
          setError(templateResult.error)
        } else if (templateResult.template) {
          setName(templateResult.template.name)
          setContent(templateResult.template.content)
          setTeamId(templateResult.template.team_id)
        }

        if (teamsResult.error) {
          console.error('Error loading teams:', teamsResult.error)
        } else {
          setTeams(teamsResult.teams || [])
        }
      } catch (err) {
        setError('Failed to load template')
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplate()
  }, [id])

  const handleSave = async () => {
    try {
      const result = await updateTemplate({
        id,
        name,
        content,
        team_id: teamId || undefined
      });

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/templates')
      }
    } catch (err) {
      setError('Failed to update template')
    }
  }

  const handleDelete = async () => {
    try {
      const result = await deleteTemplate(id)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/templates')
      }
    } catch (err) {
      setError('Failed to delete template')
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading template...</div>
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push('/templates')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Template</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="team" className="text-sm font-medium">
              Team
            </label>
            <Select value={teamId || undefined} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Content
            </label>
            <MDEditor
              value={content}
              onChange={(value) => setContent(value || '')}
              preview="edit"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  template.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 