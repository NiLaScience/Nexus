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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: PageProps) {
  const resolvedParams = await params;
  return <EditTemplateClient id={resolvedParams.id} />;
}

function EditTemplateClient({ id }: { id: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [teamId, setTeamId] = useState<string>('')
  const [teams, setTeams] = useState<Team[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)

  useEffect(() => {
    async function loadTeams() {
      try {
        const { teams, error } = await getTeamsAction()
        if (error) {
          setError(error)
        } else {
          setTeams(teams || [])
        }
      } catch (err) {
        setError('Failed to load teams')
      } finally {
        setIsLoadingTeams(false)
      }
    }
    loadTeams()
  }, [])

  useEffect(() => {
    async function loadTemplate() {
      try {
        const result = await getTemplate(id)
        if (result.error) {
          setError(result.error)
        } else {
          setName(result.template.name)
          setContent(result.template.content)
          setTeamId(result.template.team_id)
        }
      } catch (err) {
        setError('Failed to load template')
      } finally {
        setIsLoading(false)
      }
    }
    loadTemplate()
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!teamId) {
      setError('Please select a team')
      return
    }

    setIsSaving(true)
    try {
      const result = await updateTemplate({
        id,
        name,
        content,
        team_id: teamId
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/templates')
      }
    } catch (err) {
      setError('Failed to update template')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteTemplate(id)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/templates')
      }
    } catch (err) {
      setError('Failed to delete template')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading || isLoadingTeams) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/templates')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Templates
      </Button>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Edit Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive mb-4">{error}</div>
            )}
            <div className="space-y-2">
              <label htmlFor="team" className="text-sm font-medium">
                Team
              </label>
              <Select
                value={teamId}
                onValueChange={setTeamId}
                disabled={isLoadingTeams}
              >
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
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter template name"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              <div data-color-mode="dark">
                <MDEditor
                  value={content}
                  onChange={(value) => setContent(value || '')}
                  preview="edit"
                  height={400}
                  className="dark:bg-background"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" disabled={isDeleting}>
                  <Trash className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Template'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the template.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete Template
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="submit" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 