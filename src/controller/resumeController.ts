// import { Request, Response } from 'express';
// import { db } from '../db';
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
import { db } from '../db';
import { resumes, jobOpenings, jobApplications } from '../db/schema';
import { eq } from 'drizzle-orm';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import FormData from 'form-data';
import { AuthRequest } from '../middleware/authMiddleware';

const calculateMatchPercentage = (candidateSkills: string[], jobRequirements: string[] | null): number => {
    if (!jobRequirements || jobRequirements.length === 0 || !candidateSkills || candidateSkills.length === 0) {
        return 0;
    }
    const candidateSet = new Set(candidateSkills.map(s => s.toLowerCase().trim()));
    const jobReqs = jobRequirements.map(s => s.toLowerCase().trim());
    const matches = jobReqs.filter(skill => candidateSet.has(skill));
    return (matches.length / jobReqs.length) * 100;
};

const processResumeFile = async (filePath: string, fileName: string, uploadedBy?: number): Promise<void> => {
    try {
        console.log(`[1] Starting processing for: ${fileName}`);
        const resumeUniqueId = uuidv4();
        const fileExt = path.extname(fileName).toLowerCase();
        
        let extractedData = {
            name: "Unknown Candidate",
            email: `auto-${uuidv4().substring(0, 8)}@example.com`,
            skills: [] as string[]
        };

        // 1. AI Extraction
        if (fileExt === '.pdf' || fileExt === '.docx') {
            console.log(`[2] Sending to AI Service...`);
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath));
            try {
                const aiResponse = await axios.post('http://127.0.0.1:5001/process-resume', form, {
                    headers: { ...form.getHeaders() },
                    timeout: 10000, // Reduced timeout for testing
                });
                if (aiResponse.data) {
                    extractedData.name = aiResponse.data.name || extractedData.name;
                    extractedData.email = aiResponse.data.email || extractedData.email;
                    extractedData.skills = Array.isArray(aiResponse.data.skills) ? aiResponse.data.skills : [];
                }
                console.log(`[3] AI Response received. Skills found: ${extractedData.skills.length}`);
            } catch (aiError: any) {
                console.error(`[!] AI Service Error: ${aiError.message}. Check if your Python server is running on port 5001.`);
            }
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
        await db.insert(resumes).values({
            resumeUniqueId,
            resumeUrl: dbPath,
            extractedSkills: extractedData.skills,
            uploadedBy: uploadedBy || null,
            fileName: fileName,
            fileSize: fs.statSync(newFilePath).size,
            status: 'processed',
        });

        // 4. Fetch Jobs
        console.log(`[5] Fetching open jobs...`);
        const allJobs = await db.select().from(jobOpenings).where(eq(jobOpenings.status, 'open'));
        
        if (allJobs.length === 0) {
            console.log(`[!] No open jobs found in database to match against.`);
            return;
        }

        console.log(`--- Matching Report for: ${fileName} ---`);

        for (const job of allJobs) {
            console.log(`[6] Calculating match for Job ID: ${job.jobId}`);
            
            // Check if calculateMatchPercentage itself is the problem
            try {
                const matchScore = calculateMatchPercentage(extractedData.skills, job.requirements);
                console.log(`> RESULT: Job ${job.jobId} | Match Score: ${matchScore.toFixed(2)}%`);

                if (matchScore >= 50) {
                    await db.insert(jobApplications).values({
                        jobId: job.jobId,
                        fullName: extractedData.name,
                        email: extractedData.email,
                        phoneNumber: "0000000000",
                        resumeUrl: dbPath,
                        skills: extractedData.skills,
                        consentGiven: true,
                        status: 'pending',
                        appliedAt: new Date(),
                        notes: `Auto-applied. Match: ${matchScore.toFixed(2)}%`
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

        // Process sequentially to maintain database stability and AI service load
        for (const entry of resumeFiles) {
            const tempDir = path.join(process.cwd(), 'uploads', 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const tempFilePath = path.join(tempDir, `${Date.now()}-${entry.name}`);
            fs.writeFileSync(tempFilePath, entry.getData());
            
            await processResumeFile(tempFilePath, entry.name, uploadedBy);
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