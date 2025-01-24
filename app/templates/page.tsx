'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { listTemplates, type ResponseTemplate } from '@/app/actions/response-templates'
import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

export default function TemplatesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [templates, setTemplates] = useState<ResponseTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTemplates() {
      try {
        const result = await listTemplates()
        if (result.error) {
          setError(result.error)
        } else {
          setTemplates(result.templates || [])
        }
      } catch (err) {
        setError('Failed to load templates')
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplates()
  }, [])

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Response Templates</h1>
        <Button onClick={() => router.push('/templates/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center">Loading templates...</div>
      ) : error ? (
        <div className="text-center text-destructive">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert line-clamp-3">
                  <ReactMarkdown>{template.content}</ReactMarkdown>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/templates/${template.id}`)}
                >
                  Edit
                </Button>
                <span className="text-sm text-muted-foreground">
                  Used {template.usage_count} times
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 