import profile from "../../data/portfolio_data.json";

interface Job {
  company: string;
  role: string;
  tech: string[];
  period: string;
  location: string;
  highlights: string[];
}

interface Project {
  name: string;
  year: number;
  tech: string[];
  github: string;
  description: string;
}

interface Education {
  institution: string;
  degree: string;
  period: string;
  gpa?: string;
  percentage?: string;
}

export interface Profile {
  identity: {
    name: string;
    title: string;
    location: string;
    summary: string;
    tagline: string;
  };
  contact: {
    email: string;
    phone: string;
    linkedin: string;
    github: string;
  };
  experience: Job[];
  projects: Project[];
  skills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    cloud_devops: string[];
    tools: string[];
    core: string[];
  };
  achievements: {
    leetcode: string;
    codechef: string;
    hackerrank: string;
    highlights: string[];
  };
  education: Education[];
}

export function getProfile(): Profile {
  return profile as unknown as Profile;
}

export function formatExperience(experience: Job[]): string {
  return experience
    .map((job) => {
      const header = `[${job.company} | ${job.role} | ${job.period} | ${job.location}]`;
      const tech = `Tech: ${job.tech.join(", ")}`;
      const highlights = job.highlights.slice(0, 5).map((h) => `  • ${h}`).join("\n");
      return `${header}\n${tech}\nAchievements:\n${highlights}`;
    })
    .join("\n\n");
}

export function formatProjects(projects: Project[]): string {
  return projects
    .map(
      (p) =>
        `[${p.name} | ${p.year}]\nTech: ${p.tech.join(", ")}\nGitHub: ${p.github}\nWhat it does: ${p.description}`
    )
    .join("\n\n");
}

export function formatEducation(education: Education[]): string {
  return education
    .map((e) => {
      let line = `  • ${e.institution} — ${e.degree} (${e.period})`;
      if (e.gpa) line += ` | GPA: ${e.gpa}`;
      if (e.percentage) line += ` | ${e.percentage}`;
      return line;
    })
    .join("\n");
}
