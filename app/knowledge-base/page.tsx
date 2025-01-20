import { Metadata } from 'next'
import { KnowledgeBase } from '@/components/knowledge-base/knowledge-base'

export const metadata: Metadata = {
  title: 'Knowledge Base | Nexus',
  description: 'Browse our help articles and documentation'
}

export default function KnowledgeBasePage() {
  return (
    <div className="container mx-auto py-8">
      <KnowledgeBase />
    </div>
  )
} 