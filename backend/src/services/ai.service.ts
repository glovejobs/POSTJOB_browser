import { config } from '../config/environment';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface StreamChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string | null;
  }>;
}

export interface JobDescriptionParams {
  title: string;
  company: string;
  location: string;
  employmentType?: string;
  department?: string;
  salaryMin?: number;
  salaryMax?: number;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  tone?: 'professional' | 'casual' | 'friendly' | 'corporate';
}

class AIService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://openrouter.ai/api/v1';
  private readonly model = 'deepseek/deepseek-chat-v3-0324:free';

  constructor() {
    this.apiKey = config.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenRouter API key not configured. AI features will be disabled.');
    }
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateJobDescription(params: JobDescriptionParams): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured');
    }

    const prompt = this.buildJobDescriptionPrompt(params);
    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are a professional HR specialist and technical writer who creates compelling, inclusive, and SEO-optimized job descriptions. Focus on clarity, diversity, and attracting top talent.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': config.FRONTEND_URL,
        'X-Title': 'PostJob AI Assistant'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error: any = await response.json();
        console.error('OpenRouter API Error:', error);

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error) {
          errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Check for rate limiting
        if (error.error?.code === 429 || response.status === 429) {
          errorMessage = 'Rate limit exceeded. The free tier is temporarily unavailable. Please try again in a few moments.';
        }
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json() as any;
    return data.choices[0]?.message?.content || '';
  }

  async *streamJobDescription(params: JobDescriptionParams): AsyncGenerator<string, void, unknown> {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured');
    }

    const prompt = this.buildJobDescriptionPrompt(params);
    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are a professional HR specialist and technical writer who creates compelling, inclusive, and SEO-optimized job descriptions. Focus on clarity, diversity, and attracting top talent.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': config.FRONTEND_URL,
        'X-Title': 'PostJob AI Assistant'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true
      })
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error: any = await response.json();
        console.error('OpenRouter API Error:', error);

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error) {
          errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Check for rate limiting
        if (error.error?.code === 429 || response.status === 429) {
          errorMessage = 'Rate limit exceeded. The free tier is temporarily unavailable. Please try again in a few moments.';
        }
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response stream');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const chunk: StreamChunk = JSON.parse(data);
              const content = chunk.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              console.error('Error parsing SSE chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async improveJobDescription(currentDescription: string, feedback: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured');
    }

    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are a professional HR specialist helping to improve job descriptions based on feedback.'
      },
      {
        role: 'user',
        content: `Please improve this job description based on the following feedback:

Current Description:
${currentDescription}

Feedback:
${feedback}

Please provide an improved version that addresses the feedback while maintaining professionalism and clarity.`
      }
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': config.FRONTEND_URL,
        'X-Title': 'PostJob AI Assistant'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error: any = await response.json();
        console.error('OpenRouter API Error:', error);

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error) {
          errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Check for rate limiting
        if (error.error?.code === 429 || response.status === 429) {
          errorMessage = 'Rate limit exceeded. The free tier is temporarily unavailable. Please try again in a few moments.';
        }
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json() as any;
    return data.choices[0]?.message?.content || '';
  }

  async generateJobTitle(description: string): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured');
    }

    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are an expert at creating clear, SEO-friendly job titles.'
      },
      {
        role: 'user',
        content: `Based on this job description, suggest 5 appropriate job titles. Return only the titles, one per line:

${description}`
      }
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': config.FRONTEND_URL,
        'X-Title': 'PostJob AI Assistant'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.8,
        max_tokens: 200,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate job titles');
    }

    const data = await response.json() as any;
    const content = data.choices[0]?.message?.content || '';
    return content.split('\n').filter((line: string) => line.trim()).slice(0, 5);
  }

  private buildJobDescriptionPrompt(params: JobDescriptionParams): string {
    const {
      title,
      company,
      location,
      employmentType = 'Full-time',
      department,
      salaryMin,
      salaryMax,
      requirements = [],
      responsibilities = [],
      benefits = [],
      tone = 'professional'
    } = params;

    let prompt = `Create a compelling job description for the following position:

Position: ${title}
Company: ${company}
Location: ${location}
Employment Type: ${employmentType}
${department ? `Department: ${department}` : ''}
${salaryMin && salaryMax ? `Salary Range: $${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()} per year` : ''}

Writing Style: ${tone}

`;

    if (requirements.length > 0) {
      prompt += `Key Requirements:\n${requirements.map(r => `- ${r}`).join('\n')}\n\n`;
    }

    if (responsibilities.length > 0) {
      prompt += `Main Responsibilities:\n${responsibilities.map(r => `- ${r}`).join('\n')}\n\n`;
    }

    if (benefits.length > 0) {
      prompt += `Benefits:\n${benefits.map(b => `- ${b}`).join('\n')}\n\n`;
    }

    prompt += `Please create a well-structured job description that includes:
1. An engaging opening paragraph about the role and company
2. A "What You'll Do" section with key responsibilities
3. A "What We're Looking For" section with requirements and qualifications
4. A "What We Offer" section with benefits and perks
5. A closing paragraph encouraging qualified candidates to apply

Make it inclusive, avoiding biased language. Focus on essential skills rather than years of experience when possible. Use clear, concise language that appeals to top talent.`;

    return prompt;
  }

  // Template system for common job types
  getJobTemplates() {
    return {
      'software-engineer': {
        requirements: [
          'Strong programming skills in relevant languages',
          'Experience with version control systems (Git)',
          'Problem-solving and analytical thinking',
          'Ability to work in a team environment',
          'Good communication skills'
        ],
        responsibilities: [
          'Design, develop, and maintain software applications',
          'Write clean, maintainable code',
          'Participate in code reviews',
          'Collaborate with cross-functional teams',
          'Debug and resolve technical issues'
        ]
      },
      'product-manager': {
        requirements: [
          'Experience in product management or related field',
          'Strong analytical and problem-solving skills',
          'Excellent communication and presentation skills',
          'Understanding of agile methodologies',
          'Customer-focused mindset'
        ],
        responsibilities: [
          'Define product vision and strategy',
          'Manage product roadmap and prioritization',
          'Work with engineering and design teams',
          'Conduct user research and gather feedback',
          'Track and analyze product metrics'
        ]
      },
      'marketing-manager': {
        requirements: [
          'Experience in marketing or related field',
          'Strong understanding of digital marketing channels',
          'Analytical skills and data-driven mindset',
          'Creative thinking and problem-solving',
          'Excellent written and verbal communication'
        ],
        responsibilities: [
          'Develop and execute marketing strategies',
          'Manage marketing campaigns across channels',
          'Analyze campaign performance and ROI',
          'Collaborate with sales and product teams',
          'Manage marketing budget and resources'
        ]
      },
      'data-scientist': {
        requirements: [
          'Strong background in statistics and mathematics',
          'Proficiency in Python or R',
          'Experience with machine learning frameworks',
          'SQL and database knowledge',
          'Data visualization skills'
        ],
        responsibilities: [
          'Analyze large datasets to extract insights',
          'Build and deploy machine learning models',
          'Create data visualizations and reports',
          'Collaborate with stakeholders on data needs',
          'Ensure data quality and integrity'
        ]
      }
    };
  }
}

export default new AIService();