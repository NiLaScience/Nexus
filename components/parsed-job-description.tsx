'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ParsedJobDescriptionProps {
  parsedData: {
    title: string;
    requiredSkills: string[];
    preferredSkills: string[];
    yearsOfExperience: number;
    responsibilities: string[];
    qualifications: string[];
    location: string;
    employmentType: string;
    careerLevel: {
      level: string;
      managementResponsibilities: boolean;
      directReports: number;
      scope: string;
    };
    leadership: {
      type: string;
      responsibilities: string[];
      crossFunctional: boolean;
    };
    company: {
      name: string;
      industry: string;
      description?: string;
    };
  };
}

export function ParsedJobDescription({ parsedData }: ParsedJobDescriptionProps) {
  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{parsedData.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{parsedData.company.name}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{parsedData.location}</Badge>
              <Badge variant="outline">{parsedData.employmentType}</Badge>
              <Badge variant="outline">{parsedData.careerLevel.level}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Details Accordion */}
      <Accordion type="single" collapsible className="w-full">
        {/* Company Info */}
        <AccordionItem value="company">
          <AccordionTrigger>Company Information</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm mb-2">
                  <span className="font-semibold">Industry:</span> {parsedData.company.industry}
                </p>
                {parsedData.company.description && (
                  <p className="text-sm">{parsedData.company.description}</p>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Skills */}
        <AccordionItem value="skills">
          <AccordionTrigger>Skills & Requirements</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.requiredSkills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  {parsedData.preferredSkills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Preferred Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.preferredSkills.map((skill, index) => (
                          <Badge key={index} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-sm">
                    <span className="font-semibold">Years of Experience:</span> {parsedData.yearsOfExperience}
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Responsibilities */}
        <AccordionItem value="responsibilities">
          <AccordionTrigger>Responsibilities</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-4">
                <ul className="list-disc pl-4 space-y-2">
                  {parsedData.responsibilities.map((resp, index) => (
                    <li key={index} className="text-sm">{resp}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Qualifications */}
        <AccordionItem value="qualifications">
          <AccordionTrigger>Qualifications</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-4">
                <ul className="list-disc pl-4 space-y-2">
                  {parsedData.qualifications.map((qual, index) => (
                    <li key={index} className="text-sm">{qual}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Role Details */}
        <AccordionItem value="role-details">
          <AccordionTrigger>Role Details</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Career Level</h4>
                  <p className="text-sm">
                    <span className="font-medium">Level:</span> {parsedData.careerLevel.level}<br />
                    <span className="font-medium">Scope:</span> {parsedData.careerLevel.scope}<br />
                    <span className="font-medium">Direct Reports:</span> {parsedData.careerLevel.directReports}<br />
                    <span className="font-medium">Management Responsibilities:</span> {parsedData.careerLevel.managementResponsibilities ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Leadership</h4>
                  <p className="text-sm">
                    <span className="font-medium">Type:</span> {parsedData.leadership.type}<br />
                    <span className="font-medium">Cross-Functional:</span> {parsedData.leadership.crossFunctional ? 'Yes' : 'No'}
                  </p>
                  {parsedData.leadership.responsibilities.length > 0 && (
                    <div className="mt-2">
                      <h5 className="text-sm font-medium mb-1">Leadership Responsibilities:</h5>
                      <ul className="list-disc pl-4 space-y-1">
                        {parsedData.leadership.responsibilities.map((resp, index) => (
                          <li key={index} className="text-sm">{resp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
} 