import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketHeader } from "@/components/tickets/ticket-header";
import { MessageHistory } from "@/components/tickets/message-history";
import { TicketTimeline } from "@/components/tickets/ticket-timeline";
import { InternalNotes } from "@/components/tickets/internal-notes";
import { RelatedTickets } from "@/components/tickets/related-tickets";
import { AttachmentsList } from "@/components/tickets/attachments-list";
import type {
  Message,
  TicketStatus,
  TimelineEvent,
  InternalComment,
  RelatedTicket,
  Attachment,
} from "@/types/ticket";

// TODO: Replace with actual data fetching from Supabase
const MOCK_MESSAGES: Message[] = [
  {
    id: 1,
    user: "John Doe",
    role: "Customer",
    date: "Oct 20, 2023 09:15 AM",
    content: "The dashboard keeps loading indefinitely after I log in.",
    attachments: [
      {
        name: "screenshot.png",
        size: "234 KB",
        type: "image",
      },
      {
        name: "error_log.txt",
        size: "12 KB",
        type: "text",
      },
    ],
  },
  {
    id: 2,
    user: "Agent Smith",
    role: "Support Agent",
    date: "Oct 20, 2023 10:15 AM",
    content:
      "I'll look into this right away. Could you please tell me what browser you're using?",
    attachments: [],
  },
];

const MOCK_TIMELINE: TimelineEvent[] = [
  {
    type: "created",
    date: "Oct 20, 2023 09:15 AM",
    user: "John Doe",
    description: "Ticket created",
  },
  {
    type: "assigned",
    date: "Oct 20, 2023 09:30 AM",
    user: "System",
    description: "Assigned to Agent Smith",
  },
  {
    type: "status_change",
    date: "Oct 20, 2023 10:00 AM",
    user: "Agent Smith",
    description: "Status changed to In Progress",
  },
  {
    type: "comment",
    date: "Oct 20, 2023 10:15 AM",
    user: "Agent Smith",
    description: "Added a comment",
  },
];

const MOCK_INTERNAL_COMMENTS: InternalComment[] = [
  {
    id: 1,
    user: "Agent Smith",
    date: "Oct 20, 2023 10:16 AM",
    content: "Checking with dev team about recent dashboard changes.",
  },
  {
    id: 2,
    user: "Emma Davis",
    date: "Oct 20, 2023 10:30 AM",
    content:
      "Similar issue reported last week - might be related to the new authentication update.",
  },
];

const MOCK_RELATED_TICKETS: RelatedTicket[] = [
  {
    id: 101,
    title: "Login page not loading",
    status: "closed",
    date: "Oct 15, 2023",
    tags: ["auth", "bug"],
  },
  {
    id: 102,
    title: "Profile settings not saving",
    status: "open",
    date: "Oct 18, 2023",
    tags: ["settings", "bug"],
  },
];

const MOCK_ATTACHMENTS: Attachment[] = [
  {
    name: "screenshot.png",
    size: "234 KB",
    type: "image",
    date: "Oct 20, 2023 09:15 AM",
    user: "John Doe",
  },
  {
    name: "error_log.txt",
    size: "12 KB",
    type: "text",
    date: "Oct 20, 2023 09:15 AM",
    user: "John Doe",
  },
  {
    name: "debug_info.pdf",
    size: "156 KB",
    type: "pdf",
    date: "Oct 20, 2023 10:30 AM",
    user: "Agent Smith",
  },
];

interface Props {
  params: {
    id: string;
  };
}

export default async function TicketDetailPage({ params }: Props) {
  // TODO: Fetch ticket data from Supabase
  const ticket = {
    id: parseInt(params.id),
    title: "Cannot access dashboard",
    status: "open" as TicketStatus,
    created: "Oct 20, 2023",
    tags: ["bug", "dashboard"],
    description: "I'm unable to access the dashboard after logging in. The page keeps loading indefinitely.",
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">{ticket.title}</h1>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <TicketHeader
              created={ticket.created}
              tags={ticket.tags}
              status={ticket.status}
              onStatusChange={(status) => {
                // TODO: Update ticket status in Supabase
                console.log('Status changed:', status);
              }}
              onReassign={(agentId) => {
                // TODO: Reassign ticket in Supabase
                console.log('Reassigned to:', agentId);
              }}
            />
            <p className="text-gray-700">{ticket.description}</p>
          </div>

          <MessageHistory
            messages={MOCK_MESSAGES}
            onSendMessage={(content) => {
              // TODO: Send message to Supabase
              console.log('Message sent:', content);
            }}
          />
        </div>

        <div className="space-y-6">
          <TicketTimeline events={MOCK_TIMELINE} />
          <InternalNotes
            comments={MOCK_INTERNAL_COMMENTS}
            onAddNote={(content) => {
              // TODO: Add internal note to Supabase
              console.log('Internal note added:', content);
            }}
          />
          <RelatedTickets tickets={MOCK_RELATED_TICKETS} />
          <AttachmentsList
            attachments={MOCK_ATTACHMENTS}
            onDownload={(attachment) => {
              // TODO: Handle attachment download from Supabase Storage
              console.log('Downloading attachment:', attachment.name);
            }}
          />
        </div>
      </div>
    </div>
  );
} 