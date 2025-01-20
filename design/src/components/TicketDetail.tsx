import React from "react";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  MessageCircle,
  Paperclip,
  Send,
  Star,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
const MOCK_TIMELINE = [
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
const MOCK_COMMENTS = [
  {
    id: 1,
    user: "John Doe",
    role: "Customer",
    date: "Oct 20, 2023 09:15 AM",
    content: "The dashboard keeps loading indefinitely after I log in.",
    rating: null,
  },
  {
    id: 2,
    user: "Agent Smith",
    role: "Support Agent",
    date: "Oct 20, 2023 10:15 AM",
    content:
      "I'll look into this right away. Could you please tell me what browser you're using?",
    rating: 5,
  },
];
const MOCK_RELATED_TICKETS = [
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
const MOCK_MESSAGES = [
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
const MOCK_INTERNAL_COMMENTS = [
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
const MOCK_ATTACHMENTS = [
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
export function TicketDetail() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Cannot access dashboard</h1>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-gray-600">Created on Oct 20, 2023</span>
                <div className="flex gap-2 mt-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    bug
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    dashboard
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Reassign
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Reassign Ticket</h4>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent1">Sarah Wilson</SelectItem>
                          <SelectItem value="agent2">Mike Johnson</SelectItem>
                          <SelectItem value="agent3">Emma Davis</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex justify-end">
                        <Button size="sm">Reassign</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Select defaultValue="open">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-gray-700">
              I'm unable to access the dashboard after logging in. The page
              keeps loading indefinitely.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="text-gray-600">
                <Paperclip className="w-4 h-4 mr-1" /> screenshot.png
              </Button>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-medium mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Message History
            </h2>
            <div className="space-y-6 mb-6">
              {MOCK_MESSAGES.map((message) => (
                <div key={message.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    {message.user[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{message.user}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {message.role}
                        </span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {message.date}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">{message.content}</p>
                    {message.attachments.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {message.attachments.map((attachment) => (
                          <Button
                            key={attachment.name}
                            variant="outline"
                            size="sm"
                            className="text-gray-600"
                          >
                            <Paperclip className="w-4 h-4 mr-1" />
                            {attachment.name}
                            <span className="text-xs text-gray-400 ml-1">
                              ({attachment.size})
                            </span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <Textarea placeholder="Type your message..." className="flex-1" />
              <div className="flex justify-between items-center">
                <Button variant="outline">
                  <Paperclip className="w-4 h-4 mr-2" /> Attach Files
                </Button>
                <Button>
                  <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-medium mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Internal Comments
            </h2>
            <div className="space-y-4 mb-6">
              {MOCK_INTERNAL_COMMENTS.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {comment.user[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{comment.user}</span>
                      <span className="text-gray-500 text-sm">
                        {comment.date}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <Textarea
                placeholder="Add internal comment..."
                className="flex-1"
              />
              <div className="flex justify-end">
                <Button variant="secondary">
                  <AlertCircle className="w-4 h-4 mr-2" /> Add Comment
                </Button>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-medium mb-4">Related Tickets</h2>
            <div className="space-y-3">
              {MOCK_RELATED_TICKETS.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/ticket/${ticket.id}`}
                  className="block border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{ticket.title}</h3>
                      <div className="flex gap-2 mt-2">
                        {ticket.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${ticket.status === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {ticket.status}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {ticket.date}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-medium mb-4">Ticket Details</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-500 text-sm">Ticket ID</span>
                <p className="font-mono">#123456</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Requester</span>
                <p>John Doe</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Assigned To</span>
                <p>Agent Smith</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-medium mb-4">Timeline</h2>
            <div className="space-y-4">
              {MOCK_TIMELINE.map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                    {index !== MOCK_TIMELINE.length - 1 && (
                      <div className="absolute top-3 left-1/2 bottom-0 w-0.5 -ml-px bg-gray-200"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {event.description}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {event.date}
                    </div>
                    <div className="text-xs text-gray-500">{event.user}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-medium mb-4">Attachments</h2>
            <div className="space-y-3">
              {MOCK_ATTACHMENTS.map((attachment) => (
                <div
                  key={attachment.name}
                  className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-sm">
                        {attachment.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {attachment.size} • {attachment.date}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
