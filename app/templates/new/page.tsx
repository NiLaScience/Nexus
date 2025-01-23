'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import { createTemplate } from '@/app/actions/response-templates'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Team {
  id: string
  name: string
}

export default function NewTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [teamId, setTeamId] = useState<string>('')
  const [teams, setTeams] = useState<Team[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)

  // Load teams the user has access to
  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await fetch('/api/teams')
        const data = await response.json()
        if (data.error) {
          setError(data.error)
        } else {
          setTeams(data.teams || [])
          if (data.teams?.length === 1) {
            setTeamId(data.teams[0].id)
          }
        }
      } catch (err) {
        setError('Failed to load teams')
      } finally {
        setIsLoadingTeams(false)
      }
    }
    loadTeams()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!teamId) {
      setError('Please select a team')
      return
    }

    setIsCreating(true)
    try {
      const result = await createTemplate({
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
      setError('Failed to create template')
    } finally {
      setIsCreating(false)
    }
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
            <CardTitle>New Template</CardTitle>
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
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter template content"
                className="min-h-[200px]"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isCreating || isLoadingTeams}>
              <Save className="w-4 h-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Template'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 