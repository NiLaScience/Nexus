import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";

// Initialize the LLM
export const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
});

// Job Description Parser
export const formattedParserPrompt = PromptTemplate.fromTemplate(`
You are a job description parser. Your task is to extract structured information from a job description.
Please analyze the following job description and extract key information in a structured format.

Job Description:
{jobDescription}

Return a JSON object with the following structure:
{{
  "title": "Job title",
  "requiredSkills": ["List of required technical skills"],
  "preferredSkills": ["List of preferred/nice-to-have skills"],
  "yearsOfExperience": number,
  "responsibilities": ["List of key responsibilities"],
  "qualifications": ["List of required qualifications"],
  "location": "Job location",
  "employmentType": "Full-time/Part-time/Contract",
  "careerLevel": {{
    "level": "Entry/Mid/Senior/Lead/Principal/Executive",
    "managementResponsibilities": boolean,
    "directReports": number,
    "scope": "Individual Contributor/Team Lead/Department Head/C-Level"
  }},
  "leadership": {{
    "type": "Technical/People/Product/None",
    "responsibilities": ["List of leadership responsibilities"],
    "teamSize": number (optional),
    "crossFunctional": boolean
  }},
  "company": {{
    "name": "Company name if mentioned",
    "industry": "Company industry if mentioned",
    "description": "Company description if provided"
  }}
}}

Ensure all fields are filled with appropriate values from the job description.
For career level and leadership information:
- Infer the level from responsibilities, qualifications, and reporting structure
- Set managementResponsibilities based on mentions of team leadership or direct reports
- Estimate directReports count from context (use 0 if none mentioned)
- Determine leadership type based on role focus and responsibilities
- Set crossFunctional based on mentions of cross-team collaboration

If a field is not mentioned in the job description, use reasonable defaults based on the context.
`);

// Job Description Parser
export const jobDescriptionParser = StructuredOutputParser.fromZodSchema(z.object({
  title: z.string(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  yearsOfExperience: z.number(),
  responsibilities: z.array(z.string()),
  qualifications: z.array(z.string()),
  location: z.string(),
  employmentType: z.string(),
  careerLevel: z.object({
    level: z.enum(["Entry", "Mid", "Senior", "Lead", "Principal", "Executive"]),
    managementResponsibilities: z.boolean(),
    directReports: z.number(),
    scope: z.enum(["Individual Contributor", "Team Lead", "Department Head", "C-Level"])
  }),
  leadership: z.object({
    type: z.enum(["Technical", "People", "Product", "None"]),
    responsibilities: z.array(z.string()),
    teamSize: z.number().optional(),
    crossFunctional: z.boolean()
  }),
  company: z.object({
    name: z.string(),
    industry: z.string(),
    description: z.string().optional()
  })
})); 
