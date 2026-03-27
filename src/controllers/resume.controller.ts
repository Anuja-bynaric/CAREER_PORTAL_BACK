// import { Request, Response } from 'express';
// import { db } from '../config/db';
// import { resumes } from '../db/schema';
// import { eq } from 'drizzle-orm';
// import AdmZip from 'adm-zip';
// import fs from 'fs';
// import path from 'path';
// import { v4 as uuidv4 } from 'uuid';
// import pdf from 'pdf-parse-new';
// import mammoth from 'mammoth';
// import { AuthRequest } from '../middleware/authMiddleware';

// // Function to extract text from PDF
// const extractTextFromPDF = async (filePath: string): Promise<string> => {
//   try {
//     const dataBuffer = fs.readFileSync(filePath);
//     // Explicitly call the required module
//     const data = await pdf(dataBuffer);
//     return data.text;
//   } catch (error) {
//     console.error("PDF Parsing Error:", error);
//     throw error;
//   }
// };

// // Function to extract text from DOCX
// const extractTextFromDOCX = async (filePath: string): Promise<string> => {
//   try {
//     const result = await mammoth.extractRawText({ path: filePath });
//     return result.value;
//   } catch (error) {
//     console.error("DOCX Parsing Error:", error);
//     throw error;
//   }
// };

// // Extensive list of industry-standard technical skills
// const TECHNICAL_SKILLS = [
//   'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'go', 'rust',
//   'typescript', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
//   'spring', 'hibernate', 'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
//   'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'linux', 'git', 'ci/cd', 'jenkins',
//   'machine learning', 'data science', 'html', 'css', 'sass', 'html5', 'css3', 'graphql',
//   'rest api', 'next.js', 'nestjs', 'tailwindcss', 'material-ui', 'bootstrap', 'pytorch',
//   'tensorflow', 'keras', 'scikit-learn', 'pandas', 'numpy', 'matplotlib', 'seaborn',
//   'figma', 'adobe xd', 'ui/ux', 'agile', 'scrum', 'jira', 'confluence', 'trello',
//   'apache', 'nginx', 'bash', 'shell scripting', 'powershell', 'perl', 'scala', 'kotlin',
//   'dart', 'flutter', 'react native', 'ionic', 'xamarin', 'objective-c', 'assembly',
//   'c', 'r', 'matlab', 'vba', 'solidity', 'blockchain', 'smart contracts', 'web3',
//   'ethereum', 'bitcoin', 'cryptocurrency', 'ansible', 'terraform', 'puppet', 'chef',
//   'prometheus', 'grafana', 'splunk', 'elk stack', 'kibana', 'logstash', 'rabbitmq',
//   'kafka', 'activemq', 'zeromq', 'celery', 'apollo', 'relay', 'redux', 'mobx', 'rxjs',
//   'jest', 'mocha', 'chai', 'jasmine', 'karma', 'cypress', 'selenium', 'puppeteer',
//   'playwright', 'appium', 'junit', 'nunit', 'pytest', 'rspec', 'cucumber', 'webpack',
//   'babel', 'parcel', 'rollup', 'vite', 'gulp', 'grunt', 'npm', 'yarn', 'pnpm', 'maven',
//   'gradle', 'ant', 'make', 'cmake', 'composer', 'pip', 'conda', 'virtualenv', 'poetry',
//   'docker compose', 'docker swarm', 'openshift', 'heroku', 'netlify', 'vercel',
//   'firebase', 'supabase', 'auth0', 'okta', 'keycloak', 'oauth', 'jwt', 'saml',
//   'openid', 'restful', 'soap', 'grpc', 'websockets', 'socket.io', 'webrtc', 'tcp/ip',
//   'udp', 'http', 'https', 'dns', 'dhcp', 'ftp', 'ssh', 'tls', 'ssl', 'vpn', 'ipsec',
//   'bgp', 'ospf', 'vlan', 'subnetting', 'routing', 'switching', 'firewalls', 'ids/ips',
//   'siem', 'penetration testing', 'vulnerability scanning', 'owasp', 'cryptography',
//   'malware analysis', 'reverse engineering', 'sql injection', 'xss', 'csrf', 'ddos',
//   'phishing', 'social engineering', 'incident response', 'disaster recovery',
//   'business continuity', 'risk management', 'compliance', 'gdpr', 'hipaa', 'pci dss',
//   'iso 27001', 'soc 2', 'itil', 'cobit', 'togaf', 'pmp', 'prince2', 'scrum master',
//   'product owner', 'kanban', 'lean', 'six sigma', 'data structures', 'algorithms',
//   'system design', 'oop', 'solid', 'design patterns', 'microservices', 'serverless',
//   'event-driven architecture', 'monolith', 'mvc', 'mvvm', 'mvt', 'spa', 'pwa', 'ssr',
//   'ssg', 'jamstack', 'headless cms', 'wordpress', 'drupal', 'joomla', 'magento',
//   'shopify', 'salesforce', 'sap', 'oracle', 'workday', 'servicenow', 'mulesoft',
//   'boomi', 'informatica', 'talend', 'pentaho', 'ssis', 'ssrs', 'ssas', 'power bi',
//   'tableau', 'qlikview', 'looker', 'snowflake', 'redshift', 'bigquery', 'hadoop',
//   'spark', 'flink', 'storm', 'hive', 'pig', 'sqoop', 'flume', 'zookeeper', 'cassandra',
//   'hbase', 'neo4j', 'arango', 'couchbase', 'couchdb', 'dynamodb', 'cosmos db', 'riak',
//   'memcached', 'ignite', 'geode', 'hazelcast', 'ehcache', 'dask', 'ray', 'numba',
//   'cython', 'pypy', 'jython', 'ironpython', 'luigi', 'airflow', 'prefect', 'dagster',
//   'kubeflow', 'mlflow', 'sagemaker'
// ];

// // Function to extract skills using a fast local NLP approach
// const extractSkillsLocal = async (text: string): Promise<string[]> => {
//   try {
//     const lowerText = text.toLowerCase();

//     // Safely match strict word boundaries for skills to prevent partial word matching
//     const foundSkills = TECHNICAL_SKILLS.filter(skill => {
//       // Escape special regex characters
//       const escapedSkill = skill.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');

//       let pattern;
//       if (skill.endsWith('+') || skill.endsWith('#')) {
//         // Special manual word boundary definition for things like c++ and c#
//         pattern = `(?:^|\\\\s|[^a-zA-Z0-9_])${escapedSkill}(?:$|\\\\s|[^a-zA-Z0-9_])`;
//       } else {
//         // Standard word boundary parsing
//         pattern = `\\\\b${escapedSkill}\\\\b`;
//       }

//       const regex = new RegExp(pattern, 'i');
//       return regex.test(lowerText);
//     });

//     return Array.from(new Set(foundSkills));
//   } catch (error) {
//     console.error('Error extracting skills locally:', error);
//     return [];
//   }
// };

// // Function to process a single resume file
// const processResumeFile = async (filePath: string, fileName: string, uploadedBy?: number): Promise<void> => {
//   try {
//     const resumeUniqueId = uuidv4();
//     const fileExt = path.extname(fileName).toLowerCase();
//     let extractedText = '';

//     // Extract text based on file type
//     if (fileExt === '.pdf') {
//       extractedText = await extractTextFromPDF(filePath);
//     } else if (fileExt === '.docx') {
//       extractedText = await extractTextFromDOCX(filePath);
//     } else if (fileExt === '.doc') {
//       // For .doc files, we'll skip text extraction for now
//       extractedText = '';
//     } else {
//       throw new Error(`Unsupported file type: ${fileExt}`);
//     }

//     // Extract skills locally purely using Javascript dictionary
//     const extractedSkills = await extractSkillsLocal(extractedText);

//     // Move file to resumes directory
//     const newFileName = `${resumeUniqueId}${fileExt}`;
//     const newFilePath = path.join('uploads', 'resumes', newFileName);
//     fs.renameSync(filePath, newFilePath);

//     // Get file size
//     const stats = fs.statSync(newFilePath);
//     const fileSize = stats.size;

//     // Save to database
//     await db.insert(resumes).values({
//       resumeUniqueId,
//       resumeUrl: newFilePath,
//       extractedSkills,
//       uploadedBy,
//       fileName: fileName,
//       fileSize,
//       status: 'processed',
//     });

//   } catch (error) {
//     console.error(`Error processing resume ${fileName}:`, error);

//     // Save with error status
//     const resumeUniqueId = uuidv4();
//     const fileExt = path.extname(fileName).toLowerCase();
//     const newFileName = `${resumeUniqueId}${fileExt}`;
//     const newFilePath = path.join('uploads', 'resumes', newFileName);

//     try {
//       fs.renameSync(filePath, newFilePath);
//     } catch (moveError) {
//       console.error('Error moving file:', moveError);
//     }

//     await db.insert(resumes).values({
//       resumeUniqueId,
//       resumeUrl: newFilePath,
//       extractedSkills: [],
//       uploadedBy,
//       fileName: fileName,
//       status: 'failed',
//       processingError: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// };

// export const uploadBulkResumes = async (req: AuthRequest, res: Response) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: 'No zip file uploaded' });
//     }

//     const zipFilePath = req.file.path;
//     const uploadedBy = req.user?.userId; // From auth middleware

//     // Extract zip file
//     const zip = new AdmZip(zipFilePath);
//     const zipEntries = zip.getEntries();

//     const resumeFiles = zipEntries.filter(entry => {
//       const ext = path.extname(entry.entryName).toLowerCase();
//       return !entry.isDirectory && (ext === '.pdf' || ext === '.docx' || ext === '.doc');
//     });

//     if (resumeFiles.length === 0) {
//       return res.status(400).json({ success: false, message: 'No valid resume files found in the zip' });
//     }

//     // Process each resume file asynchronously
//     const processingPromises = resumeFiles.map(async (entry) => {
//       const tempFilePath = path.join('uploads', 'temp', `${Date.now()}-${entry.name}`);
//       fs.writeFileSync(tempFilePath, entry.getData());
//       await processResumeFile(tempFilePath, entry.name, uploadedBy);
//     });

//     // Wait for all processing to complete
//     await Promise.all(processingPromises);

//     // Clean up zip file
//     fs.unlinkSync(zipFilePath);

//     res.status(200).json({
//       success: true,
//       message: `Successfully processed ${resumeFiles.length} resume files`,
//       processedCount: resumeFiles.length
//     });

//   } catch (error) {
//     console.error('Error in bulk upload:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process bulk upload',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// export const getResumes = async (req: Request, res: Response) => {
//   try {
//     const allResumes = await db.select().from(resumes);
//     res.status(200).json({ success: true, data: allResumes });
//   } catch (error) {
//     console.error('Error fetching resumes:', error);
//     res.status(500).json({ success: false, message: 'Failed to fetch resumes' });
//   }
// };

// export const getResumeById = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const resume = await db.select().from(resumes).where(eq(resumes.id, parseInt(id))).limit(1);

//     if (resume.length === 0) {
//       return res.status(404).json({ success: false, message: 'Resume not found' });
//     }

//     res.status(200).json({ success: true, data: resume[0] });
//   } catch (error) {
//     console.error('Error fetching resume:', error);
//     res.status(500).json({ success: false, message: 'Failed to fetch resume' });
//   }
// };
import { Request, Response } from 'express';
import { db } from '../config/db';
import { resumes, jobOpenings, jobApplications } from '../db/schema';
import { eq } from 'drizzle-orm';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/authMiddleware';
import pdf from 'pdf-parse-new';
import mammoth from 'mammoth';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const extractTextFromPDF = async (filePath: string): Promise<string> => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        console.error("PDF Parsing Error:", error);
        return "";
    }
};

const extractTextFromDOCX = async (filePath: string): Promise<string> => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error("DOCX Parsing Error:", error);
        return "";
    }
};

const processResumeFile = async (filePath: string, fileName: string, uploadedBy?: number): Promise<void> => {
    try {
        console.log(`[1] Starting processing for: ${fileName}`);
        const resumeUniqueId = uuidv4();
        const fileExt = path.extname(fileName).toLowerCase();

        let extractedText = '';
        if (fileExt === '.pdf') {
            extractedText = await extractTextFromPDF(filePath);
        } else if (fileExt === '.docx') {
            extractedText = await extractTextFromDOCX(filePath);
        } else {
            console.log(`Unsupported file type: ${fileExt}`);
            return;
        }

        let extractedData = {
            name: "Unknown Candidate",
            email: `auto-${uuidv4().substring(0, 8)}@example.com`,
            phoneNumber: "0000000000",
            summary: "",
            experience: 0,
            skills: [] as string[]
        };

        // 1. AI Extraction
        const aiProvider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
        console.log(`[2] Sending to AI Service (${aiProvider})...`);
        const extractionPrompt = "You are an expert HR assistant. Extract candidate name, email, phone number, a professional summary, an integer representing total years of experience, and a list of technical skills from the resume text. Return STRICTLY a JSON object with this shape: { \"name\": \"string\", \"email\": \"string\", \"phoneNumber\": \"string\", \"summary\": \"string\", \"experience\": number, \"skills\": [\"string\"] }. If any field is missing, provide a reasonable default (e.g. 0 for experience, empty string for summary).";

        try {
            let aiContent = "{}";

            if (aiProvider === 'gemini') {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
                const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
                const prompt = `${extractionPrompt}\n\nResume Text:\n${extractedText.substring(0, 14000)}`;
                const result = await model.generateContent(prompt);
                const textResponse = result.response.text();
                // Clean markdown code blocks from the Gemini output
                aiContent = textResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
            } else {
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                const aiResponse = await openai.chat.completions.create({
                    model: "openai/gpt-5.4-mini",
                    messages: [
                        { role: "system", content: extractionPrompt },
                        { role: "user", content: extractedText.substring(0, 14000) } // limit characters to avoid token limit
                    ],
                    response_format: { type: "json_object" }
                });
                aiContent = aiResponse.choices[0].message.content || "{}";
            }

            const parsed = JSON.parse(aiContent);
            if (parsed.name) extractedData.name = parsed.name;
            if (parsed.email) extractedData.email = parsed.email;
            if (parsed.phoneNumber) extractedData.phoneNumber = parsed.phoneNumber;
            if (parsed.summary) extractedData.summary = parsed.summary;
            if (typeof parsed.experience === 'number') extractedData.experience = parsed.experience;
            if (Array.isArray(parsed.skills)) extractedData.skills = parsed.skills;
            console.log(`[3] AI Response received. Skills found: ${extractedData.skills.length}, Experience: ${extractedData.experience}`);
        } catch (aiError: any) {
            console.error(`[!] AI Extraction Error: ${aiError.message}`);
        }

        // 2. File Storage
        const newFileName = `${resumeUniqueId}${fileExt}`;
        const destinationDir = path.join(process.cwd(), 'uploads', 'resumes');
        if (!fs.existsSync(destinationDir)) fs.mkdirSync(destinationDir, { recursive: true });
        const newFilePath = path.join(destinationDir, newFileName);
        fs.renameSync(filePath, newFilePath);
        const dbPath = `uploads/resumes/${newFileName}`;

        // 3. Save Resume Record
        console.log(`[4] Inserting resume into Database...`);
        const insertedResume = await db.insert(resumes).values({
            resumeUniqueId,
            resumeUrl: dbPath,
            extractedSkills: extractedData.skills,
            uploadedBy: uploadedBy || null,
            fileName: fileName,
            fileSize: fs.statSync(newFilePath).size,
            status: 'processed',
        }).returning();

        const resumeId = insertedResume[0].id;

        // 4. Fetch Jobs
        console.log(`[5] Fetching open jobs...`);
        const allJobs = await db.select().from(jobOpenings).where(eq(jobOpenings.status, 'open'));

        if (allJobs.length === 0) {
            console.log(`[!] No open jobs found in database to match against.`);
            return;
        }

        console.log(`--- Matching Report for: ${fileName} ---`);

        for (const job of allJobs) {
            console.log(`[6] Calculating match for Job ID: ${job.jobId} using ${aiProvider}`);

            try {
                let matchContent = "{}";
                const matchPrompt = "Evaluate the candidate against the job requirements. Provide a match score from 0 to 100 as an integer based on how well their skills and experience align with the job responsibilities and requirements. Return STRICTLY a JSON object: { \"score\": number }";
                const matchUserContent = `Candidate Skills: ${extractedData.skills.join(', ')}\nCandidate Experience: ${extractedData.experience} years\nJob Requirements: ${job.requirements?.join(', ')}\nJob Experience Required: ${job.experience}`;

                if (aiProvider === 'gemini') {
                    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
                    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
                    const prompt = `${matchPrompt}\n\n${matchUserContent}`;
                    const result = await model.generateContent(prompt);
                    const textResponse = result.response.text();

                    // Clean markdown code blocks from the Gemini output
                    matchContent = textResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
                } else {
                    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                    const matchCompletion = await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            { role: "system", content: matchPrompt },
                            { role: "user", content: matchUserContent }
                        ],
                        response_format: { type: "json_object" }
                    });
                    matchContent = matchCompletion.choices[0].message.content || "{}";
                }

                const matchScore = JSON.parse(matchContent).score || 0;

                console.log(`> RESULT: Job ${job.jobId} | Match Score: ${matchScore}%`);

                if (matchScore >= 50) {
                    await db.insert(jobApplications).values({
                        jobId: job.jobId,
                        resumeId: resumeId, // NEW FIELD
                        matchScore: matchScore, // NEW FIELD
                        experience: extractedData.experience, // NEW FIELD
                        summary: extractedData.summary, // NEW FIELD
                        fullName: extractedData.name,
                        email: extractedData.email,
                        phoneNumber: extractedData.phoneNumber,
                        resumeUrl: dbPath,
                        skills: extractedData.skills,
                        consentGiven: true,
                        status: 'pending',
                        appliedAt: new Date(),
                        notes: `Auto-applied. Match: ${matchScore}%`
                    });
                    console.log(`[SUCCESS] Inserted Application.`);
                }
            } catch (calcError: any) {
                console.error(`[!] Error inside calculation loop:`, calcError.message);
            }
        }
        console.log(`--- End of Report ---\n`);

    } catch (error: any) {
        console.error(`[CRITICAL ERROR]:`, error.message);
    }
}

export const uploadBulkResumes = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No zip file uploaded' });
        }

        const zipFilePath = req.file.path;
        const uploadedBy = req.user?.userId;

        const zip = new AdmZip(zipFilePath);
        const zipEntries = zip.getEntries();

        const resumeFiles = zipEntries.filter(entry => {
            const ext = path.extname(entry.entryName).toLowerCase();
            return !entry.isDirectory && (ext === '.pdf' || ext === '.docx');
        });

        if (resumeFiles.length === 0) {
            if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);
            return res.status(400).json({ success: false, message: 'No valid resume files found' });
        }

        // Process in batches of 5 to balance processing time and rate limits
        const tempDir = path.join(process.cwd(), 'uploads', 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const BATCH_SIZE = 5;
        for (let i = 0; i < resumeFiles.length; i += BATCH_SIZE) {
            const batch = resumeFiles.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(resumeFiles.length / BATCH_SIZE)}`);

            await Promise.all(batch.map(async (entry) => {
                const tempFilePath = path.join(tempDir, `${Date.now()}-${uuidv4()}-${entry.name}`);
                fs.writeFileSync(tempFilePath, entry.getData());
                await processResumeFile(tempFilePath, entry.name, uploadedBy);
            }));
        }

        if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);

        res.status(200).json({
            success: true,
            message: `Bulk processing complete. Check logs for match results.`,
            count: resumeFiles.length
        });

    } catch (error) {
        console.error('Bulk upload route error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during bulk upload' });
    }
};

// ... getResumes and getResumeById remain the same
export const getResumes = async (req: Request, res: Response) => {
    try {
        const allResumes = await db.select().from(resumes);
        res.status(200).json({ success: true, data: allResumes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch resumes' });
    }
};

export const getResumeById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const resume = await db.select().from(resumes).where(eq(resumes.id, parseInt(id))).limit(1);
        if (resume.length === 0) return res.status(404).json({ success: false, message: 'Resume not found' });
        res.status(200).json({ success: true, data: resume[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch resume' });
    }
};

