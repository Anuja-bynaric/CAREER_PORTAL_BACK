from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
import re

app = Flask(__name__)
CORS(app)

SKILLS_LIST = [ 'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'go', 'rust',
  'typescript', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
  'spring', 'hibernate', 'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
   'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'linux', 'git', 'ci/cd', 'jenkins',
   'machine learning', 'data science', 'html', 'css', 'sass', 'html5', 'css3', 'graphql',
  'rest api', 'next.js', 'nestjs', 'tailwindcss', 'material-ui', 'bootstrap', 'pytorch',
  'tensorflow', 'keras', 'scikit-learn', 'pandas', 'numpy', 'matplotlib', 'seaborn',
  'figma', 'adobe xd', 'ui/ux', 'agile', 'scrum', 'jira', 'confluence', 'trello',
   'apache', 'nginx', 'bash', 'shell scripting', 'powershell', 'perl', 'scala', 'kotlin',
   'dart', 'flutter', 'react native', 'ionic', 'xamarin', 'objective-c', 'assembly',
   'c', 'r', 'matlab', 'vba', 'solidity', 'blockchain', 'smart contracts', 'web3',
  'ethereum', 'bitcoin', 'cryptocurrency', 'ansible', 'terraform', 'puppet', 'chef',
   'prometheus', 'grafana', 'splunk', 'elk stack', 'kibana', 'logstash', 'rabbitmq',
 'kafka', 'activemq', 'zeromq', 'celery', 'apollo', 'relay', 'redux', 'mobx', 'rxjs',
  'jest', 'mocha', 'chai', 'jasmine', 'karma', 'cypress', 'selenium', 'puppeteer',
   'playwright', 'appium', 'junit', 'nunit', 'pytest', 'rspec', 'cucumber', 'webpack',
  'babel', 'parcel', 'rollup', 'vite', 'gulp', 'grunt', 'npm', 'yarn', 'pnpm', 'maven',
  'gradle', 'ant', 'make', 'cmake', 'composer', 'pip', 'conda', 'virtualenv', 'poetry',
   'docker compose', 'docker swarm', 'openshift', 'heroku', 'netlify', 'vercel',
  'firebase', 'supabase', 'auth0', 'okta', 'keycloak', 'oauth', 'jwt', 'saml',
   'openid', 'restful', 'soap', 'grpc', 'websockets', 'socket.io', 'webrtc', 'tcp/ip',
   'udp', 'http', 'https', 'dns', 'dhcp', 'ftp', 'ssh', 'tls', 'ssl', 'vpn', 'ipsec',
  'bgp', 'ospf', 'vlan', 'subnetting', 'routing', 'switching', 'firewalls', 'ids/ips',
   'siem', 'penetration testing', 'vulnerability scanning', 'owasp', 'cryptography',
   'malware analysis', 'reverse engineering', 'sql injection', 'xss', 'csrf', 'ddos',
  'phishing', 'social engineering', 'incident response', 'disaster recovery',
   'business continuity', 'risk management', 'compliance', 'gdpr', 'hipaa', 'pci dss',
   'iso 27001', 'soc 2', 'itil', 'cobit', 'togaf', 'pmp', 'prince2', 'scrum master',
   'product owner', 'kanban', 'lean', 'six sigma', 'data structures', 'algorithms',
   'system design', 'oop', 'solid', 'design patterns', 'microservices', 'serverless',
   'event-driven architecture', 'monolith', 'mvc', 'mvvm', 'mvt', 'spa', 'pwa', 'ssr',
  'ssg', 'jamstack', 'headless cms', 'wordpress', 'drupal', 'joomla', 'magento',
  'shopify', 'salesforce', 'sap', 'oracle', 'workday', 'servicenow', 'mulesoft',
   'boomi', 'informatica', 'talend', 'pentaho', 'ssis', 'ssrs', 'ssas', 'power bi',
   'tableau', 'qlikview', 'looker', 'snowflake', 'redshift', 'bigquery', 'hadoop',
   'spark', 'flink', 'storm', 'hive', 'pig', 'sqoop', 'flume', 'zookeeper', 'cassandra',
  'hbase', 'neo4j', 'arango', 'couchbase', 'couchdb', 'dynamodb', 'cosmos db', 'riak',
   'memcached', 'ignite', 'geode', 'hazelcast', 'ehcache', 'dask', 'ray', 'numba',
  'cython', 'pypy', 'jython', 'ironpython', 'luigi', 'airflow', 'prefect', 'dagster',
   'kubeflow', 'mlflow', 'sagemaker'] # ... (Keep your full list here)

def extract_email(text):
    # Standard email regex pattern
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    match = re.search(email_pattern, text)
    return match.group(0) if match else None

def extract_name(text):
    # Usually, the name is in the first 2-3 lines of a resume.
    # We clean the text and take the first non-empty line that isn't an email.
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    for line in lines[:5]: # Check first 5 lines
        # Basic check: Name shouldn't have '@' or many numbers
        if '@' not in line and not any(char.isdigit() for char in line):
            if len(line.split()) >= 2: # Name usually has at least 2 words
                return line
    return "Unknown Candidate"

def extract_skills(text):
    text = text.lower()
    found = [skill for skill in SKILLS_LIST if re.search(r'\b' + re.escape(skill) + r'\b', text)]
    return list(set(found))

@app.route('/process-resume', methods=['POST'])
def process():
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400
    
    file = request.files['file']
    doc = fitz.open(stream=file.read(), filetype="pdf")
    
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    
    # Run Extractions
    email = extract_email(full_text)
    name = extract_name(full_text)
    skills = extract_skills(full_text)
    
    return jsonify({
        "name": name,
        "email": email,
        "skills": skills
    })

if __name__ == '__main__':
    app.run(port=5001, debug=True)