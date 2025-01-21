import type {
  Message,
  TimelineEvent,
  InternalComment,
  RelatedTicket,
  Attachment,
} from "@/types/ticket";

export const MOCK_MESSAGES: Message[] = [
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

export const MOCK_TIMELINE: TimelineEvent[] = [
  {
    id: 1,
    type: "created",
    date: "Oct 20, 2023 09:15 AM",
    user: "John Doe",
    description: "Ticket created",
  },
  {
    id: 2,
    type: "assigned",
    date: "Oct 20, 2023 09:30 AM",
    user: "System",
    description: "Assigned to Agent Smith",
  },
  {
    id: 3,
    type: "status_change",
    date: "Oct 20, 2023 10:00 AM",
    user: "Agent Smith",
    description: "Status changed to In Progress",
  },
  {
    id: 4,
    type: "comment",
    date: "Oct 20, 2023 10:15 AM",
    user: "Agent Smith",
    description: "Added a comment",
  },
];

export const MOCK_INTERNAL_COMMENTS: InternalComment[] = [
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

export const MOCK_RELATED_TICKETS: RelatedTicket[] = [
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

export const MOCK_ATTACHMENTS: Attachment[] = [
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